import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/agent/utils", () => ({
  FINAL_PLAN_MODELS: ["mock-model"],
  FINAL_PLAN_REASONING: { effort: "low" },
  invokeWithFallback: vi.fn(),
}));

vi.mock("@/lib/e2eHarness", () => ({
  isE2EMode: vi.fn(() => false),
}));

vi.mock("@/lib/planContract", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/planContract")>();
  return {
    ...actual,
    validateCanonicalPlanResult: vi.fn(actual.validateCanonicalPlanResult),
    formatPlanValidationErrors: vi.fn(actual.formatPlanValidationErrors),
  };
});

import { invokeWithFallback } from "@/agent/utils";
import { isE2EMode } from "@/lib/e2eHarness";
import {
  normalizeCanonicalPlanResult,
  validateCanonicalPlanResult,
} from "@/lib/planContract";
import { generatePlanSectionRefinement } from "./sectionRefinement";

function buildCurrentResult() {
  return normalizeCanonicalPlanResult(
    {
      type: "rpm",
      result: "Launch a consulting offer",
      purpose: "Create consistent revenue",
      shortTitle: "Consulting launch",
      plan: [
        "Run three customer discovery calls every Tuesday at 10:00.",
        "Ship one visible client-facing artifact every Friday at 15:00.",
      ],
      firstWeekActions: [
        "Run three customer discovery calls every Tuesday at 10:00.",
        "Ship one visible client-facing artifact every Friday at 15:00.",
      ],
      milestones: [
        "Week 1: complete the first discovery cycle.",
        "Week 2: publish the first visible artifact.",
        "Week 4: convert the feedback loop into a repeatable offer.",
      ],
    },
    "rpm",
    {
      title: "Consulting launch",
      goal: "Launch a consulting offer",
    },
  );
}

describe("generatePlanSectionRefinement", () => {
  beforeEach(() => {
    vi.mocked(invokeWithFallback).mockReset();
    vi.mocked(isE2EMode).mockReturnValue(false);
    vi.mocked(validateCanonicalPlanResult).mockClear();
  });

  it("applies only allowed fields for the requested section", async () => {
    const currentResult = buildCurrentResult();

    vi.mocked(invokeWithFallback).mockResolvedValue({
      content: JSON.stringify({
        revisionSummary: "Diagnosis tightened.",
        changeHighlights: [
          "Clarified the current reality.",
          "Sharpened the active constraints.",
          "Preserved the rest of the operating system.",
        ],
        sectionPatch: {
          currentReality:
            "The consulting plan must fit a smaller weekly bandwidth without losing proof.",
          keyConstraints: [
            "Only five focused hours are available each week.",
            "The Friday proof artifact still needs to ship visibly.",
          ],
          milestones: ["This should be ignored."],
        },
      }),
    } as any);

    const refined = await generatePlanSectionRefinement({
      framework: "rpm",
      blueprintTitle: "Consulting launch",
      goal: "Launch a consulting offer",
      currentResult,
      section: "diagnosis",
      userNote: "Account for the smaller weekly bandwidth.",
    });

    expect(invokeWithFallback).toHaveBeenCalledTimes(1);
    expect(refined.section).toBe("diagnosis");
    expect(refined.refinedResult.currentReality).toContain(
      "smaller weekly bandwidth",
    );
    expect(refined.refinedResult.milestones).toEqual(currentResult.milestones);
  });

  it("retries with a repair prompt when validation fails on the first patch", async () => {
    const currentResult = buildCurrentResult();

    vi.mocked(validateCanonicalPlanResult)
      .mockReturnValueOnce({
        isValid: false,
        errors: ["Add at least 2 proof checkpoints."],
        warnings: [],
      })
      .mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

    vi.mocked(invokeWithFallback)
      .mockResolvedValueOnce({
        content: JSON.stringify({
          revisionSummary: "First attempt.",
          changeHighlights: [
            "Initial proof update.",
            "Needs validation repair.",
            "Keeps the rest stable.",
          ],
          sectionPatch: {
            proofChecklist: ["Log one proof note."],
            accountabilityHooks: ["Send one update."],
          },
        }),
      } as any)
      .mockResolvedValueOnce({
        content: JSON.stringify({
          revisionSummary: "Proof loop repaired.",
          changeHighlights: [
            "Expanded the proof checklist.",
            "Strengthened the accountability loop.",
            "Returned a valid section patch.",
          ],
          sectionPatch: {
            proofChecklist: [
              "Capture the artifact link every Friday before the weekly review.",
              "Write one sentence explaining what the artifact proves.",
            ],
            accountabilityHooks: [
              "Share the Friday proof artifact with an accountability partner.",
            ],
          },
        }),
      } as any);

    const refined = await generatePlanSectionRefinement({
      framework: "rpm",
      blueprintTitle: "Consulting launch",
      goal: "Launch a consulting offer",
      currentResult,
      section: "proof",
      userNote: "Make the evidence loop visible every Friday.",
    });

    expect(invokeWithFallback).toHaveBeenCalledTimes(2);
    expect(vi.mocked(validateCanonicalPlanResult)).toHaveBeenCalledTimes(2);
    expect(refined.revisionSummary).toBe("Proof loop repaired.");
    expect(refined.refinedResult.proofChecklist).toEqual(
      expect.arrayContaining([
        "Capture the artifact link every Friday before the weekly review.",
        "Write one sentence explaining what the artifact proves.",
      ]),
    );
  });
});
