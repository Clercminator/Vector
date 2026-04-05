import { describe, expect, it } from "vitest";
import { getExecutionInsight } from "./trackerStats";
import { Blueprint, BlueprintTracker, GoalLog } from "./blueprints";

describe("trackerStats execution insight", () => {
  it("flags high streak risk and suggests recovery when activity has stalled", () => {
    const blueprint: Blueprint = {
      id: "bp-1",
      framework: "general",
      title: "Consistency plan",
      answers: ["Be consistent"],
      createdAt: new Date().toISOString(),
      result: {
        type: "general",
        steps: ["Workout 3x/week, 45 min, target 4 straight weeks"],
        shortTitle: "Consistency plan",
        executiveSummary: "Summary",
        commitment: "~3 hrs/week",
        firstWeekActions: ["Workout 3x/week, 45 min, target 4 straight weeks"],
        milestones: ["Week 1 done", "Week 2 done", "Week 4 done"],
        successCriteria: "4 straight weeks completed",
        whatToAvoid: ["Skipping scheduled sessions"],
        yourWhy: "Build discipline",
        difficulty: "intermediate",
        difficultyReason: "Requires repeated execution",
        failureModes: ["Skipping sessions"],
        scheduleHints: [
          {
            label: "Workout block",
            cadence: "weekly",
            days: ["mon"],
            time: "18:00",
            durationMinutes: 45,
          },
        ],
        accountabilityHooks: ["Text a friend after each workout"],
        revisionTriggers: ["Miss 2 workouts in a row"],
        weeklyReviewPrompt:
          "What adjustment makes next week easier to execute?",
      },
    } as Blueprint;

    const tracker: BlueprintTracker = {
      blueprint_id: "bp-1",
      user_id: "u1",
      plan_kind: "finite",
      status: "active",
      progress_pct: 10,
      completed_step_ids: [],
      last_activity_at: new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const logs: GoalLog[] = [];
    const insight = getExecutionInsight(blueprint, tracker, logs);

    expect(insight.streakRisk).toBe("high");
    expect(insight.overdueSignals.length).toBeGreaterThan(0);
    expect(insight.missedDayRecovery).toContain("Workout 3x/week");
  });
});
