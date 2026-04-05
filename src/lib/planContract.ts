export type DifficultyLevel = "easy" | "intermediate" | "hard" | "god-level";

export interface PlanScheduleHint {
  label: string;
  cadence: "daily" | "weekly" | "custom" | "once";
  days?: string[];
  time?: string;
  durationMinutes?: number;
  startDate?: string;
  endDate?: string;
}

export interface CommunityProofSnapshot {
  progressPct?: number;
  completedMilestones?: number;
  totalMilestones?: number;
  currentStreak?: number;
  lastActivityAt?: string | null;
  planKind?: "finite" | "infinite";
  outcomeStatus?: "not-started" | "in-progress" | "consistent" | "completed";
  evidenceNote?: string;
}

export interface CanonicalPlanFields {
  shortTitle: string;
  executiveSummary: string;
  currentReality: string;
  commitment: string;
  strategicPillars: string[];
  keyConstraints: string[];
  leverageMoves: string[];
  firstWeekActions: string[];
  milestones: string[];
  successCriteria: string;
  whatToAvoid: string[];
  yourWhy: string;
  difficulty: DifficultyLevel;
  difficultyReason: string;
  failureModes: string[];
  resourceChecklist: string[];
  decisionRules: string[];
  leadIndicators: string[];
  lagIndicators: string[];
  proofChecklist: string[];
  recoveryProtocol: string;
  scheduleHints: PlanScheduleHint[];
  ownershipCadence: string[];
  supportSystem: string[];
  trackingPrompt: string;
  accountabilityHooks: string[];
  revisionTriggers: string[];
  weeklyReviewPrompt: string;
  nextBestAction?: string;
  communityProof?: CommunityProofSnapshot;
}

export interface PlanValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const TRACKABLE_HINT_REGEX =
  /\b(\d+|daily|weekly|monthly|week|month|day|days|mon|tue|wed|thu|fri|sat|sun|minutes?|hours?|hrs?|x\/week|every|target|deadline|by week|by month|by day|review|check-in|session|before|after)\b/i;
const VAGUE_ACTION_PATTERNS = [
  /^get started$/i,
  /^start$/i,
  /^be consistent$/i,
  /^stay disciplined$/i,
  /^focus more$/i,
  /^learn more$/i,
  /^work on/i,
  /^improve/i,
  /^exercise more$/i,
  /^eat better$/i,
  /^practice regularly$/i,
  /^be productive$/i,
  /^plan better$/i,
  /^do more/i,
];

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toTextArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string"
          ? item.trim()
          : item != null
            ? String(item).trim()
            : "",
      )
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function normalizeDuplicateKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toUniqueTextArray(value: unknown, fallback: string[] = []): string[] {
  const seen = new Set<string>();
  const items = [...toTextArray(value), ...fallback];
  const out: string[] = [];
  for (const item of items) {
    const key = normalizeDuplicateKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function inferWhatToAvoid(
  result: Record<string, unknown>,
  framework: string,
): string[] {
  if (framework === "pareto") return toTextArray(result.trivial);
  if (framework === "eisenhower")
    return [...toTextArray(result.q3), ...toTextArray(result.q4)];
  if (framework === "gps")
    return toTextArray((result as { anti_goals?: string[] }).anti_goals);
  const explicit = toTextArray(result.whatToAvoid);
  if (explicit.length) return explicit;
  return [
    "Avoid vague work without a deadline or measurable output.",
    "Avoid adding new priorities before the first-week actions are complete.",
  ];
}

function inferWhy(
  result: Record<string, unknown>,
  goalOrTitle: string,
): string {
  const direct = toText(result.yourWhy);
  if (direct) return direct;
  if (typeof result.purpose === "string" && result.purpose.trim())
    return result.purpose.trim();
  return `This plan matters because ${goalOrTitle || "the goal"} needs a practical execution system, not just ideas.`;
}

function inferExecutiveSummary(
  goalOrTitle: string,
  actions: string[],
  milestones: string[],
): string {
  const lead = goalOrTitle || "This plan";
  const topActions = actions.slice(0, 2).join(" and ");
  const timeline = milestones[0]
    ? ` The first checkpoint is ${milestones[0]}.`
    : "";
  if (topActions) {
    return `${lead} is organized into a concrete execution system. Start with ${topActions}.${timeline}`.trim();
  }
  return `${lead} is organized into a concrete execution system with clear actions, milestones, and review triggers.`;
}

function inferCurrentReality(
  result: Record<string, unknown>,
  goalOrTitle: string,
  failureModes: string[],
  yourWhy: string,
): string {
  const direct =
    toText(result.currentReality) ||
    toText(result.current_state) ||
    toText(result.diagnosis);
  if (direct) return direct;

  const topRisk = failureModes[0]
    ? failureModes[0].replace(/^If\s+/i, "").replace(/\.$/, "")
    : "the current system is still too broad for reliable follow-through";

  return `${goalOrTitle} needs a tighter operating system because ${topRisk}. The plan should protect momentum, respect real constraints, and keep ${yourWhy.toLowerCase()} visible during execution.`;
}

function inferMilestones(
  result: Record<string, unknown>,
  actions: string[],
): string[] {
  const explicit = toTextArray(result.milestones);
  if (explicit.length) return explicit;
  return actions
    .slice(0, 3)
    .map((action, index) => `Checkpoint ${index + 1}: ${action}`);
}

function inferFailureModes(whatToAvoid: string[]): string[] {
  if (whatToAvoid.length) {
    return whatToAvoid
      .slice(0, 3)
      .map(
        (item) =>
          `If ${item.toLowerCase()} starts happening, simplify the plan and re-commit to the first-week actions.`,
      );
  }
  return [
    "If the plan feels too broad, reduce it to the single highest-leverage action for the next 7 days.",
    "If you miss two scheduled actions in a row, revise the cadence before adding more work.",
  ];
}

function inferStrategicPillars(
  result: Record<string, unknown>,
  actions: string[],
): string[] {
  const explicit = toTextArray(result.strategicPillars || result.pillars);
  if (explicit.length) return explicit;
  return toUniqueTextArray(actions.slice(0, 4));
}

function inferKeyConstraints(
  result: Record<string, unknown>,
  whatToAvoid: string[],
  failureModes: string[],
): string[] {
  const explicit = toTextArray(result.keyConstraints || result.constraints);
  if (explicit.length) return explicit;
  return toUniqueTextArray([
    ...whatToAvoid
      .slice(0, 2)
      .map((item) => `Constraint to design around: ${item}`),
    ...failureModes.slice(0, 2),
  ]);
}

function inferLeverageMoves(
  result: Record<string, unknown>,
  firstWeekActions: string[],
  nextBestAction: string,
): string[] {
  const explicit = toTextArray(
    result.leverageMoves || result.highLeverageMoves,
  );
  if (explicit.length) return explicit;
  return toUniqueTextArray([nextBestAction, ...firstWeekActions.slice(0, 3)]);
}

function inferResourceChecklist(
  actions: string[],
  scheduleHints: PlanScheduleHint[],
  yourWhy: string,
): string[] {
  const primaryHint = scheduleHints[0];
  const primaryAction = actions[0] || "the next best action";
  const scheduleLine = primaryHint
    ? `Reserve the first execution block for ${primaryHint.label}${primaryHint.days?.length ? ` on ${primaryHint.days.join(", ")}` : ""}${primaryHint.time ? ` at ${primaryHint.time}` : ""}.`
    : `Reserve two specific calendar blocks this week for ${primaryAction.toLowerCase()}.`;

  return [
    scheduleLine,
    "Choose one place to log progress and evidence after every session.",
    `Keep this reason visible where you execute: ${yourWhy}`,
  ];
}

function inferDecisionRules(
  nextBestAction: string,
  weeklyReviewPrompt: string,
): string[] {
  return [
    `If a planned block is missed, reschedule ${nextBestAction.toLowerCase()} within 24 hours instead of skipping the week.`,
    "If two sessions in a row produce friction or no measurable output, cut the scope in half before adding more work.",
    `Use this question during the weekly review before changing the plan: ${weeklyReviewPrompt}`,
  ];
}

function inferLeadIndicators(
  result: Record<string, unknown>,
  firstWeekActions: string[],
  scheduleHints: PlanScheduleHint[],
): string[] {
  const explicit = toTextArray(
    result.leadIndicators || result.leadingIndicators,
  );
  if (explicit.length) return explicit;

  const fromActions = firstWeekActions.slice(0, 3);
  if (fromActions.length) return toUniqueTextArray(fromActions);

  return toUniqueTextArray(
    scheduleHints
      .slice(0, 2)
      .map(
        (hint) => `Complete the scheduled execution block for ${hint.label}.`,
      ),
  );
}

function inferLagIndicators(
  result: Record<string, unknown>,
  milestones: string[],
  successCriteria: string,
): string[] {
  const explicit = toTextArray(
    result.lagIndicators || result.outcomeIndicators,
  );
  if (explicit.length) return explicit;
  return toUniqueTextArray([...milestones.slice(0, 2), successCriteria]);
}

function inferProofChecklist(
  milestones: string[],
  accountabilityHooks: string[],
  nextBestAction: string,
): string[] {
  const firstMilestone = milestones[0] || "the next milestone";
  return [
    `Log completion of ${nextBestAction.toLowerCase()} on the same day it happens.`,
    `Capture one artifact each week that proves movement toward ${firstMilestone.toLowerCase()}.`,
    accountabilityHooks[0]
      ? `Send one proof update through this accountability channel: ${accountabilityHooks[0]}`
      : "Share one proof update each week with a person or system that can hold you accountable.",
  ];
}

function inferOwnershipCadence(
  result: Record<string, unknown>,
  scheduleHints: PlanScheduleHint[],
  weeklyReviewPrompt: string,
  nextBestAction: string,
): string[] {
  const explicit = toTextArray(
    result.ownershipCadence || result.ownershipRhythm,
  );
  if (explicit.length) return explicit;

  const cadenceLines = scheduleHints.slice(0, 3).map((hint) => {
    const dayText = hint.days?.length ? ` on ${hint.days.join(", ")}` : "";
    const timeText = hint.time ? ` at ${hint.time}` : "";
    return `Run ${hint.label}${dayText}${timeText} and log the outcome immediately after.`;
  });

  return toUniqueTextArray([
    ...cadenceLines,
    `Use this weekly owner review: ${weeklyReviewPrompt}`,
    `If a block slips, reschedule ${nextBestAction.toLowerCase()} before ending the day.`,
  ]);
}

function inferSupportSystem(
  result: Record<string, unknown>,
  accountabilityHooks: string[],
): string[] {
  const explicit = toTextArray(result.supportSystem || result.ownerSupport);
  if (explicit.length) return explicit;
  return toUniqueTextArray(accountabilityHooks);
}

function inferTrackingPrompt(
  result: Record<string, unknown>,
  nextBestAction: string,
): string {
  return (
    toText(result.trackingPrompt) ||
    toText(result.trackingQuestion) ||
    `Did I complete or deliberately reschedule this priority today: ${nextBestAction}?`
  );
}

function inferRecoveryProtocol(
  nextBestAction: string,
  revisionTriggers: string[],
): string {
  const triggerText = revisionTriggers.slice(0, 2).join(" ");
  return `If execution stalls, reduce the plan to one recovery move: ${nextBestAction}. Rebuild momentum with the smallest version of that action, log the result the same day, and trigger a revision if these conditions keep showing up: ${triggerText}`.trim();
}

function inferAccountabilityHooks(
  result: Record<string, unknown>,
  yourWhy: string,
): string[] {
  const explicit = toTextArray(result.accountabilityHooks);
  if (explicit.length) return explicit;
  const stakes = toText(result.stakes);
  return toUniqueTextArray([
    stakes ||
      "Send a short weekly update to one person you trust every Sunday.",
    `Review whether the plan still connects to this reason: ${yourWhy}`,
  ]);
}

function parseDurationMinutes(text: string): number | undefined {
  const minuteMatch = text.match(/(\d{1,3})\s*(min|mins|minute|minutes)\b/i);
  if (minuteMatch) return Number(minuteMatch[1]);
  const hourMatch = text.match(/(\d{1,2})\s*(hr|hrs|hour|hours)\b/i);
  if (hourMatch) return Number(hourMatch[1]) * 60;
  return undefined;
}

function parseDays(text: string): string[] | undefined {
  const dayMatches = text.match(
    /\b(mon|monday|tue|tues|tuesday|wed|wednesday|thu|thursday|fri|friday|sat|saturday|sun|sunday)\b/gi,
  );
  if (!dayMatches?.length) return undefined;
  const map: Record<string, string> = {
    mon: "mon",
    monday: "mon",
    tue: "tue",
    tues: "tue",
    tuesday: "tue",
    wed: "wed",
    wednesday: "wed",
    thu: "thu",
    thursday: "thu",
    fri: "fri",
    friday: "fri",
    sat: "sat",
    saturday: "sat",
    sun: "sun",
    sunday: "sun",
  };
  return Array.from(
    new Set(
      dayMatches.map(
        (match) => map[match.toLowerCase()] || match.toLowerCase(),
      ),
    ),
  );
}

function inferCadence(text: string): PlanScheduleHint["cadence"] {
  if (/daily|every day|each day/i.test(text)) return "daily";
  if (/weekly|x\/week|per week|mon|tue|wed|thu|fri|sat|sun/i.test(text))
    return "weekly";
  if (/once|deadline|date/i.test(text)) return "once";
  return "custom";
}

function normalizeScheduleHint(value: unknown): PlanScheduleHint | null {
  if (!value) return null;
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return null;
    return {
      label: text,
      cadence: inferCadence(text),
      days: parseDays(text),
      durationMinutes: parseDurationMinutes(text),
    };
  }
  if (typeof value === "object") {
    const raw = value as Record<string, unknown>;
    const label = toText(raw.label) || toText(raw.title) || toText(raw.action);
    if (!label) return null;
    const cadence = ["daily", "weekly", "custom", "once"].includes(
      toText(raw.cadence),
    )
      ? (toText(raw.cadence) as PlanScheduleHint["cadence"])
      : inferCadence(label);
    const days = toTextArray(raw.days);
    return {
      label,
      cadence,
      days: days.length ? days : parseDays(label),
      time: toText(raw.time) || undefined,
      durationMinutes:
        typeof raw.durationMinutes === "number"
          ? raw.durationMinutes
          : parseDurationMinutes(label),
      startDate: toText(raw.startDate) || undefined,
      endDate: toText(raw.endDate) || undefined,
    };
  }
  return null;
}

function inferScheduleHints(
  result: Record<string, unknown>,
  actions: string[],
): PlanScheduleHint[] {
  const explicit = Array.isArray(result.scheduleHints)
    ? ((result.scheduleHints as unknown[])
        .map(normalizeScheduleHint)
        .filter(Boolean) as PlanScheduleHint[])
    : [];
  if (explicit.length) return explicit;
  const fromActions = actions
    .slice(0, 3)
    .map((action) => normalizeScheduleHint(action))
    .filter(Boolean) as PlanScheduleHint[];
  if (fromActions.length) return fromActions;
  return [
    {
      label: "Weekly review and schedule reset",
      cadence: "weekly",
      days: ["sun"],
      time: "18:00",
      durationMinutes: 20,
    },
  ];
}

export function extractPrimaryPlanItems(
  result: Record<string, unknown>,
  framework: string,
): string[] {
  const byFramework: Record<string, string[]> = {
    "first-principles": toTextArray(result.truths),
    pareto: [...toTextArray(result.vital), ...toTextArray(result.trivial)],
    rpm: toTextArray(result.plan),
    eisenhower: [
      ...toTextArray(result.q1),
      ...toTextArray(result.q2),
      ...toTextArray(result.q3),
      ...toTextArray(result.q4),
    ],
    okr: [...toTextArray(result.keyResults), ...toTextArray(result.initiative)],
    dsss: [
      ...toTextArray(result.deconstruct),
      ...toTextArray(result.selection),
      ...toTextArray(result.sequence),
      ...toTextArray(result.stakes),
    ],
    mandalas: Array.isArray(result.categories)
      ? (result.categories as Array<Record<string, unknown>>).flatMap(
          (category) => toTextArray(category.steps),
        )
      : [],
    gps: [
      ...toTextArray(result.plan),
      ...toTextArray(result.system),
      ...toTextArray((result as { anti_goals?: string[] }).anti_goals),
    ],
    misogi: [
      ...toTextArray(result.challenge),
      ...toTextArray(result.gap),
      ...toTextArray(result.purification),
    ],
    ikigai: [
      toText(result.love),
      toText(result.goodAt),
      toText(result.worldNeeds),
      toText(result.paidFor),
      toText(result.purpose),
    ].filter(Boolean),
    general: toTextArray((result as { steps?: string[] }).steps),
  };
  return toUniqueTextArray(
    byFramework[framework] ||
      toTextArray((result as { steps?: string[] }).steps),
  );
}

export function isTrackableAction(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 12) return false;
  if (VAGUE_ACTION_PATTERNS.some((pattern) => pattern.test(trimmed)))
    return false;
  return TRACKABLE_HINT_REGEX.test(trimmed);
}

export function normalizeCanonicalPlanResult<T extends Record<string, unknown>>(
  result: T,
  framework: string,
  context?: { goal?: string; title?: string },
): T & CanonicalPlanFields {
  const next = { ...result } as T & Partial<CanonicalPlanFields>;
  const goalOrTitle =
    toText(next.shortTitle) || context?.title || context?.goal || "Your plan";
  const actions = extractPrimaryPlanItems(next, framework);
  const firstWeekActions = toUniqueTextArray(
    next.firstWeekActions,
    actions.slice(0, 4),
  );
  const milestones = toUniqueTextArray(
    next.milestones,
    inferMilestones(next, actions),
  );
  const whatToAvoid = toUniqueTextArray(
    next.whatToAvoid,
    inferWhatToAvoid(next, framework),
  );
  const yourWhy = inferWhy(next, goalOrTitle);
  const failureModes = toUniqueTextArray(
    next.failureModes,
    inferFailureModes(whatToAvoid),
  );
  const scheduleHints = inferScheduleHints(
    next,
    firstWeekActions.length ? firstWeekActions : actions,
  );
  const nextBestAction =
    toText(next.nextBestAction) ||
    firstWeekActions[0] ||
    actions[0] ||
    "Define the first concrete action for this plan.";
  const weeklyReviewPrompt =
    toText(next.weeklyReviewPrompt) ||
    `During your weekly review, decide whether to keep, simplify, or reschedule the next best action: ${nextBestAction}`;
  const accountabilityHooks = toUniqueTextArray(
    next.accountabilityHooks,
    inferAccountabilityHooks(next, yourWhy),
  );
  const revisionTriggers = toUniqueTextArray(next.revisionTriggers, [
    "Miss 2 planned actions in a row.",
    "A milestone slips by more than 7 days.",
    "The weekly review shows the cadence is unrealistic.",
  ]);
  const resourceChecklist = toUniqueTextArray(
    next.resourceChecklist,
    inferResourceChecklist(
      firstWeekActions.length ? firstWeekActions : actions,
      scheduleHints,
      yourWhy,
    ),
  );
  const decisionRules = toUniqueTextArray(
    next.decisionRules,
    inferDecisionRules(nextBestAction, weeklyReviewPrompt),
  );
  const strategicPillars = toUniqueTextArray(
    next.strategicPillars,
    inferStrategicPillars(next, actions),
  );
  const keyConstraints = toUniqueTextArray(
    next.keyConstraints,
    inferKeyConstraints(next, whatToAvoid, failureModes),
  );
  const leverageMoves = toUniqueTextArray(
    next.leverageMoves,
    inferLeverageMoves(next, firstWeekActions, nextBestAction),
  );
  const currentReality =
    toText(next.currentReality) ||
    inferCurrentReality(next, goalOrTitle, failureModes, yourWhy);
  const leadIndicators = toUniqueTextArray(
    next.leadIndicators,
    inferLeadIndicators(next, firstWeekActions, scheduleHints),
  );
  const lagIndicators = toUniqueTextArray(
    next.lagIndicators,
    inferLagIndicators(next, milestones, next.successCriteria || ""),
  );
  const proofChecklist = toUniqueTextArray(
    next.proofChecklist,
    inferProofChecklist(milestones, accountabilityHooks, nextBestAction),
  );
  const recoveryProtocol =
    toText(next.recoveryProtocol) ||
    inferRecoveryProtocol(nextBestAction, revisionTriggers);
  const ownershipCadence = toUniqueTextArray(
    next.ownershipCadence,
    inferOwnershipCadence(
      next,
      scheduleHints,
      weeklyReviewPrompt,
      nextBestAction,
    ),
  );
  const supportSystem = toUniqueTextArray(
    next.supportSystem,
    inferSupportSystem(next, accountabilityHooks),
  );
  const trackingPrompt =
    toText(next.trackingPrompt) || inferTrackingPrompt(next, nextBestAction);

  next.shortTitle = toText(next.shortTitle) || goalOrTitle;
  next.executiveSummary =
    toText(next.executiveSummary) ||
    inferExecutiveSummary(
      goalOrTitle,
      firstWeekActions.length ? firstWeekActions : actions,
      milestones,
    );
  next.currentReality = currentReality;
  next.commitment = toText(next.commitment) || "User to specify";
  next.strategicPillars = strategicPillars;
  next.keyConstraints = keyConstraints;
  next.leverageMoves = leverageMoves;
  next.firstWeekActions = firstWeekActions;
  next.milestones = milestones;
  next.successCriteria =
    toText(next.successCriteria) ||
    `You will know this plan is working when ${goalOrTitle.toLowerCase()} has visible progress against the first milestone.`;
  next.whatToAvoid = whatToAvoid;
  next.yourWhy = yourWhy;
  next.difficulty =
    (toText(next.difficulty) as DifficultyLevel) || "intermediate";
  next.difficultyReason =
    toText(next.difficultyReason) ||
    "The goal is achievable with consistent execution, but it still requires repeated follow-through.";
  next.failureModes = failureModes;
  next.resourceChecklist = resourceChecklist;
  next.decisionRules = decisionRules;
  next.leadIndicators = leadIndicators;
  next.lagIndicators = lagIndicators;
  next.proofChecklist = proofChecklist;
  next.recoveryProtocol = recoveryProtocol;
  next.scheduleHints = scheduleHints;
  next.ownershipCadence = ownershipCadence;
  next.supportSystem = supportSystem;
  next.trackingPrompt = trackingPrompt;
  next.accountabilityHooks = accountabilityHooks;
  next.revisionTriggers = revisionTriggers;
  next.weeklyReviewPrompt = weeklyReviewPrompt;
  next.nextBestAction = nextBestAction;

  return next as T & CanonicalPlanFields;
}

export function validateCanonicalPlanResult(
  result: Record<string, unknown>,
  framework: string,
): PlanValidationResult {
  const normalized = normalizeCanonicalPlanResult(result, framework);
  const errors: string[] = [];
  const warnings: string[] = [];
  const primaryItems = extractPrimaryPlanItems(normalized, framework);
  const firstWeekActions = normalized.firstWeekActions || [];
  const milestones = normalized.milestones || [];
  const duplicates = new Set<string>();
  const seen = new Set<string>();

  if (!primaryItems.length)
    errors.push("The plan has no framework-specific actionable items.");
  if (!normalized.executiveSummary?.trim())
    errors.push("Executive summary is required.");
  if (!normalized.currentReality?.trim())
    errors.push("Current reality diagnosis is required.");
  if ((normalized.strategicPillars || []).length < 2)
    errors.push("Add at least 2 strategic pillars.");
  if ((normalized.keyConstraints || []).length < 2)
    errors.push("Add at least 2 key constraints.");
  if ((normalized.leverageMoves || []).length < 2)
    errors.push("Add at least 2 leverage moves.");
  if (firstWeekActions.length < 2)
    errors.push("Add at least 2 first-week actions.");
  if (milestones.length < 3) errors.push("Add at least 3 milestones.");
  if (!normalized.successCriteria?.trim())
    errors.push("Success criteria are required.");
  if ((normalized.failureModes || []).length < 2)
    errors.push("Add at least 2 failure modes.");
  if ((normalized.resourceChecklist || []).length < 2)
    errors.push("Add at least 2 setup items in the resource checklist.");
  if ((normalized.decisionRules || []).length < 2)
    errors.push("Add at least 2 decision rules.");
  if ((normalized.leadIndicators || []).length < 2)
    errors.push("Add at least 2 lead indicators.");
  if ((normalized.lagIndicators || []).length < 1)
    errors.push("Add at least 1 lag indicator.");
  if ((normalized.proofChecklist || []).length < 2)
    errors.push("Add at least 2 proof checkpoints.");
  if (!normalized.recoveryProtocol?.trim())
    errors.push("Recovery protocol is required.");
  if ((normalized.scheduleHints || []).length < 1)
    errors.push("Add at least 1 schedule hint.");
  if ((normalized.ownershipCadence || []).length < 2)
    errors.push("Add at least 2 ownership cadence checkpoints.");
  if ((normalized.supportSystem || []).length < 1)
    errors.push("Add at least 1 support system or accountability channel.");
  if (!normalized.trackingPrompt?.trim())
    errors.push("Add a tracking prompt for the ownership loop.");
  if ((normalized.accountabilityHooks || []).length < 1)
    errors.push("Add at least 1 accountability hook.");
  if ((normalized.revisionTriggers || []).length < 1)
    errors.push("Add at least 1 revision trigger.");

  const trackableCandidates = [
    ...firstWeekActions,
    ...primaryItems.slice(0, 8),
  ];
  const vagueItems = trackableCandidates.filter(
    (item) => !isTrackableAction(item),
  );
  if (vagueItems.length) {
    errors.push(
      `These actions are too vague or non-trackable: ${vagueItems.slice(0, 4).join(" | ")}`,
    );
  }

  for (const item of [...firstWeekActions, ...milestones]) {
    const key = normalizeDuplicateKey(item);
    if (!key) continue;
    if (seen.has(key)) duplicates.add(item);
    seen.add(key);
  }
  if (duplicates.size) {
    errors.push(
      `Duplicate items detected: ${Array.from(duplicates).join(" | ")}`,
    );
  }

  if (normalized.commitment === "User to specify") {
    warnings.push(
      "Commitment is still generic. Add a clearer time estimate when possible.",
    );
  }
  if (
    (normalized.scheduleHints || []).every(
      (hint) => !hint.time && !hint.days?.length && hint.cadence === "custom",
    )
  ) {
    warnings.push("Schedule hints are present but still generic.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function formatPlanValidationErrors(errors: string[]): string {
  return errors.map((error) => `- ${error}`).join("\n");
}
