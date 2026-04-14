import { normalizeCanonicalPlanResult } from "./planContract";

export interface GoalMri {
  bottlenecks: string[];
  failureModes: string[];
  leverageMoves: string[];
  missingAssumptions: string[];
  readiness: "building" | "ready";
}

interface GoalMriOptions {
  draftResult?: Record<string, unknown> | null;
  framework?: string;
  userMessages?: string[];
  formContext?: string;
}

interface AssumptionCheck {
  patterns: RegExp[];
  message: string;
}

const ASSUMPTION_CHECKS: AssumptionCheck[] = [
  {
    patterns: [
      /\b(hour|hours|hr|hrs|minute|minutes|daily|weekly|week|month|schedule|calendar|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun|morning|evening|night)\b/i,
    ],
    message:
      "The realistic weekly capacity and schedule rhythm still need to be confirmed.",
  },
  {
    patterns: [
      /\b(work|job|shift|travel|kid|kids|child|children|energy|sleep|stress|health|injury|money|budget|burnout|family)\b/i,
    ],
    message:
      "The real-life constraints behind this goal still need one more pass.",
  },
  {
    patterns: [
      /\b(friend|partner|coach|mentor|community|team|boss|accountability|support|check in|check-in)\b/i,
    ],
    message:
      "The accountability or support system is still under-specified.",
  },
  {
    patterns: [
      /\b(metric|measure|measurable|track|proof|evidence|milestone|deadline|target|kpi|score|result)\b/i,
    ],
    message:
      "The proof of progress is still too implicit and should be made more explicit.",
  },
];

function toUnique(items: string[]): string[] {
  return Array.from(
    new Set(
      items
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.replace(/\s+/g, " ")),
    ),
  );
}

export function buildGoalMri({
  draftResult,
  framework,
  userMessages = [],
  formContext = "",
}: GoalMriOptions): GoalMri | null {
  if (!draftResult && userMessages.length === 0 && !formContext.trim()) {
    return null;
  }

  const normalizedFramework =
    framework || String(draftResult?.type || "general");
  const goal = userMessages[0]?.trim() || formContext.trim() || "Your goal";

  const canonical = normalizeCanonicalPlanResult(
    (draftResult || { type: normalizedFramework }) as Record<string, unknown>,
    normalizedFramework,
    { title: goal, goal },
  );

  const contextText = `${formContext}\n${userMessages.join("\n")}`;
  const missingAssumptions = ASSUMPTION_CHECKS.filter(
    ({ patterns }) => !patterns.some((pattern) => pattern.test(contextText)),
  )
    .map(({ message }) => message)
    .slice(0, 3);

  const leverageMoves = toUnique(
    [canonical.nextBestAction || "", ...canonical.leverageMoves].filter(
      Boolean,
    ) as string[],
  ).slice(0, 3);

  return {
    bottlenecks: toUnique(canonical.keyConstraints).slice(0, 3),
    failureModes: toUnique(canonical.failureModes).slice(0, 3),
    leverageMoves,
    missingAssumptions,
    readiness: missingAssumptions.length === 0 ? "ready" : "building",
  };
}