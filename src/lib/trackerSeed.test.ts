import { describe, expect, it } from "vitest";
import type { Blueprint } from "./blueprints";
import { deriveTrackerSeed } from "./trackerSeed";

describe("deriveTrackerSeed", () => {
  it("derives tracker defaults, milestones, tasks, and reminders from the canonical plan", () => {
    const blueprint: Blueprint = {
      id: "bp-1",
      framework: "rpm",
      title: "Launch consulting offer",
      answers: ["Launch consulting offer"],
      createdAt: new Date("2026-01-01T09:00:00.000Z").toISOString(),
      result: {
        type: "rpm",
        result: "Sign first three clients",
        purpose: "Build durable monthly revenue",
        plan: [
          "Customer discovery interviews 3x/week, 30 min, target 10 interviews by week 2",
          "Offer delivery block Tue/Thu at 09:00, 90 min, target 2 pilot projects by week 4",
        ],
        scheduleHints: [
          {
            label: "Customer discovery block",
            cadence: "weekly",
            days: ["tue", "thu"],
            time: "09:00",
            durationMinutes: 30,
          },
        ],
      },
    };

    const seed = deriveTrackerSeed(
      blueprint,
      "user-1",
      new Date("2026-01-01T09:00:00.000Z"),
    );

    expect(seed.trackerDefaults.tracking_question).toBeTruthy();
    expect(seed.trackerDefaults.frequency).toBe("weekly");
    expect(seed.trackerDefaults.reminder_time).toBe("09:00");
    expect(seed.subGoals.length).toBeGreaterThan(0);
    expect(seed.tasks.length).toBeGreaterThan(0);
    expect(seed.tasks[0].target_count).toBeGreaterThanOrEqual(1);
    expect(seed.tasks.some((task) => task.task_type === "proof_entry")).toBe(
      true,
    );
    expect(seed.tasks.some((task) => task.task_type === "review")).toBe(true);
    expect(seed.tasks.some((task) => task.task_type === "rescue_action")).toBe(
      true,
    );
    expect(
      seed.tasks.some((task) => task.title.startsWith("Weekly proof:")),
    ).toBe(false);
    expect(seed.reminders).toEqual([
      {
        blueprint_id: "bp-1",
        user_id: "user-1",
        time: "09:00",
        days: ["tue", "thu"],
      },
      {
        blueprint_id: "bp-1",
        user_id: "user-1",
        time: "18:00",
        days: ["sun"],
      },
    ]);
  });
});
