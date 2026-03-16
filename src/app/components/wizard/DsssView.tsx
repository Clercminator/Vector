import React from 'react';
import { motion } from 'motion/react';
import { Layers, Filter, ListOrdered, Zap, Copy } from 'lucide-react';
import { EditableText, EditableList } from '../Editable';
import { useLanguage } from '@/app/components/language-provider';
import { useIsMobile } from '../ui/use-mobile';
import { DesktopRecommendedBanner } from './DesktopRecommendedBanner';
import { toast } from 'sonner';

interface DsssResult {
  type: 'dsss';
  deconstruct: string[];
  selection: string[];
  sequence: string[];
  stakes: string;
}

interface DsssViewProps {
  result: DsssResult;
  updateResult: (path: (string | number)[], value: any) => void;
}

const STEPS = [
  { key: 'deconstruct', icon: Layers, labelKey: 'dsss.deconstruct', descKey: 'fw.dsss.definition', color: 'orange' },
  { key: 'selection', icon: Filter, labelKey: 'dsss.selection', descKey: null, color: 'amber' },
  { key: 'sequence', icon: ListOrdered, labelKey: 'dsss.sequence', descKey: null, color: 'yellow' },
  { key: 'stakes', icon: Zap, labelKey: 'dsss.stakes', descKey: null, color: 'red' },
] as const;

const colorClasses = {
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-200 dark:border-orange-800/50',
    icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
    bar: 'bg-orange-500',
    list: 'border-orange-400 dark:border-orange-600 bg-orange-50/50 dark:bg-orange-950/20',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800/50',
    icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-500',
    list: 'border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/20',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    border: 'border-yellow-200 dark:border-yellow-800/50',
    icon: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400',
    bar: 'bg-yellow-500',
    list: 'border-yellow-400 dark:border-yellow-600 bg-yellow-50/50 dark:bg-yellow-950/20',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800/50',
    icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    bar: 'bg-red-500',
    list: 'border-red-400 dark:border-red-600 bg-red-50/50 dark:bg-red-950/20',
  },
};

export const DsssView: React.FC<DsssViewProps> = ({ result, updateResult }) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const copyDsss = () => {
    const parts = [
      `# ${t('dsss.deconstruct')}\n${(result.deconstruct || []).map((d: string, i: number) => `${i + 1}. ${d}`).join('\n')}`,
      `\n# ${t('dsss.selection')}\n${(result.selection || []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}`,
      `\n# ${t('dsss.sequence')}\n${(result.sequence || []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}`,
      `\n# ${t('dsss.stakes')}\n${result.stakes || ''}`,
    ];
    navigator.clipboard.writeText(parts.join(''));
    toast.success(t('common.copiedToClipboard'));
  };

  return (
    <div className="mt-8 w-full max-w-5xl mx-auto px-4 pb-12">
      {isMobile && <DesktopRecommendedBanner className="mb-8" />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-1.5 flex-wrap">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const colors = colorClasses[step.color];
            return (
              <React.Fragment key={step.key}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg} border ${colors.border} text-sm font-bold`}>
                  <span className={`w-6 h-6 rounded-full ${colors.bar} text-white flex items-center justify-center text-xs`}>{i + 1}</span>
                  <Icon size={14} className="text-gray-700 dark:text-gray-300" />
                  <span className="text-gray-800 dark:text-gray-200">{t(step.labelKey)}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block w-4 h-0.5 bg-orange-300 dark:bg-orange-700 rounded" aria-hidden />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <button
          type="button"
          onClick={copyDsss}
          className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-5 py-2.5 rounded-full shadow-sm hover:shadow-md active:scale-95 cursor-pointer shrink-0"
          aria-label="Copy strategy"
        >
          <Copy size={16} />
          Copy Strategy
        </button>
      </div>

      <div className="space-y-8">
        {/* 1. Deconstruct */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={`rounded-[2rem] p-8 border-2 shadow-xl ${colorClasses.orange.bg} ${colorClasses.orange.border}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-xl ${colorClasses.orange.icon}`}>
              <Layers size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">1. {t('dsss.deconstruct')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Break the skill into subcomponents</p>
            </div>
          </div>
          <EditableList
            items={result.deconstruct ?? []}
            onChange={(val) => updateResult(['deconstruct'], val)}
            itemClassName={`text-base text-gray-700 dark:text-gray-200 border-l-4 pl-4 py-2.5 rounded-r-lg ${colorClasses.orange.list}`}
          />
        </motion.div>

        {/* 2. Selection */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
          className={`rounded-[2rem] p-8 border-2 shadow-xl ${colorClasses.amber.bg} ${colorClasses.amber.border}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-xl ${colorClasses.amber.icon}`}>
              <Filter size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">2. {t('dsss.selection')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Select the vital 20% to focus on</p>
            </div>
          </div>
          <EditableList
            items={result.selection ?? []}
            onChange={(val) => updateResult(['selection'], val)}
            itemClassName={`text-base text-gray-700 dark:text-gray-200 border-l-4 pl-4 py-2.5 rounded-r-lg ${colorClasses.amber.list}`}
          />
        </motion.div>

        {/* 3. Sequence */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className={`rounded-[2rem] p-8 border-2 shadow-xl ${colorClasses.yellow.bg} ${colorClasses.yellow.border}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-xl ${colorClasses.yellow.icon}`}>
              <ListOrdered size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">3. {t('dsss.sequence')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Order of learning or execution</p>
            </div>
          </div>
          <EditableList
            items={result.sequence ?? []}
            onChange={(val) => updateResult(['sequence'], val)}
            itemClassName={`text-base text-gray-700 dark:text-gray-200 border-l-4 pl-4 py-2.5 rounded-r-lg ${colorClasses.yellow.list}`}
          />
        </motion.div>

        {/* 4. Stakes */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
          className={`rounded-[2rem] p-8 border-2 shadow-xl ${colorClasses.red.bg} ${colorClasses.red.border}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-xl ${colorClasses.red.icon}`}>
              <Zap size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">4. {t('dsss.stakes')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Accountability — what’s at risk if you don’t follow through</p>
            </div>
          </div>
          <EditableText
            value={result.stakes}
            onChange={(val) => updateResult(['stakes'], val)}
            multiline
            className="text-base md:text-lg text-gray-700 dark:text-gray-200 leading-relaxed min-h-[100px]"
          />
        </motion.div>
      </div>
    </div>
  );
};
