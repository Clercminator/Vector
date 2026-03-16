import React from 'react';
import { GoalLog } from '@/lib/blueprints';
import { getTileHeatmapData, toLocalDateKey } from '@/lib/trackerStats';

interface TrackerHeatmapProps {
  logs: GoalLog[];
  daysBack?: number;
  color?: string;
  className?: string;
}

export function TrackerHeatmap({ logs, daysBack = 35, color, className = '' }: TrackerHeatmapProps) {
  const data = getTileHeatmapData(logs, daysBack);
  
  // Create an array of identical length representing the last `daysBack` days
  const cells = Array.from({ length: daysBack }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (daysBack - 1) + i);
    const dateStr = toLocalDateKey(d);
    return {
      date: d,
      dateStr,
      active: data[dateStr] ?? false,
    };
  });
  
  // To make it look like a github graph, usually it's columns of weeks.
  // The prompt asks for a "Grid of small squares (e.g. 7 columns x 5 rows)".
  // We can just use flex wrap or a grid template columns 7.
  return (
    <div className={`grid grid-cols-7 gap-1.5 w-fit ${className}`}>
      {cells.map((cell) => (
        <div
          key={cell.dateStr}
          title={`${cell.active ? 'Activity' : 'No activity'} on ${cell.date.toLocaleDateString()}`}
          className={`w-4 h-4 rounded-sm flex-shrink-0 transition-colors ${
            cell.active 
              ? (color ? '' : 'bg-blue-500 dark:bg-blue-600') 
              : 'bg-gray-100 dark:bg-zinc-800'
          }`}
          style={cell.active && color ? { backgroundColor: color } : undefined}
        />
      ))}
    </div>
  );
}
