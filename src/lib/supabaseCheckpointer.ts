import {
  BaseCheckpointSaver,
  ChannelVersions,
  Checkpoint,
  CheckpointListOptions,
  CheckpointMetadata,
  CheckpointPendingWrite,
  CheckpointTuple,
  PendingWrite,
} from "@langchain/langgraph-checkpoint";
import { RunnableConfig } from "@langchain/core/runnables";
import { SupabaseClient } from "@supabase/supabase-js";

interface CheckpointRow {
  owner_user_id?: string | null;
  thread_id: string;
  checkpoint_id: string;
  parent_checkpoint_id: string | undefined;
  type: "checkpoint" | "metadata";
  checkpoint: unknown;
  metadata: unknown;
}

interface CheckpointWriteRow {
  owner_user_id?: string | null;
  thread_id: string;
  checkpoint_id: string;
  task_id: string;
  idx: number;
  channel: string | null;
  value: unknown;
}

/**
 * A persistent checkpointer that saves to Supabase.
 */
export class SupabaseCheckpointer extends BaseCheckpointSaver {
  client: SupabaseClient;

  constructor(client: SupabaseClient) {
    super();
    this.client = client;
  }

  private async getCurrentUserId(): Promise<string | null> {
    const {
      data: { session },
    } = await this.client.auth.getSession();

    return session?.user?.id ?? null;
  }

  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const thread_id = config.configurable?.thread_id;
    const checkpoint_id = config.configurable?.checkpoint_id;

    if (!thread_id) return undefined;

    let query = this.client
      .from("checkpoints")
      .select("*")
      .eq("thread_id", thread_id)
      .eq("type", "checkpoint");

    if (checkpoint_id) {
      query = query.eq("checkpoint_id", checkpoint_id);
    } else {
      // Get the latest
      query = query.order("created_at", { ascending: false }).limit(1);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching checkpoint tuple", error);
      return undefined;
    }

    if (!data || data.length === 0) return undefined;

    const row = data[0];
    const pendingWrites = await this.getPendingWrites(
      thread_id,
      row.checkpoint_id,
    );

    return {
      config: { configurable: { thread_id, checkpoint_id: row.checkpoint_id } },
      checkpoint: row.checkpoint as Checkpoint,
      metadata: row.metadata as CheckpointMetadata,
      parentConfig: row.parent_checkpoint_id
        ? {
            configurable: {
              thread_id,
              checkpoint_id: row.parent_checkpoint_id,
            },
          }
        : undefined,
      pendingWrites,
    };
  }

  async *list(
    config: RunnableConfig,
    options?: CheckpointListOptions,
  ): AsyncGenerator<CheckpointTuple> {
    const thread_id = config.configurable?.thread_id;
    if (!thread_id) return;

    let query = this.client
      .from("checkpoints")
      .select("*")
      .eq("thread_id", thread_id)
      .eq("type", "checkpoint")
      .order("created_at", { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    // 'before' logic would require created_at filtering or cursor based on ID.
    // Ignoring 'before' for MVP simplicity.

    const { data, error } = await query;
    if (error) {
      console.error("Listing error", error);
      return;
    }

    for (const row of data || []) {
      const pendingWrites = await this.getPendingWrites(
        thread_id,
        row.checkpoint_id,
      );
      yield {
        config: {
          configurable: { thread_id, checkpoint_id: row.checkpoint_id },
        },
        checkpoint: row.checkpoint as Checkpoint,
        metadata: row.metadata as CheckpointMetadata,
        parentConfig: row.parent_checkpoint_id
          ? {
              configurable: {
                thread_id,
                checkpoint_id: row.parent_checkpoint_id,
              },
            }
          : undefined,
        pendingWrites,
      };
    }
  }

  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    _newVersions: ChannelVersions,
  ): Promise<RunnableConfig> {
    const thread_id = config.configurable?.thread_id;
    const checkpoint_id = checkpoint.id; // Checkpoint ID comes from the checkpoint object itself usually
    const owner_user_id = await this.getCurrentUserId();

    if (!thread_id) throw new Error("Missing thread_id");

    try {
      const { error } = await this.client.from("checkpoints").upsert({
        owner_user_id,
        thread_id,
        checkpoint_id,
        parent_checkpoint_id: config.configurable?.checkpoint_id, // The ID we branched FROM
        type: "checkpoint",
        checkpoint: checkpoint,
        metadata: metadata,
      });

      if (error) {
        console.warn(
          `SupabaseCheckpointer: Failed to save checkpoint (non-fatal): ${error.message}`,
        );
        // We do NOT throw here, allowing the agent to continue even if persistence fails.
      }
    } catch (e: unknown) {
      console.warn(
        "SupabaseCheckpointer: Unexpected error saving checkpoint (non-fatal)",
        e,
      );
    }

    return { configurable: { thread_id, checkpoint_id } };
  }

  async putWrites(
    config: RunnableConfig,
    writes: PendingWrite[],
    taskId: string,
  ): Promise<void> {
    // Optional for basic persistence, but good for completeness
    const thread_id = config.configurable?.thread_id;
    const checkpoint_id = config.configurable?.checkpoint_id;
    const owner_user_id = await this.getCurrentUserId();
    if (!thread_id || !checkpoint_id) return;

    const rows = writes.map((w, idx) => ({
      owner_user_id,
      thread_id,
      checkpoint_id,
      task_id: taskId,
      idx,
      channel: w[0],
      type: "write", // null?
      value: w[1],
    }));

    try {
      const { error } = await this.client
        .from("checkpoint_writes")
        .upsert(rows);
      if (error) {
        console.warn(
          `SupabaseCheckpointer: Failed to save writes (non-fatal): ${error.message}`,
        );
      }
    } catch (e) {
      console.warn(
        "SupabaseCheckpointer: Unexpected error saving writes (non-fatal)",
        e,
      );
    }
  }

  async deleteThread(threadId: string): Promise<void> {
    const owner_user_id = await this.getCurrentUserId();
    if (!threadId) return;

    const writeDelete = this.client
      .from("checkpoint_writes")
      .delete()
      .eq("thread_id", threadId);
    const checkpointDelete = this.client
      .from("checkpoints")
      .delete()
      .eq("thread_id", threadId);

    const scopedWriteDelete = owner_user_id
      ? writeDelete.eq("owner_user_id", owner_user_id)
      : writeDelete;
    const scopedCheckpointDelete = owner_user_id
      ? checkpointDelete.eq("owner_user_id", owner_user_id)
      : checkpointDelete;

    const [{ error: writesError }, { error: checkpointsError }] =
      await Promise.all([scopedWriteDelete, scopedCheckpointDelete]);

    if (writesError) {
      console.warn(
        `SupabaseCheckpointer: Failed to delete checkpoint writes (non-fatal): ${writesError.message}`,
      );
    }

    if (checkpointsError) {
      console.warn(
        `SupabaseCheckpointer: Failed to delete checkpoints (non-fatal): ${checkpointsError.message}`,
      );
    }
  }

  private async getPendingWrites(
    threadId: string,
    checkpointId: string,
  ): Promise<CheckpointPendingWrite[]> {
    const { data, error } = await this.client
      .from("checkpoint_writes")
      .select("thread_id, checkpoint_id, task_id, idx, channel, value, owner_user_id")
      .eq("thread_id", threadId)
      .eq("checkpoint_id", checkpointId)
      .order("task_id", { ascending: true })
      .order("idx", { ascending: true });

    if (error) {
      console.error("Error fetching checkpoint writes", error);
      return [];
    }

    return ((data as CheckpointWriteRow[] | null) || [])
      .filter((row) => typeof row.channel === "string" && row.channel.length > 0)
      .map(
        (row) =>
          [row.task_id, row.channel as string, row.value] as CheckpointPendingWrite,
      );
  }
}
