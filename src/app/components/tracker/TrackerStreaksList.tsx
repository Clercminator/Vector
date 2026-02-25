import React from 'react';
import { Streak } from '@/lib/trackerStats';
import { useLanguage } from '@/app/components/language-provider';
import { Flame } from 'lucide-react';

interface TrackerStreaksListProps {
  streaks: Streak[];
  className?: string;
}

export function TrackerStreaksList({ streaks, className = '' }: TrackerStreaksListProps) {
  const { t } = useLanguage();

  if (!streaks || streaks.length === 0) return null;

  return (
    <div className={`bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 md:p-6 ${className}`}>
      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Flame size={18} className="text-orange-500" /> {t('tracker.bestStreaks')}
      </h3>
      <div className="space-y-3">
        {streaks.map((s, i) => {
          const start = s.startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          const end = s.endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          const isSingleDay = start === end;
          
          return (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
              <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs">
                  {i + 1}
                </span>
                {t('tracker.dayStreak').replace('{0}', s.days.toString())}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {isSingleDay ? start : `${start} — ${end}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
