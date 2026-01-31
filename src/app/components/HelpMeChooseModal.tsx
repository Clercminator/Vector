import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Loader2, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { suggestFramework } from '@/lib/openrouter';
import { FrameworkId } from '@/lib/blueprints';
import { frameworks } from '@/lib/frameworks';
import { toast } from 'sonner';

interface HelpMeChooseModalProps {
  onClose: () => void;
  onSelect: (id: FrameworkId) => void;
}

export function HelpMeChooseModal({ onClose, onSelect }: HelpMeChooseModalProps) {
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<FrameworkId | null>(null);

  const handleAnalyze = async () => {
    if (!problem.trim()) return;
    setLoading(true);
    setSuggestion(null);
    try {
        const result = await suggestFramework(problem);
        if (result) {
            setSuggestion(result);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden flex flex-col"
      >
        <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                <X size={18} />
            </button>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                <Sparkles className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold">Help me choose</h2>
            <p className="opacity-90 mt-2 text-sm leading-relaxed">Describe your current challenge, and our AI will recommend the perfect architectural framework.</p>
        </div>

        <div className="p-6 space-y-6">
            {!suggestion ? (
                <div className="space-y-4">
                    <textarea 
                        className="w-full h-32 p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border-2 border-transparent focus:border-indigo-500 focus:outline-none resize-none transition-all dark:text-white placeholder:text-gray-400"
                        placeholder="e.g. I have too many tasks and don't know where to start..."
                        value={problem}
                        onChange={(e) => setProblem(e.target.value)}
                        autoFocus
                    />
                    <Button 
                        onClick={handleAnalyze} 
                        disabled={loading || !problem.trim()} 
                        className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" size={18} />}
                        Find My Framework
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-6 rounded-2xl">
                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block mb-2">Recommended</span>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{suggestedFramework?.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{suggestedFramework?.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                         <Button variant="outline" onClick={() => setSuggestion(null)} className="h-12 rounded-xl border-gray-200 dark:border-zinc-700 dark:text-white">
                            Try Again
                         </Button>
                         <Button onClick={() => onSelect(suggestion!)} className="h-12 rounded-xl bg-black dark:bg-white text-white dark:text-black">
                            Start Building <ArrowRight size={18} className="ml-2" />
                         </Button>
                    </div>
                </div>
            )}
        </div>
      </motion.div>
    </div>
  );
}
