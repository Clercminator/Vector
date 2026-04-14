import { describe, expect, it } from "vitest";
import type { FrameworkId } from "./blueprints";
import { buildE2EWizardResult } from "./e2eHarness";
import { validateCanonicalPlanResult } from "./planContract";

const FRAMEWORKS: FrameworkId[] = [
  "first-principles",
  "pareto",
  "rpm",
  "eisenhower",
  "okr",
  "dsss",
  "mandalas",
  "gps",
  "misogi",
  "ikigai",
  "general",
];

describe("buildE2EWizardResult", () => {
  it.each(FRAMEWORKS)("creates a valid %s result", (framework) => {
    const result = buildE2EWizardResult(framework, [
      "Launch a consulting offer with weekly execution evidence",
    ]);
    const validation = validateCanonicalPlanResult(
      result as Record<string, unknown>,
      framework,
    );

    expect(result.type).toBe(framework);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(" | "));
    }
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(result.firstWeekActions.length).toBeGreaterThanOrEqual(2);
    expect(result.milestones.length).toBeGreaterThanOrEqual(3);
    expect(result.scheduleHints.length).toBeGreaterThan(0);
  });
});
