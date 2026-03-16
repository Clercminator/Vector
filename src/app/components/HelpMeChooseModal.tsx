import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Loader2, X, X as XIcon, Target, AlertTriangle, Clock, Mountain, Trophy, Check, Quote, ExternalLink, TriangleAlert } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { suggestFramework } from '@/lib/openrouter';
import { FrameworkId } from '@/lib/blueprints';
import { frameworks, type FrameworkDefinition } from '@/lib/frameworks';
import { supabase } from '@/lib/supabase';
import { computePersonalInfoCompletion } from '@/lib/profileCompletion';
import { toast } from 'sonner';
import { useLanguage } from './language-provider';

export interface IntakeFormContext {
  explanation: string;
  objective: string;
  stakes?: string;
  horizon?: string;
  obstacle?: string;
  successLookLike?: string;
}

interface HelpMeChooseModalProps {
  userId?: string | null;
  onClose: () => void;
  onSelect: (id: FrameworkId, context?: IntakeFormContext) => void;
  /** Opens the full framework detail view (definition, pros, cons, example) */
  onLearnMore?: (framework: FrameworkDefinition) => void;
}

export function HelpMeChooseModal({ userId, onClose, onSelect, onLearnMore }: HelpMeChooseModalProps) {
  const { t, language } = useLanguage();
  const [profileCompletion, setProfileCompletion] = useState<{ percent: number; isLow: boolean }>({ percent: 0, isLow: false });
  const [objective, setObjective] = useState('');
  const [stakes, setStakes] = useState('');
  const [horizon, setHorizon] = useState('');
  const [obstacle, setObstacle] = useState('');
  const [successLookLike, setSuccessLookLike] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<FrameworkId | null>(null);
  const [explanation, setExplanation] = useState<string>('');

  const handleAnalyze = async () => {
    if (!objective.trim()) return;
    setLoading(true);
    setSuggestion(null);
    setExplanation('');
    
    try {
        const extra = (obstacle.trim() || successLookLike.trim())
          ? { obstacle: obstacle.trim() || undefined, successLookLike: successLookLike.trim() || undefined }
          : undefined;
        const result = await suggestFramework(
          objective,
          stakes,
          horizon,
          undefined,
          language === 'es' ? 'Spanish' : 'English',
          extra
        );
        if (result) {
            setSuggestion(result.id);
            setExplanation(result.explanation);
        } else {
            toast.error(t('feedback.analysisFailed') || "Could not determine the best framework. Please try again or pick manually.", { duration: 15000 });
        }
    } catch {
        toast.error(t('feedback.analysisError') || "Analysis failed.", { duration: 15000 });
    } finally {
        setLoading(false);
    }
  };

  const suggestedFramework = frameworks.find(f => f.id === suggestion);

  useEffect(() => {
    if (!supabase || !userId) {
      setProfileCompletion({ percent: 0, isLow: false });
      return;
    }
    supabase
      .from('profiles')
      .select('bio, metadata')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        const { percent, isLow } = computePersonalInfoCompletion(data as any);
        setProfileCompletion({ percent, isLow });
      })
      .catch(() => setProfileCompletion({ percent: 0, isLow: false }));
  }, [userId]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-start bg-white dark:bg-zinc-950 sticky top-0 z-10">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
                        <Sparkles className="text-white dark:text-black" size={20} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('intake.title')}</h2>
                </div>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">{t('intake.subtitle')}</p>
            </div>
            <button type="button" onClick={onClose} aria-label={t('common.close') || 'Close'} className="cursor-pointer p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X size={24} />
            </button>
        </div>

        <div className="p-6 overflow-y-auto">
            {profileCompletion.isLow && !suggestion && (
              <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
                <TriangleAlert size={20} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 dark:text-amber-200">
                  {t('profile.personalInfoReminder')}
                </p>
              </div>
            )}
            {!suggestion ? (
                <div className="space-y-6">
                    <div className="space-y-4">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                            <Target size={16} className="inline mr-2 text-gray-400" />
                            {t('intake.objective.label')}
                        </label>
                        <textarea 
                            className="w-full h-24 p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 focus:border-black dark:focus:border-white focus:ring-0 resize-none transition-all dark:text-white placeholder:text-gray-400"
                            placeholder={t('intake.objective.placeholder')}
                            value={objective}
                            onChange={(e) => setObjective(e.target.value)}
                            autoFocus
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{t('intake.objective.hint')}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                                <AlertTriangle size={16} className="inline mr-2 text-gray-400" />
                                {t('intake.stakes.label')}
                            </label>
                            <input 
                                className="w-full h-12 p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 focus:border-black dark:focus:border-white focus:ring-0 transition-all dark:text-white placeholder:text-gray-400"
                                placeholder={t('intake.stakes.placeholder')}
                                value={stakes}
                                onChange={(e) => setStakes(e.target.value)}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                                <Clock size={16} className="inline mr-2 text-gray-400" />
                                {t('intake.horizon.label')}
                            </label>
                            <input 
                                className="w-full h-12 p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 focus:border-black dark:focus:border-white focus:ring-0 transition-all dark:text-white placeholder:text-gray-400"
                                placeholder={t('intake.horizon.placeholder')}
                                value={horizon}
                                onChange={(e) => setHorizon(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                            <Mountain size={16} className="text-gray-400 shrink-0" />
                            {t('intake.obstacle.label')}
                            <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({t('intake.optional')})</span>
                        </label>
                        <input 
                            className="w-full h-12 p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 focus:border-black dark:focus:border-white focus:ring-0 transition-all dark:text-white placeholder:text-gray-400"
                            placeholder={t('intake.obstacle.placeholder')}
                            value={obstacle}
                            onChange={(e) => setObstacle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                            <Trophy size={16} className="text-gray-400 shrink-0" />
                            {t('intake.successLookLike.label')}
                            <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({t('intake.optional')})</span>
                        </label>
                        <textarea 
                            className="w-full h-20 p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 focus:border-black dark:focus:border-white focus:ring-0 resize-none transition-all dark:text-white placeholder:text-gray-400"
                            placeholder={t('intake.successLookLike.placeholder')}
                            value={successLookLike}
                            onChange={(e) => setSuccessLookLike(e.target.value)}
                        />
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-6 mb-2 text-center">{t('intake.reassurance')}</p>
                    <Button 
                        onClick={handleAnalyze} 
                        disabled={loading || !objective.trim()} 
                        className="w-full h-14 text-lg bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black rounded-xl shadow-lg transition-all"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin mr-2" /> 
                                {t('intake.analyzing')}
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2" size={18} />
                                {t('intake.analyze')}
                            </>
                        )}
                    </Button>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                         <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-4 border-b border-gray-100 dark:border-zinc-800 pb-2">
                            {t('intake.result.title')}
                         </span>
                         
                         <div className="flex items-start gap-6">
                             <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-lg" style={{ backgroundColor: suggestedFramework?.color }}>
                                {suggestedFramework?.icon && <suggestedFramework.icon size={32} />}
                             </div>
                             <div>
                                 <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{suggestedFramework ? (t(`fw.${suggestedFramework.id}.title`) || suggestedFramework.title) : ''}</h3>
                                 <p className="text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{suggestedFramework ? (t(`fw.${suggestedFramework.id}.desc`) || suggestedFramework.description) : ''}</p>
                             </div>
                         </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Sparkles size={100} />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <Sparkles size={16} className="text-yellow-500" />
                            {t('intake.fitting')}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic relative z-10">
                            &quot;{explanation}&quot;
                        </p>
                    </div>

                    {suggestedFramework && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-green-50/60 dark:bg-green-900/15 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
                            <h4 className="text-xs font-bold text-green-800 dark:text-green-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                              <Check size={14} /> {t('common.pros')}
                            </h4>
                            <ul className="space-y-1.5">
                              {(suggestedFramework.pros || []).map((pro, i) => (
                                <li key={i} className="text-green-900 dark:text-green-200 text-sm flex items-start gap-2">
                                  <span className="mt-1.5 w-1 h-1 bg-green-500 rounded-full shrink-0" />
                                  {t(`fw.${suggestedFramework.id}.pros.${i}`) || pro}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-red-50/60 dark:bg-red-900/15 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                            <h4 className="text-xs font-bold text-red-800 dark:text-red-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                              <XIcon size={14} /> {t('common.cons')}
                            </h4>
                            <ul className="space-y-1.5">
                              {(suggestedFramework.cons || []).map((con, i) => (
                                <li key={i} className="text-red-900 dark:text-red-200 text-sm flex items-start gap-2">
                                  <span className="mt-1.5 w-1 h-1 bg-red-500 rounded-full shrink-0" />
                                  {t(`fw.${suggestedFramework.id}.cons.${i}`) || con}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="bg-gray-100/80 dark:bg-zinc-800/60 p-4 rounded-xl border border-gray-200/80 dark:border-zinc-700">
                          <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <Quote size={14} /> {t('intake.exampleLabel')}
                          </h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm italic leading-relaxed">
                            &quot;{t(`fw.${suggestedFramework.id}.example`) || suggestedFramework.example}&quot;
                          </p>
                        </div>

                        {onLearnMore && (
                          <button
                            type="button"
                            onClick={() => onLearnMore(suggestedFramework)}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
                          >
                            <ExternalLink size={16} />
                            {t('intake.learnMore')}
                          </button>
                        )}
                      </>
                    )}
                
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                         <Button variant="ghost" onClick={() => setSuggestion(null)} className="h-14 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-900">
                            {t('intake.tryAgain')}
                         </Button>
                         <Button onClick={() => onSelect(suggestion!, { explanation, objective, stakes, horizon, obstacle, successLookLike })} className="h-14 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-gray-200 shadow-xl">
                            {t('intake.useFramework')} <ArrowRight size={20} className="ml-2" />
                         </Button>
                    </div>
                </div>
            )}
        </div>
      </motion.div>
    </div>
  );
}