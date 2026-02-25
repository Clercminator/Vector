import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Lock, ArrowLeft, Target, MessageSquare, PenLine, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/app/components/language-provider';
import { getStepIdsAndLabels } from '@/lib/trackerSteps';
import { getScorePercentage, generateCalendarHighlights, getCurrentStreakDetails } from '@/lib/trackerStats';
import { TrackerScore } from './TrackerScore';
import { TrackerCalendar } from './TrackerCalendar';
import { TrackerStreakCounter } from './TrackerStreakCounter';
import { TrackerHeatmap } from './TrackerHeatmap';

const FRAMEWORK_THEMES: Record<string, string> = {
  'pareto': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'okr': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'eisenhower': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  'rpm': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  'misogi': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'ikigai': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
  'dsss': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  'first-principles': 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300',
  'gps': 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300',
  'mandalas': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'general': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  'default': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export function SharedPlanView() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [sharedData, setSharedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadShared() {
      if (!token) {
        setError(t('shared.expired') || "Link expired or invalid");
        setLoading(false);
        return;
      }

      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-shared-blueprint?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        });
        
        if (!res.ok) {
           setError(res.status === 404 ? (t('shared.expired') || "Link expired or invalid.") : (t('shared.loadError') || "Couldn't load shared plan. Please try again later."));
           setLoading(false);
           return;
        }

        const data = await res.json();
        if (!data || !data.blueprint) throw new Error("Plan not found");
        
        setSharedData(data);
      } catch (e: any) {
        console.error("Share error:", e);
        setError(t('shared.loadError') || "Couldn't load shared plan. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadShared();
  }, [token, t]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white" />
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-4">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-500 p-6 rounded-full">
          <Lock size={48} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t('shared.expired') || "Link expired or invalid"}</h2>
        <p className="text-gray-500 max-w-md text-center">{error}</p>
        <Button onClick={() => navigate('/')} className="mt-4 gap-2 rounded-xl">
          <ArrowLeft size={16} /> {t('shared.backHome') || "Back to home"}
        </Button>
      </div>
    );
  }

  const { blueprint, tracker, logs = [] } = sharedData;
  const filteredLogs = logs.slice(0, 20); // Limit to last 20
  
  const steps = getStepIdsAndLabels(blueprint.result, blueprint.framework);
  const isInfinite = tracker?.plan_kind === 'infinite';
  const themeClass = FRAMEWORK_THEMES[blueprint.framework] || FRAMEWORK_THEMES['default'];
  const colorAccent = tracker?.color || undefined;
  
  const highlights = generateCalendarHighlights(logs);
  const { streakStartedAt } = getCurrentStreakDetails(logs);
  const score = getScorePercentage(logs, tracker, steps.length, 7);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-4 py-8 pb-32">
       {/* Header */}
      <div className="mb-8 border-b border-gray-200 dark:border-zinc-800 pb-6 relative">
        <button onClick={() => navigate('/')} className="flex items-center text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors mb-6">
          <ArrowLeft size={16} className="mr-1" /> {t('shared.backHome') || "Back to home"}
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white"
                      style={colorAccent ? { backgroundColor: colorAccent } : undefined}
                    >
                        <span className={!colorAccent ? themeClass : ''}>{blueprint.framework}</span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                        {t('shared.readOnly') || "Shared plan (read-only)"}
                    </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-black dark:text-white leading-tight mt-2 flex items-center gap-3">
                    {blueprint.title}
                </h1>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Finite Steps Checkboxes (Read-Only) */}
          {!isInfinite && steps.length > 0 && (
            <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                      <Target size={20} className="text-blue-500" /> {t('tracker.steps') || "Steps"}
                  </h2>
                  <div className="text-sm font-bold text-gray-400">
                    {tracker.completed_step_ids?.length || 0} / {steps.length}
                  </div>
                </div>
                
                <div className="space-y-3">
                    {steps.map((step: any) => {
                        const isComplete = tracker.completed_step_ids?.includes(step.stepId);
                        return (
                            <div 
                                key={step.stepId} 
                                className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${isComplete ? 'bg-gray-50 dark:bg-zinc-800/30 border-gray-200 dark:border-zinc-800' : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 shadow-sm opacity-80'}`}
                            >
                                <div className="pt-0.5 pointer-events-none">
                                    {isComplete ? (
                                        <CheckCircle2 size={24} color={colorAccent || '#3b82f6'} fill={colorAccent ? `${colorAccent}20` : '#3b82f620'} />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full border-2 border-gray-200 dark:border-zinc-700" />
                                    )}
                                </div>
                                <div className={`text-base md:text-lg font-bold ${isComplete ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
                                    {step.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
          )}

          {!isInfinite && steps.length === 0 && (
             <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 text-center text-gray-500">
                 <p className="font-medium mb-2">{t('tracker.noStepsToTrack') || "No trackable steps found for this plan."}</p>
             </div>
          )}
          
          {/* Timeline */}
          <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <MessageSquare size={20} className="text-gray-400" /> {t('tracker.timeline')}
              </h2>
              {filteredLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 font-medium">{t('tracker.noActivity') || "No activity yet"}</p>
              ) : (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gray-200 dark:before:bg-zinc-800">
                      {filteredLogs.map((log: any) => {
                          const isJournal = log.kind === 'journal';
                          const isCheckIn = log.kind === 'check_in';
                          const isStepDone = log.kind === 'step_done';
                          const isSetback = log.kind === 'setback';
                          
                          let stepLabel = '';
                          if (isStepDone) {
                              const s = steps.find(x => x.stepId === log.payload?.step_id);
                              stepLabel = s ? s.label : log.payload?.step_id;
                          }

                          return (
                              <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-black shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 ${isSetback ? 'bg-red-50 dark:bg-red-900 border-red-100 dark:border-red-900/20 text-red-500' : 'bg-white dark:bg-zinc-900 text-gray-500'}`}>
                                      {isJournal && <PenLine size={16} />}
                                      {isCheckIn && <CheckCircle2 size={16} className="text-green-500" />}
                                      {isStepDone && <Target size={16} className="text-blue-500" />}
                                      {isSetback && <ShieldAlert size={16} />}
                                  </div>
                                  <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border ${isSetback ? 'border-red-200 dark:border-red-900/40 shadow-red-500/10' : 'border-gray-200 dark:border-zinc-800'} shadow-sm ml-4 md:ml-0 md:group-odd:text-right hover:shadow-md transition-all`}>
                                      <div className="flex items-center justify-between md:group-odd:flex-row-reverse mb-2">
                                          <span className={`text-xs font-bold uppercase tracking-wider ${isSetback ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                              {isJournal && (t('tracker.journal') || 'Journal')}
                                              {isCheckIn && 'Check-in'}
                                              {isStepDone && 'Completed Step'}
                                              {isSetback && 'Setback Logged'}
                                          </span>
                                          <span className="text-xs font-bold text-gray-400">{new Date(log.created_at).toLocaleDateString()}</span>
                                      </div>
                                      {log.content && <p className="text-gray-700 dark:text-gray-300 mt-2 font-medium whitespace-pre-wrap">{log.content}</p>}
                                      {isStepDone && stepLabel && <p className="text-blue-600 dark:text-blue-400 text-sm mt-2 font-bold">{stepLabel}</p>}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
           {isInfinite && (
             <TrackerStreakCounter startDate={streakStartedAt} className="w-full" />
           )}
           <div className="grid grid-cols-2 gap-4">
             <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-center items-center h-48">
               <TrackerScore score={score} label="Last 7 Days" color={colorAccent} savingsAmount={null} savingsUnit="$" />
             </div>
             <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between h-48">
               <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Activity</span>
               <div className="flex-1 flex items-end">
                 <TrackerHeatmap logs={logs} daysBack={28} color={colorAccent} className="w-full" />
               </div>
             </div>
           </div>

           <TrackerCalendar 
              highlightedDates={highlights} 
              color={colorAccent} 
              onDayClick={() => {}} 
           />

           <Card className="p-5 mt-8 bg-gray-50 dark:bg-zinc-900/30 border-none shadow-none rounded-2xl">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t('tracker.planSummary')}</h3>
             <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {blueprint.result && typeof blueprint.result === 'object' && (
                      <div className="space-y-3">
                          {'purpose' in blueprint.result && (
                              <p><strong className="text-gray-900 dark:text-gray-200 block mb-1">Purpose:</strong> {String((blueprint.result as any).purpose)}</p>
                          )}
                          {'objective' in blueprint.result && (
                              <p><strong className="text-gray-900 dark:text-gray-200 block mb-1">Objective:</strong> {String((blueprint.result as any).objective)}</p>
                          )}
                          {'centralGoal' in blueprint.result && (
                              <p><strong className="text-gray-900 dark:text-gray-200 block mb-1">Goal:</strong> {String((blueprint.result as any).centralGoal)}</p>
                          )}
                          {'newApproach' in blueprint.result && (
                              <p><strong className="text-gray-900 dark:text-gray-200 block mb-1">New Approach:</strong> {String((blueprint.result as any).newApproach)}</p>
                          )}
                      </div>
                  )}
             </div>
           </Card>
        </div>
      </div>
    </motion.div>
  );
}
