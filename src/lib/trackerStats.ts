import { Blueprint, GoalLog, BlueprintTracker } from "./blueprints";
import {
  extractPrimaryPlanItems,
  normalizeCanonicalPlanResult,
} from "./planContract";

/** Local calendar date key (YYYY-MM-DD) so streaks and heatmaps respect user timezone. */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth();
  const day = date.getDate();
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getActiveDates(logs: GoalLog[]): Date[] {
  const activeDates = new Set<string>();
  for (const log of logs) {
    let isActive = false;
    if (log.kind === "check_in" && log.payload?.done) {
      isActive = true;
    } else if (log.kind === "step_done") {
      isActive = true;
    }
    if (isActive) {
      activeDates.add(toLocalDateKey(new Date(log.created_at)));
    }
  }
  return Array.from(activeDates)
    .map((ds) => {
      const [y, m, d] = ds.split("-").map(Number);
      return new Date(y, m - 1, d);
    })
    .sort((a, b) => b.getTime() - a.getTime());
}

export function getCurrentStreakDetails(logs: GoalLog[]): {
  count: number;
  streakStartedAt: Date | null;
} {
  const dailyStatus: Record<string, { active: boolean; setback: boolean }> = {};

  for (const log of logs) {
    const dateStr = toLocalDateKey(new Date(log.created_at));
    if (!dailyStatus[dateStr]) {
      dailyStatus[dateStr] = { active: false, setback: false };
    }
    if (log.kind === "setback") {
      dailyStatus[dateStr].setback = true;
    } else if (
      (log.kind === "check_in" && log.payload?.done) ||
      log.kind === "step_done"
    ) {
      dailyStatus[dateStr].active = true;
    }
  }

  let count = 0;
  let streakStartedAt: Date | null = null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toLocalDateKey(today);

  if (dailyStatus[todayStr]?.setback) {
    return { count: 0, streakStartedAt: null };
  }

  let d = new Date(today);
  if (!dailyStatus[todayStr]?.active) {
    d.setDate(d.getDate() - 1);
  }

  while (true) {
    const ds = toLocalDateKey(d);
    const stat = dailyStatus[ds];
    if (stat?.setback) break;
    if (stat?.active) {
      count++;
      streakStartedAt = new Date(d);
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return { count, streakStartedAt };
}

export function getCurrentStreak(logs: GoalLog[]): number {
  return getCurrentStreakDetails(logs).count;
}

export interface Streak {
  startDate: Date;
  endDate: Date;
  days: number;
}

export function getBestStreaks(logs: GoalLog[]): Streak[] {
  const uniqueDates = getActiveDates(logs).sort(
    (a, b) => a.getTime() - b.getTime(),
  ); // ascending
  if (uniqueDates.length === 0) return [];

  const streaks: Streak[] = [];
  let currentStreakStart = uniqueDates[0];
  let currentStreakDays = 1;
  let lastDate = uniqueDates[0];

  for (let i = 1; i < uniqueDates.length; i++) {
    const d = uniqueDates[i];
    const diffTime = d.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreakDays++;
    } else {
      if (currentStreakDays >= 1) {
        streaks.push({
          startDate: currentStreakStart,
          endDate: lastDate,
          days: currentStreakDays,
        });
      }
      currentStreakStart = d;
      currentStreakDays = 1;
    }
    lastDate = d;
  }

  if (currentStreakDays >= 1) {
    streaks.push({
      startDate: currentStreakStart,
      endDate: lastDate,
      days: currentStreakDays,
    });
  }

  return streaks.sort((a, b) => b.days - a.days);
}

export function getScorePercentage(
  logs: GoalLog[],
  tracker: BlueprintTracker,
  totalFiniteSteps: number,
  periodDays: number = 7,
): number {
  if (tracker.plan_kind === "finite") {
    if (totalFiniteSteps === 0) return 0;
    const completed = tracker.completed_step_ids?.length || 0;
    return Math.round((completed / totalFiniteSteps) * 100);
  }

  // For infinite plans:
  const activeDates = getActiveDates(logs);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);
  // Set cutoff time to midnight to accurately count days
  cutoff.setHours(0, 0, 0, 0);

  const relevantDates = activeDates.filter((d) => {
    const dMidnight = new Date(d);
    dMidnight.setHours(0, 0, 0, 0);
    return dMidnight >= cutoff;
  });

  let maxScore = periodDays;
  if (tracker.frequency === "weekly") {
    maxScore = Math.ceil(periodDays / 7);
  }
  // 'custom' we could use reminder_days to count expected active days in last period.
  // For simplicity, handle daily and weekly. Custom -> defaults to 7 days a week if unmanaged.

  if (
    tracker.frequency === "custom" &&
    tracker.reminder_days &&
    tracker.reminder_days.length > 0 &&
    !tracker.reminder_days.includes("*")
  ) {
    // Count how many allowed days were in the last `periodDays`
    const allowedDays = tracker.reminder_days; // e.g. ["mon", "wed"]
    const dayMap: Record<string, number> = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    };
    let expected = 0;
    for (let i = 0; i < periodDays; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = Object.keys(dayMap).find((k) => dayMap[k] === d.getDay());
      if (dayStr && allowedDays.includes(dayStr)) {
        expected++;
      }
    }
    maxScore = expected > 0 ? expected : periodDays;
  }

  const score = Math.round((relevantDates.length / maxScore) * 100);
  return Math.min(score, 100);
}

export function getTileHeatmapData(
  logs: GoalLog[],
  daysBack: number = 28,
): Record<string, boolean> {
  const activeDates = new Set(
    getActiveDates(logs).map((d) => toLocalDateKey(d)),
  );
  const map: Record<string, boolean> = {};
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    map[toLocalDateKey(d)] = activeDates.has(toLocalDateKey(d));
  }
  return map;
}

export function generateCalendarHighlights(logs: GoalLog[]): Set<string> {
  return new Set(getActiveDates(logs).map((d) => toLocalDateKey(d)));
}

export interface ExecutionInsight {
  nextBestAction: string;
  overdueSignals: string[];
  proofSignals: string[];
  streakRisk: "low" | "medium" | "high";
  executionState: "on-track" | "at-risk" | "stalled" | "rescue";
  executionStateLabel: string;
  stateSummary: string;
  missedDayRecovery: string;
  rescueAction: string;
  weeklyReviewPrompt: string;
  adaptiveRevisionSuggestion: string;
}

export function getExecutionInsight(
  blueprint: Blueprint,
  tracker: BlueprintTracker | null,
  logs: GoalLog[],
): ExecutionInsight {
  const canonical = normalizeCanonicalPlanResult(
    (blueprint.result as Record<string, unknown>) || {},
    blueprint.framework,
    { title: blueprint.title, goal: blueprint.answers?.[0] },
  );
  const actions = canonical.firstWeekActions.length
    ? canonical.firstWeekActions
    : extractPrimaryPlanItems(canonical, blueprint.framework);
  const completedIds = new Set(tracker?.completed_step_ids || []);
  const nextBestAction =
    canonical.nextBestAction ||
    actions[0] ||
    "Define the next concrete action.";
  const overdueSignals: string[] = [];
  const proofSignals: string[] = [];
  const streak = getCurrentStreak(logs);
  const daysSinceActivity = tracker?.last_activity_at
    ? Math.floor(
        (Date.now() - new Date(tracker.last_activity_at).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  if (daysSinceActivity != null && daysSinceActivity >= 3) {
    overdueSignals.push(`No logged activity for ${daysSinceActivity} days.`);
  }
  if (
    tracker?.plan_kind === "finite" &&
    completedIds.size === 0 &&
    actions.length > 0
  ) {
    overdueSignals.push(
      "No tracked steps completed yet. Start with the next best action.",
    );
  }
  if (
    (canonical.milestones || []).length > 0 &&
    tracker?.progress_pct != null &&
    tracker.progress_pct < 25
  ) {
    overdueSignals.push(
      "Progress is still below the first milestone threshold.",
    );
  }

  const recentLogs = logs.filter(
    (log) => Date.now() - new Date(log.created_at).getTime() <= 7 * 24 * 60 * 60 * 1000,
  );
  const recentProofLogs = recentLogs.filter(
    (log) =>
      log.kind === "journal" &&
      ((typeof log.content === "string" && log.content.trim()) ||
        (log.payload && Object.keys(log.payload).length > 0)),
  );
  const recentSetbacks = recentLogs.filter((log) => log.kind === "setback").length;

  if ((daysSinceActivity ?? 0) >= 2 && recentProofLogs.length === 0) {
    proofSignals.push("No proof or reflection has been logged this week.");
  }
  if (recentSetbacks >= 1 && recentProofLogs.length === 0) {
    proofSignals.push(
      "The tracker shows friction, but there is no recent proof note explaining what changed.",
    );
  }

  let streakRisk: "low" | "medium" | "high" = "low";
  if ((daysSinceActivity ?? 0) >= 4 || streak === 0) streakRisk = "high";
  else if ((daysSinceActivity ?? 0) >= 2 || streak <= 1) streakRisk = "medium";

  let executionState: ExecutionInsight["executionState"] = "on-track";
  if (recentSetbacks >= 2 || (daysSinceActivity ?? 0) >= 5) {
    executionState = "rescue";
  } else if ((daysSinceActivity ?? 0) >= 3 || overdueSignals.length >= 2) {
    executionState = "stalled";
  } else if (
    streakRisk !== "low" ||
    proofSignals.length > 0 ||
    recentSetbacks === 1
  ) {
    executionState = "at-risk";
  }

  const executionStateLabel =
    executionState === "on-track"
      ? "On Track"
      : executionState === "at-risk"
        ? "At Risk"
        : executionState === "stalled"
          ? "Stalled"
          : "Rescue Mode";

  const stateSummary =
    executionState === "on-track"
      ? "Cadence, proof, and progress are aligned. Keep the system steady."
      : executionState === "at-risk"
        ? "Momentum is still recoverable, but the current rhythm needs tighter follow-through."
        : executionState === "stalled"
          ? "The plan is losing traction. Simplify the week before pushing harder."
          : "Execution is breaking down under the current scope. Switch to rescue mode and narrow the plan now.";

  const missedDayRecovery =
    executionState === "rescue" || streakRisk === "high"
      ? `Reset with one small win today: ${nextBestAction}`
      : `If today slips, do a shorter version of this action: ${nextBestAction}`;

  const rescueAction =
    executionState === "rescue"
      ? canonical.recoveryProtocol
      : missedDayRecovery;

  const adaptiveRevisionSuggestion =
    executionState === "rescue"
      ? `Tighten this week: ${
          canonical.revisionTriggers[0] ||
          "reduce the plan to one recovery block and one proof artifact."
        }`
      : executionState === "stalled"
        ? `Tighten this week: ${
            canonical.revisionTriggers[1] ||
            "simplify the cadence before adding new work."
          }`
        : proofSignals.length > 0
          ? "Tighten this week: restore a proof loop before you add more scope."
          : canonical.revisionTriggers[2] ||
            "Review whether the current cadence still fits your week.";

  return {
    nextBestAction,
    overdueSignals,
    proofSignals,
    streakRisk,
    executionState,
    executionStateLabel,
    stateSummary,
    missedDayRecovery,
    rescueAction,
    weeklyReviewPrompt: canonical.weeklyReviewPrompt,
    adaptiveRevisionSuggestion,
  };
}
