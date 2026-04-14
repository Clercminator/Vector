import React from 'react';
import { motion } from 'motion/react';
import { Target, Map, Settings, Copy, ShieldOff, Compass } from 'lucide-react';
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
  shortTitle?: string;
}

interface GpsViewProps {
  result: GpsResult;
  updateResult: (path: (string | number)[], value: any) => void;
}

const STEP_CONFIG = [
  { key: 'goal', icon: Target, labelKey: 'gps.goal', descKey: 'gps.goalDesc', gradient: 'from-sky-500 to-cyan-600', bg: 'from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20', border: 'border-sky-200/80 dark:border-sky-800/50', accent: 'bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500' },
  { key: 'plan', icon: Map, labelKey: 'gps.plan', descKey: 'gps.planDesc', gradient: 'from-cyan-500 to-teal-600', bg: 'bg-white dark:bg-zinc-900', border: 'border-gray-200 dark:border-zinc-800', accent: 'bg-cyan-500' },
  { key: 'system', icon: Settings, labelKey: 'gps.system', descKey: 'gps.systemDesc', gradient: 'from-teal-500 to-emerald-600', bg: 'bg-white dark:bg-zinc-900', border: 'border-gray-200 dark:border-zinc-800', accent: 'bg-teal-500' },
];

/** Normalize so we always have content to show (no undefined or missing arrays). */
function normalizeGpsResult(result: GpsResult): { goal: string; plan: string[]; system: string[]; anti_goals: string[]; shortTitle?: string } {
  const goal = typeof result.goal === 'string' && result.goal.trim() ? result.goal.trim() : '';
  const plan = Array.isArray(result.plan) ? result.plan.filter((s): s is string => typeof s === 'string') : [];
  const system = Array.isArray(result.system) ? result.system.filter((s): s is string => typeof s === 'string') : [];
  const anti_goals = Array.isArray(result.anti_goals) ? result.anti_goals.filter((s): s is string => typeof s === 'string') : [];
  return { goal, plan, system, anti_goals, shortTitle: result.shortTitle };
}

export const GpsView: React.FC<GpsViewProps> = ({ result, updateResult }) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { goal, plan, system, anti_goals, shortTitle } = normalizeGpsResult(result);

  const copyGps = () => {
    const parts = [
      shortTitle ? `# ${shortTitle}\n\n` : '',
      `## ${t('gps.goal')}\n${goal || ''}`,
      `\n## ${t('gps.plan')}\n${plan.map((p, i) => `${i + 1}. ${p}`).join('\n')}`,
      `\n## ${t('gps.system')}\n${system.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      anti_goals.length ? `\n## ${t('gps.antiGoals') || 'Anti-Goals'}\n${anti_goals.map(a => `- ${a}`).join('\n')}` : '',
    ];
    navigator.clipboard.writeText(parts.filter(Boolean).join(''));
    toast.success(t('common.copiedToClipboard'));
  };

  const displayPlan = plan.length > 0 ? plan : [];
  const displaySystem = system.length > 0 ? system : [];

  return (
    <div className="mt-6 w-full max-w-4xl mx-auto px-4 pb-16 sm:pb-20">
      {isMobile && <DesktopRecommendedBanner className="mb-8" />}

      {/* Optional short title — gives the plan a name */}
      {shortTitle && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400">
            <Compass size={20} />
          </div>
          <EditableText
            value={shortTitle}
            onChange={(val) => updateResult(['shortTitle'], val)}
            className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight"
          />
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 flex-wrap">
          {STEP_CONFIG.map((step, i) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.key}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${step.gradient} text-white text-sm font-bold shadow-lg`}>
                  <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">{i + 1}</span>
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
          className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-5 py-2.5 rounded-full shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer shrink-0"
          aria-label={t('common.copyStrategy')}
        >
          <Copy size={16} />
          {t('common.copyStrategy')}
        </button>
      </div>

      {/* G (Goal) — hero with accent bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-[2.5rem] border-2 shadow-2xl bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 border-sky-200/80 dark:border-sky-800/50 relative overflow-hidden"
      >
        <div className={`absolute top-0 left-0 right-0 h-1 ${STEP_CONFIG[0].accent}`} />
        <div className="absolute top-0 right-0 w-72 h-72 bg-sky-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 p-8 md:p-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-lg">
              <Target size={26} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
                {t('gps.goal')} — {t('gps.goalDesc') || 'The destination'}
              </span>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1 sr-only">{t('gps.goal')}</h2>
            </div>
          </div>
          <EditableText
            value={goal}
            onChange={(val) => updateResult(['goal'], val)}
            multiline
            placeholder={t('gps.goal') || 'Your clear, specific outcome…'}
            className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight"
          />
        </div>
      </motion.div>

      {/* P (Plan) — major moves */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="mt-8 rounded-[2.5rem] p-8 md:p-10 border-2 shadow-xl bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-400/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400">
            <Map size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('gps.plan')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('gps.planDesc') || 'The route to get there'}</p>
          </div>
        </div>
        {displayPlan.length > 0 ? (
          <EditableList
            items={displayPlan}
            onChange={(val) => updateResult(['plan'], val)}
            itemClassName="text-base text-gray-700 dark:text-gray-200 border-l-4 border-cyan-400 dark:border-cyan-600 pl-4 py-3 bg-cyan-50/50 dark:bg-cyan-950/20 rounded-r-xl"
          />
        ) : (
          <div className="text-gray-500 dark:text-gray-400 italic py-4">
            <EditableList
              items={['']}
              onChange={(val) => updateResult(['plan'], val.filter(Boolean).length ? val : [''])}
              itemClassName="text-base text-gray-700 dark:text-gray-200 border-l-4 border-cyan-400 dark:border-cyan-600 pl-4 py-3 bg-cyan-50/50 dark:bg-cyan-950/20 rounded-r-xl"
              placeholder={t('gps.plan') || 'Add a major move…'}
            />
          </div>
        )}
      </motion.div>

      {/* S (System) — habits & environment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-8 rounded-[2.5rem] p-8 md:p-10 border-2 shadow-xl bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-400/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400">
            <Settings size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('gps.system')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('gps.systemDesc') || 'Habits & environment that keep you on track'}</p>
          </div>
        </div>
        {displaySystem.length > 0 ? (
          <EditableList
            items={displaySystem}
            onChange={(val) => updateResult(['system'], val)}
            itemClassName="text-base text-gray-700 dark:text-gray-200 border-l-4 border-teal-400 dark:border-teal-600 pl-4 py-3 bg-teal-50/50 dark:bg-teal-950/20 rounded-r-xl"
          />
        ) : (
          <div className="text-gray-500 dark:text-gray-400 italic py-4">
            <EditableList
              items={['']}
              onChange={(val) => updateResult(['system'], val.filter(Boolean).length ? val : [''])}
              itemClassName="text-base text-gray-700 dark:text-gray-200 border-l-4 border-teal-400 dark:border-teal-600 pl-4 py-3 bg-teal-50/50 dark:bg-teal-950/20 rounded-r-xl"
              placeholder={t('gps.system') || 'Add a system habit…'}
            />
          </div>
        )}
      </motion.div>

      {/* Anti-Goals — always visible so content is there */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14 }}
        className="mt-8 rounded-[2.5rem] p-8 md:p-10 border-2 border-amber-200/80 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-950/20 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
            <ShieldOff size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">{t('gps.antiGoals') || 'Anti-Goals'}</h3>
            <p className="text-sm text-amber-700/90 dark:text-amber-300/90">What you won&apos;t sacrifice</p>
          </div>
        </div>
        <EditableList
          items={anti_goals.length > 0 ? anti_goals : ['']}
          onChange={(val) => updateResult(['anti_goals'], val.filter(Boolean))}
          itemClassName="text-base text-gray-700 dark:text-gray-200 border-l-4 border-amber-400 dark:border-amber-600 pl-4 py-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-r-xl"
          placeholder={t('gps.antiGoals') || 'e.g. No sacrificing sleep…'}
        />
      </motion.div>
    </div>
  );
};
