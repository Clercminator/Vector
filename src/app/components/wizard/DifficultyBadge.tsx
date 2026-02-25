import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useLanguage } from '@/app/components/language-provider';

export type DifficultyLevel = 'easy' | 'intermediate' | 'hard' | 'god-level';

interface DifficultyBadgeProps {
  difficulty: DifficultyLevel;
  reason?: string;
  className?: string;
}

const DIFFICULTY_CONFIG: Record<DifficultyLevel, { labelKey: string; descKey: string; className: string }> = {
  easy: {
    labelKey: 'difficulty.easy',
    descKey: 'difficulty.easyDesc',
    className: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  intermediate: {
    labelKey: 'difficulty.intermediate',
    descKey: 'difficulty.intermediateDesc',
    className: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  hard: {
    labelKey: 'difficulty.hard',
    descKey: 'difficulty.hardDesc',
    className: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
  'god-level': {
    labelKey: 'difficulty.godLevel',
    descKey: 'difficulty.godLevelDesc',
    className: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
};

const VALID_LEVELS: DifficultyLevel[] = ['easy', 'intermediate', 'hard', 'god-level'];

function normalizeDifficulty(val: unknown): DifficultyLevel | null {
  if (typeof val !== 'string') return null;
  const lower = val.toLowerCase().trim();
  if (VALID_LEVELS.includes(lower as DifficultyLevel)) return lower as DifficultyLevel;
  // Accept common variants
  if (['easy', 'beginner'].includes(lower)) return 'easy';
  if (['intermediate', 'medium', 'moderate'].includes(lower)) return 'intermediate';
  if (['hard', 'difficult', 'challenging'].includes(lower)) return 'hard';
  if (['god-level', 'godlevel', 'god level', 'elite', 'legendary'].includes(lower)) return 'god-level';
  return null;
}

export function DifficultyBadge({ difficulty: raw, reason, className = '' }: DifficultyBadgeProps) {
  const { t } = useLanguage();
  const difficulty = normalizeDifficulty(raw);
  if (!difficulty) return null;

  const config = DIFFICULTY_CONFIG[difficulty];
  if (!config) return null;

  const label = t(config.labelKey) || raw;
  const levelDesc = t(config.descKey);
  const tooltipContent = reason
    ? `${levelDesc}\n\n${t('difficulty.whyThis')} ${reason}`
    : levelDesc;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
            cursor-help select-none
            ${config.className}
            ${className}
          `}
          role="img"
          aria-label={t('difficulty.ariaLabel') || `Difficulty: ${label}`}
        >
          <Info size={12} className="opacity-70 shrink-0" />
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8} className="max-w-xs whitespace-pre-line text-sm">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}
