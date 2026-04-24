import { describe, expect, it, vi } from "vitest";
import type {
  Checkpoint,
  CheckpointMetadata,
  PendingWrite,
} from "@langchain/langgraph-checkpoint";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseCheckpointer } from "./supabaseCheckpointer";

interface QueryResult {
  data: unknown;
  error: { message: string } | null;
}

function createQueryBuilder(
  result: QueryResult,
  upsertSpy?: (payload: unknown) => void,
) {
  const builder = {
    delete: vi.fn(),
    eq: vi.fn(),
    limit: vi.fn(),
    order: vi.fn(),
    select: vi.fn(),
    then: undefined as
      | ((
          onfulfilled?: ((value: QueryResult) => unknown) | null,
          onrejected?: ((reason: unknown) => unknown) | null,
        ) => Promise<unknown>)
      | undefined,
    upsert: vi.fn(async (payload: unknown) => {
      upsertSpy?.(payload);
      return { error: null };
    }),
  };

  builder.delete.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.select.mockReturnValue(builder);
  builder.then = (onfulfilled, onrejected) =>
    Promise.resolve(result).then(onfulfilled, onrejected);

  return builder;
}

function createCheckpointerClient(options?: {
  checkpointResults?: QueryResult[];
  writeResults?: QueryResult[];
  userId?: string | null;
}) {
  const checkpointResults = [...(options?.checkpointResults ?? [])];
  const writeResults = [...(options?.writeResults ?? [])];
  const checkpointUpsert = vi.fn();
  const writeUpsert = vi.fn();
  const builders = {
    checkpoints: [] as ReturnType<typeof createQueryBuilder>[],
    checkpoint_writes: [] as ReturnType<typeof createQueryBuilder>[],
  };

  const client = {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: options?.userId
            ? {
                user: {
                  id: options.userId,
                },
              }
            : null,
        },
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "checkpoints") {
        const builder = createQueryBuilder(
          checkpointResults.shift() ?? { data: null, error: null },
          checkpointUpsert,
        );
        builders.checkpoints.push(builder);
        return builder;
      }

      if (table === "checkpoint_writes") {
        const builder = createQueryBuilder(
          writeResults.shift() ?? { data: null, error: null },
          writeUpsert,
        );
        builders.checkpoint_writes.push(builder);
        return builder;
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  } as unknown as SupabaseClient;

  return {
    builders,
    checkpointUpsert,
    client,
    writeUpsert,
  };
}

describe("SupabaseCheckpointer", () => {
  it("hydrates pending writes when loading a checkpoint tuple", async () => {
    const checkpoint = { id: "checkpoint-1" } as unknown as Checkpoint;
    const metadata = { source: "unit-test" } as CheckpointMetadata;
    const { client } = createCheckpointerClient({
      checkpointResults: [
        {
          data: [
            {
              checkpoint,
              checkpoint_id: "checkpoint-1",
              metadata,
              parent_checkpoint_id: "checkpoint-0",
              thread_id: "thread-1",
            },
          ],
          error: null,
        },
      ],
      writeResults: [
        {
          data: [
            {
              channel: "messages",
              checkpoint_id: "checkpoint-1",
              idx: 0,
              owner_user_id: "user-1",
              task_id: "task-1",
              thread_id: "thread-1",
              value: { text: "hello" },
            },
            {
              channel: null,
              checkpoint_id: "checkpoint-1",
              idx: 1,
              owner_user_id: "user-1",
              task_id: "task-1",
              thread_id: "thread-1",
              value: { text: "skip me" },
            },
          ],
          error: null,
        },
      ],
      userId: "user-1",
    });

    const checkpointer = new SupabaseCheckpointer(client);
    const tuple = await checkpointer.getTuple({
      configurable: { thread_id: "thread-1" },
    });

    expect(tuple).toMatchObject({
      checkpoint,
      config: {
        configurable: { checkpoint_id: "checkpoint-1", thread_id: "thread-1" },
      },
      metadata,
      parentConfig: {
        configurable: { checkpoint_id: "checkpoint-0", thread_id: "thread-1" },
      },
    });
    expect(tuple?.pendingWrites).toEqual([
      ["task-1", "messages", { text: "hello" }],
    ]);
  });

  it("stores pending writes with task and channel metadata", async () => {
    const { client, writeUpsert } = createCheckpointerClient({ userId: "user-1" });
    const checkpointer = new SupabaseCheckpointer(client);
    const writes = [
      ["messages", { text: "hello" }],
      ["updates", { status: "done" }],
    ] as PendingWrite[];

    await checkpointer.putWrites(
      {
        configurable: {
          checkpoint_id: "checkpoint-1",
          thread_id: "thread-1",
        },
      },
      writes,
      "task-42",
    );

    expect(writeUpsert).toHaveBeenCalledWith([
      {
        channel: "messages",
        checkpoint_id: "checkpoint-1",
        idx: 0,
        owner_user_id: "user-1",
        task_id: "task-42",
        thread_id: "thread-1",
        type: "write",
        value: { text: "hello" },
      },
      {
        channel: "updates",
        checkpoint_id: "checkpoint-1",
        idx: 1,
        owner_user_id: "user-1",
        task_id: "task-42",
        thread_id: "thread-1",
        type: "write",
        value: { status: "done" },
      },
    ]);
  });

  it("scopes deleteThread to the current user when a session is present", async () => {
    const { builders, client } = createCheckpointerClient({
      checkpointResults: [{ data: null, error: null }],
      writeResults: [{ data: null, error: null }],
      userId: "user-1",
    });
    const checkpointer = new SupabaseCheckpointer(client);

    await checkpointer.deleteThread("thread-1");

    expect(builders.checkpoint_writes[0].delete).toHaveBeenCalledOnce();
    expect(builders.checkpoint_writes[0].eq).toHaveBeenNthCalledWith(
      1,
      "thread_id",
      "thread-1",
    );
    expect(builders.checkpoint_writes[0].eq).toHaveBeenNthCalledWith(
      2,
      "owner_user_id",
      "user-1",
    );
    expect(builders.checkpoints[0].delete).toHaveBeenCalledOnce();
    expect(builders.checkpoints[0].eq).toHaveBeenNthCalledWith(
      1,
      "thread_id",
      "thread-1",
    );
    expect(builders.checkpoints[0].eq).toHaveBeenNthCalledWith(
      2,
      "owner_user_id",
      "user-1",
    );
  });
});