import { describe, expect, it } from "vitest";

import { buildGoalMri } from "./goalMri";

describe("buildGoalMri", () => {
  it("surfaces leverage, failure modes, and missing assumptions from the draft", () => {
    const mri = buildGoalMri({
      framework: "rpm",
      userMessages: [
        "Launch a consulting offer",
        "I keep getting distracted and I have not been consistent.",
      ],
      draftResult: {
        type: "rpm",
        result: "Sign the first three clients",
        purpose: "Create reliable monthly revenue",
        plan: [
          "Customer discovery interviews 3x/week, 30 min, target 10 interviews by week 2",
          "Offer delivery block Tue/Thu at 09:00, 90 min, target 2 pilot projects by week 4",
        ],
      },
    });

    expect(mri).not.toBeNull();
    expect(mri?.leverageMoves.length).toBeGreaterThan(0);
    expect(mri?.failureModes.length).toBeGreaterThan(0);
    expect(mri?.missingAssumptions.length).toBeGreaterThan(0);
  });
});