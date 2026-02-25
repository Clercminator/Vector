import React, { useState } from 'react';
import { useLanguage } from '@/app/components/language-provider';
import { Check } from 'lucide-react';
import { BlueprintTracker } from '@/lib/blueprints';
import { motion, AnimatePresence } from 'motion/react';

interface TrackerQuickLogProps {
  tracker: BlueprintTracker;
  isDoneToday: boolean;
  onLog: (note?: string) => Promise<void>;
  color?: string;
}

export function TrackerQuickLog({ tracker, isDoneToday, onLog, color }: TrackerQuickLogProps) {
  const { t } = useLanguage();
  const [note, setNote] = useState('');
  const [isNoteVisible, setIsNoteVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const question = tracker.tracking_question || t('tracker.didItToday');

  const handleLog = async () => {
    setIsSubmitting(true);
    try {
      await onLog(note);
      setNote('');
      setIsNoteVisible(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col items-center text-center shadow-sm">
      <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">
        {question}
      </h2>

      <div className="w-full max-w-sm flex flex-col items-center">
        <button
           onClick={handleLog}
           disabled={isDoneToday || isSubmitting}
           className={`group relative w-full h-20 md:h-24 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 shadow-lg
             ${isDoneToday 
               ? 'bg-green-500 scale-100 shadow-green-500/20' 
               : (color ? 'text-white hover:scale-[1.02] hover:shadow-xl' : 'bg-blue-500 text-white hover:scale-[1.02] hover:shadow-blue-500/20')
             }
             disabled:opacity-80 disabled:cursor-not-allowed
           `}
           style={!isDoneToday && color ? { backgroundColor: color, boxShadow: `0 10px 25px -5px ${color}66` } : undefined}
        >
          {isSubmitting ? (
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          ) : isDoneToday ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Check size={20} strokeWidth={4} className="text-white" />
              </div>
              <span className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">{t('tracker.status.completed')}!</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-xl md:text-2xl font-black uppercase tracking-wider">{t('tracker.logToday')}</span>
            </div>
          )}
        </button>

        <AnimatePresence>
          {!isDoneToday && !isNoteVisible && (
            <motion.button
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onClick={() => setIsNoteVisible(true)}
              className="mt-4 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white underline decoration-dashed underline-offset-4"
            >
              {t('tracker.addNote')}
            </motion.button>
          )}

          {!isDoneToday && isNoteVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full mt-4"
            >
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={t('tracker.journalPlaceholder')}
                className="w-full p-4 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400"
                rows={2}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
