import type {
  Blueprint,
  BlueprintReminder,
  BlueprintSubGoal,
  BlueprintTask,
  BlueprintTracker,
} from "./blueprints";
import { normalizeCanonicalPlanResult } from "./planContract";
import { inferPlanKind } from "./trackerSteps";

const DEFAULT_DAILY_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

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
    const trimmed = item.trim();
    const key = normalizeKey(trimmed);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function inferTaskTargetCount(label: string): number {
  const weeklyMatch = label.match(/(\d{1,2})\s*x\s*\/\s*week/i);
  if (weeklyMatch) return Math.max(1, Number(weeklyMatch[1]));

  const timesPerWeekMatch = label.match(
    /(\d{1,2})\s*times?\s*(?:per|a)\s*week/i,
  );
  if (timesPerWeekMatch) return Math.max(1, Number(timesPerWeekMatch[1]));

  if (/daily|every day|each day/i.test(label)) return 7;
  if (/weekly|every week|each week/i.test(label)) return 1;
  return 1;
}

function reminderDaysFromCadence(
  cadence: "daily" | "weekly" | "custom" | "once",
  days?: string[],
): string[] {
  if (days?.length) return days;
  if (cadence === "daily") return DEFAULT_DAILY_DAYS;
  if (cadence === "weekly") return ["sun"];
  return [];
}

export interface DerivedTrackerSeed {
  trackerDefaults: Partial<BlueprintTracker>;
  reminders: Array<
    Pick<BlueprintReminder, "blueprint_id" | "user_id" | "time" | "days">
  >;
  subGoals: Array<
    Pick<
      BlueprintSubGoal,
      "blueprint_id" | "user_id" | "title" | "target_date" | "status"
    >
  >;
  tasks: Array<
    Pick<BlueprintTask, "blueprint_id" | "user_id" | "title" | "target_count">
  >;
}

export function deriveTrackerSeed(
  blueprint: Blueprint,
  userId: string,
  anchorDate = new Date(),
): DerivedTrackerSeed {
  const canonical = normalizeCanonicalPlanResult(
    (blueprint.result as Record<string, unknown>) || {},
    blueprint.framework,
    { title: blueprint.title, goal: blueprint.answers?.[0] },
  );

  const primaryHint = canonical.scheduleHints[0];
  const reminderDays = reminderDaysFromCadence(
    primaryHint?.cadence || "custom",
    primaryHint?.days,
  );

  const trackerDefaults: Partial<BlueprintTracker> = {
    plan_kind: inferPlanKind(blueprint.result, blueprint.framework),
    tracking_question: canonical.trackingPrompt || null,
    frequency:
      primaryHint?.cadence === "daily" ||
      primaryHint?.cadence === "weekly" ||
      primaryHint?.cadence === "custom"
        ? primaryHint.cadence
        : "custom",
    reminder_time: primaryHint?.time || null,
    reminder_days: reminderDays,
    reminder_enabled: Boolean(primaryHint?.time || reminderDays.length),
  };

  const subGoals: DerivedTrackerSeed["subGoals"] = canonical.milestones
    .slice(0, 5)
    .map((milestone, index) => {
      const targetDate = new Date(anchorDate);
      targetDate.setDate(anchorDate.getDate() + (index + 1) * 7);
      return {
        blueprint_id: blueprint.id,
        user_id: userId,
        title: milestone,
        target_date: targetDate.toISOString().slice(0, 10),
        status: "active",
      };
    });

  const taskTitles = uniqueStrings([
    ...canonical.firstWeekActions.slice(0, 4),
    ...canonical.leadIndicators.slice(0, 2),
    ...canonical.ownershipCadence.slice(0, 2),
  ]).slice(0, 6);

  const tasks: DerivedTrackerSeed["tasks"] = taskTitles.map((title) => ({
    blueprint_id: blueprint.id,
    user_id: userId,
    title,
    target_count: inferTaskTargetCount(title),
  }));

  const reminders: DerivedTrackerSeed["reminders"] = canonical.scheduleHints
    .filter((hint) => hint.time)
    .slice(0, 2)
    .map((hint) => ({
      blueprint_id: blueprint.id,
      user_id: userId,
      time: hint.time || "09:00",
      days: reminderDaysFromCadence(hint.cadence, hint.days),
    }))
    .filter((reminder) => reminder.days.length > 0);

  return {
    trackerDefaults,
    reminders,
    subGoals,
    tasks,
  };
}
