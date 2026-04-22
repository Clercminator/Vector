import { describe, expect, it } from "vitest";

import type { BlueprintTask, BlueprintTracker, GoalLog } from "./blueprints";
import {
  formatTaskTarget,
  getMetricSummary,
  getQuickLogCadenceState,
  hasTrackerQuickLogSurface,
} from "./trackerSurface";

describe("trackerSurface", () => {
  const tracker: BlueprintTracker = {
    blueprint_id: "bp-1",
    user_id: "user-1",
    plan_kind: "finite",
    status: "active",
    progress_pct: 20,
    completed_step_ids: [],
    last_activity_at: new Date("2026-04-20T10:00:00.000Z").toISOString(),
    created_at: new Date("2026-04-01T10:00:00.000Z").toISOString(),
    updated_at: new Date("2026-04-20T10:00:00.000Z").toISOString(),
    tracking_question: "How many minutes did you spend on reading today?",
    frequency: "daily",
    reminder_time: "07:00",
    reminder_days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    reminder_enabled: true,
  };

  const metricTask: BlueprintTask = {
    id: "task-1",
    blueprint_id: "bp-1",
    user_id: "user-1",
    title: "Read",
    target_count: 45,
    task_type: "task",
    input_type: "duration",
    target_value: 45,
    unit_label: "minutes",
    created_at: new Date("2026-04-01T10:00:00.000Z").toISOString(),
  };

  it("shows a quick-log surface when a finite tracker has a question or metric tasks", () => {
    expect(hasTrackerQuickLogSurface(tracker, [])).toBe(true);
    expect(
      hasTrackerQuickLogSurface({ ...tracker, tracking_question: null }, [
        metricTask,
      ]),
    ).toBe(true);
  });

  it("formats metric targets and the latest metric summary", () => {
    const logs: GoalLog[] = [
      {
        id: "log-1",
        blueprint_id: "bp-1",
        user_id: "user-1",
        kind: "check_in",
        content: null,
        payload: {
          done: true,
          metrics: [
            {
              task_id: "task-1",
              title: "Read",
              input_type: "duration",
              value: 30,
              unit_label: "minutes",
              target_value: 45,
            },
          ],
        },
        created_at: new Date("2026-04-21T08:30:00.000Z").toISOString(),
      },
    ];

    expect(formatTaskTarget(metricTask)).toBe("45 minutes");
    expect(getMetricSummary([metricTask], logs)).toBe(
      "Read: 30 minutes / 45 minutes",
    );
  });

  it("tracks due-state and completion from check-ins for hybrid quick logs", () => {
    const now = new Date("2026-04-21T12:00:00.000Z");
    const logs: GoalLog[] = [
      {
        id: "log-2",
        blueprint_id: "bp-1",
        user_id: "user-1",
        kind: "check_in",
        content: null,
        payload: { done: true },
        created_at: new Date("2026-04-21T07:15:00.000Z").toISOString(),
      },
    ];

    expect(getQuickLogCadenceState(tracker, logs, now)).toEqual({
      completedToday: true,
      isDue: true,
      streakOrLast: "Active",
    });
  });
});
