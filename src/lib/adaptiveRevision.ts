import { SystemMessage } from "@langchain/core/messages";

import {
  FINAL_PLAN_MODELS,
  FINAL_PLAN_REASONING,
  invokeWithFallback,
} from "@/agent/utils";
import type {
  Blueprint,
  BlueprintResult,
  BlueprintSubGoal,
  BlueprintTask,
  BlueprintTaskCompletion,
  BlueprintTracker,
  GoalLog,
} from "@/lib/blueprints";
import {
  extractPrimaryPlanItems,
  formatPlanValidationErrors,
  normalizeCanonicalPlanResult,
  validateCanonicalPlanResult,
} from "@/lib/planContract";
import { isE2EMode } from "@/lib/e2eHarness";
import { deriveTrackerSeed } from "@/lib/trackerSeed";
import { getExecutionInsight } from "@/lib/trackerStats";

export interface AdaptiveRevisionInput {
  blueprint: Blueprint;
  tracker?: BlueprintTracker | null;
  logs?: GoalLog[];
  subGoals?: BlueprintSubGoal[];
  tasks?: BlueprintTask[];
  taskCompletions?: BlueprintTaskCompletion[];
  userNote?: string;
}

export interface AdaptiveRevisionOutput {
  revisedResult: BlueprintResult;
  revisionSummary: string;
  changeHighlights: string[];
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
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string"
          ? item.trim()
          : item != null
            ? String(item).trim()
            : "",
      )
      .filter(Boolean)
      .slice(0, 6);
  }
  return fallback;
}

function rewriteFrameworkActions(
  framework: Blueprint["framework"],
  raw: Record<string, unknown>,
  actions: string[],
  nextBestAction: string,
) {
  switch (framework) {
    case "rpm":
      return { ...raw, plan: actions, result: raw.result || nextBestAction };
    case "general":
      return { ...raw, steps: actions };
    case "pareto":
      return {
        ...raw,
        vital: actions.slice(0, 2),
        trivial:
          Array.isArray(raw.trivial) && raw.trivial.length
            ? raw.trivial
            : ["Low-leverage work without a measurable outcome."],
      };
    case "gps":
      return {
        ...raw,
        plan: actions.slice(0, 2),
        system:
          Array.isArray(raw.system) && raw.system.length
            ? raw.system
            : [
                "Weekly review every Sunday to keep the plan realistic.",
                "Log one proof artifact after each execution block.",
              ],
      };
    case "okr":
      return {
        ...raw,
        keyResults:
          Array.isArray(raw.keyResults) && raw.keyResults.length
            ? raw.keyResults
            : actions.slice(0, 2),
        initiative: raw.initiative || nextBestAction,
      };
    default:
      return raw;
  }
}

function buildDeterministicRevision(
  input: AdaptiveRevisionInput,
): AdaptiveRevisionOutput {
  const canonical = normalizeCanonicalPlanResult(
    (input.blueprint.result as Record<string, unknown>) || {},
    input.blueprint.framework,
    { title: input.blueprint.title, goal: input.blueprint.answers?.[0] },
  );
  const focusLine = input.userNote?.trim()
    ? `Adjusted around this new constraint: ${input.userNote.trim()}`
    : "Adjusted around execution friction and missed follow-through.";
  const revisedActions = [
    `Run one protected 60 minute focus block every Tuesday at 09:00 dedicated only to ${canonical.nextBestAction?.toLowerCase() || "the highest-leverage task"}.`,
    "Ship one visible weekly artifact by Friday 15:00 that proves progress against the next milestone.",
    "Do a 15 minute Sunday review to rescope the next week before adding new work.",
  ];

  const rawResult = rewriteFrameworkActions(
    input.blueprint.framework,
    {
      ...(input.blueprint.result as Record<string, unknown>),
      executiveSummary: `${canonical.shortTitle} has been revised to reduce drag, narrow scope, and make follow-through visible week by week. ${focusLine}`,
      commitment: "~3 focused hrs/week",
      firstWeekActions: revisedActions,
      milestones: [
        "Week 1: complete the first protected block and log one proof artifact",
        "Week 2: ship a visible weekly deliverable without slipping the cadence",
        "Week 4: sustain four straight weekly reviews with one completed artifact each week",
      ],
      successCriteria: `You will know the revision is working when execution becomes predictable and ${canonical.milestones[0]?.toLowerCase() || "the next milestone"} is moving again.`,
      failureModes: [
        "Letting reactive work replace the protected weekly block.",
        "Skipping proof capture and losing visibility on whether the plan is actually working.",
        "Keeping the plan broad after the weekly review shows the cadence is slipping.",
      ],
      resourceChecklist: [
        "Reserve the Tuesday execution block on the calendar before Monday ends.",
        "Prepare one workspace or document where all progress proof is stored.",
        "Choose the one deliverable that will count as this week’s visible artifact.",
      ],
      decisionRules: [
        "If a weekly block is missed, move it within 24 hours before doing any new optional work.",
        "If the Friday artifact is not ready, cut scope instead of adding time.",
        "If two weeks in a row slip, trigger another revision immediately.",
      ],
      proofChecklist: [
        "Save one artifact link, screenshot, or document after each weekly block.",
        "Log the shipped weekly deliverable in the tracker on the same day.",
        "Use the Sunday review to note whether the plan moved the next milestone forward.",
      ],
      recoveryProtocol:
        "After a missed week, do one recovery block within 24 hours, log a visible proof artifact immediately, and simplify the next seven days to only one primary deliverable.",
      scheduleHints: [
        {
          label: "Protected revision block",
          cadence: "weekly",
          days: ["tue"],
          time: "09:00",
          durationMinutes: 60,
        },
        {
          label: "Weekly proof ship",
          cadence: "weekly",
          days: ["fri"],
          time: "15:00",
          durationMinutes: 45,
        },
        {
          label: "Weekly review and scope reset",
          cadence: "weekly",
          days: ["sun"],
          time: "18:00",
          durationMinutes: 15,
        },
      ],
      accountabilityHooks: [
        "Send the Friday artifact to one accountability partner or channel.",
        "Do not start next week’s work until the Sunday review is logged.",
      ],
      revisionTriggers: [
        "Miss one protected block and fail to reschedule it within 24 hours.",
        "Ship no visible artifact by Friday for 2 weeks in a row.",
        "The weekly review shows the plan is still too broad for the available time.",
      ],
      weeklyReviewPrompt:
        "What created the most drag this week, what visible proof did I ship, and what must be cut before next week starts?",
      nextBestAction: revisedActions[0],
    },
    revisedActions,
    revisedActions[0],
  );

  const revisedResult = normalizeCanonicalPlanResult(
    rawResult,
    input.blueprint.framework,
    {
      title: input.blueprint.title,
      goal: input.blueprint.answers?.[0],
    },
  ) as BlueprintResult;

  return {
    revisedResult,
    revisionSummary:
      "The plan was narrowed to a smaller weekly operating rhythm with one protected block, one proof artifact, and one review checkpoint.",
    changeHighlights: [
      "Reduced the plan to one primary weekly execution block.",
      "Added mandatory proof artifacts so progress is visible instead of assumed.",
      "Converted vague recovery advice into a concrete missed-week protocol.",
    ],
  };
}

export async function generateAdaptiveRevision(
  input: AdaptiveRevisionInput,
): Promise<AdaptiveRevisionOutput> {
  if (isE2EMode()) {
    return buildDeterministicRevision(input);
  }

  const canonical = normalizeCanonicalPlanResult(
    (input.blueprint.result as Record<string, unknown>) || {},
    input.blueprint.framework,
    { title: input.blueprint.title, goal: input.blueprint.answers?.[0] },
  );
  const insight = getExecutionInsight(
    input.blueprint,
    input.tracker ?? null,
    input.logs || [],
  );

  const prompt = `You are revising an existing structured execution plan that has started to stall.

CURRENT PLAN TITLE: ${input.blueprint.title}
FRAMEWORK: ${input.blueprint.framework}
GOAL: ${input.blueprint.answers?.[0] || input.blueprint.title}

CURRENT BLUEPRINT JSON:
${JSON.stringify(input.blueprint.result, null, 2)}

CURRENT CANONICAL EXECUTION VIEW:
- Next best action: ${canonical.nextBestAction}
- First week actions: ${canonical.firstWeekActions.join(" | ")}
- Milestones: ${canonical.milestones.join(" | ")}
- Revision triggers: ${canonical.revisionTriggers.join(" | ")}
- Proof checklist: ${(canonical.proofChecklist || []).join(" | ")}

EXECUTION SIGNALS:
- Streak risk: ${insight.streakRisk}
- Overdue signals: ${insight.overdueSignals.join(" | ") || "none"}
- Missed-day recovery: ${insight.missedDayRecovery}
- Adaptive revision suggestion: ${insight.adaptiveRevisionSuggestion}

TRACKER DATA:
${JSON.stringify(
  {
    tracker: input.tracker || null,
    recentLogs: (input.logs || []).slice(0, 12),
    subGoals: input.subGoals || [],
    tasks: input.tasks || [],
    taskCompletions: input.taskCompletions || [],
  },
  null,
  2,
)}

OPTIONAL USER NOTE:
${input.userNote?.trim() || "(none)"}

TASK:
Revise the plan so it is more executable under the real constraints shown by the execution data.

RULES:
- Keep the same framework and same overall goal.
- Do not make the plan more ambitious than before.
- Reduce drag, narrow focus, and increase visible proof of progress.
- The revised plan must still satisfy the full canonical plan contract.
- Turn vague ideas into explicit operating rules, proof checkpoints, and recovery instructions.
- Respect the real execution data instead of pretending the old cadence is working.

OUTPUT JSON ONLY with this exact shape:
{
  "revisionSummary": "2-3 sentences",
  "changeHighlights": ["item", "item", "item"],
  "revisedBlueprint": { ...full revised blueprint JSON ... }
}`;

  const invokeOptions = {
    temperature: 0.15,
    bindTools: false,
    models: FINAL_PLAN_MODELS,
    maxTokens: 3600,
    modelKwargs: {
      reasoning: FINAL_PLAN_REASONING,
    },
  } as const;

  const JSON_ONLY_NUDGE =
    "\n\nCRITICAL: Return ONLY valid JSON with revisionSummary, changeHighlights, and revisedBlueprint.";
  let response = await invokeWithFallback(
    [new SystemMessage(prompt + JSON_ONLY_NUDGE)],
    invokeOptions,
  );
  let parsed = extractJsonObject(response.content.toString().trim());

  if (!parsed) {
    response = await invokeWithFallback(
      [
        new SystemMessage(
          `${prompt}${JSON_ONLY_NUDGE}\n\nThe prior attempt was not valid JSON. Fix it.`,
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
    throw new Error("Failed to parse adaptive revision response.");
  }

  const revisedCandidate =
    parsed.revisedBlueprint && typeof parsed.revisedBlueprint === "object"
      ? (parsed.revisedBlueprint as Record<string, unknown>)
      : null;

  if (!revisedCandidate) {
    throw new Error(
      "Adaptive revision response did not include revisedBlueprint.",
    );
  }

  let revisedResult = normalizeCanonicalPlanResult(
    rewriteFrameworkActions(
      input.blueprint.framework,
      revisedCandidate,
      extractPrimaryPlanItems(revisedCandidate, input.blueprint.framework),
      String(revisedCandidate.nextBestAction || canonical.nextBestAction || ""),
    ),
    input.blueprint.framework,
    { title: input.blueprint.title, goal: input.blueprint.answers?.[0] },
  ) as BlueprintResult;

  let validation = validateCanonicalPlanResult(
    revisedResult as Record<string, unknown>,
    input.blueprint.framework,
  );
  if (!validation.isValid) {
    const repairPrompt = `${prompt}${JSON_ONLY_NUDGE}\n\nCRITICAL VALIDATION FAILURES TO FIX BEFORE RETURNING JSON:\n${formatPlanValidationErrors(validation.errors)}`;
    response = await invokeWithFallback([new SystemMessage(repairPrompt)], {
      ...invokeOptions,
      temperature: 0.1,
    });
    const repaired = extractJsonObject(response.content.toString().trim());
    const repairedCandidate =
      repaired?.revisedBlueprint &&
      typeof repaired.revisedBlueprint === "object"
        ? (repaired.revisedBlueprint as Record<string, unknown>)
        : null;
    if (repairedCandidate) {
      revisedResult = normalizeCanonicalPlanResult(
        repairedCandidate,
        input.blueprint.framework,
        {
          title: input.blueprint.title,
          goal: input.blueprint.answers?.[0],
        },
      ) as BlueprintResult;
      validation = validateCanonicalPlanResult(
        revisedResult as Record<string, unknown>,
        input.blueprint.framework,
      );
      if (validation.isValid && typeof repaired.revisionSummary === "string") {
        parsed = repaired;
      }
    }
  }

  if (!validation.isValid) {
    throw new Error(
      validation.errors[0] || "Adaptive revision did not pass plan validation.",
    );
  }

  return {
    revisedResult,
    revisionSummary:
      typeof parsed.revisionSummary === "string" &&
      parsed.revisionSummary.trim()
        ? parsed.revisionSummary.trim()
        : "The plan was revised to reduce friction and make follow-through more visible.",
    changeHighlights: clampList(parsed.changeHighlights, [
      "Reduced scope around the highest-leverage action.",
      "Added stronger proof and recovery rules.",
      "Updated cadence based on real execution friction.",
    ]),
  };
}

export function deriveRevisionExecutionArtifacts(
  blueprint: Blueprint,
  userId: string,
  anchorDate = new Date(),
) {
  const seed = deriveTrackerSeed(blueprint, userId, anchorDate);
  return { subGoals: seed.subGoals, tasks: seed.tasks };
}
