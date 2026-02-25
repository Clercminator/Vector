import React from 'react';

interface TrackerScoreProps {
  score: number; // 0-100
  label: string;
  color?: string;
  className?: string;
  savingsAmount?: number | null;
  savingsUnit?: string | null;
}

export function TrackerScore({ score, label, color = '#3b82f6', className = '', savingsAmount, savingsUnit }: TrackerScoreProps) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Background Circle */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            className="text-gray-100 dark:text-zinc-800"
          />
          {/* Progress Circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            strokeWidth="8"
            stroke={color}
            fill="transparent"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 1s ease-in-out',
            }}
          />
        </svg>
        <span className="absolute text-xl font-bold dark:text-white">{score}%</span>
      </div>
      <span className="mt-2 text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      {savingsAmount !== undefined && savingsAmount !== null && savingsAmount > 0 && (
          <div className="mt-3 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-bold border border-green-200 dark:border-green-900/30 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.5-1 2-1.5L21 11c0-3-1.5-6-2-6Z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h.01"/></svg>
              {savingsUnit}{savingsAmount.toLocaleString()} Saved
          </div>
      )}
    </div>
  );
}
