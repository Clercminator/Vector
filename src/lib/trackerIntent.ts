import type { BlueprintTaskInputType, BlueprintTracker } from "./blueprints";

const DAILY_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const WEEKDAY_DAYS = ["mon", "tue", "wed", "thu", "fri"] as const;

const DAY_PATTERNS: Array<{ key: string; pattern: RegExp }> = [
  { key: "mon", pattern: /\b(?:mon|monday)\b/i },
  { key: "tue", pattern: /\b(?:tue|tues|tuesday)\b/i },
  { key: "wed", pattern: /\b(?:wed|wednesday)\b/i },
  { key: "thu", pattern: /\b(?:thu|thur|thurs|thursday)\b/i },
  { key: "fri", pattern: /\b(?:fri|friday)\b/i },
  { key: "sat", pattern: /\b(?:sat|saturday)\b/i },
  { key: "sun", pattern: /\b(?:sun|sunday)\b/i },
];

const LEADING_TRACKER_PHRASES = [
  /^help me\s+/i,
  /^i want to\s+/i,
  /^i need to\s+/i,
  /^please\s+/i,
  /^(?:track|log|measure|monitor|follow|remember to)\s+/i,
];

export interface TrackerIntentContext {
  blueprintTitle?: string;
  fallbackQuestion?: string | null;
  leadIndicators?: string[];
  weeklyReviewPrompt?: string | null;
}

export interface TrackerIntentTaskDraft {
  title: string;
  targetCount: number;
  inputType: BlueprintTaskInputType;
  targetValue: number | null;
  unitLabel: string | null;
}

export interface TrackerIntentDraft {
  normalizedInput: string;
  trackingQuestion: string;
  frequency: NonNullable<BlueprintTracker["frequency"]>;
  reminderTime: string | null;
  reminderDays: string[];
  reminderEnabled: boolean;
  tasks: TrackerIntentTaskDraft[];
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const normalized = normalizeWhitespace(item);
    const key = normalizeKey(normalized);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
  }
  return out;
}

function capitalize(value: string): string {
  if (!value) return value;
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

function extractReminderTime(value: string): string | null {
  const twelveHourMatch = value.match(
    /\b(?:at\s+)?(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b/i,
  );
  if (twelveHourMatch) {
    const rawHours = Number(twelveHourMatch[1]);
    const minutes = twelveHourMatch[2] || "00";
    const meridiem = twelveHourMatch[3].toLowerCase();
    const normalizedHours =
      meridiem === "pm"
        ? rawHours === 12
          ? 12
          : rawHours + 12
        : rawHours === 12
          ? 0
          : rawHours;
    return `${String(normalizedHours).padStart(2, "0")}:${minutes}`;
  }

  const twentyFourHourMatch = value.match(
    /\b(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/,
  );
  if (twentyFourHourMatch) {
    return `${twentyFourHourMatch[1].padStart(2, "0")}:${twentyFourHourMatch[2]}`;
  }

  return null;
}

function extractReminderDays(value: string): string[] {
  const days: string[] = [];

  if (/\b(?:weekdays|workdays)\b/i.test(value)) {
    days.push(...WEEKDAY_DAYS);
  }

  if (/\b(?:daily|every day|each day)\b/i.test(value)) {
    days.push(...DAILY_DAYS);
  }

  for (const entry of DAY_PATTERNS) {
    if (entry.pattern.test(value)) {
      days.push(entry.key);
    }
  }

  return uniqueStrings(days);
}

function normalizeUnitLabel(unit: string): string {
  const normalized = unit.trim().toLowerCase();
  const unitMap: Record<string, string> = {
    min: "minutes",
    mins: "minutes",
    minute: "minutes",
    minutes: "minutes",
    hr: "hours",
    hrs: "hours",
    hour: "hours",
    hours: "hours",
    l: "liters",
    liter: "liters",
    liters: "liters",
    litre: "liters",
    litres: "liters",
    km: "km",
    mile: "miles",
    miles: "miles",
    mi: "miles",
    page: "pages",
    pages: "pages",
    step: "steps",
    steps: "steps",
    glass: "glasses",
    glasses: "glasses",
    rep: "reps",
    reps: "reps",
    kg: "kg",
    lb: "lbs",
    lbs: "lbs",
    cal: "calories",
    calorie: "calories",
    calories: "calories",
    dollar: "$",
    dollars: "$",
    usd: "$",
    eur: "EUR",
    euro: "EUR",
    euros: "EUR",
    gbp: "GBP",
    pound: "GBP",
    pounds: "GBP",
  };

  return unitMap[normalized] || normalized;
}

function extractMetricTarget(value: string): {
  inputType: BlueprintTaskInputType;
  targetValue: number | null;
  unitLabel: string | null;
} {
  const currencyPrefixMatch = value.match(/(?:\$|€|£)\s*(\d+(?:\.\d+)?)/);
  if (currencyPrefixMatch) {
    const symbol = value.match(/(\$|€|£)/)?.[1] || "$";
    return {
      inputType: "currency",
      targetValue: Number(currencyPrefixMatch[1]),
      unitLabel: symbol,
    };
  }

  const currencySuffixMatch = value.match(
    /\b(\d+(?:\.\d+)?)\s*(usd|dollars?|eur|euros?|gbp|pounds?)\b/i,
  );
  if (currencySuffixMatch) {
    return {
      inputType: "currency",
      targetValue: Number(currencySuffixMatch[1]),
      unitLabel: normalizeUnitLabel(currencySuffixMatch[2]),
    };
  }

  const durationMatch = value.match(
    /\b(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|minutes?|mins?|min)\b/i,
  );
  if (durationMatch) {
    return {
      inputType: "duration",
      targetValue: Number(durationMatch[1]),
      unitLabel: normalizeUnitLabel(durationMatch[2]),
    };
  }

  const numberUnitMatch = value.match(
    /\b(\d+(?:\.\d+)?)\s*(liters?|litres?|l|km|miles?|mi|pages?|steps?|glasses?|reps?|lbs?|kg|calories?|cal)\b/i,
  );
  if (numberUnitMatch) {
    return {
      inputType: "number",
      targetValue: Number(numberUnitMatch[1]),
      unitLabel: normalizeUnitLabel(numberUnitMatch[2]),
    };
  }

  return {
    inputType: "count",
    targetValue: null,
    unitLabel: null,
  };
}

function inferTargetCount(value: string): number {
  const metricTarget = extractMetricTarget(value);
  if (metricTarget.targetValue != null) {
    return Math.max(1, Math.ceil(metricTarget.targetValue));
  }

  const weeklyTimesMatch = value.match(
    /\b(\d{1,2})\s*(?:x|times?)\s*(?:\/|per|a)?\s*week\b/i,
  );
  if (weeklyTimesMatch) return Math.max(1, Number(weeklyTimesMatch[1]));

  const weeklyDaysMatch = value.match(
    /\b(\d{1,2})\s*days?\s*(?:per|a)\s*week\b/i,
  );
  if (weeklyDaysMatch) return Math.max(1, Number(weeklyDaysMatch[1]));

  if (/\b(?:weekdays|workdays)\b/i.test(value)) return 5;
  if (/\b(?:daily|every day|each day)\b/i.test(value)) return 7;
  if (/\b(?:weekly|every week|each week)\b/i.test(value)) return 1;
  if (/\breview\b/i.test(value)) return 1;
  return 1;
}

function stripSchedulingMetadata(value: string): string {
  let next = normalizeWhitespace(value);

  for (const phrase of LEADING_TRACKER_PHRASES) {
    next = next.replace(phrase, "");
  }

  next = next
    .replace(/\b(?:at\s+)?(?:1[0-2]|0?[1-9])(?::[0-5]\d)?\s*(?:am|pm)\b/gi, " ")
    .replace(/\b(?:at\s+)?(?:[01]?\d|2[0-3]):[0-5]\d\b/g, " ")
    .replace(/(?:\$|€|£)\s*\d+(?:\.\d+)?/g, " ")
    .replace(
      /\b\d+(?:\.\d+)?\s*(?:usd|dollars?|eur|euros?|gbp|pounds?|hours?|hrs?|hr|minutes?|mins?|min|liters?|litres?|l|km|miles?|mi|pages?|steps?|glasses?|reps?|lbs?|kg|calories?|cal)\b/gi,
      " ",
    )
    .replace(
      /\b(?:daily|every day|each day|weekly|every week|each week|weekdays|workdays)\b/gi,
      " ",
    )
    .replace(/\b\d{1,2}\s*(?:x|times?)\s*(?:\/|per|a)?\s*week\b/gi, " ")
    .replace(/\b\d{1,2}\s*days?\s*(?:per|a)\s*week\b/gi, " ")
    .replace(
      /\b(?:on|every)\s+(?:(?:mon|monday|tue|tues|tuesday|wed|wednesday|thu|thur|thurs|thursday|fri|friday|sat|saturday|sun|sunday)(?:\s*(?:,|and)\s*)?)+\b/gi,
      " ",
    )
    .replace(/\b(?:before|after)\s+[a-z0-9\- ]+$/i, " ")
    .replace(/[.,]+$/g, " ");

  next = normalizeWhitespace(next);
  return capitalize(next || normalizeWhitespace(value));
}

function splitCommaSegments(value: string): string[] {
  return value
    .split(/\s*,\s*/)
    .map((segment) => normalizeWhitespace(segment))
    .filter(Boolean);
}

function splitAndSegments(value: string): string[] {
  const protectedDays =
    /\b(?:mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\s+and\s+(?:mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/i;
  if (protectedDays.test(value)) return [value];

  const items = value
    .split(/\s+and\s+/i)
    .map((segment) => normalizeWhitespace(segment))
    .filter(Boolean);

  return items.length > 1 ? items : [value];
}

function splitIntoSegments(value: string): string[] {
  const normalized = normalizeWhitespace(
    value
      .replace(/[•·]/g, ";")
      .replace(/\r?\n+/g, ";")
      .replace(/,\s+and\s+/gi, "; ")
      .replace(/\s+then\s+/gi, "; "),
  );

  let segments = normalized
    .split(/[;]+/)
    .map((segment) => normalizeWhitespace(segment))
    .filter(Boolean);

  if (segments.length === 1) {
    const commaSegments = splitCommaSegments(segments[0]);
    if (commaSegments.length > 1) {
      segments = commaSegments;
    }
  }

  if (segments.length === 1) {
    const andSegments = splitAndSegments(segments[0]);
    if (andSegments.length > 1) {
      segments = andSegments;
    }
  }

  return uniqueStrings(segments);
}

function detectCadences(
  value: string,
  reminderDays: string[],
): Set<NonNullable<BlueprintTracker["frequency"]>> {
  const cadences = new Set<NonNullable<BlueprintTracker["frequency"]>>();

  if (/\b(?:daily|every day|each day)\b/i.test(value)) {
    cadences.add("daily");
  }
  if (/\b(?:weekly|every week|each week)\b/i.test(value)) {
    cadences.add("weekly");
  }
  if (/\b\d{1,2}\s*(?:x|times?)\s*(?:\/|per|a)?\s*week\b/i.test(value)) {
    cadences.add("weekly");
  }
  if (
    /\bweekdays\b/i.test(value) ||
    (reminderDays.length > 0 && reminderDays.length < DAILY_DAYS.length)
  ) {
    cadences.add("custom");
  }

  return cadences;
}

function inferFrequency(
  value: string,
  reminderDays: string[],
): NonNullable<BlueprintTracker["frequency"]> {
  const cadences = detectCadences(value, reminderDays);
  if (cadences.size === 0)
    return reminderDays.length === DAILY_DAYS.length ? "daily" : "custom";
  if (cadences.size === 1) return Array.from(cadences)[0];
  return "custom";
}

function buildTrackingQuestion(
  primaryTask: TrackerIntentTaskDraft | undefined,
  frequency: NonNullable<BlueprintTracker["frequency"]>,
  context: TrackerIntentContext,
): string {
  if (!primaryTask) {
    return (
      context.fallbackQuestion?.trim() ||
      `Did you follow through on ${context.blueprintTitle || "this plan"} today?`
    );
  }

  const lowered = primaryTask.title.toLowerCase();
  const cadenceSuffix = frequency === "weekly" ? "this week" : "today";

  if (primaryTask.inputType === "currency") {
    return `How much did you ${lowered} ${cadenceSuffix}?`;
  }

  if (primaryTask.inputType === "duration") {
    const unitLabel = primaryTask.unitLabel || "time";
    return `How many ${unitLabel} did you spend on ${lowered} ${cadenceSuffix}?`;
  }

  if (primaryTask.inputType === "number") {
    const unitLabel = primaryTask.unitLabel || "units";
    return `How many ${unitLabel} did you log for ${lowered} ${cadenceSuffix}?`;
  }

  if (/\breview\b/i.test(primaryTask.title)) {
    return frequency === "weekly"
      ? "Did you complete your weekly review?"
      : `Did you complete ${lowered} today?`;
  }
  if (frequency === "weekly") {
    return `Did you complete ${lowered} this week?`;
  }
  return `Did you follow through on ${lowered} today?`;
}

export function buildTrackerIntentSuggestion(
  context: TrackerIntentContext,
): string {
  const hints = uniqueStrings([
    ...(context.leadIndicators || []).slice(0, 2),
    context.weeklyReviewPrompt || "",
  ]);

  if (hints.length > 0) {
    return hints.join("; ");
  }

  if (context.fallbackQuestion?.trim()) {
    return context.fallbackQuestion.trim();
  }

  return context.blueprintTitle
    ? `Track progress for ${context.blueprintTitle}`
    : "";
}

export function deriveTrackerIntentDraft(
  input: string,
  context: TrackerIntentContext = {},
): TrackerIntentDraft | null {
  const normalizedInput = normalizeWhitespace(input);
  if (!normalizedInput) return null;

  const segments = splitIntoSegments(normalizedInput);
  const tasks = segments
    .map((segment) => {
      const metricTarget = extractMetricTarget(segment);
      return {
        title: stripSchedulingMetadata(segment),
        targetCount: inferTargetCount(segment),
        inputType: metricTarget.inputType,
        targetValue: metricTarget.targetValue,
        unitLabel: metricTarget.unitLabel,
      };
    })
    .filter((task) => Boolean(normalizeKey(task.title)))
    .filter((task, index, items) => {
      const key = normalizeKey(task.title);
      return (
        items.findIndex((item) => normalizeKey(item.title) === key) === index
      );
    })
    .slice(0, 6);

  const reminderSource =
    segments.find((segment) => Boolean(extractReminderTime(segment))) ||
    normalizedInput;
  const reminderTime = extractReminderTime(reminderSource);
  let reminderDays = extractReminderDays(reminderSource);
  const frequency = inferFrequency(normalizedInput, reminderDays);

  if (reminderDays.length === 0 && frequency === "daily") {
    reminderDays = [...DAILY_DAYS];
  }

  const trackingQuestion = buildTrackingQuestion(tasks[0], frequency, context);

  return {
    normalizedInput,
    trackingQuestion,
    frequency,
    reminderTime,
    reminderDays,
    reminderEnabled: Boolean(reminderTime || reminderDays.length),
    tasks,
  };
}
