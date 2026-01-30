import { Blueprint, BlueprintResult } from "@/lib/blueprints";

export interface CalendarEvent {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
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

export function blueprintToEvents(bp: Blueprint, opts?: { startAt?: Date; minutesPerEvent?: number }): CalendarEvent[] {
  const startAt = opts?.startAt ?? defaultStartAt();
  const minutes = opts?.minutesPerEvent ?? 60;

  const result = bp.result as BlueprintResult;
  const tasks: string[] = [];

  if (result?.type === "rpm") tasks.push(...(result.plan ?? []));
  if (result?.type === "pareto") tasks.push(...(result.vital ?? []));
  if (result?.type === "eisenhower") tasks.push(...(result.q2 ?? [])); // Schedule bucket
  if (result?.type === "okr") tasks.push(result.initiative, ...(result.keyResults ?? []).map((kr) => `KR: ${kr}`));
  if (result?.type === "first-principles") tasks.push(`Build: ${result.newApproach}`);

  const clean = tasks.map((t) => (t ?? "").trim()).filter(Boolean);
  const list = clean.length ? clean : [`Vector blueprint: ${bp.title}`];

  return list.map((t, i) => {
    const start = new Date(startAt.getTime() + i * minutes * 60_000);
    const end = new Date(start.getTime() + minutes * 60_000);
    return {
      summary: t,
      description: `Created in Vector (${bp.framework}).\n\nBlueprint: ${bp.title}`,
      start,
      end,
    };
  });
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
    if (ev.description) lines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").trim() || "vector-blueprint";
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
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google OAuth script")));
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
  if (!clientId) throw new Error("Missing VITE_GOOGLE_OAUTH_CLIENT_ID (or VITE_GOOGLE_CLIENT_ID). Falling back to .ics export.");

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

export async function exportEventsToGoogleCalendar(accessToken: string, events: CalendarEvent[]) {
  for (const ev of events) {
    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
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
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Google Calendar API error (${res.status}): ${body || res.statusText}`);
    }
  }
}

