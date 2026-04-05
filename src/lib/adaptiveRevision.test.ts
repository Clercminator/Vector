import { describe, expect, it } from "vitest";

import type { Blueprint } from "./blueprints";
import { deriveRevisionExecutionArtifacts } from "./adaptiveRevision";

describe("adaptiveRevision", () => {
  it("derives tracker sub-goals and tasks from the revised canonical plan", () => {
    const blueprint: Blueprint = {
      id: "bp-revision",
      framework: "rpm",
      title: "Revise consulting plan",
      answers: ["Launch a consulting offer"],
      createdAt: "2026-04-03T09:00:00.000Z",
      result: {
        type: "rpm",
        result: "Launch a consulting offer",
        purpose: "Create execution evidence",
        plan: ["Ship one weekly artifact every Friday at 15:00."],
        shortTitle: "Consulting revision",
        executiveSummary: "Summary",
        commitment: "~4 hrs/week",
        firstWeekActions: [
          "Run one protected 60 minute focus block every Tuesday at 09:00.",
          "Ship one visible weekly artifact by Friday 15:00.",
        ],
        milestones: [
          "Week 1: first artifact",
          "Week 2: second artifact",
          "Week 4: sustained rhythm",
        ],
        successCriteria: "Weekly artifacts shipped",
        whatToAvoid: ["Reactive busywork"],
        yourWhy: "Build proof",
        difficulty: "intermediate",
        difficultyReason: "Needs consistency",
        failureModes: ["Skipping the protected block", "No weekly proof"],
        resourceChecklist: [
          "Reserve the Tuesday block",
          "Prepare proof workspace",
        ],
        decisionRules: [
          "If Tuesday slips, move it within 24 hours",
          "If Friday slips, cut scope",
        ],
        proofChecklist: [
          "Save one artifact link each week",
          "Log Friday proof in tracker",
        ],
        recoveryProtocol: "Do one recovery block within 24 hours after a miss.",
        scheduleHints: [
          {
            label: "Protected block",
            cadence: "weekly",
            days: ["tue"],
            time: "09:00",
            durationMinutes: 60,
          },
        ],
        accountabilityHooks: ["Send Friday proof update"],
        revisionTriggers: ["Miss the protected block"],
        weeklyReviewPrompt: "What should I cut next week?",
      } as any,
    };

    const derived = deriveRevisionExecutionArtifacts(
      blueprint,
      "user-1",
      new Date("2026-04-03T09:00:00.000Z"),
    );

    expect(derived.subGoals.length).toBeGreaterThan(0);
    expect(derived.tasks.length).toBeGreaterThan(0);
    expect(derived.subGoals[0].title).toContain("Week 1");
    expect(derived.tasks[0].title).toContain("protected 60 minute focus block");
  });
});
