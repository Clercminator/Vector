import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/app/components/language-provider';
import { toLocalDateKey } from '@/lib/trackerStats';

interface TrackerCalendarProps {
  highlightedDates: Set<string>; // active dates (YYYY-MM-DD local)
  color?: string;
  onDayClick?: (date: Date) => void;
  className?: string;
}

export function TrackerCalendar({ highlightedDates, color, onDayClick, className = '' }: TrackerCalendarProps) {
  const { t } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); // 0 is Sunday
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const days = [];
  // add empty padding for start of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8 md:w-10 md:h-10"></div>);
  }

  const todayStr = toLocalDateKey(new Date());

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dStr = toLocalDateKey(d);
    const isActive = highlightedDates.has(dStr);
    const isToday = dStr === todayStr;

    days.push(
      <button
        key={day}
        onClick={() => onDayClick && onDayClick(d)}
        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer
          ${isToday ? 'border-2 border-black dark:border-white' : ''}
          ${isActive ? (color ? 'text-white' : 'bg-blue-500 text-white') : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}
        `}
        style={isActive && color ? { backgroundColor: color } : undefined}
      >
        {day}
      </button>
    );
  }

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className={`flex flex-col items-center bg-white dark:bg-zinc-900/50 rounded-2xl p-4 border border-gray-200 dark:border-zinc-800 ${className}`}>
      <div className="flex w-full justify-between items-center mb-4 px-2">
        <button onClick={prevMonth} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 cursor-pointer">
          <ChevronLeft size={20} />
        </button>
        <div className="font-bold text-gray-900 dark:text-white">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button onClick={nextMonth} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 cursor-pointer">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 w-full text-center text-xs font-bold text-gray-400 uppercase">
        {weekDays.map((wd, i) => (
          <div key={i}>{wd}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2 w-full text-center">
        {days}
      </div>
    </div>
  );
}
