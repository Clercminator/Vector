import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2 } from 'lucide-react';
import { ErrorBoundary } from '../ErrorBoundary';
import { useLanguage } from '@/app/components/language-provider';
import { ScrollArea } from '@/app/components/ui/scroll-area';

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
              const vital = draft.vital ?? [];
              const trivial = draft.trivial ?? [];
              return (
                  <div className="space-y-4">
                      <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-blue-100 dark:border-blue-900/30">
                          <h5 className="font-bold text-blue-600 text-sm mb-2">{t('pareto.vital')}</h5>
                          {vital.length > 0 ? (
                              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                                  {vital.map((v: string, i: number) => <li key={i}>{v}</li>)}
                              </ul>
                          ) : (
                              <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t('wizard.planStepsPlaceholder')}</p>
                          )}
                      </div>
                      <div className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
                          <h5 className="font-bold text-gray-500 text-sm mb-2">{t('pareto.trivial')}</h5>
                          {trivial.length > 0 ? (
                              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                                  {trivial.map((v: string, i: number) => <li key={i}>{v}</li>)}
                              </ul>
                          ) : (
                              <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t('wizard.planStepsPlaceholder')}</p>
                          )}
                      </div>
                  </div>
              );
          }
  
          if (draft.type === 'first-principles') {
              const truths = draft.truths ?? [];
              const newApproach = draft.newApproach?.trim() || '';
              return (
                  <div className="space-y-4">
                      <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-700/80">
                          <h5 className="font-bold text-slate-600 dark:text-slate-400 text-sm mb-2">{t('fp.truths')}</h5>
                          {truths.length > 0 ? (
                              <ul className="space-y-2 pl-4 border-l-2 border-slate-200 dark:border-zinc-600">
                                  {truths.map((truth: string, i: number) => <li key={i} className="text-sm text-gray-700 dark:text-gray-300">{truth}</li>)}
                              </ul>
                          ) : (
                              <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t('wizard.planStepsPlaceholder')}</p>
                          )}
                      </div>
                      <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-blue-100 dark:border-blue-900/40">
                          <h5 className="font-bold text-blue-600 dark:text-blue-400 text-sm mb-2">{t('fp.newApproach')}</h5>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{newApproach || t('wizard.planStepsPlaceholder')}</p>
                      </div>
                  </div>
              );
          }

          if (draft.type === 'okr') {
              const hasKrs = Array.isArray(draft.keyResults) && draft.keyResults.length > 0;
              const initiative = draft.initiative?.trim() || '';
              return (
                  <div className="space-y-4">
                       <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-900/40">
                          <h5 className="font-bold text-purple-600 text-sm mb-2">{t('okr.northStar')}</h5>
                          <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{draft.objective || t('wizard.planStepsPlaceholder')}</p>
                      </div>
                       <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                          <h5 className="font-bold text-gray-500 text-sm mb-2">{t('okr.keyResult')}</h5>
                          {hasKrs ? (
                              <ul className="space-y-2">
                                  {draft.keyResults.map((kr: string, i: number) => (
                                      <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                                          <span className="font-bold text-purple-400 shrink-0">{i+1}.</span>
                                          <span className="truncate">{kr}</span>
                                      </li>
                                  ))}
                              </ul>
                          ) : (
                              <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t('wizard.planStepsPlaceholder')}</p>
                          )}
                      </div>
                      {initiative && (
                          <div className="p-4 bg-purple-100/50 dark:bg-purple-900/30 rounded-xl border border-purple-200/60 dark:border-purple-800/40">
                              <h5 className="font-bold text-purple-600 dark:text-purple-400 text-sm mb-1.5">{t('okr.initiative')}</h5>
                              <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug line-clamp-2">{initiative}</p>
                          </div>
                      )}
                  </div>
              );
          }
  
          if (draft.type === 'mandalas') {
              const goal = draft.centralGoal?.trim() || '';
              const categories = Array.isArray(draft.categories) ? draft.categories : [];
              return (
                  <div className="space-y-4">
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
                          <h5 className="font-bold text-amber-700 dark:text-amber-400 text-sm mb-1.5">{t('wizard.mandalaCentralGoal')}</h5>
                          <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{goal || t('wizard.planStepsPlaceholder')}</p>
                      </div>
                      <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                          <h5 className="font-bold text-gray-500 dark:text-gray-400 text-sm mb-2">{t('wizard.mandalaCategories')}</h5>
                          {categories.length > 0 ? (
                              <ul className="space-y-1.5">
                                  {categories.map((cat: { name?: string; steps?: string[] }, i: number) => (
                                      <li key={i} className="flex items-center justify-between gap-2 text-sm text-gray-700 dark:text-gray-300">
                                          <span className="truncate">{cat.name || t('wizard.planStepsPlaceholder')}</span>
                                          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                                              {(cat.steps?.length ?? 0)}/8
                                          </span>
                                      </li>
                                  ))}
                              </ul>
                          ) : (
                              <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t('wizard.planStepsPlaceholder')}</p>
                          )}
                      </div>
                  </div>
              );
          }

          if (draft.type === 'eisenhower') {
              const q1 = draft.q1 ?? [];
              const q2 = draft.q2 ?? [];
              const q3 = draft.q3 ?? [];
              const q4 = draft.q4 ?? [];
              const quads = [
                  { key: 'eisenhower.do', label: t('eisenhower.do'), items: q1, bg: 'bg-red-50 dark:bg-red-950/20 border-red-200/60 dark:border-red-900/30' },
                  { key: 'eisenhower.schedule', label: t('eisenhower.schedule'), items: q2, bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/30' },
                  { key: 'eisenhower.delegate', label: t('eisenhower.delegate'), items: q3, bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/30' },
                  { key: 'eisenhower.eliminate', label: t('eisenhower.eliminate'), items: q4, bg: 'bg-gray-100 dark:bg-zinc-800/80 border-gray-200 dark:border-zinc-700' },
              ];
              return (
                  <div className="grid grid-cols-2 gap-3">
                      {quads.map((q) => (
                          <div key={q.key} className={`p-3 rounded-xl border ${q.bg}`}>
                              <h5 className="font-bold text-gray-700 dark:text-gray-300 text-xs mb-1.5 truncate">{q.label}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{q.items.length} {q.items.length === 1 ? 'item' : 'items'}</p>
                          </div>
                      ))}
                  </div>
              );
          }

          if (draft.type === 'misogi') {
              const challenge = draft.challenge?.trim() || '';
              const gap = draft.gap?.trim() || '';
              const purification = draft.purification?.trim() || '';
              return (
                  <div className="space-y-4">
                      <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200/60 dark:border-red-900/40">
                          <h5 className="font-bold text-red-700 dark:text-red-400 text-sm mb-1.5">The Challenge</h5>
                          <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight line-clamp-2">{challenge || t('wizard.planStepsPlaceholder')}</p>
                      </div>
                      <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                          <h5 className="font-bold text-gray-500 dark:text-gray-400 text-sm mb-1.5">The Failure Gap</h5>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug line-clamp-2">{gap || t('wizard.planStepsPlaceholder')}</p>
                      </div>
                      <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                          <h5 className="font-bold text-gray-500 dark:text-gray-400 text-sm mb-1.5">The Purification</h5>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug line-clamp-2">{purification || t('wizard.planStepsPlaceholder')}</p>
                      </div>
                  </div>
              );
          }

          if (draft.type === 'ikigai') {
              const purpose = draft.purpose?.trim() || '';
              const love = draft.love?.trim() || '';
              const goodAt = draft.goodAt?.trim() || '';
              const worldNeeds = draft.worldNeeds?.trim() || '';
              const paidFor = draft.paidFor?.trim() || '';
              return (
                  <div className="space-y-4">
                      {purpose && (
                          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
                              <h5 className="font-bold text-rose-700 dark:text-rose-400 text-sm mb-1.5">{t('ikigai.purpose')}</h5>
                              <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{purpose}</p>
                          </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                          {[
                              { key: 'ikigai.love', label: t('ikigai.love'), val: love },
                              { key: 'ikigai.goodAt', label: t('ikigai.goodAt'), val: goodAt },
                              { key: 'ikigai.worldNeeds', label: t('ikigai.worldNeeds'), val: worldNeeds },
                              { key: 'ikigai.paidFor', label: t('ikigai.paidFor'), val: paidFor },
                          ].map(({ label, val }) => (
                              <div key={label} className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                                  <h5 className="font-bold text-gray-500 dark:text-gray-400 text-xs mb-1 truncate">{label}</h5>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug line-clamp-2">{val || t('wizard.planStepsPlaceholder')}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              );
          }

          if (draft.type === 'dsss') {
              const deconstruct = draft.deconstruct ?? [];
              const selection = draft.selection ?? [];
              const sequence = draft.sequence ?? [];
              const stakes = draft.stakes?.trim() || '';
              return (
                  <div className="space-y-4">
                      <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200/60 dark:border-orange-900/40">
                          <h5 className="font-bold text-orange-700 dark:text-orange-400 text-sm mb-2">{t('dsss.deconstruct')}</h5>
                          {deconstruct.length > 0 ? (
                              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
                                  {deconstruct.map((v: string, i: number) => <li key={i}>{v}</li>)}
                              </ul>
                          ) : (
                              <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t('wizard.planStepsPlaceholder')}</p>
                          )}
                      </div>
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                          <h5 className="font-bold text-amber-700 dark:text-amber-400 text-sm mb-2">{t('dsss.selection')}</h5>
                          {selection.length > 0 ? (
                              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
                                  {selection.map((v: string, i: number) => <li key={i}>{v}</li>)}
                              </ul>
                          ) : (
                              <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t('wizard.planStepsPlaceholder')}</p>
                          )}
                      </div>
                      <div className="p-4 bg-yellow-50/80 dark:bg-yellow-950/20 rounded-xl border border-yellow-200/60 dark:border-yellow-900/30">
                          <h5 className="font-bold text-yellow-700 dark:text-yellow-400 text-sm mb-2">{t('dsss.sequence')}</h5>
                          {sequence.length > 0 ? (
                              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
                                  {sequence.map((v: string, i: number) => <li key={i}>{v}</li>)}
                              </ul>
                          ) : (
                              <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t('wizard.planStepsPlaceholder')}</p>
                          )}
                      </div>
                      {stakes && (
                          <div className="p-4 bg-red-50/80 dark:bg-red-950/20 rounded-xl border border-red-200/60 dark:border-red-900/30">
                              <h5 className="font-bold text-red-700 dark:text-red-400 text-sm mb-2">{t('dsss.stakes')}</h5>
                              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{stakes}</p>
                          </div>
                      )}
                  </div>
              );
          }

          if (draft.type === 'gps') {
              const goal = draft.goal?.trim() || '';
              const plan = draft.plan ?? [];
              const system = draft.system ?? [];
              const antiGoals = draft.anti_goals ?? [];
              return (
                  <div className="space-y-4">
                      <div className="p-4 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200/60 dark:border-sky-900/40">
                          <h5 className="font-bold text-sky-700 dark:text-sky-400 text-sm mb-2">{t('gps.goal')}</h5>
                          <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{goal || t('wizard.planStepsPlaceholder')}</p>
                      </div>
                      <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                          <h5 className="font-bold text-sky-600 dark:text-sky-400 text-sm mb-2">{t('gps.plan')}</h5>
                          {plan.length > 0 ? (
                              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
                                  {plan.map((v: string, i: number) => <li key={i}>{v}</li>)}
                              </ul>
                          ) : (
                              <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t('wizard.planStepsPlaceholder')}</p>
                          )}
                      </div>
                      <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                          <h5 className="font-bold text-cyan-600 dark:text-cyan-400 text-sm mb-2">{t('gps.system')}</h5>
                          {system.length > 0 ? (
                              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
                                  {system.map((v: string, i: number) => <li key={i}>{v}</li>)}
                              </ul>
                          ) : (
                              <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t('wizard.planStepsPlaceholder')}</p>
                          )}
                      </div>
                      {antiGoals.length > 0 && (
                          <div className="p-4 bg-amber-50/80 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/30">
                              <h5 className="font-bold text-amber-700 dark:text-amber-400 text-sm mb-2">{t('gps.antiGoals') || 'Anti-Goals'}</h5>
                              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
                                  {antiGoals.map((v: string, i: number) => <li key={i}>{v}</li>)}
                              </ul>
                          </div>
                      )}
                  </div>
              );
          }

          if (draft.type === 'rpm') {
              const hasPlan = draft.plan != null && Array.isArray(draft.plan) && draft.plan.length > 0;
              return (
                  <div className="space-y-4">
                      {draft.result != null && draft.result !== '' && (
                          <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                              <h5 className="font-bold text-gray-500 text-sm mb-2">{t('rpm.outcome')}</h5>
                              <p className="text-sm text-black dark:text-white">{draft.result}</p>
                          </div>
                      )}
                      {draft.purpose != null && draft.purpose !== '' && (
                          <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                              <h5 className="font-bold text-gray-500 text-sm mb-2">{t('rpm.purpose')}</h5>
                              <p className="text-sm text-black dark:text-white">{draft.purpose}</p>
                          </div>
                      )}
                      <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                          <h5 className="font-bold text-gray-500 text-sm mb-2">{t('rpm.map')}</h5>
                          {hasPlan ? (
                              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                                  {draft.plan.map((v: string, i: number) => <li key={i}>{v}</li>)}
                              </ul>
                          ) : (
                              <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t('wizard.planStepsPlaceholder')}</p>
                          )}
                      </div>
                  </div>
              );
          }

          // Fallback (e.g. general, misogi, or unknown shape)
          const eisenhowerLabels: Record<string, string> = { q1: 'eisenhower.do', q2: 'eisenhower.schedule', q3: 'eisenhower.delegate', q4: 'eisenhower.eliminate' };
          return (
              <div className="space-y-4">
                  {Object.entries(draft).map(([key, val]) => {
                      if (key === 'type' || key === 'score') return null;
                      const labelKey = draft.type === 'rpm' && (key === 'result' || key === 'purpose' || key === 'plan')
                          ? (key === 'result' ? 'rpm.outcome' : key === 'purpose' ? 'rpm.purpose' : 'rpm.map')
                          : draft.type === 'eisenhower' ? eisenhowerLabels[key] : null;
                      const label = labelKey ? t(labelKey) : (key as string).replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
                      const isEmpty = val == null || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && !val.trim());
                      if (isEmpty) return null;
                      return (
                          <div key={key} className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                              <h5 className="font-bold text-gray-500 text-sm mb-2">{label}</h5>
                              {Array.isArray(val) ? (
                                  <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
                                      {(val as string[]).map((v, i) => (typeof v === 'string' ? <li key={i}>{v}</li> : null))}
                                  </ul>
                              ) : (
                                  <p className="text-sm text-black dark:text-white">{String(val)}</p>
                              )}
                          </div>
                      );
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
                         <p className="text-xs text-gray-400 mt-1">{t('wizard.buildingPlanUpdates')}</p>
                         <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 leading-snug">{t('wizard.draftPanelPurpose')}</p>
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
            {/* Desktop Drawer — same ScrollArea as Chat UI so scroll + rounded corners match */}
             <motion.div 
               initial={{ opacity: 0, x: 50 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 50 }}
               className="hidden lg:flex lg:flex-col w-96 shrink-0 bg-gray-50 dark:bg-zinc-900/50 border-l border-gray-200 dark:border-zinc-800 backdrop-blur-sm min-h-0 rounded-l-2xl overflow-hidden"
             >
                <ScrollArea className={`flex-1 min-h-0 w-full rounded-l-2xl overflow-hidden ${!draftResult?.isTeaser && draftResult?.type ? '' : 'pointer-events-none opacity-80'}`}>
                    <div className="px-4 pb-6">
                        <div className="pt-4 pb-2">
                            <div className="flex items-center gap-2 text-gray-400 uppercase tracking-widest text-xs font-bold">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                {isTyping || isAgentRunning ? t('wizard.liveDraft') : t('wizard.yourBlueprint')}
                            </div>
                            {!draftResult?.isTeaser && draftResult?.type && onFinalize && !isTyping && !isAgentRunning && (
                                <button
                                    type="button"
                                    onClick={onFinalize}
                                    className="w-full mt-4 py-3 px-4 cursor-pointer bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg"
                                >
                                    <CheckCircle2 size={18} />
                                    {t('wizard.viewFullBlueprint')}
                                </button>
                            )}
                        </div>
                        <ErrorBoundary name="Live Draft">
                            {renderDraftContent(draftResult)}
                        </ErrorBoundary>
                    </div>
                </ScrollArea>
             </motion.div>

             {/* Mobile Drawer Trigger moved to WizardInput topAction to avoid overlap */}

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
                                {isTyping || isAgentRunning ? t('wizard.liveDraft') : t('wizard.yourBlueprint')}
                            </div>
                            <button type="button" onClick={() => setShowMobileDraft(false)} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors" aria-label="Close draft panel">
                                <X size={16} />
                            </button>
                        </div>
                        {!draftResult?.isTeaser && draftResult?.type && onFinalize && !isTyping && !isAgentRunning && (
                            <div className="flex-none px-4 pb-4">
                                <button
                                    type="button"
                                    onClick={onFinalize}
                                    className="w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
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
