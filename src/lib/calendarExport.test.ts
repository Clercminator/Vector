import { describe, expect, it } from "vitest";
import { blueprintToEvents } from "./calendarExport";
import { Blueprint } from "./blueprints";

describe("calendarExport", () => {
  it("builds schedule-aware events from reminders, tasks, sub-goals, and canonical schedule hints", () => {
    const blueprint: Blueprint = {
      id: "bp-1",
      framework: "rpm",
      title: "Launch plan",
      answers: ["Launch my service"],
      createdAt: new Date().toISOString(),
      result: {
        type: "rpm",
        result: "Launch service",
        purpose: "Win first clients",
        plan: ["Sales outreach 3x/week, 45 min, target 15 messages by week 1"],
        shortTitle: "Launch plan",
        executiveSummary: "Summary",
        commitment: "~5 hrs/week",
        firstWeekActions: [
          "Sales outreach 3x/week, 45 min, target 15 messages by week 1",
        ],
        milestones: [
          "Week 1: 15 messages",
          "Week 2: 5 calls",
          "Week 3: first proposal",
        ],
        successCriteria: "First paying client",
        whatToAvoid: ["Random busy work"],
        yourWhy: "Revenue and proof",
        difficulty: "intermediate",
        difficultyReason: "Requires consistency",
        failureModes: ["Skipping outreach"],
        scheduleHints: [
          {
            label: "Outreach block",
            cadence: "weekly",
            days: ["mon"],
            time: "09:00",
            durationMinutes: 45,
          },
        ],
        accountabilityHooks: ["Send Friday update"],
        revisionTriggers: ["Miss 2 outreach blocks"],
        weeklyReviewPrompt: "What should change next week?",
      },
    } as Blueprint;

    const events = blueprintToEvents(blueprint, {
      reminders: [
        {
          id: "r1",
          blueprint_id: "bp-1",
          user_id: "u1",
          time: "08:30",
          days: ["wed"],
          created_at: new Date().toISOString(),
        },
      ],
      tasks: [
        {
          id: "t1",
          blueprint_id: "bp-1",
          user_id: "u1",
          title: "Write 15 outreach messages",
          target_count: 15,
          created_at: new Date().toISOString(),
        },
      ],
      taskCompletions: [],
      subGoals: [
        {
          id: "g1",
          blueprint_id: "bp-1",
          user_id: "u1",
          title: "Book first 5 calls",
          target_date: "2026-04-20",
          status: "active",
          created_at: new Date().toISOString(),
        },
      ],
    });

    expect(
      events.some((event) => event.summary.includes("Vector reminder")),
    ).toBe(true);
    expect(
      events.some((event) =>
        event.summary.includes("Write 15 outreach messages"),
      ),
    ).toBe(true);
    expect(
      events.some((event) =>
        event.summary.includes("Milestone: Book first 5 calls"),
      ),
    ).toBe(true);
    expect(
      events.some((event) => event.summary.includes("Outreach block")),
    ).toBe(true);
  });
});
