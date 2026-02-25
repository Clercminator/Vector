import { GoalLog, BlueprintTracker } from './blueprints';

export function getActiveDates(logs: GoalLog[]): Date[] {
  const activeDates = new Set<string>();
  for (const log of logs) {
    let isActive = false;
    if (log.kind === 'check_in' && log.payload?.done) {
      isActive = true;
    } else if (log.kind === 'step_done') {
      isActive = true;
    }
    
    if (isActive) {
      const d = new Date(log.created_at);
      activeDates.add(d.toDateString());
    }
  }
  return Array.from(activeDates).map(ds => new Date(ds)).sort((a, b) => b.getTime() - a.getTime());
}

export function getCurrentStreakDetails(logs: GoalLog[]): { count: number, streakStartedAt: Date | null } {
  const dailyStatus: Record<string, { active: boolean, setback: boolean }> = {};
  
  for (const log of logs) {
    const d = new Date(log.created_at);
    d.setHours(0, 0, 0, 0);
    const dateStr = d.toISOString();
    
    if (!dailyStatus[dateStr]) {
      dailyStatus[dateStr] = { active: false, setback: false };
    }
    
    if (log.kind === 'setback') {
      dailyStatus[dateStr].setback = true;
    } else if ((log.kind === 'check_in' && log.payload?.done) || log.kind === 'step_done') {
      dailyStatus[dateStr].active = true;
    }
  }

  let count = 0;
  let streakStartedAt: Date | null = null;
  let d = new Date();
  d.setHours(0, 0, 0, 0);
  
  const todayStr = d.toISOString();

  if (dailyStatus[todayStr]?.setback) {
    return { count: 0, streakStartedAt: null };
  }

  if (!dailyStatus[todayStr]?.active) {
    d.setDate(d.getDate() - 1);
  }

  while (true) {
    const ds = d.toISOString();
    const stat = dailyStatus[ds];
    
    if (stat?.setback) {
      break;
    }
    
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
  const uniqueDates = getActiveDates(logs).sort((a, b) => a.getTime() - b.getTime()); // ascending
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
          days: currentStreakDays
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
          days: currentStreakDays
      });
  }

  return streaks.sort((a, b) => b.days - a.days);
}

export function getScorePercentage(logs: GoalLog[], tracker: BlueprintTracker, totalFiniteSteps: number, periodDays: number = 7): number {
  if (tracker.plan_kind === 'finite') {
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
  
  const relevantDates = activeDates.filter(d => {
    const dMidnight = new Date(d);
    dMidnight.setHours(0,0,0,0);
    return dMidnight >= cutoff;
  });
  
  let maxScore = periodDays;
  if (tracker.frequency === 'weekly') {
    maxScore = Math.ceil(periodDays / 7);
  } 
  // 'custom' we could use reminder_days to count expected active days in last period.
  // For simplicity, handle daily and weekly. Custom -> defaults to 7 days a week if unmanaged.

  if (tracker.frequency === 'custom' && tracker.reminder_days && tracker.reminder_days.length > 0 && !tracker.reminder_days.includes('*')) {
    // Count how many allowed days were in the last `periodDays`
    const allowedDays = tracker.reminder_days; // e.g. ["mon", "wed"]
    const dayMap: Record<string, number> = { "sun": 0, "mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6 };
    let expected = 0;
    for (let i = 0; i < periodDays; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = Object.keys(dayMap).find(k => dayMap[k] === d.getDay());
        if (dayStr && allowedDays.includes(dayStr)) {
            expected++;
        }
    }
    maxScore = expected > 0 ? expected : periodDays;
  }

  const score = Math.round((relevantDates.length / maxScore) * 100);
  return Math.min(score, 100);
}

export function getTileHeatmapData(logs: GoalLog[], daysBack: number = 28): Record<string, boolean> {
  const activeDates = getActiveDates(logs).map(d => d.toDateString());
  const map: Record<string, boolean> = {};
  
  for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      map[ds] = activeDates.includes(ds);
  }
  
  return map;
}

export function generateCalendarHighlights(logs: GoalLog[]): Set<string> {
    return new Set(getActiveDates(logs).map(d => d.toDateString()));
}
