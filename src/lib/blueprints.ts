import type {
  CanonicalPlanFields,
  CommunityProofSnapshot,
  PlanScheduleHint,
} from "./planContract";

export type FrameworkId =
  | "first-principles"
  | "pareto"
  | "rpm"
  | "eisenhower"
  | "okr"
  | "dsss"
  | "mandalas"
  | "gps"
  | "misogi"
  | "ikigai"
  | "general";

export type BlueprintResultShared = CanonicalPlanFields & {
  scheduleHints: PlanScheduleHint[];
  communityProof?: CommunityProofSnapshot;
};

export type BlueprintResult =
  | (BlueprintResultShared & {
      type: "first-principles";
      truths: string[];
      newApproach: string;
    })
  | (BlueprintResultShared & {
      type: "pareto";
      vital: string[];
      trivial: string[];
    })
  | (BlueprintResultShared & {
      type: "rpm";
      result: string;
      purpose: string;
      plan: string[];
    })
  | (BlueprintResultShared & {
      type: "eisenhower";
      q1: string[];
      q2: string[];
      q3: string[];
      q4: string[];
    })
  | (BlueprintResultShared & {
      type: "okr";
      objective: string;
      keyResults: string[];
      initiative: string;
    })
  | (BlueprintResultShared & {
      type: "mandalas";
      centralGoal: string;
      categories: Array<{ name: string; steps: string[] }>;
    })
  | (BlueprintResultShared & {
      type: "ikigai";
      love: string;
      goodAt: string;
      worldNeeds: string;
      paidFor: string;
      purpose: string;
    })
  | (BlueprintResultShared & {
      type: "dsss";
      deconstruct: string[];
      selection: string[];
      sequence: string[];
      stakes: string;
    })
  | (BlueprintResultShared & {
      type: "gps";
      goal: string;
      plan: string[];
      system: string[];
      anti_goals?: string[];
    })
  | (BlueprintResultShared & {
      type: "misogi";
      challenge: string | string[];
      gap: string | string[];
      purification: string | string[];
    })
  | (BlueprintResultShared & { type: "general"; steps: string[] })
  | (BlueprintResultShared & Record<string, unknown>);

export interface Blueprint {
  id: string;
  framework: FrameworkId;
  title: string;
  answers: string[];
  result: BlueprintResult;
  createdAt: string; // ISO string
}

export interface BlueprintTracker {
  blueprint_id: string;
  user_id: string;
  plan_kind: "finite" | "infinite";
  status: "active" | "completed" | "paused" | "abandoned";
  progress_pct: number;
  completed_step_ids: string[];
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  tracking_question?: string | null;
  color?: string | null;
  reminder_time?: string | null;
  reminder_days?: string[];
  reminder_enabled?: boolean;
  frequency?: "daily" | "weekly" | "custom";
  savings_baseline?: number | null;
  savings_unit?: string | null;
  savings_enabled?: boolean;
  tags?: string[];
}

export interface GoalLog {
  id: string;
  blueprint_id: string;
  user_id: string;
  kind: "journal" | "check_in" | "step_done" | "setback";
  content?: string | null;
  payload?: Record<string, any>;
  created_at: string;
}

export interface BlueprintSubGoal {
  id: string;
  blueprint_id: string;
  user_id: string;
  title: string;
  target_date: string; // YYYY-MM-DD
  status: "active" | "completed" | "missed";
  created_at: string;
}

export interface BlueprintTask {
  id: string;
  blueprint_id: string;
  user_id: string;
  title: string;
  target_count: number;
  created_at: string;
}

export interface BlueprintTaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  completed_at: string;
}

export interface MotivationalContent {
  id: string;
  content_type: "quote" | "affirmation";
  text: string;
  author?: string | null;
  sort_order: number;
  created_at: string;
}

// Batch 3 Features
export interface BlueprintReminder {
  id: string;
  blueprint_id: string;
  user_id: string;
  time: string; // HH:mm format
  days: string[]; // Array of strings like 'monday', 'tuesday', etc.
  created_at: string;
}

export interface SupportResource {
  id: string;
  title: string;
  description?: string;
  url?: string;
  phone?: string;
  type: "emergency" | "general" | "internal";
  enabled: boolean;
  sort_order: number;
}

export interface GoalTemplate {
  id: string;
  title: string;
  description?: string;
  framework: FrameworkId | "general";
  is_active: boolean;
  sort_order?: number;
}

export interface GoalTemplateItem {
  id: string;
  template_id: string;
  item_type: "sub_goal" | "task";
  title: string;
  description?: string;
  target_count?: number; // for tasks
  relative_days: number; // offset for target_date calculation
}

export interface BlueprintShare {
  id: string;
  blueprint_id: string;
  user_id: string;
  share_token: string;
  permission: "view" | "edit";
  expires_at?: string | null;
  created_at: string;
}

const STORAGE_KEY = "vector.blueprints.v1";

export function loadLocalBlueprints(): Blueprint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as Blueprint[];
  } catch {
    return [];
  }
}

export function saveLocalBlueprints(blueprints: Blueprint[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprints));
}

import { SupabaseClient } from "@supabase/supabase-js";

// ... (existing exports)

/**
 * Upsert blueprint to Supabase.
 * Note: App.tsx uses an overload name. We export this as a distinct function
 * or we can use function overloading if we want to mimic the current usage.
 * Since I cannot change App.tsx easily in one go without errors, I will export this
 * separate function first, then check App.tsx usage.
 * Wait, App.tsx imports `upsertBlueprint`. If I change the signature here, I break it.
 * But currently `upsertBlueprint` calls in App.tsx (Line 258) DO NOT MATCH this file.
 * So I will add the Overload implementation.
 */

export function upsertBlueprint(list: Blueprint[], bp: Blueprint): Blueprint[];
export function upsertBlueprint(
  client: SupabaseClient,
  bp: Blueprint,
  userId: string,
): Promise<any>;
export function upsertBlueprint(arg1: any, bp: Blueprint, arg3?: string): any {
  // Local Usage
  if (Array.isArray(arg1)) {
    const list = arg1 as Blueprint[];
    const idx = list.findIndex((x) => x.id === bp.id);
    if (idx === -1) return [bp, ...list];
    const next = [...list];
    next[idx] = bp;
    return next;
  }

  // Remote Usage
  const supabase = arg1 as SupabaseClient;
  const userId = arg3 as string;
  return supabase
    .from("blueprints")
    .upsert({
      id: bp.id,
      user_id: userId,
      framework: bp.framework,
      title: bp.title,
      answers: bp.answers,
      result: bp.result,
      updated_at: new Date().toISOString(),
    })
    .then(({ error }) => {
      if (error) throw error;
      return null;
    });
}

// Same for removeBlueprint
export function removeBlueprint(list: Blueprint[], id: string): Blueprint[];
export function removeBlueprint(
  client: SupabaseClient,
  id: string,
): Promise<any>;
export function removeBlueprint(arg1: any, id: string): any {
  if (Array.isArray(arg1)) {
    return (arg1 as Blueprint[]).filter((x) => x.id !== id);
  }
  return (arg1 as SupabaseClient)
    .from("blueprints")
    .delete()
    .eq("id", id)
    .then(({ error }) => {
      if (error) throw error;
      return null;
    });
}

// Chat Persistence
export async function fetchBlueprintMessages(
  supabase: SupabaseClient,
  blueprintId: string,
) {
  const { data, error } = await supabase
    .from("blueprint_messages")
    .select("*")
    .eq("blueprint_id", blueprintId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as { role: "user" | "ai"; content: string }[];
}

export async function saveBlueprintMessage(
  supabase: SupabaseClient,
  blueprintId: string,
  role: "user" | "ai",
  content: string,
) {
  return supabase
    .from("blueprint_messages")
    .insert({
      blueprint_id: blueprintId,
      role,
      content,
    })
    .then(({ error }) => {
      if (error) throw error;
      return null;
    });
}

export async function saveBlueprintMessages(
  supabase: SupabaseClient,
  blueprintId: string,
  messages: { role: "user" | "ai"; content: string }[],
) {
  const toInsert = messages.map((m) => ({
    blueprint_id: blueprintId,
    role: m.role,
    content: m.content,
  }));
  return supabase
    .from("blueprint_messages")
    .insert(toInsert)
    .then(({ error }) => {
      if (error) throw error;
      return null;
    });
}

export async function syncBlueprintMessages(
  supabase: SupabaseClient,
  blueprintId: string,
  messages: { role: "user" | "ai"; content: string }[],
) {
  // 1. Delete existing messages for this blueprint
  const { error: deleteError } = await supabase
    .from("blueprint_messages")
    .delete()
    .eq("blueprint_id", blueprintId);

  if (deleteError) throw deleteError;

  // 2. Insert new messages
  if (messages.length > 0) {
    return saveBlueprintMessages(supabase, blueprintId, messages);
  }
}

/** Exclude system-injected userReview feedback (fake "Answer 6") from answers. */
export function filterRealAnswers(answers: string[]): string[] {
  const prefix = "User-perspective review requested improvements";
  return (answers || []).filter((a) => !(a || "").trim().startsWith(prefix));
}

export function blueprintTitleFromAnswers(
  answers: string[],
  fallback = "Untitled blueprint",
) {
  const first = (answers[0] ?? "").trim();
  if (!first) return fallback;
  // Keep titles short for UI.
  return first.length > 60 ? `${first.slice(0, 57)}...` : first;
}

export async function syncLocalBlueprintsToRemote(
  supabase: SupabaseClient,
  userId: string,
) {
  const local = loadLocalBlueprints();
  if (local.length === 0) return 0;

  for (const bp of local) {
    // Ensure user_id is set to the current user
    await upsertBlueprint(supabase, bp, userId);
  }

  // Clear local blueprints after sync
  localStorage.removeItem(STORAGE_KEY);
  return local.length;
}

const DELETED_QUEUE_KEY = "vector.deleted_queue";

export function queueDeletedBlueprint(id: string) {
  try {
    const raw = localStorage.getItem(DELETED_QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    if (!queue.includes(id)) {
      queue.push(id);
      localStorage.setItem(DELETED_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch (e) {
    console.error("Failed to queue deleted blueprint", e);
  }
}

export async function processDeletedQueue(supabase: SupabaseClient) {
  try {
    const raw = localStorage.getItem(DELETED_QUEUE_KEY);
    if (!raw) return;
    const queue = JSON.parse(raw) as string[];

    if (queue.length === 0) return;

    console.log("Processing deleted queue:", queue);

    for (const id of queue) {
      await removeBlueprint(supabase, id);
    }

    localStorage.removeItem(DELETED_QUEUE_KEY);
  } catch (e) {
    console.error("Failed to process deleted queue", e);
  }
}
