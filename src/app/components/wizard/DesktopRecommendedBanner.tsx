import React from 'react';
import { Monitor } from 'lucide-react';
import { useLanguage } from '@/app/components/language-provider';

interface DesktopRecommendedBannerProps {
  /** Optional custom message; defaults to wizard.visualizationDesktopRecommended */
  message?: string;
  className?: string;
}

/**
 * Banner shown on mobile for framework visualizations that work best on desktop.
 * Used by Mandala, Eisenhower, Ikigai, and other space-constrained views.
 */
export const DesktopRecommendedBanner: React.FC<DesktopRecommendedBannerProps> = ({
  message,
  className = ''
}) => {
  const { t } = useLanguage();
  const text = message ?? t('wizard.visualizationDesktopRecommended');

  return (
    <div
      className={`p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 flex items-start gap-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <Monitor size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
        {text}
      </p>
    </div>
  );
};
