import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Loader2, X, Target, AlertTriangle, Clock, Mountain, Trophy } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { suggestFramework } from '@/lib/openrouter';
import { FrameworkId } from '@/lib/blueprints';
import { frameworks } from '@/lib/frameworks';
import { toast } from 'sonner';
import { useLanguage } from './language-provider';

interface HelpMeChooseModalProps {
  onClose: () => void;
  onSelect: (id: FrameworkId, context?: { explanation: string; objective: string }) => void;
}

export function HelpMeChooseModal({ onClose, onSelect }: HelpMeChooseModalProps) {
  const { t, language } = useLanguage();
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
            toast.error("Could not determine the best framework. Please try again or pick manually.");
        }
    } catch {
        toast.error("Analysis failed.");
    } finally {
        setLoading(false);
    }
  };

  const suggestedFramework = frameworks.find(f => f.id === suggestion);

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
            <button type="button" onClick={onClose} aria-label={t('common.close') || 'Close'} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X size={24} />
            </button>
        </div>

        <div className="p-6 overflow-y-auto">
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
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                            <Mountain size={16} className="inline mr-2 text-gray-400" />
                            {t('intake.obstacle.label')}
                        </label>
                        <input 
                            className="w-full h-12 p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 focus:border-black dark:focus:border-white focus:ring-0 transition-all dark:text-white placeholder:text-gray-400"
                            placeholder={t('intake.obstacle.placeholder')}
                            value={obstacle}
                            onChange={(e) => setObstacle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                            <Trophy size={16} className="inline mr-2 text-gray-400" />
                            {t('intake.successLookLike.label')}
                        </label>
                        <textarea 
                            className="w-full h-20 p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 focus:border-black dark:focus:border-white focus:ring-0 resize-none transition-all dark:text-white placeholder:text-gray-400"
                            placeholder={t('intake.successLookLike.placeholder')}
                            value={successLookLike}
                            onChange={(e) => setSuccessLookLike(e.target.value)}
                        />
                    </div>

                    <Button 
                        onClick={handleAnalyze} 
                        disabled={loading || !objective.trim()} 
                        className="w-full h-14 text-lg bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black rounded-xl shadow-lg mt-4 transition-all"
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
                                 <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{suggestedFramework?.title}</h3>
                                 <p className="text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{suggestedFramework?.description}</p>
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
                            "{explanation}"
                        </p>
                    </div>
                
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                         <Button variant="ghost" onClick={() => setSuggestion(null)} className="h-14 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-900">
                            {t('intake.tryAgain')}
                         </Button>
                         <Button onClick={() => onSelect(suggestion!, { explanation, objective })} className="h-14 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-gray-200 shadow-xl">
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