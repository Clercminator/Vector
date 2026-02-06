import React from 'react';
import { Send, Mic, WifiOff } from 'lucide-react';
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
                 className="px-4 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {chip}
               </button>
            ))}
         </div>
      )}

      <form onSubmit={onSubmit} className="w-full relative">
        <input 
            id="wizard-chat-input"
            name="wizardMessage"
            autoFocus 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            disabled={isTyping || isAgentRunning || isOffline}
            placeholder={isOffline ? "You are offline. Please reconnect to continue." : (isTyping ? "Agent is thinking..." : isListening ? "Listening..." : t('wizard.placeholder'))}
            className={`w-full bg-gray-100 dark:bg-zinc-800 text-black dark:text-white rounded-[2rem] pl-12 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 shadow-inner transition-all ${isOffline ? 'opacity-50 cursor-not-allowed pl-24' : ''}`}
        />
        {/* Offline Indicator in Input Area */}
        {isOffline && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-red-500 font-medium text-sm">
                <WifiOff size={16} />
            </div>
        )}

         {/* Voice Input Button */}
        {isSpeechSupported && !isOffline && (
            <button
                type="button"
                onClick={toggleListening}
                disabled={isTyping || isAgentRunning}
                className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                title="Voice Input"
            >
                <Mic size={18} />
            </button>
        )}

        <button
          type="submit"
          aria-label="Send message"
          disabled={!inputValue.trim() || isTyping || isAgentRunning || isOffline}
          className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
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
                className="absolute right-14 top-1/2 -translate-y-1/2 p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors cursor-pointer"
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
