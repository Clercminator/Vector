import {
  Blueprint,
  BlueprintReminder,
  BlueprintResult,
  BlueprintSubGoal,
  BlueprintTask,
  BlueprintTaskCompletion,
  BlueprintTracker,
} from "@/lib/blueprints";
import { normalizeCanonicalPlanResult } from "@/lib/planContract";

export interface CalendarEvent {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
}

export type CalendarEventSource =
  | "reminder"
  | "task"
  | "milestone"
  | "schedule_hint"
  | "plan_step";

export interface CalendarEventPreview extends CalendarEvent {
  source: CalendarEventSource;
}

export interface CalendarExportOptions {
  startAt?: Date;
  minutesPerEvent?: number;
  tracker?: BlueprintTracker | null;
  reminders?: BlueprintReminder[];
  subGoals?: BlueprintSubGoal[];
  tasks?: BlueprintTask[];
  taskCompletions?: BlueprintTaskCompletion[];
  includeReminders?: boolean;
  includeTasks?: boolean;
  includeMilestones?: boolean;
  includeScheduleHints?: boolean;
  includePlanSteps?: boolean;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toIcsDateUtc(d: Date) {
  // YYYYMMDDTHHMMSSZ
  return (
    d.getUTCFullYear() +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate()) +
    "T" +
    pad2(d.getUTCHours()) +
    pad2(d.getUTCMinutes()) +
    pad2(d.getUTCSeconds()) +
    "Z"
  );
}

function nextDateForDay(day: string, time?: string): Date {
  const map: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };
  const now = new Date();
  const targetDay = map[day] ?? now.getDay();
  const date = new Date(now);
  const diff = (targetDay - now.getDay() + 7) % 7;
  date.setDate(now.getDate() + (diff === 0 ? 7 : diff));
  const [hours, minutes] = (time || "09:00").split(":").map(Number);
  date.setHours(
    Number.isFinite(hours) ? hours : 9,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0,
  );
  return date;
}

function buildReminderEvents(
  reminders: BlueprintReminder[] | undefined,
  tracker: BlueprintTracker | null | undefined,
  minutes: number,
  blueprint: Blueprint,
): CalendarEventPreview[] {
  const effectiveReminders =
    Array.isArray(reminders) && reminders.length
      ? reminders
      : tracker?.reminder_enabled && tracker.reminder_time
        ? [
            {
              id: "tracker-reminder",
              blueprint_id: blueprint.id,
              user_id: tracker.user_id,
              time: tracker.reminder_time,
              days: tracker.reminder_days?.length
                ? tracker.reminder_days
                : ["mon"],
              created_at: tracker.created_at,
            },
          ]
        : [];
  if (!effectiveReminders.length) return [];
  return effectiveReminders.flatMap((reminder, reminderIndex) => {
    const days = reminder.days?.length ? reminder.days : ["mon"];
    return days.map((day, dayIndex) => {
      const start = nextDateForDay(day, reminder.time);
      const end = new Date(start.getTime() + minutes * 60_000);
      return {
        source: "reminder" as const,
        summary: `Vector reminder: ${blueprint.title}`,
        description: `Reminder generated from your tracker settings for ${blueprint.title}.`,
        start: new Date(start.getTime() + (reminderIndex + dayIndex) * 60_000),
        end,
      };
    });
  });
}

function buildTaskEvents(
  tasks: BlueprintTask[] | undefined,
  taskCompletions: BlueprintTaskCompletion[] | undefined,
  minutes: number,
  startAt: Date,
): CalendarEventPreview[] {
  if (!Array.isArray(tasks) || tasks.length === 0) return [];
  const completedTaskIds = new Set(
    (taskCompletions || []).map((completion) => completion.task_id),
  );
  return tasks
    .filter((task) => !completedTaskIds.has(task.id))
    .slice(0, 6)
    .map((task, index) => {
      const start = new Date(startAt.getTime() + index * minutes * 60_000);
      const end = new Date(start.getTime() + minutes * 60_000);
      return {
        source: "task" as const,
        summary: task.title,
        description: `Task target count: ${task.target_count}`,
        start,
        end,
      };
    });
}

function buildSubGoalEvents(
  subGoals: BlueprintSubGoal[] | undefined,
  minutes: number,
): CalendarEventPreview[] {
  if (!Array.isArray(subGoals) || subGoals.length === 0) return [];
  return subGoals
    .filter((goal) => goal.status !== "completed")
    .slice(0, 4)
    .map((goal) => {
      const start = new Date(`${goal.target_date}T09:00:00`);
      const end = new Date(start.getTime() + minutes * 60_000);
      return {
        source: "milestone" as const,
        summary: `Milestone: ${goal.title}`,
        description: `Target date: ${goal.target_date}`,
        start,
        end,
      };
    });
}

export function recommendCalendarStartAt(
  bp: Blueprint,
  opts?: CalendarExportOptions,
): Date {
  const reminder = opts?.reminders?.[0];
  if (reminder?.time && reminder.days?.[0])
    return nextDateForDay(reminder.days[0], reminder.time);

  if (opts?.tracker?.reminder_enabled && opts.tracker.reminder_time) {
    return nextDateForDay(
      opts.tracker.reminder_days?.[0] || "mon",
      opts.tracker.reminder_time,
    );
  }

  const canonical = normalizeCanonicalPlanResult(
    (bp.result as Record<string, unknown>) || {},
    bp.framework,
    { title: bp.title, goal: bp.answers?.[0] },
  ) as BlueprintResult & { scheduleHints?: Array<Record<string, unknown>> };

  const firstHint = (canonical.scheduleHints || [])[0] as any;
  if (
    firstHint?.time ||
    (Array.isArray(firstHint?.days) && firstHint.days[0])
  ) {
    return nextDateForDay(firstHint.days?.[0] || "mon", firstHint.time);
  }

  return defaultStartAt();
}

export function buildCalendarExportPlan(
  bp: Blueprint,
  opts?: CalendarExportOptions,
): CalendarEventPreview[] {
  const startAt = opts?.startAt ?? recommendCalendarStartAt(bp, opts);
  const minutes = opts?.minutesPerEvent ?? 60;

  const result = normalizeCanonicalPlanResult(
    (bp.result as Record<string, unknown>) || {},
    bp.framework,
    { title: bp.title, goal: bp.answers?.[0] },
  ) as BlueprintResult & { scheduleHints?: Array<Record<string, unknown>> };
  const tasks: string[] = [];

  if (result?.type === "rpm") tasks.push(...(result.plan ?? []));
  if (result?.type === "pareto") tasks.push(...(result.vital ?? []));
  if (result?.type === "eisenhower") tasks.push(...(result.q2 ?? [])); // Schedule bucket
  if (result?.type === "okr")
    tasks.push(
      result.initiative,
      ...(result.keyResults ?? []).map((kr) => `KR: ${kr}`),
    );
  if (result?.type === "first-principles")
    tasks.push(`Build: ${result.newApproach}`);
  if (result?.type === "dsss") {
    const d = result as { sequence?: string[]; selection?: string[] };
    tasks.push(...(d.sequence ?? []), ...(d.selection ?? []));
  }
  if (result?.type === "gps") {
    const g = result as { plan?: string[]; system?: string[] };
    tasks.push(...(g.plan ?? []), ...(g.system ?? []));
  }
  if (result?.type === "mandalas") {
    const cats =
      (result as { categories?: Array<{ steps?: string[] }> }).categories ?? [];
    for (const cat of cats) {
      if (Array.isArray(cat.steps)) tasks.push(...cat.steps);
    }
  }
  if (result?.type === "misogi") {
    const pur = (result as { purification?: string | string[] }).purification;
    if (Array.isArray(pur)) tasks.push(...pur);
    else if (typeof pur === "string" && pur.trim()) tasks.push(pur);
  }
  if (result?.type === "general") {
    tasks.push(...(result.steps ?? []));
  }

  const reminderEvents =
    opts?.includeReminders === false
      ? []
      : buildReminderEvents(opts?.reminders, opts?.tracker, minutes, bp);
  const taskEvents =
    opts?.includeTasks === false
      ? []
      : buildTaskEvents(opts?.tasks, opts?.taskCompletions, minutes, startAt);
  const subGoalEvents =
    opts?.includeMilestones === false
      ? []
      : buildSubGoalEvents(opts?.subGoals, minutes);
  const scheduleHintEvents = (result.scheduleHints || [])
    .slice(0, 4)
    .map((hint: any, index: number) => {
      const days =
        Array.isArray(hint.days) && hint.days.length ? hint.days : ["mon"];
      const start = nextDateForDay(
        days[0],
        typeof hint.time === "string" ? hint.time : undefined,
      );
      const end = new Date(
        start.getTime() +
          (typeof hint.durationMinutes === "number"
            ? hint.durationMinutes
            : minutes) *
            60_000,
      );
      return {
        source: "schedule_hint" as const,
        summary: hint.label || `Plan block ${index + 1}`,
        description: `Cadence: ${hint.cadence || "custom"}${days.length ? ` | Days: ${days.join(", ")}` : ""}`,
        start,
        end,
      };
    });

  const clean = tasks.map((t) => (t ?? "").trim()).filter(Boolean);
  const list = clean.length ? clean : [`Vector blueprint: ${bp.title}`];

  const blueprintEvents = list.map((t, i) => {
    const start = new Date(startAt.getTime() + i * minutes * 60_000);
    const end = new Date(start.getTime() + minutes * 60_000);
    return {
      source: "plan_step" as const,
      summary: t,
      description: `Created in Vector (${bp.framework}).\n\nBlueprint: ${bp.title}`,
      start,
      end,
    };
  });

  return [
    ...reminderEvents,
    ...taskEvents,
    ...subGoalEvents,
    ...(opts?.includeScheduleHints === false ? [] : scheduleHintEvents),
    ...(opts?.includePlanSteps === false ? [] : blueprintEvents),
  ].slice(0, 12);
}

export function blueprintToEvents(
  bp: Blueprint,
  opts?: CalendarExportOptions,
): CalendarEvent[] {
  return buildCalendarExportPlan(bp, opts).map(
    ({ source: _source, ...event }) => event,
  );
}

/**
 * True when the blueprint has enough structure to be a meaningful calendar export
 * (multiple schedulable items). When false, we should not show the Export to Google / ICS button.
 */
export function isBlueprintCalendarWorthy(bp: Blueprint): boolean {
  return blueprintToEvents(bp).length >= 2;
}

export function defaultStartAt() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

export function downloadIcs(filename: string, events: CalendarEvent[]) {
  const now = new Date();
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Vector//Goal Architect//EN");

  for (const ev of events) {
    const uid = crypto.randomUUID();
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${toIcsDateUtc(now)}`);
    lines.push(`DTSTART:${toIcsDateUtc(ev.start)}`);
    lines.push(`DTEND:${toIcsDateUtc(ev.end)}`);
    lines.push(`SUMMARY:${escapeIcsText(ev.summary)}`);
    if (ev.description)
      lines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  const blob = new Blob([lines.join("\r\n")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName =
    filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").trim() ||
    "vector-blueprint";
  a.download = safeName.endsWith(".ics") ? safeName : `${safeName}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeIcsText(s: string) {
  // Escape: backslash, semicolon, comma, newline
  return s
    .replace(/\\\\/g, "\\\\\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// ---------------------------
// Google Calendar Export (OAuth token client via GIS)
// ---------------------------

const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar.events";

async function loadGoogleGisScript(): Promise<void> {
  if ((window as any).google?.accounts?.oauth2) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google OAuth script")),
      );
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google OAuth script"));
    document.head.appendChild(s);
  });
}

export async function getGoogleAccessToken(): Promise<string> {
  const clientId =
    (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ??
    (import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID as string | undefined) ??
    "";
  if (!clientId)
    throw new Error(
      "Missing VITE_GOOGLE_OAUTH_CLIENT_ID (or VITE_GOOGLE_CLIENT_ID). Falling back to .ics export.",
    );

  await loadGoogleGisScript();

  return await new Promise<string>((resolve, reject) => {
    const google = (window as any).google;
    if (!google?.accounts?.oauth2?.initTokenClient) {
      reject(new Error("Google OAuth client not available."));
      return;
    }

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_SCOPE,
      callback: (resp: any) => {
        if (resp?.access_token) resolve(resp.access_token);
        else reject(new Error("Google auth failed."));
      },
      error_callback: () => reject(new Error("Google auth failed.")),
    });

    tokenClient.requestAccessToken({ prompt: "" });
  });
}

export async function exportEventsToGoogleCalendar(
  accessToken: string,
  events: CalendarEvent[],
) {
  for (const ev of events) {
    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: ev.summary,
          description: ev.description,
          start: { dateTime: ev.start.toISOString() },
          end: { dateTime: ev.end.toISOString() },
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Google Calendar API error (${res.status}): ${body || res.statusText}`,
      );
    }
  }
}
