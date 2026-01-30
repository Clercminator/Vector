import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, ArrowLeft, RefreshCcw, CheckCircle2, Calendar, Target, Zap, Layers, Share2, Rocket, Clock, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { Blueprint, BlueprintResult, blueprintTitleFromAnswers } from '@/lib/blueprints';
import { blueprintToEvents, downloadIcs, exportEventsToGoogleCalendar, getGoogleAccessToken } from '@/lib/calendarExport';
import { generateBlueprintResult as generateBlueprintResultAI } from '@/lib/openrouter';
import { useLanguage } from '@/app/components/language-provider';
import { supabase } from '@/lib/supabase';
import { useTheme } from 'next-themes';

interface Message {
  role: 'ai' | 'user';
  content: string;
}

interface GoalWizardProps {
  framework: 'first-principles' | 'pareto' | 'rpm' | 'eisenhower' | 'okr';
  onBack: () => void;
  onSaveBlueprint?: (bp: Blueprint) => Promise<void> | void;
  initialBlueprint?: Blueprint;
}

export const GoalWizard: React.FC<GoalWizardProps> = ({ framework, onBack, onSaveBlueprint, initialBlueprint }) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [step, setStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [result, setResult] = useState<BlueprintResult | null>(null);
  const [finalAnswers, setFinalAnswers] = useState<string[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    // Fetch credits
    if (supabase) {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                supabase.from('profiles').select('credits').eq('user_id', user.id).single()
                .then(({ data }) => {
                    if (data) setCredits(data.credits);
                });
            } else {
                // Anonymous / Demo user: give 3 "virtual" credits for session
                setCredits(3); 
            }
        });
    }
  }, []);

  const frameworkConfig = {
    'first-principles': {
      title: t('fp.title'),
      questions: [
        t('fp.q1'),
        t('fp.q2'),
        t('fp.q3')
      ],
      generateResult: (answers: string[]) => ({
        type: 'first-principles',
        truths: answers[1].split('.').filter(s => s.trim()),
        newApproach: answers[2]
      })
    },
    'pareto': {
      title: t('pareto.title'),
      questions: [
        t('pareto.q1'),
        t('pareto.q2'),
        t('pareto.q3')
      ],
      generateResult: (answers: string[]) => {
        const activities = answers[1].split(/,|\n/).map(s => s.trim()).filter(s => s);
        const vital = answers[2].split(/,|\n/).map(s => s.trim()).filter(s => s);
        return {
          type: 'pareto',
          vital: vital,
          trivial: activities.filter(a => !vital.includes(a))
        };
      }
    },
    'rpm': {
      title: t('rpm.title'),
      questions: [
        t('rpm.q1'),
        t('rpm.q2'),
        t('rpm.q3')
      ],
      generateResult: (answers: string[]) => ({
        type: 'rpm',
        result: answers[0],
        purpose: answers[1],
        plan: answers[2].split(/,|\n/).map(s => s.trim()).filter(s => s)
      })
    },
    'eisenhower': {
      title: t('eisenhower.title'),
      questions: [
        t('eisenhower.q1'),
        t('eisenhower.q2'),
        t('eisenhower.q3')
      ],
      generateResult: (answers: string[]) => {
        const all = answers[0].split(/,|\n/).map(s => s.trim()).filter(s => s);
        const quadrant1 = answers[1].split(/,|\n/).map(s => s.trim()).filter(s => s);
        const quadrant2 = answers[2].split(/,|\n/).map(s => s.trim()).filter(s => s);
        return {
          type: 'eisenhower',
          q1: quadrant1, // Do
          q2: quadrant2, // Schedule
          q3: all.filter(t => !quadrant1.includes(t) && !quadrant2.includes(t)).slice(0, Math.floor(all.length/2)), // Delegate (mock)
          q4: all.filter(t => !quadrant1.includes(t) && !quadrant2.includes(t)).slice(Math.floor(all.length/2)) // Eliminate (mock)
        };
      }
    },
    'okr': {
      title: t('okr.title'),
      questions: [
        t('okr.q1'),
        t('okr.q2'),
        t('okr.q3')
      ],
      generateResult: (answers: string[]) => ({
        type: 'okr',
        objective: answers[0],
        keyResults: answers[1].split(/,|\n/).map(s => s.trim()).filter(s => s),
        initiative: answers[2]
      })
    }
  };

  const currentConfig = frameworkConfig[framework];

  useEffect(() => {
    if (initialBlueprint) {
      setMessages([
        { role: 'ai', content: t('wizard.reopening').replace('{0}', currentConfig.title) },
        { role: 'user', content: initialBlueprint.title },
        { role: 'ai', content: t('wizard.loaded') },
      ]);
      setResult(initialBlueprint.result);
      setFinalAnswers(initialBlueprint.answers ?? []);
      setStep(currentConfig.questions.length);
      setIsTyping(false);
      return;
    }

    setResult(null);
    setFinalAnswers([]);
    setStep(0);
    setIsTyping(true);
    const tTimer = setTimeout(() => {
      setMessages([{ role: 'ai', content: t('wizard.welcome').replace('{0}', currentConfig.title) + ' ' + currentConfig.questions[0] }]);
      setIsTyping(false);
    }, 1000);
    return () => clearTimeout(tTimer);
  }, [framework, initialBlueprint, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: inputValue }];
    setMessages(newMessages);
    setInputValue('');
    
    const nextStep = step + 1;
    setStep(nextStep);

    if (nextStep < currentConfig.questions.length) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', content: currentConfig.questions[nextStep] }]);
        setIsTyping(false);
      }, 1500);
    } else {
      const answers = newMessages.filter(m => m.role === 'user').map(m => m.content);
      
      // Credit Check
      if (credits !== null && credits <= 0) {
          toast.error("You have 0 credits. Upgrade to continue!");
          // Fallback to non-AI or stop? 
          // For now, let's stop but maybe in future we allow rule-based fallback
          // Force fallback to rule based:
          const res = currentConfig.generateResult(answers) as BlueprintResult;
          setResult(res);
          setFinalAnswers(answers);
          setMessages(prev => [...prev, { role: 'ai', content: t('wizard.ai.complete') + " (Rule-based due to low credits)" }]);
          return; 
      }

      setIsTyping(true);
      setIsSynthesizing(true);
      (async () => {
        let res: BlueprintResult | null = null;
        try {
          res = await generateBlueprintResultAI(framework, answers);
          
          // Deduct credit if AI was successful
          if (res && supabase && credits !== null) {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                  await supabase.rpc('decrement_credits', { user_id: user.id });
                  setCredits(c => (c ? c - 1 : 0));
              } else {
                  setCredits(c => (c ? c - 1 : 0)); // virtual
              }
          }

        } catch {
          // Fall through to rule-based
        }
        if (res == null) res = currentConfig.generateResult(answers) as BlueprintResult;
        setResult(res);
        setFinalAnswers(answers);
        setMessages(prev => [...prev, { role: 'ai', content: t('wizard.ai.complete') }]);
        setIsTyping(false);
        setIsSynthesizing(false);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      })();
    }
  };

  const handleExport = () => {
    const answers = finalAnswers.length ? finalAnswers : messages.filter(m => m.role === 'user').map(m => m.content);
    const bp: Blueprint = {
      id: initialBlueprint?.id ?? crypto.randomUUID(),
      framework,
      title: initialBlueprint?.title ?? blueprintTitleFromAnswers(answers),
      answers,
      result,
      createdAt: initialBlueprint?.createdAt ?? new Date().toISOString(),
    };

    const events = blueprintToEvents(bp);

    toast.promise(
      (async () => {
        try {
          const token = await getGoogleAccessToken();
          await exportEventsToGoogleCalendar(token, events);
          return { mode: "google" as const };
        } catch (e) {
          // Fallback: download a standard .ics file that can be imported into Google Calendar.
          downloadIcs(`vector-${bp.title}`, events);
          return { mode: "ics" as const, error: e };
        }
      })(),
      {
        loading: t('common.loading'),
        success: (res) =>
          res.mode === "google"
            ? "Exported to Google Calendar!"
            : "Downloaded a .ics file.",
        error: 'Failed to export calendar events.',
      }
    );

    confetti({ particleCount: 60, spread: 45, origin: { y: 0.8 } });
  };

  const handleSave = async () => {
    const answers = finalAnswers.length ? finalAnswers : messages.filter(m => m.role === 'user').map(m => m.content);
    const bp: Blueprint = {
      id: initialBlueprint?.id ?? crypto.randomUUID(),
      framework,
      title: initialBlueprint?.title ?? blueprintTitleFromAnswers(answers),
      answers,
      result,
      createdAt: initialBlueprint?.createdAt ?? new Date().toISOString(),
    };

    try {
      await onSaveBlueprint?.(bp);
      toast.success(t('common.save') + " successful");
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.75 } });
      onBack();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save blueprint.");
    }
  };

  const renderResult = () => {
    if (!result) return null;

    if (result.type === 'pareto') {
      return (
        <div className="mt-8 grid md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-zinc-900 border-2 border-blue-500 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
              <Zap size={20} />
              <h4 className="font-bold text-lg uppercase tracking-wider">{t('pareto.vital')}</h4>
            </div>
            <ul className="space-y-3">
              {result.vital.map((item: string, i: number) => (
                <li key={i} className="flex gap-3 items-start">
                  <CheckCircle2 size={18} className="text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4 text-gray-400">
              <Layers size={20} />
              <h4 className="font-bold text-lg uppercase tracking-wider">{t('pareto.trivial')}</h4>
            </div>
            <ul className="space-y-3">
              {result.trivial.map((item: string, i: number) => (
                <li key={i} className="flex gap-3 items-start text-gray-500 dark:text-gray-400">
                  <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-zinc-600 mt-1 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      );
    }

    if (result.type === 'eisenhower') {
      return (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-6 rounded-3xl">
            <h4 className="text-red-600 dark:text-red-400 font-bold mb-4 flex items-center gap-2 uppercase tracking-tighter"><Zap size={16} /> {t('eisenhower.do')}</h4>
            <div className="space-y-2">
              {result.q1.map((t: string, i: number) => <div key={i} className="p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm text-sm font-medium dark:text-gray-200">{t}</div>)}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-6 rounded-3xl">
            <h4 className="text-blue-600 dark:text-blue-400 font-bold mb-4 flex items-center gap-2 uppercase tracking-tighter"><Clock size={16} /> {t('eisenhower.schedule')}</h4>
            <div className="space-y-2">
              {result.q2.map((t: string, i: number) => <div key={i} className="p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm text-sm font-medium dark:text-gray-200">{t}</div>)}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 p-6 rounded-3xl">
            <h4 className="text-green-600 dark:text-green-400 font-bold mb-4 flex items-center gap-2 uppercase tracking-tighter"><Share2 size={16} /> {t('eisenhower.delegate')}</h4>
            <div className="space-y-2">
              {result.q3.map((t: string, i: number) => <div key={i} className="p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm text-sm font-medium opacity-60 dark:text-gray-400">{t}</div>)}
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-6 rounded-3xl">
            <h4 className="text-gray-500 dark:text-gray-400 font-bold mb-4 flex items-center gap-2 uppercase tracking-tighter">{t('eisenhower.eliminate')}</h4>
            <div className="space-y-2">
              {result.q4.map((t: string, i: number) => <div key={i} className="p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm text-sm font-medium opacity-30 line-through dark:text-gray-500">{t}</div>)}
            </div>
          </div>
        </div>
      );
    }

    if (result.type === 'okr') {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 w-full max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-purple-100 dark:border-purple-900/20 overflow-hidden"
        >
          <div className="bg-purple-600 p-8 text-white">
            <span className="text-xs font-bold uppercase tracking-[0.3em] opacity-80">{t('okr.northStar')}</span>
            <h3 className="text-3xl font-bold mt-2">{result.objective}</h3>
          </div>
          <div className="p-8">
            <div className="grid md:grid-cols-3 gap-6">
              {result.keyResults.map((kr: string, i: number) => (
                <div key={i} className="p-6 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/20">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{t('okr.keyResult')} 0{i+1}</span>
                  <p className="mt-3 font-bold text-gray-800 dark:text-gray-200 leading-snug">{kr}</p>
                  <div className="mt-4 w-full h-1.5 bg-purple-200 dark:bg-purple-900/40 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: '0%' }} 
                      className="h-full bg-purple-600" 
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-zinc-800 flex items-center gap-4">
              <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black">
                <Rocket size={20} />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('okr.initiative')}</span>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{result.initiative}</p>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    if (result.type === 'first-principles') {
       return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 w-full max-w-4xl mx-auto space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{t('fp.truths')}</h4>
            <div className="grid gap-4">
              {result.truths.map((truth: string, i: number) => (
                <div key={i} className="flex items-center gap-4 bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                  <span className="text-blue-500 font-bold">0{i+1}</span>
                  <p className="text-gray-700 dark:text-gray-300">{truth}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-black dark:bg-white text-white dark:text-black rounded-2xl p-8">
            <h4 className="text-sm font-bold text-blue-400 dark:text-blue-600 uppercase tracking-widest mb-4">{t('fp.newApproach')}</h4>
            <p className="text-xl leading-relaxed font-light">{result.newApproach}</p>
          </div>
        </motion.div>
      );
    }

    if (result.type === 'rpm') {
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 w-full max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-zinc-800">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-2 opacity-80">{t('rpm.outcome')}</h4>
            <h3 className="text-3xl font-bold">{result.result}</h3>
          </div>
          <div className="p-8 grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400 font-bold uppercase text-xs tracking-widest"><Target size={16} /><span>{t('rpm.purpose')}</span></div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic border-l-4 border-indigo-200 dark:border-indigo-900 pl-4">"{result.purpose}"</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4 text-green-600 dark:text-green-400 font-bold uppercase text-xs tracking-widest"><Calendar size={16} /><span>{t('rpm.map')}</span></div>
              <ul className="space-y-3">
                {result.plan.map((task: string, i: number) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="w-5 h-5 rounded-md bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center font-bold text-[10px]">{i+1}</span>
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      );
    }

    return null;
  };

  return (
    <div className="relative min-h-screen pt-24 pb-12 px-4 z-10 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-grow">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">{t('wizard.exit')}</span>
        </button>

        <div className="space-y-6 mb-8">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                 <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'ai' ? 'bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-gray-800 dark:text-gray-200 shadow-sm' : 'bg-black dark:bg-white text-white dark:text-black'}`}>
                  <p className="text-sm md:text-base leading-relaxed">{msg.content}</p>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl flex items-center gap-3">
                  <div className="flex gap-1">
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-gray-300 dark:bg-zinc-600 rounded-full" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-300 dark:bg-zinc-600 rounded-full" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-300 dark:bg-zinc-600 rounded-full" />
                  </div>
                  {isSynthesizing && <span className="text-sm text-gray-500 dark:text-gray-400">{t('wizard.synthesizing')}</span>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {renderResult()}
      </div>

      {!result && !initialBlueprint && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-zinc-950 dark:via-zinc-950 pt-12">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
            <input autoFocus value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={t('wizard.typePlaceholder')} className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full py-4 pl-6 pr-16 shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg dark:text-white dark:placeholder-zinc-500" />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!inputValue.trim() || isTyping}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}

      {result && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
          <button onClick={() => { setMessages([]); setStep(0); setResult(null); setFinalAnswers([]); }} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-800 rounded-full shadow-lg hover:shadow-xl transition-all font-medium"><RefreshCcw size={18} />{t('wizard.restart')}</button>
          <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all font-medium"><Calendar size={18} />{t('wizard.export')}</button>
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:shadow-xl transition-all font-medium"><CheckCircle2 size={18} />{t('wizard.save')}</button>
        </div>
      )}
    </div>
  );
};
