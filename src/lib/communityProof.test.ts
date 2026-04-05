import { describe, expect, it } from "vitest";

import { buildCommunityProofArtifacts } from "./communityProof";
import type {
  Blueprint,
  BlueprintSubGoal,
  BlueprintTask,
  BlueprintTaskCompletion,
  BlueprintTracker,
  GoalLog,
} from "./blueprints";

describe("communityProof", () => {
  it("builds a snapshot and verified history from execution data", () => {
    const blueprint: Blueprint = {
      id: "bp-1",
      framework: "rpm",
      title: "Ship consulting offer",
      answers: ["Ship consulting offer"],
      createdAt: "2026-04-01T09:00:00.000Z",
      result: {
        type: "rpm",
        result: "Ship consulting offer",
        purpose: "Create reliable revenue",
        plan: ["Run a 45 minute outreach block every Monday and Thursday."],
        shortTitle: "Ship consulting offer",
        executiveSummary: "Summary",
        commitment: "~5 hrs/week",
        firstWeekActions: [
          "Run a 45 minute outreach block every Monday and Thursday.",
        ],
        milestones: [
          "Week 1: first 10 messages",
          "Week 2: first 3 calls",
          "Week 4: first proposal",
        ],
        successCriteria: "First client signed",
        whatToAvoid: ["Random busywork"],
        yourWhy: "Revenue and proof",
        difficulty: "intermediate",
        difficultyReason: "Requires consistency",
        failureModes: ["Skipping outreach"],
        scheduleHints: [],
        accountabilityHooks: ["Send Friday update"],
        revisionTriggers: ["Miss 2 outreach blocks"],
        weeklyReviewPrompt: "What should change next week?",
      } as any,
    };

    const tracker: BlueprintTracker = {
      blueprint_id: blueprint.id,
      user_id: "u1",
      plan_kind: "finite",
      status: "active",
      progress_pct: 50,
      completed_step_ids: ["step-1"],
      last_activity_at: "2026-04-03T09:00:00.000Z",
      created_at: "2026-04-01T09:00:00.000Z",
      updated_at: "2026-04-03T10:00:00.000Z",
    };

    const logs: GoalLog[] = [
      {
        id: "l1",
        blueprint_id: blueprint.id,
        user_id: "u1",
        kind: "check_in",
        payload: { done: true },
        created_at: "2026-04-03T09:00:00.000Z",
      },
      {
        id: "l2",
        blueprint_id: blueprint.id,
        user_id: "u1",
        kind: "step_done",
        payload: { step_id: "step-1" },
        created_at: "2026-04-02T09:00:00.000Z",
      },
    ];
    const subGoals: BlueprintSubGoal[] = [
      {
        id: "sg1",
        blueprint_id: blueprint.id,
        user_id: "u1",
        title: "Week 1: first 10 messages",
        target_date: "2026-04-05",
        status: "completed",
        created_at: "2026-04-01T09:00:00.000Z",
      },
    ];
    const tasks: BlueprintTask[] = [
      {
        id: "t1",
        blueprint_id: blueprint.id,
        user_id: "u1",
        title: "Send 10 messages",
        target_count: 10,
        created_at: "2026-04-01T09:00:00.000Z",
      },
    ];
    const taskCompletions: BlueprintTaskCompletion[] = [
      {
        id: "tc1",
        task_id: "t1",
        user_id: "u1",
        completed_at: "2026-04-03T09:00:00.000Z",
      },
    ];

    const proof = buildCommunityProofArtifacts({
      blueprint,
      tracker,
      logs,
      subGoals,
      tasks,
      taskCompletions,
    });

    expect(proof.snapshot.progressPct).toBe(50);
    expect(proof.snapshot.currentStreak).toBe(2);
    expect(proof.events.some((event) => event.eventType === "milestone")).toBe(
      true,
    );
    expect(proof.events.some((event) => event.eventType === "execution")).toBe(
      true,
    );
  });
});
