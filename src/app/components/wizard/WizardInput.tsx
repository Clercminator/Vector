import React, { useState } from 'react';
import { Send, Mic, WifiOff, Maximize2, Minimize2 } from 'lucide-react';
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
  onStop
}) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (expanded) {
        if (e.shiftKey) return; // Shift+Enter = newline
        e.preventDefault();
        if (inputValue.trim()) onSubmit(e as unknown as React.FormEvent);
      } else {
        e.preventDefault();
        if (inputValue.trim()) onSubmit(e as unknown as React.FormEvent);
      }
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
    <div className="flex-none p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-gray-100 dark:border-zinc-800 z-20 pb-safe">
      <div className="max-w-4xl mx-auto w-full relative">
      
      {/* Suggestion Chips */}
      {!isTyping && !isAgentRunning && (suggestionChips || []).length > 0 && (
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

        {/* Expand / Collapse */}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? t('wizard.inputCollapse') : t('wizard.inputExpand')}
          title={expanded ? t('wizard.inputCollapse') : t('wizard.inputExpand')}
          className={`absolute right-14 w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-700 ${expanded ? 'top-6' : 'top-1/2 -translate-y-1/2'}`}
        >
          {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        <button
          type="submit"
          aria-label="Send message"
          disabled={!inputValue.trim() || isTyping || isAgentRunning || isOffline}
          className={`absolute right-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${expanded ? 'top-6' : 'top-1/2 -translate-y-1/2'} ${
              (!inputValue.trim() && !isAgentRunning) || isOffline ? 'bg-gray-200 text-gray-400 dark:bg-zinc-800 dark:text-zinc-600' : 'bg-black dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95'
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
