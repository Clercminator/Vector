import type {
  Blueprint,
  BlueprintReminder,
  BlueprintSubGoal,
  BlueprintTask,
  BlueprintTaskType,
  BlueprintTracker,
} from "./blueprints";
import {
  normalizeCanonicalPlanResult,
  type CanonicalPlanFields,
  type PlanScheduleHint,
} from "./planContract";
import { inferPlanKind } from "./trackerSteps";

const DEFAULT_DAILY_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

type SeedTask = {
  title: string;
  task_type: BlueprintTaskType;
};

function uniqueSeedTasks(items: SeedTask[]): SeedTask[] {
  const seen = new Set<string>();
  const out: SeedTask[] = [];
  for (const item of items) {
    const title = item.title.trim();
    const key = `${item.task_type}:${normalizeKey(title)}`;
    if (!title || seen.has(key)) continue;
    seen.add(key);
    out.push({ ...item, title });
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

function shortenSeedTitle(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.length > 140
    ? `${normalized.slice(0, 137).trimEnd()}...`
    : normalized;
}

function summarizeRecoveryProtocol(
  recoveryProtocol: string,
  fallback: string,
): string {
  const normalized = recoveryProtocol.replace(/\s+/g, " ").trim();
  const sentence = normalized.match(/^[^.!?]+[.!?]?/);
  return shortenSeedTitle(sentence?.[0] || normalized || fallback);
}

function buildTrackerTasks(canonical: CanonicalPlanFields): SeedTask[] {
  const reviewTask = canonical.weeklyReviewPrompt
    ? [
        {
          title: shortenSeedTitle(canonical.weeklyReviewPrompt),
          task_type: "review" as const,
        },
      ]
    : [];
  const proofTasks = canonical.proofChecklist.slice(0, 3).map((item) => ({
    title: shortenSeedTitle(item),
    task_type: "proof_entry" as const,
  }));
  const rescueTasks = [
    {
      title: summarizeRecoveryProtocol(
        canonical.recoveryProtocol,
        canonical.nextBestAction ||
          canonical.firstWeekActions[0] ||
          "Reset with one small recovery move.",
      ),
      task_type: "rescue_action" as const,
    },
  ];

  return uniqueSeedTasks([
    ...canonical.firstWeekActions.slice(0, 3).map((item) => ({
      title: shortenSeedTitle(item),
      task_type: "task" as const,
    })),
    ...canonical.leadIndicators.slice(0, 1).map((item) => ({
      title: shortenSeedTitle(item),
      task_type: "task" as const,
    })),
    ...proofTasks,
    ...reviewTask,
    ...rescueTasks,
  ]).slice(0, 10);
}

function buildReminderHints(
  canonical: CanonicalPlanFields,
): PlanScheduleHint[] {
  const hints = [...canonical.scheduleHints].slice(0, 3);

  if (
    canonical.weeklyReviewPrompt &&
    !hints.some((hint) => /review/i.test(hint.label))
  ) {
    hints.push({
      label: "Weekly review",
      cadence: "weekly",
      days: ["sun"],
      time: "18:00",
      durationMinutes: 15,
    });
  }

  return hints.slice(0, 3);
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
    Pick<
      BlueprintTask,
      "blueprint_id" | "user_id" | "title" | "target_count" | "task_type"
    >
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

  const reminderHints = buildReminderHints(canonical);
  const primaryHint = reminderHints[0];
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

  const taskSeeds = buildTrackerTasks(canonical);

  const tasks: DerivedTrackerSeed["tasks"] = taskSeeds.map((task) => ({
    blueprint_id: blueprint.id,
    user_id: userId,
    title: task.title,
    target_count: inferTaskTargetCount(task.title),
    task_type: task.task_type,
  }));

  const reminders: DerivedTrackerSeed["reminders"] = reminderHints
    .filter((hint) => hint.time)
    .slice(0, 3)
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
