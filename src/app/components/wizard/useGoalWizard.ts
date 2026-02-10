import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabase';
import { Blueprint, BlueprintResult, blueprintTitleFromAnswers, fetchBlueprintMessages, syncBlueprintMessages } from '@/lib/blueprints';
import { TIER_CONFIGS, TierId, DEFAULT_TIER_ID, canUseFramework, FrameworkId } from '@/lib/tiers';
import { useLanguage } from '@/app/components/language-provider';
import { graph } from '@/agent/goalAgent';
import { HumanMessage } from '@langchain/core/messages';

export interface GoalWizardHookProps {
    framework?: FrameworkId;
    initialBlueprint?: Blueprint;
    onSaveBlueprint?: (bp: Blueprint) => Promise<void> | void;
    tier?: TierId;
    onSwitchFramework?: (fw: FrameworkId, isPreview?: boolean) => void;
    onBack: () => void;
    isPreviewMode?: boolean;
}

export interface Message {
    role: 'ai' | 'user' | 'system';
    content: string;
}

export const useGoalWizard = ({ 
    framework, 
    initialBlueprint, 
    onSaveBlueprint, 
    tier: propTier, 
    onSwitchFramework, 
    onBack,
    isPreviewMode = false 
}: GoalWizardHookProps) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [step, setStep] = useState(0); 
    const [isTyping, setIsTyping] = useState(false);
    const [result, setResult] = useState<BlueprintResult | null>(null);
    const [draftResult, setDraftResult] = useState<any>(null);
    const [finalAnswers, setFinalAnswers] = useState<string[]>([]);
    const [credits, setCredits] = useState<number | null>(null);
    const [tier, setTier] = useState<TierId>(propTier || DEFAULT_TIER_ID);
    const [userName, setUserName] = useState<string | undefined>(undefined);
    const [suggestionChips, setSuggestionChips] = useState<string[]>([]);
    
    // Agent State
    const [threadId, setThreadId] = useState<string>(() => {
        if (typeof window === 'undefined') return uuidv4();
        const saved = localStorage.getItem('vector_wizard_session');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.threadId && Date.now() - (parsed.timestamp || 0) < 24 * 60 * 60 * 1000) {
                    return parsed.threadId;
                }
            } catch (e) {}
        }
        return uuidv4();
    });
    const [isAgentRunning, setIsAgentRunning] = useState(false);
    
    // UI Feedback State
    const [draftPulse, setDraftPulse] = useState(false);
    const prevDraftRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Hard Mode & Offline
    const [isHardMode, setIsHardMode] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    // Refs
    const isSwitchingRef = useRef(false);
    const isMounted = useRef(true);
    const isRunningRef = useRef(false);

    // Voice
    const [isListening, setIsListening] = useState(false);
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Framework Config Helper (Simplified for hook)
    const getFrameworkConfig = (fw: string) => {
        // We rely on translations mostly, but need basic config if used logic
        // For now returning basic lookup or relying on 't' keys
        const keys: Record<string, any> = {
            'first-principles': { title: t('fpf.title'), questions: [t('fpf.q1'), t('fpf.q2'), t('fpf.q3')] },
            'pareto': { title: t('pareto.title'), questions: [t('pareto.q1'), t('pareto.q2'), t('pareto.q3')] },
            'rpm': { title: t('rpm.title'), questions: [t('rpm.q1'), t('rpm.q2'), t('rpm.q3')] },
            'eisenhower': { title: t('eisenhower.title'), questions: [t('eisenhower.q1'), t('eisenhower.q2'), t('eisenhower.q3')] },
            'okr': { title: t('okr.title'), questions: [t('okr.q1'), t('okr.q2'), t('okr.q3')] },
            'media': { title: t('misogi.title'), questions: [t('misogi.q1'), t('misogi.q2'), t('misogi.q3')] },
            'misogi': { title: t('misogi.title'), questions: [t('misogi.q1'), t('misogi.q2'), t('misogi.q3')] },
            'general': { title: t('fp.title'), questions: [t('fp.q1')] }
        };
        if (!fw) return { title: t('fp.title'), questions: [t('fp.q1')] }; // Default Goal Planner Generator
        return keys[fw] || keys['first-principles'];
    };

    // --- Effects ---

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // Initial Load & Persistence
    useEffect(() => {
        // Realtime Subscription
        let channel: any = null;
        if (initialBlueprint?.id && supabase) {
            channel = supabase.channel(`blueprint-${initialBlueprint.id}`)
              .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'blueprints', filter: `id=eq.${initialBlueprint.id}` }, () => {
                   if (!isTyping && !isAgentRunning) {
                       toast.info(t('wizard.externalUpdate') || "This blueprint was updated in another tab.", {
                           action: { label: "Refresh", onClick: () => window.location.reload() }
                       });
                   }
              })
              .subscribe();
        }

        // Restore Session (Draft)
        const savedSession = localStorage.getItem('vector_wizard_session');
        if (savedSession) {
            try {
                const { threadId: savedThreadId, messages: savedMsgs, step: savedStep, draftResult: savedDraft, framework: savedFw, timestamp } = JSON.parse(savedSession);
                if (Date.now() - timestamp < 24 * 60 * 60 * 1000 && savedFw === framework) {
                     if (savedThreadId) setThreadId(savedThreadId);
                     if (savedMsgs.length > 0) setMessages(savedMsgs);
                     if (savedStep) setStep(savedStep);
                     if (savedDraft) setDraftResult(savedDraft);
                }
            } catch (e) {
                localStorage.removeItem('vector_wizard_session');
            }
        }

        return () => { if (channel) supabase.removeChannel(channel); };
    }, [framework, initialBlueprint]);

    // Save Session
    useEffect(() => {
        if (messages.length > 0) {
            const session = {
                threadId, messages, step, draftResult, framework, timestamp: Date.now()
            };
            localStorage.setItem('vector_wizard_session', JSON.stringify(session));
        }
    }, [messages, step, draftResult, framework, threadId]);

    // Initialization Logic
    useEffect(() => {
        if (isSwitchingRef.current) {
            isSwitchingRef.current = false;
            setResult(null);
            setFinalAnswers([]); 
            return;
        }

        const currentConfig = getFrameworkConfig(framework);

        if (initialBlueprint) {
          const openingMsg = currentConfig.questions?.[0] ? currentConfig.questions[0] : t('wizard.welcome').replace('{0}', currentConfig.title) + " " + t('wizard.agentStart');
          const baseMessages: Message[] = [
            { role: 'system', content: t('wizard.reopening').replace('{0}', currentConfig.title) },
            { role: 'ai', content: openingMsg },
            { role: 'user', content: initialBlueprint.title },
            { role: 'system', content: t('wizard.loaded') },
          ];
          setMessages(baseMessages);
          setResult(initialBlueprint.result);
          setFinalAnswers(initialBlueprint.answers ?? []);
          setStep(currentConfig.questions?.length || 0);
          setIsTyping(false);

          if (supabase && initialBlueprint.id) {
              fetchBlueprintMessages(supabase, initialBlueprint.id)
                .then((history: any[]) => {
                    if (history && history.length > 0) setMessages([...baseMessages, ...history as Message[]]);
                })
                .catch((err: any) => console.error("Failed to load chat history", err));
          }
          return;
        }

        // Check if we restored a session above, if so skip default init
        const savedSession = localStorage.getItem('vector_wizard_session');
        if (savedSession) {
            try {
                const { framework: savedFw, timestamp } = JSON.parse(savedSession);
                if (Date.now() - (timestamp || 0) < 24 * 60 * 60 * 1000 && savedFw === framework) return;
            } catch (_) {}
        }

        // Fresh Start
        setResult(null);
        setFinalAnswers([]);
        setStep(0);
        
        let initialMsg = "";
        
        const initialContext = (window.history.state?.usr?.context) || (location.state as any)?.context;
        
        if (initialContext && initialContext.explanation) {
             initialMsg = `${initialContext.explanation}\n\n${t(currentConfig.questions?.[0] || 'wizard.agentStart')}`;
        } else if (currentConfig.questions?.[0]) {
           initialMsg = currentConfig.questions[0];
        } else {
           initialMsg = t('wizard.welcome').replace('{0}', currentConfig.title) + " " + t('wizard.agentStart');
        }

        if (framework) {
            setIsTyping(true);
            const tTimer = setTimeout(() => {
                setMessages([{ role: 'ai', content: initialMsg }]); 
                setIsTyping(false);
            }, 1000);
            return () => clearTimeout(tTimer);
        } else {
            // Immediate start for general flow, no typing simulation needed for static welcome
            setMessages([{ role: 'ai', content: t('fp.q1') }]);
            setIsTyping(false);
        }
    }, [framework, initialBlueprint, t]);

    // Offline & Voice
    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsSpeechSupported(!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // User Profile
    useEffect(() => {
        if (supabase) {
            supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
                if (user) {
                    if (user.id) {
                        supabase.from('profiles').select('credits,tier,display_name').eq('user_id', user.id).single()
                        .then(({ data }: { data: any }) => {
                            if (data) {
                                setCredits(data.credits ?? 3);
                                if (data.tier) setTier(data.tier as TierId);
                                if (data.display_name) setUserName(data.display_name);
                            }
                        })
                        .catch(() => setCredits(3));
                    }
                } else {
                    setCredits(3);
                }
            });
        }
    }, []);

    // Locked Framework Check
    useEffect(() => {
        if (!framework) return;
        if (!isPreviewMode && !canUseFramework(tier, framework)) {
          toast.error(t('wizard.lockedError') || "This framework is not available in your plan.", { duration: 5000 });
          onBack();
        }
    }, [tier, framework, onBack, t, isPreviewMode]);

    // Auto-Scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping, result]);

    // --- Helpers ---

    const clearSession = () => {
        localStorage.removeItem('vector_wizard_session');
        setStep(0);
        setResult(null);
        setDraftResult(null);
        setFinalAnswers([]);
        setSuggestionChips([]);
        setThreadId(uuidv4());
        const currentConfig = getFrameworkConfig(framework || '');
        const initialMsg = currentConfig.questions?.[0] || t('wizard.welcome').replace('{0}', currentConfig.title) + " " + t('wizard.agentStart');
        setMessages([{ role: 'ai', content: initialMsg }]);
        setIsTyping(false);
    };

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
        recognition.lang = 'en-US'; 
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };
        recognition.onresult = (event: any) => {
          setInputValue(prev => (prev + " " + event.results[0][0].transcript).trim());
        };
        recognitionRef.current = recognition;
        recognition.start();
    };

    const extractContent = (text: string): { cleanText: string, suggestions: string[], draft: any | null } => {
        let cleanText = text;
        let suggestions: string[] = [];
        let draft: any | null = null;
        let isPartial = false;
    
        const startTag = '|||DRAFT_START|||';
        const endTag = '|||DRAFT_END|||';
        const startIndex = cleanText.indexOf(startTag);
        
        if (startIndex !== -1) {
            const afterStart = cleanText.substring(startIndex + startTag.length);
            const endIndex = afterStart.indexOf(endTag);
            let jsonStr = '';
            if (endIndex !== -1) {
                jsonStr = afterStart.substring(0, endIndex);
                cleanText = cleanText.substring(0, startIndex) + afterStart.substring(endIndex + endTag.length);
            } else {
                jsonStr = afterStart;
                cleanText = cleanText.substring(0, startIndex);
                isPartial = true;
            }
    
            if (jsonStr.trim()) {
               if (isPartial) {
                   draft = tryParsePartialJson(jsonStr.trim());
               } else {
                   try { draft = JSON.parse(jsonStr.trim()); } catch (e) {}
               }
            }
        }
    
        const parts = cleanText.split('|||');
        if (parts.length > 1) {
            try {
                const lastPart = parts[parts.length - 1].trim();
                if (lastPart.startsWith('[') && lastPart.endsWith(']')) {
                    suggestions = JSON.parse(lastPart);
                    cleanText = parts.slice(0, -1).join('|||').trim();
                }
            } catch (e) {}
        }
        return { cleanText, suggestions, draft };
    };

    const tryParsePartialJson = (jsonString: string): any => {
        if (!jsonString) return null;
        try { return JSON.parse(jsonString); } catch (e) {
            try {
                let sanitized = jsonString.trim();
                if (sanitized.endsWith(',')) sanitized = sanitized.slice(0, -1);
                const closers = ['}', ']}', '"}', '"]}', '"]}'];
                for (const closer of closers) {
                    try { return JSON.parse(sanitized + closer); } catch (err) { continue; }
                }
                return null;
            } catch (e2) { return null; }
        }
    };

    /** Normalize OpenRouter/LangChain message content to string. Handles: string, array of { text?, content? }, single block object. */
    const normalizeMessageContent = (content: unknown): string | null => {
        if (content == null) return null;
        if (typeof content === 'string') return content;
        if (Array.isArray(content)) {
            return content.map((c: any) => {
                if (typeof c === 'string') return c;
                if (c && typeof c === 'object') return c.text ?? c.content ?? '';
                return '';
            }).join('');
        }
        if (typeof content === 'object' && content !== null) {
            const c = content as Record<string, unknown>;
            if (typeof c.text === 'string') return c.text;
            if (typeof c.content === 'string') return c.content;
        }
        return String(content);
    };

    // --- Actions ---

    const runAgent = async (userText: string) => {
        if (!userText.trim()) return;
        if (credits !== null && credits <= 0) {
            toast.error(t('wizard.outOfCredits') || "Low credits.", { action: { label: "Pricing", onClick: () => navigate('/pricing') } });
            return;
        }
        
        if (isRunningRef.current || isTyping || isAgentRunning) return;
        isRunningRef.current = true;
        
        setMessages(prev => [...prev, { role: 'user', content: userText }]);
        setInputValue('');
        setSuggestionChips([]);
        setIsTyping(true);
        setIsAgentRunning(true);
    
        try {
            const config = { configurable: { thread_id: threadId }, streamMode: ["updates", "values"] as const };
            const allowedFrameworks = TIER_CONFIGS[tier]?.allowedFrameworks || [];
            const currentLang = t('language_code') || 'en';
            const inputs = {
                messages: [new HumanMessage(userText)],
                goal: userText, 
                framework: framework,
                tier: tier,
                validFrameworks: allowedFrameworks,
                hardMode: isHardMode,
                language: currentLang
            };
    
            // Wrap generation in a promise to race against timeout properly
            // Note: graph.stream returns an AsyncGenerator, which is not a Promise, so we must consume it or wrap the creation if it was async.
            // Since graph.stream is sync-ish (returns generator), we race the *first event* or use a wrapper.
            // Simplified: Just start iterating. Timeouts for streams are tricky, better to rely on internal timeouts or handle hang by UI state.
            // But to keep the "connection error" safety, we can race the first next() call.
            
            const generator = await graph.stream(inputs, config);

            // Robust stream consumption
            let didReceiveAgentMessage = false;
            
            for await (const event of generator) {
                if (!isMounted.current || !isAgentRunning) break; 
                
                // LangGraph stream can yield: single mode -> raw chunk; multi mode streamMode: ["updates", "values"] -> [mode, chunk].
                // "updates" chunk: { nodeName: stateUpdate }. "values" chunk: full state.
                // OpenRouter/LLM: AIMessage with content (string or content blocks) and optional tool_calls; we show content even when tool_calls exist.
                let streamMode: string | null = null;
                let updateData: any = event;
                if (Array.isArray(event) && event.length === 2 && typeof event[0] === 'string') {
                    streamMode = event[0];
                    updateData = event[1];
                } else if (event && typeof event === 'object') {
                    updateData = event;
                }

                // Handle Frame Switching (can be nested or root)
                const frameworkSetter = updateData?.framework_setter || (Array.isArray(event) && event?.[0] === 'framework_setter' && event?.[1] ? event[1] : null);
                if (frameworkSetter) {
                     const newFw = frameworkSetter.framework;
                    if (newFw && newFw !== framework && onSwitchFramework) {
                        isSwitchingRef.current = true;
                        setDraftResult(null); 
                        const isLocked = !canUseFramework(tier, newFw as FrameworkId);
                        onSwitchFramework(newFw as FrameworkId, isLocked); 
                        if (frameworkSetter.messages && frameworkSetter.messages.length > 0) {
                             const lastMsg = frameworkSetter.messages[frameworkSetter.messages.length - 1];
                             const content = normalizeMessageContent(lastMsg?.content);
                             if (content) {
                                 setMessages(prev => [...prev, { role: 'ai', content }]);
                                 didReceiveAgentMessage = true;
                             }
                        }
                    }
                }

                // Extract Messages: from "values" (full state) or "updates" (node output)
                let messageList: any[] | null = null;
                if (streamMode === 'values' && updateData?.messages && Array.isArray(updateData.messages)) {
                    messageList = updateData.messages;
                } else if (updateData?.messages && Array.isArray(updateData.messages)) {
                    messageList = updateData.messages;
                } else if (updateData && typeof updateData === 'object') {
                    if (streamMode === 'values') {
                        messageList = updateData.messages ?? null;
                    } else {
                        for (const key of Object.keys(updateData)) {
                            const val = (updateData as Record<string, unknown>)[key];
                            if (val && typeof val === 'object' && Array.isArray((val as any).messages)) {
                                messageList = (val as any).messages;
                                break;
                            }
                        }
                    }
                }

                if (messageList && messageList.length > 0) {
                     // Get the last AI message (prefer last message that has AI content)
                     let lastMsg = messageList[messageList.length - 1];
                     
                     const getMsgType = (m: any) => {
                         if (!m) return undefined;
                         if (typeof m._getType === 'function') return m._getType();
                         if (m.type) return m.type;
                         if (m.role === 'assistant' || m.role === 'ai') return 'ai';
                         if (m.role === 'user') return 'human';
                         if (m.role === 'system') return 'system';
                         if (m.role === 'tool') return 'tool';
                         if (m.lc_kwargs?.type) return m.lc_kwargs.type;
                         return (m as any).constructor?.name === 'AIMessage' ? 'ai' : undefined;
                     };
                     
                     if (getMsgType(lastMsg) !== 'ai') {
                         const aiIdx = messageList.map((m: any) => getMsgType(m)).lastIndexOf('ai');
                         if (aiIdx >= 0) lastMsg = messageList[aiIdx];
                     }
                     
                     const msgType = getMsgType(lastMsg);
                     // Only treat as tool when it's a ToolMessage (tool_call_id or name = tool). AIMessage with tool_calls still has displayable content.
                     const isTool = msgType === 'tool' || !!lastMsg?.tool_call_id || (lastMsg?.name && ['set_framework', 'generate_blueprint'].includes(lastMsg.name));
                     const isAIMessage = !isTool && (
                        msgType === 'ai' || 
                        lastMsg?.role === 'ai' ||
                        lastMsg?.role === 'assistant' ||
                        lastMsg?.constructor?.name === 'AIMessage' ||
                        (lastMsg?.content != null && lastMsg?.content !== '' && msgType !== 'human' && msgType !== 'system')
                     );

                     // Show AI message when it has any displayable content (including when tool_calls are also present, e.g. set_framework / generate_blueprint)
                     if (isAIMessage && lastMsg?.content != null) {
                         const rawContent = normalizeMessageContent(lastMsg.content);
                         if (rawContent == null) continue;
                         const { cleanText, suggestions, draft } = extractContent(rawContent);
                         const textToShow = cleanText.trim() || rawContent.trim().slice(0, 2000) || (t('common.loading') ?? '…');
    
                         setMessages(prev => {
                             const lastPrev = prev[prev.length - 1];
                             if (lastPrev && lastPrev.role === 'ai' && lastPrev.content === textToShow) return prev;
                             if (!textToShow) return prev;
                             return [...prev, { role: 'ai', content: textToShow }];
                         });
    
                         if (suggestions.length > 0) setSuggestionChips(suggestions);
                         if (draft) {
                            const currentDraftStr = JSON.stringify(draft);
                            const prevDraftStr = JSON.stringify(prevDraftRef.current);
                            if (currentDraftStr !== prevDraftStr) {
                                setDraftPulse(true);
                                setTimeout(() => setDraftPulse(false), 800);
                                prevDraftRef.current = draft;
                            }
                            setDraftResult((prev: any) => ({ ...prev, ...draft, type: framework }));
                         }
                         didReceiveAgentMessage = true;
                         setIsTyping(false); 
                     }
                }
            }
    
            if (isMounted.current && !didReceiveAgentMessage && isAgentRunning) {
                // If stream finished but no messages, it might be a silent failure or just no output.
                // We'll log it as an error to be safe.
                console.warn("Agent finished but no AI messages received.");
                setMessages(prev => [...prev, { role: 'ai', content: "⚠️ **Connection Error**: I couldn't complete that thought. Please try asking again." }]);
            }
        } catch (e: any) {
            console.error("Agent Run Error:", e);
            toast.error(t('common.error'), { description: "The agent encountered an error. Please try again." });
            setMessages(prev => [...prev, { role: 'ai', content: "⚠️ **Error**: " + (e.message || "Unknown error") }]);
        }
        finally {
            isRunningRef.current = false;
            if (isMounted.current) {
                setIsAgentRunning(false);
                setIsTyping(false);
            }
        }
    };

    const handleStop = () => {
        isRunningRef.current = false;
        setIsAgentRunning(false);
        setIsTyping(false);
        toast.info("Generation stopped by user");
    };

    const handleSafeRestart = async () => {
        if (!result && messages.length > 0) {
             const answers = finalAnswers.length ? finalAnswers : messages.filter(m => m.role === 'user').map(m => m.content);
             const bp: Blueprint = {
                id: initialBlueprint?.id ?? crypto.randomUUID(),
                framework: framework || "general",
                title: initialBlueprint?.title ?? blueprintTitleFromAnswers(answers),
                answers,
                result: result || { type: framework } as any,
                createdAt: initialBlueprint?.createdAt ?? new Date().toISOString(),
             };
  
             try {
                 await onSaveBlueprint?.(bp);
                 if (supabase) await syncBlueprintMessages(supabase, bp.id, messages);
                 toast.success("Draft saved to 'My Blueprints'");
             } catch (e) {
                 if (!confirm("Auto-save failed. Restart anyway?")) return;
             }
        }
        clearSession();
    };

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

    const handleSave = async () => {
        const answers = finalAnswers.length ? finalAnswers : messages.filter(m => m.role === 'user').map(m => m.content);
        const bp: Blueprint = {
          id: initialBlueprint?.id ?? crypto.randomUUID(),
          framework: framework || "general",
          title: initialBlueprint?.title ?? blueprintTitleFromAnswers(answers),
          answers,
          result,
          createdAt: initialBlueprint?.createdAt ?? new Date().toISOString(),
        };
    
        try {
          await onSaveBlueprint?.(bp);
          if (supabase) syncBlueprintMessages(supabase, bp.id, messages).catch((err: any) => console.error("Failed to sync chat history", err));
          toast.success(t('wizard.saveSuccess'));
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.75 } });
          onBack();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : t('common.error'));
        }
    };

    const toggleHardMode = () => {
        setIsHardMode(!isHardMode);
        toast(isHardMode ? "Mode: Supportive Coach 🤝" : "Mode: Devil's Advocate (Hard Mode) 🔥", {
            description: !isHardMode ? "The agent will now be ruthless and critical." : "The agent is back to being nice."
        });
    };

    return {
        messages,
        inputValue,
        setInputValue,
        isTyping,
        isAgentRunning,
        result,
        draftResult,
        finalAnswers,
        credits,
        tier,
        isHardMode,
        isOffline,
        suggestionChips,
        isListening,
        isSpeechSupported,
        messagesEndRef,
        draftPulse,
        runAgent,
        toggleListening,
        handleStop,
        handleSafeRestart,
        handleSave,
        updateResult,
        toggleHardMode
    };
};
