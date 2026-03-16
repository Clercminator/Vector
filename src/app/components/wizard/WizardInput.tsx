import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, WifiOff, Maximize2, Minimize2, Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '@/app/components/language-provider';

interface WizardInputProps {
  inputValue: string;
  setInputValue: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isTyping: boolean;
  isAgentRunning: boolean;
  isOffline: boolean;
  suggestionChips: string[];
  onRunAgent: (text: string) => void;
  isSpeechSupported: boolean;
  toggleListening: () => void;
  isListening: boolean;
  onStop: () => void;
  /** When true, show "Generate my plan" and "Not ready yet, go deeper" buttons. */
  awaitingPlanConfirmation?: boolean;
  /** Called when user clicks "Generate my plan". */
  onConfirmGenerate?: () => void;
  /** Called when user clicks "Not ready yet, let's keep going deeper" — Vector asks more nuanced questions. */
  onGoDeeper?: () => void;
  /** Renders above suggestion chips (e.g. "Ver borrador" on mobile to avoid overlap) */
  topAction?: React.ReactNode;
}

export const WizardInput: React.FC<WizardInputProps> = ({
  inputValue,
  setInputValue,
  onSubmit,
  isTyping,
  isAgentRunning,
  isOffline,
  suggestionChips,
  onRunAgent,
  isSpeechSupported,
  toggleListening,
  isListening,
  onStop,
  awaitingPlanConfirmation = false,
  onConfirmGenerate,
  onGoDeeper,
  topAction
}) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const generateBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (awaitingPlanConfirmation && generateBtnRef.current) {
      generateBtnRef.current.focus({ preventScroll: true });
    }
  }, [awaitingPlanConfirmation]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter = new line (never send)
        if (!expanded) setExpanded(true);
        return;
      }
      // Enter (no Shift) = send
      e.preventDefault();
      if (inputValue.trim()) onSubmit(e as unknown as React.FormEvent);
    }
  };

  const baseInputClass =
    'w-full bg-gray-100 dark:bg-zinc-800 text-black dark:text-white rounded-[2rem] pl-12 pr-24 py-4 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 shadow-inner transition-all resize-none ' +
    (isOffline ? 'opacity-50 cursor-not-allowed pl-24' : '');
  const overflowClass = expanded
    ? 'overflow-auto min-h-[6rem]'
    : 'overflow-x-auto overflow-y-hidden whitespace-nowrap';
  const placeholder = isOffline
    ? 'You are offline. Please reconnect to continue.'
    : isTyping
      ? 'Agent is thinking...'
      : isListening
        ? 'Listening...'
        : t('wizard.placeholder') || 'Write your answer...';

  return (
    <div data-print-hide className="flex-none p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-gray-100 dark:border-zinc-800 z-20 pb-safe">
      <div className="max-w-4xl mx-auto w-full relative">
      
      {/* Approval gate: two clear, non-blocking choices when Vector is ready to generate the plan */}
      {awaitingPlanConfirmation && onConfirmGenerate && onGoDeeper && (
        <div
          role="region"
          aria-label={t('wizard.approvalGateLabel') || "Ready to generate plan. Choose an action."}
          aria-live="polite"
          className="flex-shrink-0 relative z-10 mb-4 p-4 rounded-2xl bg-gray-50/90 dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-700 shadow-sm"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {t('wizard.planReminderShort') || t('wizard.personalizedPlanReminder') || "Add any other details that matter, or click to generate."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <button
              ref={generateBtnRef}
              type="button"
              onClick={onConfirmGenerate}
              disabled={isTyping || isAgentRunning}
              aria-label={t('wizard.generatePlanAria') || t('wizard.generatePlan') || "Generate my plan"}
              aria-busy={isTyping || isAgentRunning ? "true" : "false"}
              className="flex items-center justify-center gap-2 flex-1 min-w-0 sm:flex-initial px-5 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            >
              {(isTyping || isAgentRunning) ? (
                <Loader2 size={18} className="animate-spin shrink-0" aria-hidden />
              ) : (
                <Sparkles size={18} className="shrink-0" aria-hidden />
              )}
              <span className="truncate">{t('wizard.generatePlan') || 'Generate my plan'}</span>
            </button>
            <button
              type="button"
              onClick={onGoDeeper}
              disabled={isTyping || isAgentRunning}
              aria-label={t('wizard.goDeeperAria') || t('wizard.notReadyGoDeeper') || "Not ready yet, keep exploring with more questions"}
              title={t('wizard.notReadyGoDeeper') || "Not ready yet, let's keep going deeper into the problem"}
              className="flex items-center justify-center gap-2 flex-1 min-w-0 sm:flex-initial px-5 py-3 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-zinc-600 rounded-full font-medium text-sm shadow-sm hover:bg-gray-100 dark:hover:bg-zinc-700 hover:border-gray-300 dark:hover:border-zinc-500 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
            >
              <span className="sm:hidden truncate">{t('wizard.goDeeperShort') || "Go deeper"}</span>
              <span className="hidden sm:inline truncate">{t('wizard.notReadyGoDeeper') || "Not ready yet, let's keep going deeper into the problem"}</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Top action (e.g. Ver borrador on mobile) */}
      {topAction && <div className="mb-3">{topAction}</div>}
      
      {/* Suggestion Chips — hidden when approval gate is visible to reduce clutter */}
      {!awaitingPlanConfirmation && !isTyping && !isAgentRunning && (suggestionChips || []).length > 0 && (
         <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-none">
            {(suggestionChips || []).map((chip) => (
               <button 
                 key={chip}
                 onClick={() => onRunAgent(chip)}
                 disabled={isTyping || isAgentRunning}
                 className="cursor-pointer px-4 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {chip}
               </button>
            ))}
         </div>
      )}

      <form onSubmit={onSubmit} className="w-full relative">
        <div className={`relative ${isOffline ? 'opacity-50' : ''}`}>
          <textarea
            id="wizard-chat-input"
            name="wizardMessage"
            autoFocus
            rows={expanded ? 5 : 1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping || isAgentRunning || isOffline}
            placeholder={placeholder}
            className={`${baseInputClass} ${overflowClass} block`}
          />
        </div>
        {/* Offline Indicator */}
        {isOffline && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-red-500 font-medium text-sm pointer-events-none">
                <WifiOff size={16} />
            </div>
        )}

        {/* Voice Input Button */}
        {isSpeechSupported && !isOffline && (
            <button
                type="button"
                onClick={toggleListening}
                disabled={isTyping || isAgentRunning}
                className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${expanded ? '!top-6 !translate-y-0' : ''} ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                title="Voice Input"
            >
                <Mic size={18} />
            </button>
        )}

        {/* Expand / Collapse — prominent styling for visibility on mobile and desktop */}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? t('wizard.inputCollapse') : t('wizard.inputExpand')}
          title={expanded ? t('wizard.inputCollapse') : t('wizard.inputExpand')}
          className={`absolute right-14 w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer bg-gray-200/90 dark:bg-zinc-700/90 text-gray-700 dark:text-gray-200 border border-gray-300/80 dark:border-zinc-600/80 hover:bg-gray-300 dark:hover:bg-zinc-600 hover:text-black dark:hover:text-white shadow-sm ${expanded ? 'top-6' : 'top-1/2 -translate-y-1/2'}`}
        >
          {expanded ? <Minimize2 size={18} strokeWidth={2.5} /> : <Maximize2 size={18} strokeWidth={2.5} />}
        </button>

        <button
          type="submit"
          aria-label="Send message"
          disabled={!inputValue.trim() || isTyping || isAgentRunning || isOffline}
          className={`absolute right-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${expanded ? 'top-6' : 'top-1/2 -translate-y-1/2'} ${
              (!inputValue.trim() && !isAgentRunning) || isOffline ? 'bg-gray-200 text-gray-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed' : 'cursor-pointer bg-black dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95'
          }`}
        >
          <Send size={20} />
        </button>
        
        {/* Stop Button (only when running) */}
        {isAgentRunning && (
            <button
                type="button"
                onClick={onStop}
                className="absolute right-24 top-1/2 -translate-y-1/2 p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors cursor-pointer"
                title="Stop Generating"
            >
                <div className="w-3 h-3 bg-red-600 rounded-[2px]" />
            </button>
        )}
      </form>
      </div>
    </div>
  );
};
