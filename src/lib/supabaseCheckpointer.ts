import {
  BaseCheckpointSaver,
  Checkpoint,
  CheckpointMetadata,
  CheckpointTuple,
  SerializerProtocol,
  PendingWrite,
} from "@langchain/langgraph-checkpoint";
import { SupabaseClient } from "@supabase/supabase-js";

interface CheckpointRow {
  owner_user_id?: string | null;
  thread_id: string;
  checkpoint_id: string;
  parent_checkpoint_id: string | undefined;
  type: "checkpoint" | "metadata";
  checkpoint: any; // jsonb
  metadata: any; // jsonb
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

  async getTuple(config: {
    configurable?: { thread_id?: string; checkpoint_id?: string };
  }): Promise<CheckpointTuple | undefined> {
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
    // We also need the pending writes for this checkpoint?
    // For simplicity in this implementation, we might skip 'putWrites' logic if we aren't using advanced human-in-the-loop requiring write persistence BEFORE commit.
    // But for full compliance, we should implementing putting writes.
    // Getting writes:
    // const writes = await this.client.from("checkpoint_writes")...

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
      pendingWrites: [], // TODO: Implement writes fetching if needed
    };
  }

  async *list(config: {
    configurable?: { thread_id?: string };
    limit?: number;
    before?: { configurable?: { checkpoint_id?: string } };
  }): AsyncGenerator<CheckpointTuple> {
    const thread_id = config.configurable?.thread_id;
    if (!thread_id) return;

    let query = this.client
      .from("checkpoints")
      .select("*")
      .eq("thread_id", thread_id)
      .eq("type", "checkpoint")
      .order("created_at", { ascending: false });

    if (config.limit) {
      query = query.limit(config.limit);
    }

    // 'before' logic would require created_at filtering or cursor based on ID.
    // Ignoring 'before' for MVP simplicity.

    const { data, error } = await query;
    if (error) {
      console.error("Listing error", error);
      return;
    }

    for (const row of data || []) {
      yield {
        config: {
          configurable: { thread_id, checkpoint_id: row.checkpoint_id },
        },
        checkpoint: row.checkpoint,
        metadata: row.metadata,
        parentConfig: row.parent_checkpoint_id
          ? {
              configurable: {
                thread_id,
                checkpoint_id: row.parent_checkpoint_id,
              },
            }
          : undefined,
      };
    }
  }

  async put(
    config: { configurable?: { thread_id?: string; checkpoint_id?: string } },
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    newVersions?: any,
  ): Promise<{ configurable: { thread_id: string; checkpoint_id: string } }> {
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
    } catch (e: any) {
      console.warn(
        "SupabaseCheckpointer: Unexpected error saving checkpoint (non-fatal)",
        e,
      );
    }

    return { configurable: { thread_id, checkpoint_id } };
  }

  async putWrites(
    config: { configurable?: { thread_id?: string; checkpoint_id?: string } },
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

  async deleteThread(config: {
    configurable?: { thread_id?: string };
  }): Promise<void> {
    // Not implemented for this MVP, but required by interface
    // console.warn("deleteThread not implemented");
  }
}
