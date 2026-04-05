import { describe, expect, it } from "vitest";
import {
  normalizeCanonicalPlanResult,
  validateCanonicalPlanResult,
} from "./planContract";

describe("planContract", () => {
  it("normalizes shared plan sections for framework results", () => {
    const result = normalizeCanonicalPlanResult(
      {
        type: "rpm",
        result: "Ship the product",
        purpose: "Create reliable recurring revenue",
        plan: [
          "Customer discovery interviews 3x/week, 30 min, target 10 interviews by week 2",
          "Build MVP Tue/Thu 90 min blocks, target internal demo by week 3",
        ],
      },
      "rpm",
      { title: "Launch consulting offer" },
    );

    expect(result.executiveSummary).toContain("Launch consulting offer");
    expect(result.currentReality.length).toBeGreaterThan(20);
    expect(result.strategicPillars.length).toBeGreaterThanOrEqual(2);
    expect(result.keyConstraints.length).toBeGreaterThanOrEqual(2);
    expect(result.leverageMoves.length).toBeGreaterThanOrEqual(2);
    expect(result.firstWeekActions.length).toBeGreaterThanOrEqual(2);
    expect(result.milestones.length).toBeGreaterThanOrEqual(2);
    expect(result.scheduleHints.length).toBeGreaterThan(0);
    expect(result.leadIndicators.length).toBeGreaterThanOrEqual(2);
    expect(result.lagIndicators.length).toBeGreaterThanOrEqual(1);
    expect(result.ownershipCadence.length).toBeGreaterThanOrEqual(2);
    expect(result.supportSystem.length).toBeGreaterThan(0);
    expect(result.trackingPrompt.length).toBeGreaterThan(10);
    expect(result.accountabilityHooks.length).toBeGreaterThan(0);
    expect(result.revisionTriggers.length).toBeGreaterThan(0);
    expect(result.resourceChecklist.length).toBeGreaterThan(0);
    expect(result.decisionRules.length).toBeGreaterThan(0);
    expect(result.proofChecklist.length).toBeGreaterThan(0);
    expect(result.recoveryProtocol.length).toBeGreaterThan(20);
  });

  it("rejects vague and duplicate plans", () => {
    const validation = validateCanonicalPlanResult(
      {
        type: "general",
        steps: ["Get started", "Get started"],
        firstWeekActions: ["Get started", "Get started"],
        milestones: ["Soon", "Soon", "Soon"],
        successCriteria: "",
        currentReality: "",
        strategicPillars: [],
        keyConstraints: [],
        leverageMoves: [],
        failureModes: ["Be more disciplined"],
        resourceChecklist: [],
        decisionRules: [],
        leadIndicators: [],
        lagIndicators: [],
        proofChecklist: [],
        recoveryProtocol: "",
        scheduleHints: [],
        ownershipCadence: [],
        supportSystem: [],
        trackingPrompt: "",
        accountabilityHooks: [],
        revisionTriggers: [],
      },
      "general",
    );

    expect(validation.isValid).toBe(false);
    expect(validation.errors.join(" ")).toMatch(
      /vague|Duplicate|Success criteria/i,
    );
  });
});
