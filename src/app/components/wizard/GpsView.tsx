import React from 'react';
import { motion } from 'motion/react';
import { Target, Map, Settings, Copy, ShieldOff } from 'lucide-react';
import { EditableText, EditableList } from '../Editable';
import { useLanguage } from '@/app/components/language-provider';
import { useIsMobile } from '../ui/use-mobile';
import { DesktopRecommendedBanner } from './DesktopRecommendedBanner';
import { toast } from 'sonner';

interface GpsResult {
  type: 'gps';
  goal: string;
  plan: string[];
  system: string[];
  anti_goals?: string[];
}

interface GpsViewProps {
  result: GpsResult;
  updateResult: (path: (string | number)[], value: any) => void;
}

const STEP_CONFIG = [
  { key: 'goal', icon: Target, labelKey: 'gps.goal', descKey: 'gps.goalDesc', gradient: 'from-sky-500 to-cyan-600', bg: 'from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20', border: 'border-sky-200/80 dark:border-sky-800/50' },
  { key: 'plan', icon: Map, labelKey: 'gps.plan', descKey: 'gps.planDesc', gradient: 'from-cyan-500 to-teal-600', bg: 'bg-white dark:bg-zinc-900', border: 'border-gray-200 dark:border-zinc-800' },
  { key: 'system', icon: Settings, labelKey: 'gps.system', descKey: 'gps.systemDesc', gradient: 'from-teal-500 to-emerald-600', bg: 'bg-white dark:bg-zinc-900', border: 'border-gray-200 dark:border-zinc-800' },
];

export const GpsView: React.FC<GpsViewProps> = ({ result, updateResult }) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const copyGps = () => {
    const parts = [
      `# ${t('gps.goal')}\n${result.goal || ''}`,
      `\n## ${t('gps.plan')}\n${(result.plan || []).map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}`,
      `\n## ${t('gps.system')}\n${(result.system || []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}`,
      (result.anti_goals?.length ? `\n## ${t('gps.antiGoals') || 'Anti-Goals'}\n${result.anti_goals.map((a: string) => `- ${a}`).join('\n')}` : ''),
    ];
    navigator.clipboard.writeText(parts.filter(Boolean).join(''));
    toast.success(t('common.copiedToClipboard'));
  };

  return (
    <div className="mt-8 w-full max-w-4xl mx-auto px-4 pb-12">
      {isMobile && <DesktopRecommendedBanner className="mb-8" />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        {/* Flow indicator: 1 → 2 → 3 */}
        <div className="flex items-center gap-2 flex-wrap">
          {STEP_CONFIG.map((step, i) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.key}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${step.gradient} text-white text-sm font-bold shadow-md`}>
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">{i + 1}</span>
                  <Icon size={14} />
                  <span>{t(step.labelKey)}</span>
                </div>
                {i < STEP_CONFIG.length - 1 && (
                  <div className="hidden sm:block w-6 h-0.5 bg-gray-300 dark:bg-zinc-600 rounded" aria-hidden />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <button
          type="button"
          onClick={copyGps}
          className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-5 py-2.5 rounded-full shadow-sm hover:shadow-md active:scale-95 cursor-pointer shrink-0"
          aria-label="Copy strategy"
        >
          <Copy size={16} />
          Copy Strategy
        </button>
      </div>

      {/* Goal — hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`rounded-[2.5rem] p-8 md:p-10 border-2 shadow-xl bg-gradient-to-br ${STEP_CONFIG[0].bg} ${STEP_CONFIG[0].border} relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex items-start gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-lg">
            <Target size={24} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
              {t('gps.goal')} — {t('gps.goalDesc') || 'The destination'}
            </span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1 sr-only">{t('gps.goal')}</h2>
          </div>
        </div>
        <EditableText
          value={result.goal}
          onChange={(val) => updateResult(['goal'], val)}
          multiline
          className="relative z-10 text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight"
        />
      </motion.div>

      {/* Plan — the route */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className={`mt-8 rounded-[2rem] p-8 border-2 shadow-lg ${STEP_CONFIG[1].bg} ${STEP_CONFIG[1].border}`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400">
            <Map size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('gps.plan')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('gps.planDesc') || 'The route to get there'}</p>
          </div>
        </div>
        <EditableList
          items={result.plan ?? []}
          onChange={(val) => updateResult(['plan'], val)}
          itemClassName="text-base text-gray-700 dark:text-gray-200 border-l-4 border-cyan-400 dark:border-cyan-600 pl-4 py-2.5 bg-cyan-50/50 dark:bg-cyan-950/20 rounded-r-lg"
        />
      </motion.div>

      {/* System — the vehicle/habits */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className={`mt-8 rounded-[2rem] p-8 border-2 shadow-lg ${STEP_CONFIG[2].bg} ${STEP_CONFIG[2].border}`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400">
            <Settings size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('gps.system')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('gps.systemDesc') || 'Habits & environment that keep you on track'}</p>
          </div>
        </div>
        <EditableList
          items={result.system ?? []}
          onChange={(val) => updateResult(['system'], val)}
          itemClassName="text-base text-gray-700 dark:text-gray-200 border-l-4 border-teal-400 dark:border-teal-600 pl-4 py-2.5 bg-teal-50/50 dark:bg-teal-950/20 rounded-r-lg"
        />
      </motion.div>

      {/* Anti-Goals — what to avoid */}
      {Array.isArray(result.anti_goals) && result.anti_goals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          className="mt-8 rounded-[2rem] p-8 border-2 border-amber-200/80 dark:border-amber-800/40 bg-amber-50/80 dark:bg-amber-950/20 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <ShieldOff size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">{t('gps.antiGoals') || 'Anti-Goals'}</h3>
              <p className="text-sm text-amber-700/80 dark:text-amber-300/80">What to avoid or cut</p>
            </div>
          </div>
          <EditableList
            items={result.anti_goals}
            onChange={(val) => updateResult(['anti_goals'], val)}
            itemClassName="text-base text-gray-700 dark:text-gray-200"
          />
        </motion.div>
      )}
    </div>
  );
};
