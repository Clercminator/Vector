import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, RefreshCcw, CheckCircle2, Calendar, Target, Zap, Layers, Share2, Rocket, Clock, Star, Download, Lock, Mic, X, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { Blueprint, BlueprintResult, blueprintTitleFromAnswers, fetchBlueprintMessages, saveBlueprintMessage, saveBlueprintMessages } from '@/lib/blueprints';
import { blueprintToEvents, downloadIcs, exportEventsToGoogleCalendar, getGoogleAccessToken } from '@/lib/calendarExport';
import { generateBlueprintResult as generateBlueprintResultAI, refineBlueprint } from '@/lib/openrouter';
import { exportToPdf } from '@/lib/pdfExport';
import ReactMarkdown from 'react-markdown';
import { TIER_CONFIGS, TierId, DEFAULT_TIER_ID, canUseFramework, FrameworkId } from '@/lib/tiers';
import { useLanguage } from '@/app/components/language-provider';
import { supabase } from '@/lib/supabase';
import { useTheme } from 'next-themes';
import { graph } from '@/agent/goalAgent';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';
import { EditableText, EditableList } from './Editable';
import { ErrorBoundary } from './ErrorBoundary';

interface Message {
  role: 'ai' | 'user';
  content: string;
}

interface GoalWizardProps {
  framework: 'first-principles' | 'pareto' | 'rpm' | 'eisenhower' | 'okr' | 'gps' | 'dsss' | 'mandalas' | 'misogi';
  onBack: () => void;
  onSaveBlueprint?: (bp: Blueprint) => Promise<void> | void;
  initialBlueprint?: Blueprint;
  tier?: TierId;
  onSwitchFramework?: (fw: FrameworkId, isPreview?: boolean) => void;
  isPreviewMode?: boolean;
}

export const GoalWizard: React.FC<GoalWizardProps> = ({ framework, onBack, onSaveBlueprint, initialBlueprint, tier: propTier, onSwitchFramework, isPreviewMode = false }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [step, setStep] = useState(0); 
  const [isTyping, setIsTyping] = useState(false);
  const [result, setResult] = useState<BlueprintResult | null>(null);
  const [draftResult, setDraftResult] = useState<any>(null); // Interactive Draft State
  const [finalAnswers, setFinalAnswers] = useState<string[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [tier, setTier] = useState<TierId>(propTier || DEFAULT_TIER_ID);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [suggestionChips, setSuggestionChips] = useState<string[]>([]); // Dynamic suggestions
  
  // Agent State
  const [threadId] = useState<string>(() => uuidv4());
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  
  // Transition State
  // Transition State
  const isSwitchingRef = useRef(false);

  // Persistence: Load on Mount
  useEffect(() => {
    const savedSession = localStorage.getItem('vector_wizard_session');
    if (savedSession) {
        try {
            const { threadId: savedThreadId, messages: savedMsgs, step: savedStep, draftResult: savedDraft, framework: savedFw, timestamp } = JSON.parse(savedSession);
            // Valid for 24 hours
            if (Date.now() - timestamp < 24 * 60 * 60 * 1000 && savedFw === framework && savedMsgs.length > 0) {
                 setMessages(savedMsgs);
                 setStep(savedStep);
                 setDraftResult(savedDraft);
                 // We don't restore threadId state directly as it's a prop/state init, but we can reuse it if we store it
                 // Actually, threadId is state initialized via function, so we can't easily change it here without setThreadId which we don't have exposed.
                 // Ideally we should have setThreadId, but for now let's just restore the visible state.
            }
        } catch (e) {
            console.error("Failed to restore session", e);
        }
    }
  }, [framework]);

  // Persistence: Save on Change
  useEffect(() => {
    if (messages.length > 0) {
        const session = {
            threadId,
            messages,
            step,
            draftResult,
            framework,
            timestamp: Date.now()
        };
        localStorage.setItem('vector_wizard_session', JSON.stringify(session));
    }
  }, [messages, step, draftResult, framework, threadId]);

  const clearSession = () => {
      localStorage.removeItem('vector_wizard_session');
      setMessages([]);
      setStep(0);
      setResult(null);
      setDraftResult(null);
      setFinalAnswers([]);
      setSuggestionChips([]);
  };

  // Mobile Drawer State
  const [showMobileDraft, setShowMobileDraft] = useState(false);

  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; // Could be dynamic based on user language
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(prev => (prev + " " + transcript).trim());
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Enforce tier check
  useEffect(() => {
    if (!isPreviewMode && !canUseFramework(tier, framework)) {
      toast.error(t('wizard.lockedError') || "This framework is not available in your plan.", { duration: 5000 });
      onBack();
    }
  }, [tier, framework, onBack, t, isPreviewMode]);

  useEffect(() => {
    // Fetch credits logic... (omitted for brevity, assume same)
     if (supabase) {
        supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
            if (user) {
                // Fetch full_name along with credits and tier
                supabase.from('profiles').select('credits, tier, full_name').eq('user_id', user.id).single()
                .then(({ data }: { data: any }) => {
                    if (data) {
                        setCredits(data.credits);
                        if (data.tier) setTier(data.tier as TierId);
                        if (data.full_name) setUserName(data.full_name);
                    }
                });
            } else {
                setCredits(3); 
            }
        });
    }
  }, []);
  
  // ... helper checkAndNotifyLowCredits ...
  const checkAndNotifyLowCredits = async (newCredits: number) => {
      // Only notify if credits hit exactly 2 (to avoid spam) and user is logged in
      if (newCredits === 2 && supabase && userName) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && user.email) {
               // Fire and forget
               supabase.functions.invoke('send-email', {
                  body: {
                      to: user.email,
                      subject: "Vector: You're running low on credits!",
                      html: `
                        <h1>Low Credits Warning</h1>
                        <p>Hi ${userName},</p>
                        <p>You have only <strong>${newCredits} details</strong> left.</p>
                        <p>To continue using AI features ensuring uninterrupted access, consider upgrading your plan.</p>
                        <p><a href="${window.location.origin}/pricing">Upgrade now</a></p>
                      `
                  }
               }).then(({ error }) => {
                   if (error) console.error("Failed to send low credit email", error);
               });
               
               toast.info(t('wizard.lowCreditsWarning') || "Low credits! You have 2 credits remaining.");
          }
      }
  };


  const isOpenRouterConfigured = () => !!import.meta.env.VITE_OPENROUTER_API_KEY || !!import.meta.env.VITE_OPENROUTER_PROXY_URL;

  const extractContent = (text: string): { cleanText: string, suggestions: string[], draft: any | null } => {
    let cleanText = text;
    let suggestions: string[] = [];
    let draft: any | null = null;

    // 1. Extract Draft
    const draftRegex = /\|\|\|DRAFT_START\|\|\|([\s\S]*?)\|\|\|DRAFT_END\|\|\|/;
    const draftMatch = cleanText.match(draftRegex);
    if (draftMatch) {
        try {
            draft = JSON.parse(draftMatch[1].trim());
            cleanText = cleanText.replace(draftMatch[0], '').trim();
        } catch (e) {
            console.error("Failed to parse draft JSON", e);
        }
    }

    // 2. Extract Suggestions (at the end)
    const parts = cleanText.split('|||');
    if (parts.length > 1) {
        try {
            const lastPart = parts[parts.length - 1].trim();
            // Check if it looks like a JSON array
            if (lastPart.startsWith('[') && lastPart.endsWith(']')) {
                const parsed = JSON.parse(lastPart);
                if (Array.isArray(parsed)) {
                    suggestions = parsed;
                    cleanText = parts.slice(0, -1).join('|||').trim();
                }
            }
        } catch (e) {
            // Ignore parse errors, just keep text as is
        }
    }

    return { cleanText, suggestions, draft };
  };

  const frameworkConfig = {
    // ... config object ...
    'first-principles': {
      title: t('fp.title'),
      questions: [t('fp.q1'), t('fp.q2'), t('fp.q3')],
      generateResult: (answers: string[]) => ({
        type: 'first-principles',
        truths: answers[1]?.split('.').filter(s => s.trim()) || [],
        newApproach: answers[2] || ""
      })
    },
    'pareto': {
      title: t('pareto.title'),
      questions: [t('pareto.q1'), t('pareto.q2'), t('pareto.q3')],
      generateResult: (answers: string[]) => {
        const activities = answers[1]?.split(/,|\n/).map(s => s.trim()).filter(s => s) || [];
        const vital = answers[2]?.split(/,|\n/).map(s => s.trim()).filter(s => s) || [];
        return {
          type: 'pareto',
          vital: vital,
          trivial: activities.filter(a => !vital.includes(a))
        };
      }
    },
    'rpm': {
      title: t('rpm.title'),
      questions: [t('rpm.q1'), t('rpm.q2'), t('rpm.q3')],
      generateResult: (answers: string[]) => ({
        type: 'rpm',
        result: answers[0] || "",
        purpose: answers[1] || "",
        plan: answers[2]?.split(/,|\n/).map(s => s.trim()).filter(s => s) || []
      })
    },
    'eisenhower': {
      title: t('eisenhower.title'),
      questions: [t('eisenhower.q1'), t('eisenhower.q2'), t('eisenhower.q3')],
      generateResult: (answers: string[]) => {
        const all = answers[0]?.split(/,|\n/).map(s => s.trim()).filter(s => s) || [];
        const quadrant1 = answers[1]?.split(/,|\n/).map(s => s.trim()).filter(s => s) || [];
        const quadrant2 = answers[2]?.split(/,|\n/).map(s => s.trim()).filter(s => s) || [];
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
      questions: [t('okr.q1'), t('okr.q2'), t('okr.q3')],
      generateResult: (answers: string[]) => ({
        type: 'okr',
        objective: answers[0] || "",
        keyResults: answers[1]?.split(/,|\n/).map(s => s.trim()).filter(s => s) || [],
        initiative: answers[2] || ""
      })
    },
    'gps': { title: "GPS", questions: [], generateResult: () => ({}) }, // Placeholder as in original might be missing
    'misogi': {
      title: t('misogi.title'),
      questions: [t('misogi.q1'), t('misogi.q2'), t('misogi.q3')],
      generateResult: (answers: string[]) => ({
        type: 'misogi',
        challenge: answers[0] || "",
        gap: answers[1] || "",
        purification: answers[2] || ""
      })
    },
    'dsss': { title: "DSSS", questions: [], generateResult: () => ({}) },
    'mandalas': { title: "Mandalas", questions: [], generateResult: () => ({}) }
  };

  const currentConfig = frameworkConfig[framework as keyof typeof frameworkConfig] || frameworkConfig['first-principles'];

  useEffect(() => {
    // If switching dynamically, preserve messages but announce switch
    if (isSwitchingRef.current) {
        isSwitchingRef.current = false;
        // The agent graph already injected a system/tool message about the switch, 
        // but we might want to ensure the UI result is cleared to avoid confusion.
        setResult(null);
        setFinalAnswers([]); 
        // We do NOT reset messages here
        return;
    }

    if (!currentConfig) {
      console.error("Critical: Invalid framework passed to GoalWizard:", framework);
      onBack();
      return;
    }

    if (initialBlueprint) {
       // ... existing load logic ...
      const baseMessages: Message[] = [
        { role: 'ai', content: t('wizard.reopening').replace('{0}', currentConfig.title) },
        { role: 'user', content: initialBlueprint.title },
        { role: 'ai', content: t('wizard.loaded') },
      ];
      setMessages(baseMessages);
      setResult(initialBlueprint.result);
      setFinalAnswers(initialBlueprint.answers ?? []);
      setStep(currentConfig.questions.length);
      setIsTyping(false);

      if (supabase && initialBlueprint.id) {
          fetchBlueprintMessages(supabase, initialBlueprint.id)
            .then((history: any[]) => {
                if (history && history.length > 0) {
                     setMessages([...baseMessages, ...history as Message[]]);
                }
            })
            .catch((err: any) => console.error("Failed to load chat history", err));
      }
      return;
    }

    // Default initialization (Fresh Start)
    setResult(null);
    setFinalAnswers([]);
    setStep(0);
    setIsTyping(true);
    const tTimer = setTimeout(() => {
      // Agent Welcome
      setMessages([{ role: 'ai', content: t('wizard.welcome').replace('{0}', currentConfig.title) + " " + t('wizard.agentStart') }]); 
      setIsTyping(false);
    }, 1000);
    return () => clearTimeout(tTimer);
  }, [framework, initialBlueprint, t]); // Removed currentConfig from dep to avoid loop if object ref changes

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const runAgent = async (userText: string) => {
    if (!userText.trim()) return;

    // 1. Credit Check Guard
    if (credits !== null && credits <= 0) {
        toast.error(t('wizard.outOfCredits') || "You have run out of credits. Please upgrade your plan to continue.", {
            action: {
                label: t('nav.pricing') || "Pricing",
                onClick: () => navigate('/pricing')
            },
            duration: 10000
        });
        return;
    }
    
    // 2. Race Condition Guard: Prevent multiple submissions
    if (isTyping || isAgentRunning) return;
    
    // Add user message to UI immediately
    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInputValue('');
    setSuggestionChips([]); // Clear chips on user input
    setIsTyping(true);
    setIsAgentRunning(true);

    try {
        const config = { configurable: { thread_id: threadId } };
        
        const allowedFrameworks = TIER_CONFIGS[tier]?.allowedFrameworks || [];

        const inputs = {
            messages: [new HumanMessage(userText)],
            goal: userText, 
            framework: framework,
            tier: tier,
            validFrameworks: allowedFrameworks
        };

        const stream = await graph.stream(inputs, config);

        let deductionTriggered = false;

        for await (const event of stream) {
            
            // Check for Framework Switching
            if (event?.framework_setter) {
                const newFw = event.framework_setter.framework;
                if (newFw && newFw !== framework && onSwitchFramework) {
                    isSwitchingRef.current = true;
                    // FRANKENSTEIN FIX: Explicitly clear draft to prevent mixing old framework data with new one
                    setDraftResult(null); 
                    
                    const isLocked = !canUseFramework(tier, newFw as FrameworkId);
                    onSwitchFramework(newFw as FrameworkId, isLocked); 

                    if (event.framework_setter.messages) {
                         const lastMsg = event.framework_setter.messages[event.framework_setter.messages.length - 1];
                         setMessages(prev => [...prev, { role: 'ai', content: lastMsg.content as string }]);
                    }
                }
            }

            // Handle streaming Logic (Ask Node)
            if (event?.ask && event.ask.messages && event.ask.messages.length > 0) {
                 const lastMsg = event.ask.messages[event.ask.messages.length - 1];
                 const rawContent = lastMsg.content as string;
                 const { cleanText, suggestions, draft } = extractContent(rawContent);
                 
                 // 2. Loop Detection: Check if identical to last AI message
                 setMessages(prev => {
                     const lastAiMsg = [...prev].reverse().find(m => m.role === 'ai');
                     if (lastAiMsg && lastAiMsg.content === cleanText) {
                         // Duplicate detected, ignore.
                         return prev;
                     }
                     
                     // 3. Silent Failure Check: Ignore empty messages
                     if (!cleanText.trim()) return prev;

                     return [...prev, { role: 'ai', content: cleanText }];
                 });

                 if (suggestions.length > 0) setSuggestionChips(suggestions);
                 if (draft) setDraftResult((prev: any) => ({ ...prev, ...draft, type: framework }));
                 setIsTyping(false); 

                 if (!deductionTriggered) {
                     deductionTriggered = true;
                     if (supabase) {
                         const { data: { user } } = await supabase.auth.getUser();
                         if (user) {
                             const { data: newBalance, error } = await supabase.rpc('decrement_credits', { amount_to_deduct: 1 });
                             if (!error && newBalance !== undefined) {
                                 setCredits(newBalance);
                                 checkAndNotifyLowCredits(newBalance);
                             }
                         } else {
                             setCredits(prev => (prev !== null ? Math.max(0, prev - 1) : 0));
                         }
                     }
                 }
            }
            
            // Consultant Logic
             if (event?.consultant && event.consultant.messages) {
                  const lastMsg = event.consultant.messages[event.consultant.messages.length - 1];
                  const rawContent = lastMsg.content as string;
                  const { cleanText, suggestions, draft } = extractContent(rawContent);
                  
                  setMessages(prev => [...prev, { role: 'ai', content: cleanText }]);
                  if (suggestions.length > 0) setSuggestionChips(suggestions);
                  if (draft) setDraftResult((prev: any) => ({ ...prev, ...draft, type: framework }));
                  setIsTyping(false);
            }

            // Draft Logic (Completion)
            if (event?.draft && event.draft.blueprint) {
                 const bp = event.draft.blueprint;
                 setResult({
                     type: framework, 
                     ...bp 
                 });
                 if (event.draft.messages && event.draft.messages.length > 0) {
                     const lastMsg = event.draft.messages[event.draft.messages.length - 1];
                     setMessages(prev => [...prev, { role: 'ai', content: lastMsg.content as string }]);
                 }
                 setIsTyping(false);
                 setIsSynthesizing(false);
                 confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            }
        }
    } catch (error) {
        console.error("Agent Error:", error);
        toast.error(t('wizard.error') || "Agent connection failed. Please try again.");
        setIsTyping(false);
    } finally {
        setIsAgentRunning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isAgentRunning) return;
    runAgent(inputValue);
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
            ? t('wizard.exportSuccess')
            : t('wizard.exportIcs'),
        error: t('wizard.exportError'),
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
      
      // If this is a new blueprint, persist the chat history
      if (!initialBlueprint && supabase) {
          saveBlueprintMessages(supabase, bp.id, messages).catch((err: any) => console.error("Failed to save chat history", err));
      }

      toast.success(t('wizard.saveSuccess'));
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.75 } });
      onBack();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    }
  };

  // Helper to update deeply nested state immutably (simple version for now)
  const updateResult = (path: string[], value: any) => {
    if (!result) return;
    const newResult = JSON.parse(JSON.stringify(result));
    let current = newResult;
    for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setResult(newResult);
  };

  const renderResult = () => {
    if (!result) return null;
    
    // ... overlay helper ...
    const renderUpgradeOverlay = () => (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center bg-white/60 dark:bg-black/60 backdrop-blur-md rounded-[2.5rem]">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 max-w-md w-full animate-in fade-in zoom-in duration-500">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white mb-6 mx-auto shadow-lg rotate-3 hover:rotate-6 transition-transform">
            <Lock size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Unlock Full Blueprint</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            You've generated a <strong>Teaser Preview</strong>. Upgrade to the <strong>Standard Plan</strong> to reveal the full detailed strategy.
          </p>
          <button 
            onClick={() => navigate('/pricing')}
            className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
          >
            <Zap size={20} className="fill-current" />
            Upgrade Now
          </button>
          <button 
             onClick={onBack}
             className="mt-4 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            No thanks, take me back
          </button>
        </div>
      </div>
    );

    const isTeaser = (result as any).isTeaser;

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
       <div className="relative w-full">
           <div className={isTeaser ? "blur-sm select-none pointer-events-none opacity-50 transition-all duration-700" : ""}>
               {children}
           </div>
           {isTeaser && renderUpgradeOverlay()}
       </div>
    );

    if (result.type === 'pareto') {
      return (
        <Wrapper>
        <div className="mt-8 grid md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-8 shadow-xl relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
            <div className="flex items-center gap-3 mb-6 text-blue-600 dark:text-blue-400">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Zap size={24} />
              </div>
              <h4 className="font-bold text-xl uppercase tracking-wider">{t('pareto.vital')}</h4>
            </div>
            
            <EditableList 
              items={result.vital} 
              onChange={(val) => updateResult(['vital'], val)}
              itemClassName="text-gray-800 dark:text-gray-100 font-medium text-lg leading-snug"
            />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-50/50 dark:bg-zinc-800/30 backdrop-blur-lg border border-gray-200 dark:border-zinc-700 rounded-3xl p-8 shadow-lg"
          >
             <div className="flex items-center gap-3 mb-6 text-gray-500 dark:text-gray-400 opacity-80">
              <div className="p-2 bg-gray-200 dark:bg-zinc-700/50 rounded-lg">
                <Layers size={24} />
              </div>
              <h4 className="font-bold text-xl uppercase tracking-wider">{t('pareto.trivial')}</h4>
            </div>
             <EditableList 
              items={result.trivial} 
              onChange={(val) => updateResult(['trivial'], val)}
              itemClassName="text-base text-gray-600 dark:text-gray-400"
            />
          </motion.div>
        </div>
        </Wrapper>
      );
    }

    if (result.type === 'eisenhower') {
      return (
        <Wrapper>
        <div className="mt-8 w-full max-w-5xl mx-auto">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 shadow-2xl">
            <div className="bg-red-50/80 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-8 rounded-3xl relative overflow-hidden">
               <div className="absolute top-4 right-4 text-red-200 dark:text-red-900/40 opacity-50 font-black text-6xl pointer-events-none">1</div>
              <h4 className="text-red-600 dark:text-red-400 font-bold mb-6 flex items-center gap-3 uppercase tracking-wider text-sm">
                <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center"><Zap size={16} /></span> 
                {t('eisenhower.do')}
              </h4>
              <EditableList 
                  items={result.q1} 
                  onChange={(val) => updateResult(['q1'], val)}
                  itemClassName="p-2 bg-white dark:bg-zinc-950 rounded-xl shadow-sm text-base font-semibold dark:text-gray-100 border-l-4 border-red-500"
              />
            </div>
            
            <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-4 right-4 text-blue-200 dark:text-blue-900/40 opacity-50 font-black text-6xl pointer-events-none">2</div>
              <h4 className="text-blue-600 dark:text-blue-400 font-bold mb-6 flex items-center gap-3 uppercase tracking-wider text-sm">
                <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center"><Clock size={16} /></span> 
                {t('eisenhower.schedule')}
              </h4>
               <EditableList 
                  items={result.q2} 
                  onChange={(val) => updateResult(['q2'], val)}
                  itemClassName="p-2 bg-white dark:bg-zinc-950 rounded-xl shadow-sm text-base font-medium dark:text-gray-200 border-l-4 border-blue-500"
              />
            </div>
            
            <div className="bg-amber-50/80 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-4 right-4 text-amber-200 dark:text-amber-900/40 opacity-50 font-black text-6xl pointer-events-none">3</div>
              <h4 className="text-amber-600 dark:text-amber-400 font-bold mb-6 flex items-center gap-3 uppercase tracking-wider text-sm">
                 <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center"><Share2 size={16} /></span>
                 {t('eisenhower.delegate')}
              </h4>
              <EditableList 
                  items={result.q3} 
                  onChange={(val) => updateResult(['q3'], val)}
                  itemClassName="p-2 bg-white dark:bg-zinc-950 rounded-xl shadow-sm text-sm font-medium dark:text-gray-300 opacity-90"
              />
            </div>
            
            <div className="bg-gray-100/80 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-4 right-4 text-gray-200 dark:text-zinc-700 opacity-50 font-black text-6xl pointer-events-none">4</div>
              <h4 className="text-gray-500 dark:text-gray-400 font-bold mb-6 flex items-center gap-3 uppercase tracking-wider text-sm">
                 <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center"><Layers size={16} /></span>
                 {t('eisenhower.eliminate')}
              </h4>
               <EditableList 
                  items={result.q4} 
                  onChange={(val) => updateResult(['q4'], val)}
                  itemClassName="p-2 bg-white dark:bg-zinc-950 rounded-xl shadow-sm text-sm font-medium opacity-50 line-through dark:text-gray-500"
              />
            </div>
          </div>
        </div>
        </Wrapper>
      );
    }

    if (result.type === 'okr') {
      return (
        <Wrapper>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 w-full max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-purple-200 dark:border-purple-900/40 overflow-hidden relative"
        >
          <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600" />
          <div className="bg-purple-50/50 dark:bg-purple-900/10 p-10 text-center border-b border-purple-100 dark:border-purple-900/20">
            <span className="inline-block px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-[0.2em] mb-4">{t('okr.northStar')}</span>
            <div className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                <EditableText 
                    value={result.objective} 
                    onChange={(val) => updateResult(['objective'], val)} 
                    multiline 
                    className="text-center"
                />
            </div>
          </div>
          <div className="p-10">
            <h4 className="text-center text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">{t('okr.keyResult')}</h4>
            <div className="grid md:grid-cols-3 gap-6">
              {result.keyResults.map((kr: string, i: number) => (
                <div key={i} className="group p-6 bg-white dark:bg-zinc-950 rounded-3xl border-2 border-transparent hover:border-purple-100 dark:hover:border-purple-900/30 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-700 dark:text-purple-400 font-bold mb-4">{i+1}</div>
                   <EditableText 
                    value={kr} 
                    onChange={(val) => {
                         const newKrs = [...result.keyResults];
                         newKrs[i] = val;
                         updateResult(['keyResults'], newKrs);
                    }} 
                    multiline 
                    className="font-medium text-gray-800 dark:text-gray-200 leading-relaxed"
                   />
                </div>
              ))}
            </div>
            <div className="mt-12 p-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl flex items-center gap-6 text-white shadow-lg">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Rocket size={32} />
              </div>
              <div className="flex-grow">
                <span className="text-xs font-bold text-purple-200 uppercase tracking-widest">{t('okr.initiative')}</span>
                 <EditableText 
                    value={result.initiative} 
                    onChange={(val) => updateResult(['initiative'], val)} 
                    multiline 
                    className="text-xl font-bold mt-1 bg-transparent border-white/30"
                />
              </div>
            </div>
          </div>
        </motion.div>
        </Wrapper>
      );
    }

    if (result.type === 'first-principles') {
       return (
        <Wrapper>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 w-full max-w-4xl mx-auto space-y-8">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-3xl p-10 shadow-lg">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                 <span className="font-bold text-xl">1</span>
               </div>
               <h4 className="text-xl font-bold uppercase tracking-widest">{t('fp.truths')}</h4>
            </div>
            <EditableList 
              items={result.truths} 
              onChange={(val) => updateResult(['truths'], val)}
              itemClassName="text-xl text-gray-800 dark:text-gray-200 font-light leading-relaxed pl-6 border-l-4 border-blue-500"
            />
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-10 shadow-2xl relative overflow-hidden">
             <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
             <div className="flex items-center gap-4 mb-6 relative z-10">
               <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                 <span className="font-bold text-xl">2</span>
               </div>
               <h4 className="text-lg font-bold text-blue-100 uppercase tracking-widest">{t('fp.newApproach')}</h4>
             </div>
             <div className="relative z-10">
                <EditableText 
                    value={result.newApproach} 
                    onChange={(val) => updateResult(['newApproach'], val)} 
                    multiline 
                    className="text-3xl leading-relaxed font-bold bg-transparent border-white/30"
                />
             </div>
          </div>
        </motion.div>
        </Wrapper>
      );
    }

    if (result.type === 'rpm') {
      return (
        <Wrapper>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 w-full max-w-5xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 flex flex-col md:flex-row">
           {/* Left Sidebar: Result & Purpose */}
           <div className="md:w-2/5 bg-gray-900 text-white p-10 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10 flex flex-col h-full">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">{t('rpm.outcome')}</span>
                <div className="mb-12">
                     <EditableText 
                        value={result.result} 
                        onChange={(val) => updateResult(['result'], val)} 
                        multiline 
                        className="text-3xl font-bold leading-tight bg-transparent border-gray-700"
                    />
                </div>
                
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 block flex items-center gap-2"><Target size={14}/> {t('rpm.purpose')}</span>
                <div className="border-l-2 border-indigo-500 pl-4">
                    <EditableText 
                        value={result.purpose} 
                        onChange={(val) => updateResult(['purpose'], val)} 
                        multiline 
                        className="text-lg leading-relaxed text-gray-300 font-light bg-transparent border-gray-700"
                    />
                </div>
              </div>
              
              <div className="mt-12 opacity-30 absolute bottom-10 left-10 pointer-events-none">
                <Star size={120} />
              </div>
           </div>
           
           {/* Right Content: MAP */}
           <div className="md:w-3/5 p-10 bg-white dark:bg-zinc-900">
             <div className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                 <Layers size={20} />
               </div>
               <h4 className="font-bold text-xl text-gray-900 dark:text-white">{t('rpm.map')}</h4>
             </div>
             
             <EditableList 
                items={result.plan} 
                onChange={(val) => updateResult(['plan'], val)}
                itemClassName="font-medium text-lg text-gray-700 dark:text-gray-300"
            />
           </div>
        </motion.div>
        </Wrapper>
      );
    }

    if (result.type === 'misogi') {
      return (
        <Wrapper>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 w-full max-w-4xl mx-auto space-y-8">
           <div className="bg-gradient-to-br from-red-900 to-rose-900 text-white rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden border border-red-800">
              <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 text-center">
                 <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-red-100 text-xs font-bold uppercase tracking-[0.3em] mb-8 border border-white/20">The Challenge (50% Fail Rate)</span>
                 <div className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
                    <EditableText 
                        value={result.challenge} 
                        onChange={(val) => updateResult(['challenge'], val)} 
                        multiline 
                        className="bg-transparent border-white/20 text-center"
                    />
                 </div>
              </div>
           </div>

           <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-200 dark:border-zinc-800 shadow-xl">
                 <h4 className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-sm mb-4">The Failure Gap</h4>
                 <EditableText 
                    value={result.gap} 
                    onChange={(val) => updateResult(['gap'], val)}
                    multiline
                    className="text-xl font-medium text-gray-900 dark:text-gray-100 leading-relaxed"
                 />
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-200 dark:border-zinc-800 shadow-xl">
                 <h4 className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-sm mb-4">The Purification</h4>
                 <EditableText 
                    value={result.purification} 
                    onChange={(val) => updateResult(['purification'], val)}
                    multiline
                    className="text-xl font-medium text-gray-900 dark:text-gray-100 leading-relaxed"
                 />
              </div>
           </div>
        </motion.div>
        </Wrapper>
      );
    }
    
    return null;
  };

  const renderDraftContent = (draft: any, t: any) => {
      if (!draft) return null;

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
                if (key === 'type' || !val) return null;
                return (
                    <div key={key} className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                        <h5 className="font-bold text-gray-500 text-sm mb-2 capitalize">{key}</h5>
                        {Array.isArray(val) ? (
                            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                                {(val as string[]).map((v, i) => <li key={i}>{v}</li>)}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-800 dark:text-gray-200">{val as string}</p>
                        )}
                    </div>
                )
            })}
        </div>
    );
  };

  return (
    <div className="relative h-[calc(100vh-5rem)] px-4 md:px-8 z-10 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="w-full max-w-full mx-auto flex-none pt-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-2 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">{t('wizard.exit')}</span>
        </button>
      </div>

      <div className="flex-grow flex overflow-hidden">
        {/* Chat Area */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${draftResult ? 'lg:mr-96' : ''}`}>
          <div className="w-full max-w-3xl mx-auto flex-grow flex flex-col overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden px-4 md:px-0">
             <div className="space-y-6 pb-32 pt-4">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                     <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'ai' ? 'bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-gray-800 dark:text-gray-200 shadow-sm' : 'bg-black dark:bg-white text-white dark:text-black'}`}>
                      <div className={`text-base md:text-lg leading-relaxed prose max-w-none ${
                        msg.role === 'ai' 
                          ? 'dark:prose-invert' 
                          : 'prose-invert dark:prose'
                      }`}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
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
                      {isSynthesizing && <span className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">{t('wizard.synthesizing') || "Thinking..."}</span>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {renderResult()}
          </div>

          {!initialBlueprint && (
        <div className="flex-none p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-gray-100 dark:border-zinc-800 z-20 pb-safe">
          {/* Mobile Draft Toggle */}
          {!result && draftResult && (
             <button 
               onClick={() => setShowMobileDraft(!showMobileDraft)}
               className="lg:hidden absolute top-[-3rem] left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/80 dark:bg-white/90 text-white dark:text-black rounded-full text-xs font-bold shadow-lg backdrop-blur-md flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in"
             >
                {showMobileDraft ? <X size={12} /> : <FileText size={12} />}
                {showMobileDraft ? "Close Draft" : "View Draft"}
             </button>
          )}

          {/* Suggestion Chips */}
          {!result && !isTyping && !isAgentRunning && suggestionChips.length > 0 && (
             <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-none">
                {suggestionChips.map((chip) => (
                   <button 
                     key={chip}
                     onClick={() => runAgent(chip)}
                     disabled={isTyping || isAgentRunning}
                     className="px-4 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {chip}
                   </button>
                ))}
             </div>
          )}
          <form onSubmit={handleSubmit} className="w-full relative">
            <input 
                autoFocus 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                disabled={isTyping || isAgentRunning}
                placeholder={isTyping ? t('wizard.synthesizing') : (result ? t('wizard.refinePlaceholder') : t('wizard.typePlaceholder'))} 
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl py-3 pl-12 pr-14 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base md:text-lg text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 disabled:opacity-70 disabled:cursor-not-allowed" 
            />
            {/* Voice Input Button */}
            {!result && (
                <button
                    type="button"
                    onClick={toggleListening}
                    disabled={isTyping || isAgentRunning}
                    className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                    title="Voice Input"
                >
                    <Mic size={18} />
                </button>
            )}

            <button
              type="submit"
              aria-label="Send message"
              disabled={!inputValue.trim() || isTyping || isAgentRunning}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
        </div>

        {/* Side Panel (Desktop only for now) */}
        {!result && draftResult && (
          <>
             {/* Desktop Drawer */}
             <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="hidden lg:block absolute right-0 top-16 bottom-0 w-96 bg-gray-50 dark:bg-zinc-900/50 border-l border-gray-200 dark:border-zinc-800 overflow-y-auto p-6 backdrop-blur-sm z-10"
              >
                 <div className="flex items-center gap-2 mb-6 text-gray-400 uppercase tracking-widest text-xs font-bold">
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                     Live Draft
                 </div>
                 <div className="pointer-events-none opacity-80 scale-90 origin-top">
                     <ErrorBoundary name="Live Draft">
                       {renderDraftContent(draftResult, t)}
                     </ErrorBoundary>
                 </div>
              </motion.div>

              {/* Mobile Drawer */}
              <AnimatePresence>
                {showMobileDraft && (
                    <motion.div 
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="lg:hidden absolute inset-x-0 bottom-0 top-20 bg-white dark:bg-zinc-900 rounded-t-[2rem] shadow-2xl z-20 border-t border-gray-200 dark:border-zinc-800 flex flex-col"
                    >
                         <div className="flex-none p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                             <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                 Live Draft
                             </div>
                             <button onClick={() => setShowMobileDraft(false)} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full">
                                 <X size={16} />
                             </button>
                         </div>
                         <div className="flex-grow overflow-y-auto p-6">
                              <ErrorBoundary name="Mobile Draft">
                                {renderDraftContent(draftResult, t)}
                              </ErrorBoundary>
                         </div>
                    </motion.div>
                )}
              </AnimatePresence>
          </>
        )}
      </div>

      {result && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 items-center z-30">
          <button onClick={clearSession} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-800 rounded-full shadow-lg hover:shadow-xl transition-all font-medium"><RefreshCcw size={18} />{t('wizard.restart')}</button>
          
          {/* Calendar Export */}
          <button 
             onClick={handleExport} 
             disabled={!TIER_CONFIGS[tier].canExportCalendar}
             className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-lg transition-all font-medium ${
                 !TIER_CONFIGS[tier].canExportCalendar 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:shadow-xl'
             }`}
          >
             {TIER_CONFIGS[tier].canExportCalendar ? <Calendar size={18} /> : <Lock size={16} />}
             {t('wizard.export')}
          </button>

          {/* PDF Export */}
          <button 
             onClick={() => {
                 if (!result) return;
                  const bp: Blueprint = {
                    id: initialBlueprint?.id ?? crypto.randomUUID(),
                    framework,
                    title: initialBlueprint?.title ?? blueprintTitleFromAnswers(finalAnswers),
                    answers: finalAnswers,
                    result,
                    createdAt: initialBlueprint?.createdAt ?? new Date().toISOString(),
                  };
                  exportToPdf(bp);
                  toast.success(t('wizard.pdfSuccess'));
             }}
             disabled={!TIER_CONFIGS[tier].canExportPdf}
             className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-lg transition-all font-medium ${
                 !TIER_CONFIGS[tier].canExportPdf 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-red-600 text-white hover:shadow-xl'
             }`}
          >
             {TIER_CONFIGS[tier].canExportPdf ? <Download size={18} /> : <Lock size={16} />}
             PDF
          </button>

          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:shadow-xl transition-all font-medium"><CheckCircle2 size={18} />{t('wizard.save')}</button>
        </div>
      )}

      {result && (
          <div className="h-32" /> // Spacer for the fixed input
      )}
    </div>
  );
};
