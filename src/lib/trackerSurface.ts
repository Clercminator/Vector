import type {
  BlueprintTask,
  BlueprintTaskInputType,
  BlueprintTracker,
  GoalLog,
} from "./blueprints";
import { toLocalDateKey } from "./trackerStats";

const DAY_MAP: Record<number, string> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

export interface TrackerMetricLogEntry {
  taskId?: string;
  title: string;
  inputType: BlueprintTaskInputType;
  value: number;
  unitLabel?: string | null;
  targetValue?: number | null;
  loggedAt?: string;
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function formatCompactNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1).replace(/\.0$/, "");
}

function isMetricInputType(
  inputType?: BlueprintTaskInputType | null,
): inputType is Exclude<BlueprintTaskInputType, "count"> {
  return Boolean(inputType && inputType !== "count");
}

export function isMetricTask(task: BlueprintTask): boolean {
  return isMetricInputType(task.input_type);
}

export function getMetricTasks(tasks: BlueprintTask[]): BlueprintTask[] {
  return tasks.filter((task) => isMetricTask(task));
}

export function hasTrackerQuickLogSurface(
  tracker: BlueprintTracker | null | undefined,
  tasks: BlueprintTask[] = [],
): boolean {
  if (!tracker) return false;
  return Boolean(
    tracker.plan_kind === "infinite" ||
    tracker.tracking_question ||
    getMetricTasks(tasks).length > 0,
  );
}

export function formatTaskTarget(task: BlueprintTask): string {
  const targetValue = task.target_value ?? null;
  const unitLabel = task.unit_label ?? null;
  const inputType = task.input_type || "count";

  if (inputType === "currency" && targetValue != null) {
    const currencyPrefix =
      unitLabel === "$" || unitLabel === "€" || unitLabel === "£";
    return currencyPrefix
      ? `${unitLabel}${formatCompactNumber(targetValue)}`
      : `${formatCompactNumber(targetValue)} ${unitLabel || "currency"}`;
  }

  if (targetValue != null && unitLabel) {
    return `${formatCompactNumber(targetValue)} ${unitLabel}`;
  }

  if (targetValue != null) {
    return formatCompactNumber(targetValue);
  }

  if (unitLabel) {
    return `${task.target_count} ${unitLabel}`;
  }

  return `${task.target_count}`;
}

export function extractMetricEntriesFromLog(
  log: GoalLog,
): TrackerMetricLogEntry[] {
  const rawMetrics = Array.isArray(log.payload?.metrics)
    ? (log.payload.metrics as Array<Record<string, unknown>>)
    : [];

  return rawMetrics
    .map((entry): TrackerMetricLogEntry => {
      const inputType: TrackerMetricLogEntry["inputType"] =
        entry.input_type === "currency" ||
        entry.input_type === "duration" ||
        entry.input_type === "number"
          ? entry.input_type
          : "number";

      return {
        taskId:
          typeof entry.task_id === "string" && entry.task_id.trim()
            ? entry.task_id
            : undefined,
        title:
          typeof entry.title === "string" && entry.title.trim()
            ? entry.title.trim()
            : "Metric",
        inputType,
        value:
          typeof entry.value === "number"
            ? entry.value
            : Number(entry.value || 0),
        unitLabel:
          typeof entry.unit_label === "string" ? entry.unit_label : null,
        targetValue:
          typeof entry.target_value === "number"
            ? entry.target_value
            : entry.target_value != null
              ? Number(entry.target_value)
              : null,
        loggedAt: log.created_at,
      };
    })
    .filter((entry) => Number.isFinite(entry.value));
}

export function getLatestMetricEntries(
  logs: GoalLog[],
  tasks: BlueprintTask[],
): TrackerMetricLogEntry[] {
  const latest = new Map<string, TrackerMetricLogEntry>();
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const sortedLogs = [...logs].sort(
    (left, right) =>
      new Date(right.created_at).getTime() -
      new Date(left.created_at).getTime(),
  );

  for (const log of sortedLogs) {
    const entries = extractMetricEntriesFromLog(log);
    for (const entry of entries) {
      const task = entry.taskId ? taskById.get(entry.taskId) : undefined;
      const key = entry.taskId || normalizeKey(entry.title);
      if (!key || latest.has(key)) continue;
      latest.set(key, {
        ...entry,
        title: task?.title || entry.title,
        inputType:
          (task?.input_type as BlueprintTaskInputType | undefined) ||
          entry.inputType,
        targetValue: task?.target_value ?? entry.targetValue ?? null,
        unitLabel: task?.unit_label ?? entry.unitLabel ?? null,
      });
    }
  }

  return Array.from(latest.values());
}

export function formatMetricValue(entry: TrackerMetricLogEntry): string {
  const displayValue = formatCompactNumber(entry.value);
  if (entry.inputType === "currency") {
    const prefix =
      entry.unitLabel === "$" ||
      entry.unitLabel === "€" ||
      entry.unitLabel === "£";
    return prefix
      ? `${entry.unitLabel}${displayValue}`
      : `${displayValue} ${entry.unitLabel || "currency"}`;
  }
  return entry.unitLabel ? `${displayValue} ${entry.unitLabel}` : displayValue;
}

export function formatMetricProgressLabel(
  entry: TrackerMetricLogEntry,
): string {
  const current = formatMetricValue(entry);
  if (entry.targetValue != null) {
    const target = formatTaskTarget({
      id: entry.taskId || "metric",
      blueprint_id: "",
      user_id: "",
      title: entry.title,
      target_count: Math.max(1, Math.ceil(entry.targetValue)),
      input_type: entry.inputType,
      target_value: entry.targetValue,
      unit_label: entry.unitLabel,
      created_at: entry.loggedAt || "",
    });
    return `${current} / ${target}`;
  }
  return current;
}

export function getMetricSummary(
  tasks: BlueprintTask[],
  logs: GoalLog[],
): string | null {
  const metricTasks = getMetricTasks(tasks);
  if (metricTasks.length === 0) return null;

  const latestEntries = getLatestMetricEntries(logs, metricTasks);
  const latestByKey = new Map(
    latestEntries.map((entry) => [
      entry.taskId || normalizeKey(entry.title),
      entry,
    ]),
  );

  const parts = metricTasks.slice(0, 2).map((task) => {
    const key = task.id || normalizeKey(task.title);
    const latest = latestByKey.get(key);
    if (latest) {
      return `${task.title}: ${formatMetricProgressLabel(latest)}`;
    }
    return `${task.title}: ${formatTaskTarget(task)}`;
  });

  return parts.join(" • ");
}

export function getQuickLogCadenceState(
  tracker: BlueprintTracker,
  logs: GoalLog[],
  now: Date = new Date(),
): {
  completedToday: boolean;
  isDue: boolean;
  streakOrLast: string;
} {
  const todayKey = toLocalDateKey(now);
  const completedToday = logs.some((log) => {
    if (log.kind !== "check_in" || !log.payload?.done) return false;
    return toLocalDateKey(new Date(log.created_at)) === todayKey;
  });

  const completedLogs = [...logs]
    .filter((log) => log.kind === "check_in" && log.payload?.done)
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() -
        new Date(left.created_at).getTime(),
    );

  const lastDoneAt = completedLogs[0]
    ? new Date(completedLogs[0].created_at).getTime()
    : 0;
  const currentTime = now.getTime();
  const sevenDaysAgo = currentTime - 7 * 24 * 3600 * 1000;
  const currentDayStr = DAY_MAP[now.getDay()];

  let isDue = false;
  if (tracker.frequency === "weekly") {
    isDue = lastDoneAt < sevenDaysAgo;
  } else {
    const reminderDays = tracker.reminder_days || [];
    isDue =
      reminderDays.length === 0 ||
      reminderDays.includes("*") ||
      reminderDays.includes(currentDayStr);
  }

  let streakOrLast = "Not started";
  if (tracker.last_activity_at) {
    const diff = Math.floor(
      (currentTime - new Date(tracker.last_activity_at).getTime()) /
        (1000 * 3600 * 24),
    );
    streakOrLast = diff <= 1 ? "Active" : `Last: ${diff} days ago`;
  }

  return {
    completedToday,
    isDue,
    streakOrLast,
  };
}
