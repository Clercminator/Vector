import { describe, expect, it } from "vitest";

import {
  buildTrackerIntentSuggestion,
  deriveTrackerIntentDraft,
} from "./trackerIntent";

describe("trackerIntent", () => {
  it("parses a weekly tracker intent into a question, task, and reminder", () => {
    const draft = deriveTrackerIntentDraft("Track workouts 4x/week at 7:30am", {
      blueprintTitle: "Get stronger",
    });

    expect(draft).not.toBeNull();
    expect(draft?.trackingQuestion).toBe(
      "Did you complete workouts this week?",
    );
    expect(draft?.frequency).toBe("weekly");
    expect(draft?.reminderTime).toBe("07:30");
    expect(draft?.reminderDays).toEqual([]);
    expect(draft?.reminderEnabled).toBe(true);
    expect(draft?.tasks).toEqual([
      {
        title: "Workouts",
        targetCount: 4,
        inputType: "count",
        targetValue: null,
        unitLabel: null,
      },
    ]);
  });

  it("handles mixed cadence intents and preserves the timed reminder segment", () => {
    const draft = deriveTrackerIntentDraft(
      "Protein daily; journal weekdays at 9pm; Sunday review",
      {
        fallbackQuestion: "Did you keep the plan moving today?",
      },
    );

    expect(draft).not.toBeNull();
    expect(draft?.frequency).toBe("custom");
    expect(draft?.reminderTime).toBe("21:00");
    expect(draft?.reminderDays).toEqual(["mon", "tue", "wed", "thu", "fri"]);
    expect(draft?.tasks).toEqual([
      {
        title: "Protein",
        targetCount: 7,
        inputType: "count",
        targetValue: null,
        unitLabel: null,
      },
      {
        title: "Journal",
        targetCount: 5,
        inputType: "count",
        targetValue: null,
        unitLabel: null,
      },
      {
        title: "Sunday review",
        targetCount: 1,
        inputType: "count",
        targetValue: null,
        unitLabel: null,
      },
    ]);
  });

  it("parses richer metric outputs for duration, currency, and numeric inputs", () => {
    const draft = deriveTrackerIntentDraft(
      "Read 45 minutes daily; save $200 weekly; drink 3 liters daily",
      {
        blueprintTitle: "Personal operating system",
      },
    );

    expect(draft).not.toBeNull();
    expect(draft?.trackingQuestion).toBe(
      "How many minutes did you spend on read today?",
    );
    expect(draft?.tasks).toEqual([
      {
        title: "Read",
        targetCount: 45,
        inputType: "duration",
        targetValue: 45,
        unitLabel: "minutes",
      },
      {
        title: "Save",
        targetCount: 200,
        inputType: "currency",
        targetValue: 200,
        unitLabel: "$",
      },
      {
        title: "Drink",
        targetCount: 3,
        inputType: "number",
        targetValue: 3,
        unitLabel: "liters",
      },
    ]);
  });

  it("builds a starter suggestion from plan cues", () => {
    const suggestion = buildTrackerIntentSuggestion({
      leadIndicators: [
        "Ship one outreach block every weekday",
        "Log one proof artifact after each call",
      ],
      weeklyReviewPrompt: "Review the pipeline every Friday at 17:00",
    });

    expect(suggestion).toBe(
      "Ship one outreach block every weekday; Log one proof artifact after each call; Review the pipeline every Friday at 17:00",
    );
  });
});
