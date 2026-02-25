import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/app/components/language-provider';

interface TrackerStreakCounterProps {
  startDate: Date | null;
  className?: string;
}

export function TrackerStreakCounter({ startDate, className = '' }: TrackerStreakCounterProps) {
  const { t } = useLanguage();
  const [elapsed, setElapsed] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!startDate) return;

    const calculateElapsed = () => {
      const now = new Date();
      const diffMs = now.getTime() - startDate.getTime();
      
      if (diffMs <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

      const seconds = Math.floor((diffMs / 1000) % 60);
      const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      return { days, hours, minutes, seconds };
    };

    setElapsed(calculateElapsed());
    const interval = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [startDate]);

  if (!startDate) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 ${className}`}>
        <p className="text-xl font-bold text-gray-400 dark:text-zinc-500">{t('tracker.startStreakToday') || "Start your streak today"}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-4 md:p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg relative overflow-hidden ${className}`}>
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
      </div>
      <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-2 z-10">{t('tracker.realtimeStreak') || "Ongoing Streak"}</p>
      <div className="flex items-baseline gap-2 z-10">
        <div className="flex flex-col items-center">
          <span className="text-3xl md:text-5xl font-black text-white leading-none tracking-tight">{elapsed.days}</span>
          <span className="text-xs text-white/70 mt-1 uppercase">Days</span>
        </div>
        <span className="text-2xl text-white/50 mb-4">:</span>
        <div className="flex flex-col items-center">
          <span className="text-3xl md:text-5xl font-black text-white leading-none tracking-tight">{elapsed.hours.toString().padStart(2, '0')}</span>
          <span className="text-xs text-white/70 mt-1 uppercase">Hrs</span>
        </div>
        <span className="text-2xl text-white/50 mb-4">:</span>
        <div className="flex flex-col items-center">
          <span className="text-3xl md:text-5xl font-black text-white leading-none tracking-tight">{elapsed.minutes.toString().padStart(2, '0')}</span>
          <span className="text-xs text-white/70 mt-1 uppercase">Min</span>
        </div>
        <span className="text-2xl text-white/50 mb-4">:</span>
        <div className="flex flex-col items-center">
          <span className="text-3xl md:text-5xl font-black text-white leading-none tracking-tight">{elapsed.seconds.toString().padStart(2, '0')}</span>
          <span className="text-xs text-white/70 mt-1 uppercase">Sec</span>
        </div>
      </div>
    </div>
  );
}
