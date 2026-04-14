import { SystemMessage } from "@langchain/core/messages";

import {
  FINAL_PLAN_MODELS,
  FINAL_PLAN_REASONING,
  invokeWithFallback,
} from "@/agent/utils";
import type { BlueprintResult, FrameworkId } from "@/lib/blueprints";
import { isE2EMode } from "@/lib/e2eHarness";
import {
  formatPlanValidationErrors,
  normalizeCanonicalPlanResult,
  validateCanonicalPlanResult,
  type CanonicalPlanFields,
} from "@/lib/planContract";

const SECTION_FIELDS = {
  diagnosis: [
    "currentReality",
    "strategicPillars",
    "keyConstraints",
    "leverageMoves",
    "yourWhy",
    "whatToAvoid",
  ],
  proof: [
    "leadIndicators",
    "lagIndicators",
    "successCriteria",
    "proofChecklist",
    "resourceChecklist",
    "accountabilityHooks",
  ],
  recovery: [
    "failureModes",
    "recoveryProtocol",
    "revisionTriggers",
    "weeklyReviewPrompt",
  ],
} as const;

const SECTION_META = {
  diagnosis: {
    label: "Diagnosis",
    goal: "Clarify the real situation, pressure points, and highest-leverage logic without changing the rest of the operating system.",
  },
  proof: {
    label: "Proof",
    goal: "Make progress objectively visible with stronger evidence loops, scoreboards, and accountability hooks.",
  },
  recovery: {
    label: "Recovery",
    goal: "Turn bad-day recovery into explicit rescue rules, triggers, and fallback instructions.",
  },
} as const;

type SectionFieldMap = typeof SECTION_FIELDS;
type SectionFieldKey = SectionFieldMap[keyof SectionFieldMap][number];

export type PlanRefinementSection = keyof typeof SECTION_FIELDS;

export interface SectionRefinementInput {
  framework: FrameworkId | string;
  blueprintTitle: string;
  goal?: string;
  currentResult: BlueprintResult | Record<string, unknown>;
  section: PlanRefinementSection;
  userNote?: string;
  userProfile?: string;
  formContext?: string;
}

export interface SectionRefinementOutput {
  section: PlanRefinementSection;
  revisionSummary: string;
  changeHighlights: string[];
  refinedResult: BlueprintResult;
}

function extractJsonObject(rawContent: string): Record<string, unknown> | null {
  const codeBlock = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const rawJson = codeBlock ? codeBlock[1].trim() : rawContent.trim();
  const braceMatch = rawJson.match(/\{[\s\S]*\}/);
  const toParse = braceMatch ? braceMatch[0] : rawJson;
  try {
    const parsed = JSON.parse(toParse);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function clampList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item) =>
      typeof item === "string"
        ? item.trim()
        : item != null
          ? String(item).trim()
          : "",
    )
    .filter(Boolean)
    .slice(0, 5);
}

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const trimmed = item.trim();
    const key = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function summarizeRecoveryProtocol(protocol: string, fallback: string): string {
  const normalized = protocol.replace(/\s+/g, " ").trim();
  const sentence = normalized.match(/^[^.!?]+[.!?]?/);
  const summary = sentence?.[0]?.trim() || normalized || fallback;
  return summary.length > 140
    ? `${summary.slice(0, 137).trimEnd()}...`
    : summary;
}

function buildSectionView(
  canonical: CanonicalPlanFields,
  section: PlanRefinementSection,
) {
  return Object.fromEntries(
    SECTION_FIELDS[section].map((field) => [field, canonical[field]]),
  );
}

function pickAllowedSectionPatch(
  section: PlanRefinementSection,
  patch: Record<string, unknown> | null,
): Partial<Record<SectionFieldKey, unknown>> {
  if (!patch) return {};
  const allowed = new Set<string>(SECTION_FIELDS[section]);
  const out: Partial<Record<SectionFieldKey, unknown>> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (allowed.has(key)) {
      out[key as SectionFieldKey] = value;
    }
  }
  return out;
}

function fieldTypeLabel(value: unknown): string {
  if (Array.isArray(value)) return "string[]";
  return "string";
}

function applySectionPatch(
  input: SectionRefinementInput,
  patch: Partial<Record<SectionFieldKey, unknown>>,
): BlueprintResult {
  const merged = {
    ...(input.currentResult as Record<string, unknown>),
    ...patch,
  };
  return normalizeCanonicalPlanResult(merged, String(input.framework), {
    title: input.blueprintTitle,
    goal: input.goal,
  }) as BlueprintResult;
}

function buildDeterministicPatch(
  input: SectionRefinementInput,
  canonical: CanonicalPlanFields,
): SectionRefinementOutput {
  const note = input.userNote?.trim();
  const noteLine = note
    ? ` Address this new constraint directly: ${note}`
    : " Tighten the section around clearer execution reality.";

  let patch: Partial<Record<SectionFieldKey, unknown>> = {};
  let revisionSummary = "";
  let changeHighlights: string[] = [];

  if (input.section === "diagnosis") {
    patch = {
      currentReality: `${canonical.currentReality}${noteLine}`.trim(),
      keyConstraints: uniqueStrings([
        ...canonical.keyConstraints,
        note
          ? `Design the plan around this live constraint: ${note}`
          : "Design the next two weeks around the real bottleneck instead of ideal conditions.",
      ]).slice(0, 4),
      leverageMoves: uniqueStrings([
        canonical.nextBestAction ||
          canonical.leverageMoves[0] ||
          "Protect one high-leverage block this week.",
        ...canonical.leverageMoves,
      ]).slice(0, 4),
    };
    revisionSummary =
      "The diagnosis was tightened so the plan explains the real constraint pattern, not just the intended outcome.";
    changeHighlights = [
      "Clarified the core execution bottleneck.",
      "Sharpened the leverage moves that the plan should protect first.",
      "Made the constraint map more explicit and current.",
    ];
  } else if (input.section === "proof") {
    patch = {
      proofChecklist: uniqueStrings([
        ...canonical.proofChecklist,
        note
          ? `Capture one proof artifact that directly addresses this issue: ${note}`
          : "Log one proof artifact immediately after the highest-leverage block each week.",
      ]).slice(0, 4),
      leadIndicators: uniqueStrings([
        canonical.nextBestAction ||
          canonical.leadIndicators[0] ||
          "Complete the next best action on schedule.",
        ...canonical.leadIndicators,
      ]).slice(0, 3),
      accountabilityHooks: uniqueStrings([
        ...canonical.accountabilityHooks,
        "Close the week by sharing one concrete proof update before the weekly review.",
      ]).slice(0, 3),
    };
    revisionSummary =
      "The proof layer was tightened so progress can be seen, checked, and shared instead of assumed.";
    changeHighlights = [
      "Strengthened the proof checklist.",
      "Made the lead indicators easier to verify week by week.",
      "Added a clearer accountability loop around visible evidence.",
    ];
  } else {
    patch = {
      recoveryProtocol:
        `${summarizeRecoveryProtocol(canonical.recoveryProtocol, canonical.nextBestAction || "Reset with one small recovery move today.")} ${noteLine}`.trim(),
      revisionTriggers: uniqueStrings([
        ...canonical.revisionTriggers,
        note
          ? `Trigger a revision immediately if this new constraint keeps blocking follow-through: ${note}`
          : "Trigger a revision if the rescue move slips twice in the same week.",
      ]).slice(0, 4),
      failureModes: uniqueStrings([
        ...canonical.failureModes,
        "Letting a bad day turn into a full week without a rescue move.",
      ]).slice(0, 4),
    };
    revisionSummary =
      "The recovery layer was tightened into a clearer rescue playbook with stronger failure triggers.";
    changeHighlights = [
      "Turned the fallback into a more concrete rescue move.",
      "Made failure triggers more explicit.",
      "Reduced ambiguity about when to simplify or revise the plan.",
    ];
  }

  return {
    section: input.section,
    revisionSummary,
    changeHighlights,
    refinedResult: applySectionPatch(input, patch),
  };
}

function buildPrompt(
  input: SectionRefinementInput,
  canonical: CanonicalPlanFields,
) {
  const section = input.section;
  const sectionMeta = SECTION_META[section];
  const sectionView = buildSectionView(canonical, section);
  const fieldTypes = Object.entries(sectionView)
    .map(([field, value]) => `- ${field}: ${fieldTypeLabel(value)}`)
    .join("\n");

  return `You are tightening only the ${sectionMeta.label} section of an existing structured execution plan.

PLAN TITLE: ${input.blueprintTitle}
FRAMEWORK: ${input.framework}
GOAL: ${input.goal || input.blueprintTitle}
USER PROFILE: ${input.userProfile?.trim() || "(not provided)"}
FORM CONTEXT: ${input.formContext?.trim() || "(not provided)"}

CURRENT BLUEPRINT JSON:
${JSON.stringify(input.currentResult, null, 2)}

CURRENT ${sectionMeta.label.toUpperCase()} SECTION:
${JSON.stringify(sectionView, null, 2)}

SECTION GOAL:
${sectionMeta.goal}

OPTIONAL USER NOTE:
${input.userNote?.trim() || "(none)"}

RULES:
- Only tighten the ${sectionMeta.label} section.
- Preserve the same framework, goal, and overall ambition.
- Do not weaken the plan into generic advice.
- Do not return any fields outside this section in sectionPatch.
- Keep every returned field in the same type it already uses.
- If the user note is present, incorporate it directly.

ALLOWED FIELDS:
${SECTION_FIELDS[section].map((field) => `- ${field}`).join("\n")}

FIELD TYPES:
${fieldTypes}

OUTPUT JSON ONLY with this exact shape:
{
  "revisionSummary": "2-3 sentences",
  "changeHighlights": ["item", "item", "item"],
  "sectionPatch": {
    "field": "updated value or array"
  }
}`;
}

export async function generatePlanSectionRefinement(
  input: SectionRefinementInput,
): Promise<SectionRefinementOutput> {
  const canonical = normalizeCanonicalPlanResult(
    input.currentResult as Record<string, unknown>,
    String(input.framework),
    { title: input.blueprintTitle, goal: input.goal },
  );

  if (isE2EMode()) {
    return buildDeterministicPatch(input, canonical);
  }

  const prompt = buildPrompt(input, canonical);
  const invokeOptions = {
    temperature: 0.15,
    bindTools: false,
    models: FINAL_PLAN_MODELS,
    maxTokens: 2200,
    modelKwargs: {
      reasoning: FINAL_PLAN_REASONING,
    },
  } as const;
  const jsonOnlyNudge =
    "\n\nCRITICAL: Return ONLY valid JSON with revisionSummary, changeHighlights, and sectionPatch.";

  let response = await invokeWithFallback(
    [new SystemMessage(prompt + jsonOnlyNudge)],
    invokeOptions,
  );
  let parsed = extractJsonObject(response.content.toString().trim());

  if (!parsed) {
    response = await invokeWithFallback(
      [
        new SystemMessage(
          `${prompt}${jsonOnlyNudge}\n\nThe prior attempt was not valid JSON. Fix it.`,
        ),
      ],
      {
        ...invokeOptions,
        temperature: 0.1,
      },
    );
    parsed = extractJsonObject(response.content.toString().trim());
  }

  if (!parsed) {
    throw new Error("Failed to parse section refinement response.");
  }

  const patch = pickAllowedSectionPatch(
    input.section,
    parsed.sectionPatch && typeof parsed.sectionPatch === "object"
      ? (parsed.sectionPatch as Record<string, unknown>)
      : null,
  );

  if (Object.keys(patch).length === 0) {
    throw new Error("Section refinement did not return any valid fields.");
  }

  let refinedResult = applySectionPatch(input, patch);
  let validation = validateCanonicalPlanResult(
    refinedResult as Record<string, unknown>,
    String(input.framework),
  );

  if (!validation.isValid) {
    const repairPrompt = `${prompt}${jsonOnlyNudge}\n\nCRITICAL VALIDATION FAILURES TO FIX BEFORE RETURNING JSON:\n${formatPlanValidationErrors(validation.errors)}`;
    response = await invokeWithFallback([new SystemMessage(repairPrompt)], {
      ...invokeOptions,
      temperature: 0.1,
    });
    const repaired = extractJsonObject(response.content.toString().trim());
    const repairedPatch = pickAllowedSectionPatch(
      input.section,
      repaired?.sectionPatch && typeof repaired.sectionPatch === "object"
        ? (repaired.sectionPatch as Record<string, unknown>)
        : null,
    );
    if (Object.keys(repairedPatch).length > 0) {
      refinedResult = applySectionPatch(input, repairedPatch);
      validation = validateCanonicalPlanResult(
        refinedResult as Record<string, unknown>,
        String(input.framework),
      );
      if (validation.isValid) {
        parsed = repaired || parsed;
      }
    }
  }

  if (!validation.isValid) {
    throw new Error(
      validation.errors[0] || "Section refinement did not pass validation.",
    );
  }

  return {
    section: input.section,
    revisionSummary:
      typeof parsed.revisionSummary === "string" &&
      parsed.revisionSummary.trim()
        ? parsed.revisionSummary.trim()
        : `The ${SECTION_META[input.section].label.toLowerCase()} section was tightened without changing the rest of the plan.`,
    changeHighlights: clampList(parsed.changeHighlights, [
      `Tightened the ${SECTION_META[input.section].label.toLowerCase()} logic.`,
      "Kept the rest of the plan stable.",
      "Preserved the canonical plan contract.",
    ]),
    refinedResult,
  };
}
