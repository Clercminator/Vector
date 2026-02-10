import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, CheckCircle2 } from 'lucide-react';
import { ErrorBoundary } from '../ErrorBoundary';
import { useLanguage } from '@/app/components/language-provider';

// Score Indicator Component (Local to Draft/Result usually)
const ScoreIndicator = ({ score }: { score: number }) => {
    let color = "text-red-500";
    let text = "Weak";
    if (score >= 40) { color = "text-yellow-500"; text = "Developing"; }
    if (score >= 70) { color = "text-green-500"; text = "Strong"; }
    if (score >= 90) { color = "text-emerald-600 font-bold"; text = "Excellent"; }

    return (
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-zinc-800/50">
            <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{text}</span>
                <span className={`text-xl font-mono leading-none ${color}`}>{score}%</span>
            </div>
             <div className="w-10 h-10 relative flex items-center justify-center">
                <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
                    <path className="text-gray-200 dark:text-zinc-700" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className={`${color} transition-all duration-1000 ease-out`} strokeDasharray={`${score}, 100`} strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
             </div>
        </div>
    );
};

interface WizardDraftProps {
    draftResult: any;
    showMobileDraft: boolean;
    setShowMobileDraft: (show: boolean) => void;
    draftPulse?: boolean;
    onFinalize?: () => void;
    isTyping?: boolean;
    isAgentRunning?: boolean;
}

export const WizardDraft: React.FC<WizardDraftProps> = ({
    draftResult,
    showMobileDraft,
    setShowMobileDraft,
    draftPulse = false,
    onFinalize,
    isTyping = false,
    isAgentRunning = false
}) => {
    const { t } = useLanguage();

    const renderDraftContent = (draft: any) => {
        if (!draft) return null;
  
        const renderBody = () => {
          if (draft.type === 'pareto') {
              return (
                  <div className="space-y-4">
                      <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-blue-100 dark:border-blue-900/30">
                          <h5 className="font-bold text-blue-600 text-sm mb-2">{t('pareto.vital')}</h5>
                          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                              {draft.vital?.map((v: string, i: number) => <li key={i}>{v}</li>)}
                          </ul>
                      </div>
                       <div className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
                          <h5 className="font-bold text-gray-500 text-sm mb-2">{t('pareto.trivial')}</h5>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                              {draft.trivial?.map((v: string, i: number) => <li key={i}>{v}</li>)}
                          </ul>
                      </div>
                  </div>
              );
          }
  
          if (draft.type === 'first-principles') {
              return (
                  <div className="space-y-4">
                      <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-700/80">
                          <h5 className="font-bold text-slate-600 dark:text-slate-400 text-sm mb-2">{t('fp.truths')}</h5>
                          <ul className="space-y-2 pl-4 border-l-2 border-slate-200 dark:border-zinc-600">
                              {(draft.truths || []).map((truth: string, i: number) => <li key={i} className="text-sm text-gray-700 dark:text-gray-300">{truth}</li>)}
                          </ul>
                      </div>
                      <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-blue-100 dark:border-blue-900/40">
                          <h5 className="font-bold text-blue-600 dark:text-blue-400 text-sm mb-2">{t('fp.newApproach')}</h5>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{draft.newApproach || "..."}</p>
                      </div>
                  </div>
              );
          }

          if (draft.type === 'okr') {
              return (
                  <div className="space-y-4">
                       <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-900/40">
                          <h5 className="font-bold text-purple-600 text-sm mb-2">{t('okr.northStar')}</h5>
                          <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{draft.objective || "Defining..."}</p>
                      </div>
                       <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                          <h5 className="font-bold text-gray-500 text-sm mb-2">{t('okr.keyResult')}</h5>
                          <ul className="space-y-2">
                              {draft.keyResults?.map((kr: string, i: number) => (
                                  <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                                      <span className="font-bold text-purple-400">{i+1}.</span> {kr}
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </div>
              );
          }
  
          // Fallback
          return (
              <div className="space-y-4">
                  {Object.entries(draft).map(([key, val]) => {
                      if (key === 'type' || key === 'score' || !val) return null;
                      return (
                          <div key={key} className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                              <h5 className="font-bold text-gray-500 text-sm mb-2 capitalize">{key}</h5>
                              {Array.isArray(val) ? (
                                  <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                                      {(val as string[]).map((v, i) => <li key={i}>{v}</li>)}
                                  </ul>
                              ) : (
                                  <p className="text-sm text-black dark:text-white">{val as string}</p>
                              )}
                          </div>
                      )
                  })}
              </div>
          );
        };
  
        return (
            <div className={`space-y-6 transition-all duration-500 ${draftPulse ? 'scale-[1.02] ring-2 ring-blue-400/50 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.2)] bg-blue-50/30' : ''}`}>
                 <div className="flex items-start justify-between border-b border-gray-100 dark:border-zinc-800 pb-4">
                     <div>
                         <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                             <span className="capitalize">{draft.type?.replace('-', ' ') || "Plan"}</span>
                         </h3>
                         <p className="text-xs text-gray-400 mt-1">Building your plan – updates as we talk</p>
                     </div>
                     {draft.score !== undefined && <ScoreIndicator score={draft.score} />}
                 </div>
                 {renderBody()}
            </div>
        );
    };

    if (!draftResult) return null;

    return (
        <>
            {/* Desktop Drawer */}
             <motion.div 
               initial={{ opacity: 0, x: 50 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 50 }}
               className="hidden lg:block absolute right-0 top-0 bottom-0 w-96 bg-gray-50 dark:bg-zinc-900/50 border-l border-gray-200 dark:border-zinc-800 overflow-y-auto p-6 backdrop-blur-sm z-10"
             >
                <div className="flex items-center gap-2 mb-6 text-gray-400 uppercase tracking-widest text-xs font-bold">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {isTyping || isAgentRunning ? 'Live Draft' : 'Your Blueprint'}
                </div>
                {!draftResult?.isTeaser && draftResult?.type && onFinalize && !isTyping && !isAgentRunning && (
                    <button
                        onClick={onFinalize}
                        className="w-full mb-6 py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg"
                    >
                        <CheckCircle2 size={18} />
                        {t('wizard.viewFullBlueprint')}
                    </button>
                )}
                <div className={`origin-top ${!draftResult?.isTeaser && draftResult?.type ? '' : 'pointer-events-none opacity-80 scale-90'}`}>
                    <ErrorBoundary name="Live Draft">
                      {renderDraftContent(draftResult)}
                    </ErrorBoundary>
                </div>
             </motion.div>

             {/* Mobile Drawer Trigger (if folded) */}
             <button 
               onClick={() => setShowMobileDraft(!showMobileDraft)}
               className="lg:hidden absolute top-[-3rem] left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/80 dark:bg-white/90 text-white dark:text-black rounded-full text-xs font-bold shadow-lg backdrop-blur-md flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in z-20"
               style={{ bottom: "5rem", top: 'auto'}} 
             >
                {showMobileDraft ? <X size={12} /> : <FileText size={12} />}
                {showMobileDraft ? "Close Draft" : "View Draft"}
             </button>

             {/* Mobile Drawer */}
             <AnimatePresence>
               {showMobileDraft && (
                   <motion.div 
                       initial={{ y: "100%" }}
                       animate={{ y: 0 }}
                       exit={{ y: "100%" }}
                       transition={{ type: "spring", damping: 25, stiffness: 200 }}
                       className="lg:hidden absolute inset-x-0 bottom-0 top-20 bg-white dark:bg-zinc-900 rounded-t-[2rem] shadow-2xl z-30 border-t border-gray-200 dark:border-zinc-800 flex flex-col"
                   >
                        <div className="flex-none p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                {isTyping || isAgentRunning ? 'Live Draft' : 'Your Blueprint'}
                            </div>
                            <button onClick={() => setShowMobileDraft(false)} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full" aria-label="Close draft panel">
                                <X size={16} />
                            </button>
                        </div>
                        {!draftResult?.isTeaser && draftResult?.type && onFinalize && !isTyping && !isAgentRunning && (
                            <div className="flex-none px-4 pb-4">
                                <button
                                    onClick={onFinalize}
                                    className="w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={18} />
                                    {t('wizard.viewFullBlueprint')}
                                </button>
                            </div>
                        )}
                        <div className="flex-grow overflow-y-auto p-6">
                             <ErrorBoundary name="Mobile Draft">
                               {renderDraftContent(draftResult)}
                             </ErrorBoundary>
                        </div>
                   </motion.div>
               )}
             </AnimatePresence>
        </>
    );
}
