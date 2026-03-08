import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabase';
import { Blueprint, BlueprintResult, blueprintTitleFromAnswers, fetchBlueprintMessages, syncBlueprintMessages } from '@/lib/blueprints';
import { TIER_CONFIGS, TierId, DEFAULT_TIER_ID, canUseFramework, FrameworkId } from '@/lib/tiers';
import { useLanguage } from '@/app/components/language-provider';
import { trackEvent } from '@/lib/analytics';
import { graph } from '@/agent/goalAgent';
import { AIMessage, HumanMessage } from '@langchain/core/messages';

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
    id: string;
    role: 'ai' | 'user' | 'system';
    content: string;
    /** Allow a one-time post-send edit for user messages. */
    editedOnce?: boolean;
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
    const { t, language: appLanguage } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    const ensureMessageIds = (raw: any[]): Message[] => {
        if (!Array.isArray(raw)) return [];
        return raw
            .filter(Boolean)
            .map((m: any) => ({
                id: m?.id ?? uuidv4(),
                role: m?.role,
                content: typeof m?.content === 'string' ? m.content : String(m?.content ?? ''),
                editedOnce: !!m?.editedOnce,
            }))
            .filter((m) => m.role === 'ai' || m.role === 'user' || m.role === 'system');
    };

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
    const [showRestartConfirm, setShowRestartConfirm] = useState(false);
    /** Summary of user profile for the agent (personalization). */
    const [agentUserProfile, setAgentUserProfile] = useState<string>('');
    /** Intake form context for the agent (what the user wrote in Find Your Framework). */
    const [agentFormContext, setAgentFormContext] = useState<string>('');
    
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
    /** Phase-specific status during Draft→Critique→UserReview burst (for UX). */
    const [agentPhase, setAgentPhase] = useState<'thinking' | 'drafting' | 'reviewing' | 'finalizing'>('thinking');
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
    const lastAppendedContentRef = useRef<string | null>(null);
    const hasDeductedCreditThisRunRef = useRef(false);
    const seenDraftUpdateThisRunRef = useRef(false);
    const blueprintReceivedThisRunRef = useRef<BlueprintResult | null>(null);
    const hasAutoRunFromIntakeRef = useRef(false);

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
            'ikigai': { title: t('ikigai.title'), questions: [t('ikigai.q1'), t('ikigai.q2'), t('ikigai.q3'), t('ikigai.q4')] },
            'dsss': { title: t('fw.dsss.title'), questions: [t('wizard.dsss.firstQuestion')] },
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
                     if (savedMsgs.length > 0) setMessages(ensureMessageIds(savedMsgs));
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
            { id: uuidv4(), role: 'system', content: t('wizard.reopening').replace('{0}', currentConfig.title) },
            { id: uuidv4(), role: 'ai', content: openingMsg },
            { id: uuidv4(), role: 'user', content: initialBlueprint.title, editedOnce: false },
            { id: uuidv4(), role: 'system', content: t('wizard.loaded') },
          ];
          setMessages(baseMessages);
          setResult(initialBlueprint.result);
          setFinalAnswers(initialBlueprint.answers ?? []);
          setStep(currentConfig.questions?.length || 0);
          setIsTyping(false);

          if (supabase && initialBlueprint.id) {
              fetchBlueprintMessages(supabase, initialBlueprint.id)
                .then((history: any[]) => {
                    if (history && history.length > 0) setMessages([...baseMessages, ...ensureMessageIds(history)]);
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

        const initialContext = (window.history.state?.usr?.context) || (location.state as any)?.context;

        // When coming from "Help me find" with intake data: skip static message; agent will paraphrase and ask follow-ups
        if (initialContext?.objective && framework) {
            setMessages([]);
            return; // Auto-run effect will invoke agent with intake data
        }

        let initialMsg = "";
        if (initialContext && initialContext.explanation) {
             initialMsg = initialContext.objective
                ? `${initialContext.explanation}\n\n${t('wizard.readyToBuild')}`
                : `${initialContext.explanation}\n\n${t(currentConfig.questions?.[0] || 'wizard.agentStart')}`;
        } else if (currentConfig.questions?.[0]) {
           initialMsg = currentConfig.questions[0];
        } else {
           initialMsg = t('wizard.welcome').replace('{0}', currentConfig.title) + " " + t('wizard.agentStart');
        }

        if (framework) {
            setIsTyping(true);
            const tTimer = setTimeout(() => {
                setMessages([{ id: uuidv4(), role: 'ai', content: initialMsg }]);
                setIsTyping(false);
            }, 1000);
            return () => clearTimeout(tTimer);
        } else {
            setMessages([{ id: uuidv4(), role: 'ai', content: t('fp.q1') }]);
            setIsTyping(false);
        }
    }, [framework, initialBlueprint, t]);

    // Auto-invoke agent with intake data when coming from "Help me find the right framework"
    useEffect(() => {
        const ctx = (window.history.state?.usr?.context) || (location.state as any)?.context;
        if (!ctx?.objective || !framework || initialBlueprint) return;
        if (hasAutoRunFromIntakeRef.current) return;
        const saved = localStorage.getItem('vector_wizard_session');
        if (saved) {
            try {
                const { framework: savedFw, timestamp } = JSON.parse(saved);
                if (Date.now() - (timestamp || 0) < 24 * 60 * 60 * 1000 && savedFw === framework) return;
            } catch (_) {}
        }
        hasAutoRunFromIntakeRef.current = true;

        const parts: string[] = [ctx.objective];
        if (ctx.stakes) parts.push(`Stakes: ${ctx.stakes}`);
        if (ctx.horizon) parts.push(`Time horizon: ${ctx.horizon}`);
        if (ctx.obstacle) parts.push(`Obstacles: ${ctx.obstacle}`);
        if (ctx.successLookLike) parts.push(`Success looks like: ${ctx.successLookLike}`);
        const formattedMessage = parts.join('. ');

        const formCtxParts: string[] = [];
        if (ctx.objective) formCtxParts.push(`Objective: ${ctx.objective}`);
        if (ctx.stakes) formCtxParts.push(`Stakes: ${ctx.stakes}`);
        if (ctx.horizon) formCtxParts.push(`Time horizon: ${ctx.horizon}`);
        if (ctx.obstacle) formCtxParts.push(`Obstacle/situation: ${ctx.obstacle}`);
        if (ctx.successLookLike) formCtxParts.push(`Success looks like: ${ctx.successLookLike}`);
        if (ctx.explanation) formCtxParts.push(`Why this framework fits: ${ctx.explanation}`);
        const formContextOverride = formCtxParts.join('. ');

        runAgentInternal(formattedMessage, { formContextOverride });
    }, [location.state, framework, initialBlueprint]);

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

    // User Profile (credits, tier, display_name + full profile for agent personalization)
    useEffect(() => {
        if (!supabase) return;
        supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
            if (!user?.id) {
                setCredits(1);
                return;
            }
            supabase.from('profiles')
                .select('credits,extra_credits,credits_expires_at,tier,display_name,bio,metadata')
                .eq('user_id', user.id)
                .single()
                .then(({ data }: { data: any }) => {
                    if (data) {
                        const regular = data.credits ?? 0;
                        const extra = data.extra_credits ?? 0;
                        const expiresAt = data.credits_expires_at ? new Date(data.credits_expires_at) : null;
                        const validRegular = expiresAt && expiresAt.getTime() < Date.now() ? 0 : regular;
                        setCredits(validRegular + extra);
                        if (data.tier) setTier(data.tier as TierId);
                        if (data.display_name) setUserName(data.display_name);
                        // Build profile summary for the agent (personality-aware plans)
                        const meta = data.metadata || {};
                        const parts: string[] = [];
                        if (data.display_name) parts.push(`Name: ${data.display_name}`);
                        if (data.bio) parts.push(`Bio/Mission: ${data.bio}`);
                        if (meta.age) parts.push(`Age: ${meta.age}`);
                        if (meta.gender) parts.push(`Gender: ${meta.gender}`);
                        if (meta.country) parts.push(`Country: ${meta.country}`);
                        if (meta.zodiac_sign) parts.push(`Zodiac: ${meta.zodiac_sign}`);
                        if (meta.zodiac_importance) parts.push(`Zodiac importance for personality: ${meta.zodiac_importance}`);
                        if (meta.interests) parts.push(`Interests: ${meta.interests}`);
                        if (meta.skills) parts.push(`Skills: ${meta.skills}`);
                        if (meta.hobbies) parts.push(`Hobbies: ${meta.hobbies}`);
                        if (meta.values) parts.push(`Values: ${meta.values}`);
                        if (meta.vision) parts.push(`Vision: ${meta.vision}`);
                        if (meta.preferred_plan_style) parts.push(`Preferred plan style: ${meta.preferred_plan_style}`);
                        if (meta.stay_on_track) parts.push(`What helps them stay on track: ${meta.stay_on_track}`);
                        if (meta.question_flow) parts.push(`Prefers questions: ${meta.question_flow === 'list' ? 'all at once' : 'one at a time with suggestions'}`);
                        if (meta.preferred_tone) parts.push(`Preferred tone: ${meta.preferred_tone}`);
                        if (meta.treatment_level) parts.push(`Treat as: ${meta.treatment_level} (expert=assume knowledge, beginner=explain, mixed=adapt)`);
                        if (meta.other_observations) parts.push(`Other observations: ${meta.other_observations}`);
                        setAgentUserProfile(parts.length ? parts.join('. ') : '');
                    }
                })
                .catch(() => setCredits(1));
        });
    }, []);

    // Intake form context (from Find Your Framework) for the agent
    useEffect(() => {
        const ctx = (window.history.state?.usr?.context) || (location.state as { context?: { objective?: string; explanation?: string; stakes?: string; horizon?: string; obstacle?: string; successLookLike?: string } })?.context;
        if (!ctx) {
            setAgentFormContext('');
            return;
        }
        const parts: string[] = [];
        if (ctx.objective) parts.push(`Objective: ${ctx.objective}`);
        if (ctx.stakes) parts.push(`Stakes: ${ctx.stakes}`);
        if (ctx.horizon) parts.push(`Time horizon: ${ctx.horizon}`);
        if (ctx.obstacle) parts.push(`Obstacle/situation: ${ctx.obstacle}`);
        if (ctx.successLookLike) parts.push(`Success looks like: ${ctx.successLookLike}`);
        if (ctx.explanation) parts.push(`Why this framework fits: ${ctx.explanation}`);
        setAgentFormContext(parts.length ? parts.join('. ') : '');
    }, [location.state]);

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
        lastAppendedContentRef.current = null;
        localStorage.removeItem('vector_wizard_session');
        setStep(0);
        setResult(null);
        setDraftResult(null);
        setFinalAnswers([]);
        setSuggestionChips([]);
        setThreadId(uuidv4());
        const currentConfig = getFrameworkConfig(framework || '');
        const initialMsg = currentConfig.questions?.[0] || t('wizard.welcome').replace('{0}', currentConfig.title) + " " + t('wizard.agentStart');
        setMessages([{ id: uuidv4(), role: 'ai', content: initialMsg }]);
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

    /** Normalize OpenRouter/LangChain message content to string. Handles: string, array of { text?, content? }, array of strings (e.g. tool results). */
    const normalizeMessageContent = (content: unknown): string | null => {
        if (content == null) return null;
        if (typeof content === 'string') return content;
        if (Array.isArray(content)) {
            const parts = content.map((c: any) => {
                if (typeof c === 'string') return c;
                if (c && typeof c === 'object') return c.text ?? c.content ?? '';
                return '';
            }).filter(Boolean);
            return parts.join('\n');
        }
        if (typeof content === 'object' && content !== null) {
            const c = content as Record<string, unknown>;
            if (typeof c.text === 'string') return c.text;
            if (typeof c.content === 'string') return c.content;
        }
        return String(content);
    };

    // --- Actions ---

    const LOG = (label: string, data?: unknown) => {
        console.log(`[Wizard:Agent] ${label}`, data !== undefined ? data : '');
    };

    type RunAgentOptions = {
        appendUserMessage?: boolean;
        seedMessages?: Array<HumanMessage | AIMessage>;
        threadIdOverride?: string;
        formContextOverride?: string;
    };

    const runAgentInternal = async (userText: string, options: RunAgentOptions = {}) => {
        const appendUserMessage = options.appendUserMessage ?? true;
        const effectiveThreadId = options.threadIdOverride ?? threadId;

        if (!userText.trim()) return;
        if (credits !== null && credits <= 0) {
            toast.error(t('wizard.outOfCredits') || "Low credits.", { action: { label: "Pricing", onClick: () => navigate('/pricing') } });
            return;
        }
        
        if (isRunningRef.current || isTyping || isAgentRunning) return;
        isRunningRef.current = true;
        
        if (appendUserMessage) {
            setMessages(prev => [...prev, { id: uuidv4(), role: 'user', content: userText, editedOnce: false }]);
        }
        setInputValue('');
        setSuggestionChips([]);
        setIsTyping(true);
        setIsAgentRunning(true);
        setAgentPhase('thinking');
        // Heuristic: if user message looks like confirmation, we're likely going to draft→critique→user_review
        const looksLikeConfirmation = /^(yes|sí|si|ok|okay|looks good|perfect|proceed|generate|go ahead|listo|vale|adelante|dale|genera|genéralo|génère)/i.test(userText.trim());
        if (looksLikeConfirmation) setAgentPhase('drafting');
        // Clear previous result/draft so we don't show a stale blueprint from checkpoint restore
        setResult(null);
        setDraftResult(null);

        try {
            const config = { configurable: { thread_id: effectiveThreadId }, streamMode: ["updates", "values"] as const };
            const allowedFrameworks = TIER_CONFIGS[tier]?.allowedFrameworks || [];
            const currentLang = appLanguage || 'en';
            const seeded = options.seedMessages && options.seedMessages.length > 0 ? options.seedMessages : null;
            const inputs = {
                messages: seeded ? [...seeded, new HumanMessage(userText)] : [new HumanMessage(userText)],
                goal: userText, 
                framework: framework,
                tier: tier,
                validFrameworks: allowedFrameworks,
                hardMode: isHardMode,
                language: currentLang,
                userProfile: agentUserProfile,
                formContext: options.formContextOverride ?? agentFormContext
            };

            LOG('runAgent START', { threadId: effectiveThreadId, framework, currentLang, goalLength: userText.length, seededCount: seeded?.length ?? 0 });
    
            const generator = await graph.stream(inputs, config);
            LOG('graph.stream() returned generator, starting for-await loop');
            isRunningRef.current = true;

            let didReceiveAgentMessage = false;
            let eventIndex = 0;
            lastAppendedContentRef.current = null;
            hasDeductedCreditThisRunRef.current = false;
            seenDraftUpdateThisRunRef.current = false;
            blueprintReceivedThisRunRef.current = null;

            for await (const event of generator) {
                eventIndex++;
                if (!isMounted.current || !isRunningRef.current) {
                    LOG('break: unmounted or agent stopped', { isMounted: isMounted.current, isRunningRef: isRunningRef.current });
                    break;
                }
                
                const isTuple = Array.isArray(event) && event.length === 2 && typeof event[0] === 'string';
                const streamMode: string | null = isTuple ? (event[0] as string) : null;
                const updateData: any = isTuple ? event[1] : event;
                const updateKeys = updateData && typeof updateData === 'object' ? Object.keys(updateData) : [];
                LOG(`event #${eventIndex}`, { isTuple, streamMode, updateKeys, hasMessages: !!(updateData?.messages), messagesLength: updateData?.messages?.length });

                // Track when draft node ran this turn (for fallback promotion from values)
                if (streamMode === 'updates' && updateData && typeof updateData === 'object' && 'draft' in updateData) {
                    seenDraftUpdateThisRunRef.current = true;
                    if (isMounted.current) setAgentPhase('reviewing');
                }
                if (streamMode === 'updates' && updateKeys.includes('critique') && isMounted.current) {
                    setAgentPhase('finalizing');
                }
                if (streamMode === 'updates' && updateKeys.includes('user_review') && isMounted.current) {
                    setAgentPhase('thinking'); // Will finish or loop to draft
                }

                // Handle blueprint from stream. Prefer "updates" (draft node). Fallback: "values" only when
                // we've seen a draft update this run (avoids promoting stale checkpoint blueprints).
                let blueprintFromStream: any = null;
                if (streamMode === 'updates' && updateData && typeof updateData === 'object') {
                    blueprintFromStream = updateData?.draft?.blueprint ?? null;
                    if (!blueprintFromStream) {
                        for (const key of Object.keys(updateData)) {
                            const nodeOut = (updateData as Record<string, unknown>)[key];
                            if (nodeOut && typeof nodeOut === 'object' && (nodeOut as any).blueprint) {
                                blueprintFromStream = (nodeOut as any).blueprint;
                                break;
                            }
                        }
                    }
                }
                if (!blueprintFromStream && streamMode === 'values' && seenDraftUpdateThisRunRef.current && updateData?.blueprint) {
                    blueprintFromStream = updateData.blueprint;
                }
                if (blueprintFromStream && typeof blueprintFromStream === 'object' && blueprintFromStream.type && !(blueprintFromStream as any).isTeaser) {
                    const bp = blueprintFromStream as BlueprintResult;
                    if (isMounted.current) {
                        let graphMessages = updateData?.messages;
                        if (!graphMessages && streamMode === 'updates' && updateData && typeof updateData === 'object') {
                            for (const key of Object.keys(updateData)) {
                                const nodeOut = (updateData as Record<string, unknown>)[key];
                                if (nodeOut && typeof nodeOut === 'object' && Array.isArray((nodeOut as any).messages)) {
                                    graphMessages = (nodeOut as any).messages;
                                    break;
                                }
                            }
                        }
                        const userAnswers = Array.isArray(graphMessages)
                            ? graphMessages.filter((m: any) => m.role === 'user' || m._getType?.() === 'human').map((m: any) => typeof m.content === 'string' ? m.content : String(m.content ?? ''))
                            : [];
                        blueprintReceivedThisRunRef.current = bp;
                        setResult(bp);
                        setFinalAnswers(userAnswers.length > 0 ? userAnswers : messages.filter(m => m.role === 'user').map(m => m.content));
                        setDraftResult((prev: any) => prev ? { ...prev, ...bp } : bp);
                        if (supabase && !hasDeductedCreditThisRunRef.current) {
                            hasDeductedCreditThisRunRef.current = true;
                            supabase.auth.getUser().then(({ data: { user } }) => {
                                if (user?.id) {
                                    supabase.rpc('decrement_credits', { amount_to_deduct: 1 })
                                        .then(({ data, error }) => {
                                            if (!error && data != null) {
                                                setCredits(data as number);
                                            }
                                        })
                                        .catch(() => {});
                                }
                            });
                        }
                        LOG('blueprint from stream → setResult, decrement_credits');
                        
                        // Analytics: Wizard Completed
                        // Only fire if it's a final blueprint (which is implied by !isTeaser logic above)
                        trackEvent('wizard_completed', { framework: framework || bp.framework });
                    }
                }

                if (streamMode === 'values' && updateData?.messages) {
                    LOG(`event #${eventIndex} values.messages`, { count: updateData.messages.length, lastRole: updateData.messages[updateData.messages.length - 1]?.role ?? updateData.messages[updateData.messages.length - 1]?.type });
                }
                if (streamMode !== 'values' && updateKeys.length > 0) {
                    for (const k of updateKeys) {
                        const v = (updateData as Record<string, unknown>)[k];
                        if (v && typeof v === 'object' && Array.isArray((v as any).messages)) {
                            LOG(`event #${eventIndex} nested messages under key "${k}"`, { count: (v as any).messages.length });
                            break;
                        }
                    }
                }

                // Handle Frame Switching (internal only — do not add "Switched to X" to chat)
                const frameworkSetter = updateData?.framework_setter || (Array.isArray(event) && event?.[0] === 'framework_setter' && event?.[1] ? event[1] : null);
                if (frameworkSetter) {
                     const newFw = frameworkSetter.framework;
                    if (newFw && newFw !== framework && onSwitchFramework) {
                        isSwitchingRef.current = true;
                        setDraftResult(null); 
                        const isLocked = !canUseFramework(tier, newFw as FrameworkId);
                        onSwitchFramework(newFw as FrameworkId, isLocked);
                        // framework_setter message is for logs only; do not show "Switched to rpm" in chat
                    }
                }

                // Extract Messages: from "values" (full state) or "updates" (node output)
                let messageList: any[] | null = null;
                let messageListSource = '';
                if (streamMode === 'values' && updateData?.messages && Array.isArray(updateData.messages)) {
                    messageList = updateData.messages;
                    messageListSource = 'values (direct)';
                } else if (updateData?.messages && Array.isArray(updateData.messages)) {
                    messageList = updateData.messages;
                    messageListSource = 'updateData.messages';
                } else if (updateData && typeof updateData === 'object') {
                    if (streamMode === 'values') {
                        messageList = updateData.messages ?? null;
                        messageListSource = 'values (fallback)';
                    } else {
                        for (const key of Object.keys(updateData)) {
                            const val = (updateData as Record<string, unknown>)[key];
                            if (val && typeof val === 'object' && Array.isArray((val as any).messages)) {
                                messageList = (val as any).messages;
                                messageListSource = `key "${key}"`;
                                break;
                            }
                        }
                    }
                }

                if (messageList && messageList.length > 0) {
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
                     
                     const lastMsgType = getMsgType(lastMsg);
                     if (lastMsgType !== 'ai') {
                         const aiIdx = messageList.map((m: any) => getMsgType(m)).lastIndexOf('ai');
                         if (aiIdx >= 0) lastMsg = messageList[aiIdx];
                     }
                     
                     const msgType = getMsgType(lastMsg);
                     const isTool = msgType === 'tool' || !!lastMsg?.tool_call_id || (lastMsg?.name && ['set_framework', 'generate_blueprint'].includes(lastMsg.name));
                     const isAIMessage = !isTool && (
                        msgType === 'ai' || 
                        lastMsg?.role === 'ai' ||
                        lastMsg?.role === 'assistant' ||
                        lastMsg?.constructor?.name === 'AIMessage' ||
                        (lastMsg?.content != null && lastMsg?.content !== '' && msgType !== 'human' && msgType !== 'system')
                     );

                     const contentPreview = typeof lastMsg?.content === 'string' ? lastMsg.content.slice(0, 100) : JSON.stringify(lastMsg?.content)?.slice(0, 100);
                     LOG(`event #${eventIndex} messageList`, { source: messageListSource, count: messageList.length, msgType, isTool, isAIMessage, hasContent: lastMsg?.content != null, contentPreview });

                     if (isAIMessage && lastMsg?.content != null) {
                         const rawContent = normalizeMessageContent(lastMsg.content);
                         if (rawContent == null) {
                             LOG(`event #${eventIndex} SKIP: normalizeMessageContent returned null`);
                             continue;
                         }
                         const { cleanText, suggestions, draft } = extractContent(rawContent);
                         let textToShow = (cleanText.trim() || rawContent.trim().slice(0, 2000)).trim();
                         // Strip confusing trailing question that implies the plan is not final (e.g. "Ready to generate the full blueprint with exact numbers...?")
                         textToShow = textToShow.replace(/\n\s*(\*\*)?Ready to generate the full blueprint[^*]*(\*\*)?\s*$/i, "").trim();
                         if (/^Your .+ blueprint is ready below\. Review your personalized plan and refine as needed\.$/.test(textToShow) || textToShow === 'Your blueprint is ready below. Review your personalized plan and refine as needed.') {
                             const label = (framework && String(framework).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())) || '';
                             const translated = (t('wizard.blueprintReadyBelow') || '').replace('{0}', label).trim();
                             if (translated) textToShow = translated;
                         }
                         const loadingPlaceholders = ['Loading...', 'Loading..', 'Loading', 'Cargando...', 'Carregando...', 'Chargement...', 'Laden...'];
const isLoadingPlaceholder = !textToShow || loadingPlaceholders.includes(textToShow) || textToShow === (t('common.loading') ?? 'Loading...');
                         LOG(`event #${eventIndex} WILL setMessages`, { rawContentLength: rawContent.length, cleanTextLength: cleanText.length, textToShowPreview: textToShow.slice(0, 120), suggestionsCount: suggestions.length });
    
                         if (lastAppendedContentRef.current === textToShow) {
                             LOG(`event #${eventIndex} setMessages: no-op (duplicate, ref check)`);
                         } else if (!textToShow || isLoadingPlaceholder) {
                             LOG(`event #${eventIndex} setMessages: no-op (empty or loading placeholder)`);
                         } else {
                             setMessages(prev => {
                                 const alreadyExists = prev.some(m => m.role === 'ai' && m.content === textToShow);
                                 if (alreadyExists) {
                                     LOG(`event #${eventIndex} setMessages: no-op (already in state, from checkpoint)`);
                                     return prev;
                                 }
                                 const lastPrev = prev[prev.length - 1];
                                 if (lastPrev && lastPrev.role === 'ai' && lastPrev.content === textToShow) {
                                     LOG(`event #${eventIndex} setMessages: no-op (duplicate, state check)`);
                                     return prev;
                                 }
                                 const isGreetingOnly = /^[¡]?Hola!?\s*\.?$/i.test(textToShow.trim()) || /^Hello!?\s*\.?$/i.test(textToShow.trim());
                                 if (isGreetingOnly && lastPrev?.role === 'ai' && /^[¡]?Hola!?|^Hello!?/i.test(String(lastPrev.content).trim())) {
                                     LOG(`event #${eventIndex} setMessages: no-op (duplicate greeting)`);
                                     return prev;
                                 }
                                 lastAppendedContentRef.current = textToShow;
                                 LOG(`event #${eventIndex} setMessages: APPENDING ai message`, { length: textToShow.length });
                                 return [...prev, { id: uuidv4(), role: 'ai', content: textToShow }];
                             });
                         }
    
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
                     } else {
                         if (messageList.length > 0 && !isAIMessage) {
                             LOG(`event #${eventIndex} SKIP: not treating as AI`, { msgType, isTool, hasContent: lastMsg?.content != null });
                         }
                     }
                } else {
                     if (eventIndex <= 5 || updateKeys.length > 0) {
                         LOG(`event #${eventIndex} no messageList`, { streamMode, updateKeys, hasUpdateDataMessages: !!(updateData?.messages) });
                     }
                }
            }
    
            LOG('stream loop DONE', { eventCount: eventIndex, didReceiveAgentMessage, isMounted: isMounted.current, isRunningRef: isRunningRef.current });
    
            if (isMounted.current && !didReceiveAgentMessage && isRunningRef.current) {
                console.warn("[Wizard:Agent] Agent finished but no AI messages received.");
                setMessages(prev => [...prev, { id: uuidv4(), role: 'ai', content: "⚠️ **Connection Error**: I couldn't complete that thought. Please try asking again." }]);
            }
            // Ensure blueprint is applied even if React batched updates; avoids "blueprint is ready below" with no panel
            if (isMounted.current && blueprintReceivedThisRunRef.current) {
                setResult(blueprintReceivedThisRunRef.current);
            }
        } catch (e: any) {
            console.error("Agent Run Error:", e);
            const msg = (e.message || "").toLowerCase();
            let errorToastMsg = t('errors.agentGeneric') || "We couldn't complete your plan. Please try again or simplify your goal.";
            let showErrorAction = true;

            if (msg.includes("timeout") || msg.includes("fetch")) {
                errorToastMsg = t('errors.agentTimeout') || "The request took too long. Please try again.";
            } else if (msg.includes("401") || msg.includes("api key")) {
                errorToastMsg = t('errors.agentConfig') || "AI service configuration issue. Please try again later.";
                showErrorAction = false;
            } else if (msg.includes("rate") || msg.includes("429")) {
                errorToastMsg = t('errors.agentRateLimit') || "Too many requests. Please wait a moment and try again.";
            }

            toast.error(errorToastMsg, {
                action: showErrorAction ? { label: t('common.retry') || "Retry", onClick: () => runAgent(userText) } : undefined
            });
            setMessages(prev => [...prev, { id: uuidv4(), role: 'ai', content: `⚠️ **Error**: ${errorToastMsg}` }]);
        }
        finally {
            isRunningRef.current = false;
            if (isMounted.current) {
                setIsAgentRunning(false);
                setIsTyping(false);
                setAgentPhase('thinking');
            }
        }
    };

    const runAgent = async (userText: string) => runAgentInternal(userText);

    const editUserMessageOnce = async (messageId: string, newContent: string) => {
        const trimmed = (newContent ?? '').trim();
        if (!trimmed) {
            toast.error(t('wizard.emptyMessageError') || "Message can't be empty.");
            return;
        }
        if (isRunningRef.current || isTyping || isAgentRunning) {
            toast.info(t('wizard.waitUntilDone') || "Wait for the agent to finish, then edit.");
            return;
        }

        const latestUserMessageId = [...messages].reverse().find((m) => m.role === 'user')?.id ?? null;
        if (!latestUserMessageId || latestUserMessageId !== messageId) {
            toast.info(t('wizard.editLatestOnly') || "You can only edit your latest message.");
            return;
        }

        const idx = messages.findIndex((m) => m.id === messageId);
        if (idx < 0) return;
        const target = messages[idx];
        if (target.role !== 'user') return;
        if (target.editedOnce) return;

        const seedHistory = messages
            .slice(0, idx)
            .filter((m) => m.role === 'user' || m.role === 'ai')
            .map((m) => (m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)));

        const newThreadId = uuidv4();
        setThreadId(newThreadId);

        // Rewind chat to edited prompt (everything after becomes invalid).
        const updated: Message = { ...target, content: trimmed, editedOnce: true };
        setMessages([...messages.slice(0, idx), updated]);

        // Re-run agent from this point with a fresh thread.
        await runAgentInternal(trimmed, {
            appendUserMessage: false,
            seedMessages: seedHistory,
            threadIdOverride: newThreadId,
        });
    };

    const handleStop = () => {
        isRunningRef.current = false;
        setIsAgentRunning(false);
        setIsTyping(false);
        toast.info("Generation stopped by user");
    };

    const handleSafeRestart = async () => {
        // When a final plan exists, show confirmation (credit already consumed)
        const isTeaser = (result as any)?.isTeaser;
        if (result && !isTeaser) {
            setShowRestartConfirm(true);
            return;
        }
        if (!result && messages.length > 0) {
             const answers = finalAnswers.length ? finalAnswers : messages.filter(m => m.role === 'user').map(m => m.content);
             const bp: Blueprint = {
                id: initialBlueprint?.id ?? crypto.randomUUID(),
                framework: framework || (result?.type as FrameworkId) || "general",
                title: initialBlueprint?.title ?? blueprintTitleFromAnswers(answers),
                answers,
                result: result || { type: framework } as any,
                createdAt: initialBlueprint?.createdAt ?? new Date().toISOString(),
             };
  
             try {
                 await onSaveBlueprint?.(bp);
                 if (supabase) {
                    const persistable = messages
                        .filter((m) => m.role === 'user' || m.role === 'ai')
                        .map((m) => ({ role: m.role as 'user' | 'ai', content: m.content }));
                    await syncBlueprintMessages(supabase, bp.id, persistable);
                 }
                 toast.success(t('wizard.draftSavedToBlueprints'));
             } catch (e) {
                 if (!confirm("Auto-save failed. Restart anyway?")) return;
             }
        }
        clearSession();
    };

    const handleConfirmRestart = () => {
        setShowRestartConfirm(false);
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

    const promoteDraftToResult = () => {
        if (!draftResult || !draftResult.type || draftResult.isTeaser) return;
        setResult(draftResult as BlueprintResult);
        setFinalAnswers(messages.filter(m => m.role === 'user').map(m => m.content));
        if (supabase) {
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user?.id) {
                    supabase.rpc('decrement_credits', { amount_to_deduct: 1 })
                        .then(({ data, error }) => {
                            if (!error && data != null) setCredits(data as number);
                        })
                        .catch(() => {});
                }
            });
        }
        trackEvent('wizard_completed', { framework: framework || (draftResult as any).framework });
    };

    const handleSave = async () => {
        const answers = finalAnswers.length ? finalAnswers : messages.filter(m => m.role === 'user').map(m => m.content);
        const bp: Blueprint = {
          id: initialBlueprint?.id ?? crypto.randomUUID(),
          framework: framework || (result?.type as FrameworkId) || "general",
          title: initialBlueprint?.title ?? blueprintTitleFromAnswers(answers),
          answers,
          result,
          createdAt: initialBlueprint?.createdAt ?? new Date().toISOString(),
        };
    
        try {
          await onSaveBlueprint?.(bp);
          if (supabase) {
            const persistable = messages
                .filter((m) => m.role === 'user' || m.role === 'ai')
                .map((m) => ({ role: m.role as 'user' | 'ai', content: m.content }));
            syncBlueprintMessages(supabase, bp.id, persistable).catch((err: any) => console.error("Failed to sync chat history", err));
          }
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
        agentStatus: t(`wizard.phase.${agentPhase}`),
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
        editUserMessageOnce,
        toggleListening,
        handleStop,
        handleSafeRestart,
        handleConfirmRestart,
        showRestartConfirm,
        setShowRestartConfirm,
        handleSave,
        updateResult,
        promoteDraftToResult,
        toggleHardMode
    };
};
