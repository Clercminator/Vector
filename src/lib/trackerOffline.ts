/**
 * Offline queue for tracker writes (goal_logs, blueprint_tracker updates).
 * When offline, writes are stored in localStorage and flushed when back online.
 */

const PENDING_KEY = 'vector.tracker_pending';
const SYNC_EVENT = 'vector-tracker-synced';

export type PendingGoalLog = {
  id: string;
  type: 'goal_log';
  payload: {
    blueprint_id: string;
    user_id: string;
    kind: 'journal' | 'check_in' | 'step_done' | 'setback';
    content?: string | null;
    payload?: Record<string, unknown>;
    created_at?: string; // optional override for past-date logging
  };
  created_at: string;
};

export type PendingTrackerUpdate = {
  id: string;
  type: 'tracker_update';
  payload: {
    blueprint_id: string;
    completed_step_ids: string[];
  };
  created_at: string;
};

export type PendingGoalLogDelete = {
  id: string;
  type: 'goal_log_delete';
  payload: { log_id: string };
  created_at: string;
};

export type PendingOp = PendingGoalLog | PendingTrackerUpdate | PendingGoalLogDelete;

function genId(): string {
  return `pending_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === true;
}

export function getPendingQueue(): PendingOp[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingOp[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePendingQueue(queue: PendingOp[]): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('trackerOffline: failed to save pending queue', e);
  }
}

export function addPendingGoalLog(
  blueprint_id: string,
  user_id: string,
  kind: PendingGoalLog['payload']['kind'],
  options?: { content?: string | null; payload?: Record<string, unknown>; created_at?: string }
): PendingGoalLog {
  const op: PendingGoalLog = {
    id: genId(),
    type: 'goal_log',
    payload: {
      blueprint_id,
      user_id,
      kind,
      content: options?.content ?? null,
      payload: options?.payload ?? undefined,
      created_at: options?.created_at,
    },
    created_at: new Date().toISOString(),
  };
  const queue = getPendingQueue();
  queue.push(op);
  savePendingQueue(queue);
  return op;
}

export function addPendingTrackerUpdate(blueprint_id: string, completed_step_ids: string[]): PendingTrackerUpdate {
  const op: PendingTrackerUpdate = {
    id: genId(),
    type: 'tracker_update',
    payload: { blueprint_id, completed_step_ids },
    created_at: new Date().toISOString(),
  };
  const queue = getPendingQueue();
  queue.push(op);
  savePendingQueue(queue);
  return op;
}

export function addPendingGoalLogDelete(log_id: string): PendingGoalLogDelete {
  const op: PendingGoalLogDelete = {
    id: genId(),
    type: 'goal_log_delete',
    payload: { log_id },
    created_at: new Date().toISOString(),
  };
  const queue = getPendingQueue();
  queue.push(op);
  savePendingQueue(queue);
  return op;
}

export function removePendingOp(id: string): void {
  const queue = getPendingQueue().filter((o) => o.id !== id);
  savePendingQueue(queue);
}

/** Flush pending queue to Supabase. Returns true if flush completed (with or without errors). Dispatches SYNC_EVENT when done. */
export async function flushPendingQueue(
  supabase: import('@supabase/supabase-js').SupabaseClient,
  userId: string
): Promise<{ flushed: number; errors: number }> {
  const queue = getPendingQueue();
  if (queue.length === 0) {
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
    return { flushed: 0, errors: 0 };
  }

  let flushed = 0;
  let errors = 0;
  const remaining: PendingOp[] = [];

  for (const op of queue) {
    try {
      if (op.type === 'goal_log') {
        const row: Record<string, unknown> = {
          blueprint_id: op.payload.blueprint_id,
          user_id: op.payload.user_id,
          kind: op.payload.kind,
          content: op.payload.content ?? null,
          payload: op.payload.payload ?? {},
        };
        if (op.payload.created_at) row.created_at = op.payload.created_at;
        const { error } = await supabase.from('goal_logs').insert(row);
        if (error) throw error;
        flushed++;
      } else if (op.type === 'tracker_update') {
        const { error } = await supabase
          .from('blueprint_tracker')
          .update({
            completed_step_ids: op.payload.completed_step_ids,
            updated_at: new Date().toISOString(),
          })
          .eq('blueprint_id', op.payload.blueprint_id)
          .eq('user_id', userId);
        if (error) throw error;
        flushed++;
      } else if (op.type === 'goal_log_delete') {
        const { error } = await supabase.from('goal_logs').delete().eq('id', op.payload.log_id).eq('user_id', userId);
        if (error) throw error;
        flushed++;
      }
    } catch (e) {
      console.warn('trackerOffline: flush failed for', op.id, e);
      errors++;
      remaining.push(op);
    }
  }

  savePendingQueue(remaining);
  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  return { flushed, errors };
}

export function getPendingCount(): number {
  return getPendingQueue().length;
}

/** Subscribe to sync completion (e.g. to refetch data). */
export function onTrackerSynced(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(SYNC_EVENT, handler);
  return () => window.removeEventListener(SYNC_EVENT, handler);
}
