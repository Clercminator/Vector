import React, { useState } from 'react';
import { RefreshCcw, Calendar, CheckCircle2, Download, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { Blueprint, blueprintTitleFromAnswers } from '@/lib/blueprints';
import { blueprintToEvents, downloadIcs, exportEventsToGoogleCalendar, getGoogleAccessToken } from '@/lib/calendarExport';
import { exportToPdf } from '@/lib/pdfExport';
import { TIER_CONFIGS, TierId } from '@/lib/tiers';
import { useLanguage } from '@/app/components/language-provider';

import { WizardHeader } from './wizard/WizardHeader';
import { WizardChat } from './wizard/WizardChat';
import { WizardInput } from './wizard/WizardInput';
import { WizardDraft } from './wizard/WizardDraft';
import { WizardResult } from './wizard/WizardResult';
import { useGoalWizard, GoalWizardHookProps } from './wizard/useGoalWizard';

// Re-export interface for consumers
export type { GoalWizardHookProps as GoalWizardProps };

export const GoalWizard: React.FC<GoalWizardHookProps> = (props) => {
  const { t } = useLanguage();
  const [showMobileDraft, setShowMobileDraft] = useState(false);

  // Hook handles all state logic
  const {
      messages,
      inputValue,
      setInputValue,
      isTyping,
      isAgentRunning,
      result,
      draftResult,
      finalAnswers,
      credits,
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
  } = useGoalWizard(props);

  // Export Logic (View Layer Concern)
  const handleExport = () => {
    const answers = finalAnswers.length ? finalAnswers : messages.filter(m => m.role === 'user').map(m => m.content);
    const bp: Blueprint = {
      id: props.initialBlueprint?.id ?? crypto.randomUUID(),
      framework: props.framework,
      title: props.initialBlueprint?.title ?? blueprintTitleFromAnswers(answers),
      answers,
      result: result!, // Only called when result exists
      createdAt: props.initialBlueprint?.createdAt ?? new Date().toISOString(),
    };

    const events = blueprintToEvents(bp);

    toast.promise(
      (async () => {
        try {
          const token = await getGoogleAccessToken();
          await exportEventsToGoogleCalendar(token, events);
          return { mode: "google" as const };
        } catch (e) {
          downloadIcs(`vector-${bp.title}`, events);
          return { mode: "ics" as const, error: e };
        }
      })(),
      {
        loading: t('common.loading'),
        success: (res) => res.mode === "google" ? t('wizard.exportSuccess') : t('wizard.exportIcs'),
        error: t('wizard.exportError'),
      }
    );
  };

  const handlePdfExport = () => {
     if (!result) return;
      const bp: Blueprint = {
        id: props.initialBlueprint?.id ?? crypto.randomUUID(),
        framework: props.framework,
        title: props.initialBlueprint?.title ?? blueprintTitleFromAnswers(finalAnswers),
        answers: finalAnswers,
        result,
        createdAt: props.initialBlueprint?.createdAt ?? new Date().toISOString(),
      };
      exportToPdf(bp);
      toast.success(t('wizard.pdfSuccess'));
  };

  return (
    <div className="relative h-[calc(100vh-5rem)] z-10 flex flex-col overflow-hidden">
      
      <WizardHeader 
          onBack={props.onBack}
          isHardMode={isHardMode}
          onToggleHardMode={toggleHardMode}
          onRestart={handleSafeRestart}
      />

      <div className="flex-grow flex overflow-hidden relative">
        {/* Chat Area & Result */}
        <WizardChat
            messages={messages}
            isTyping={isTyping}
            result={result}
            draftResult={draftResult}
            messagesEndRef={messagesEndRef}
        >
             <WizardResult 
                result={result} 
                updateResult={updateResult} 
                onBack={props.onBack}
             />
        </WizardChat>

        {/* Input Area (Hidden when result is final) */}
        {!result && (
             <WizardInput
                inputValue={inputValue}
                setInputValue={setInputValue}
                onSubmit={(e) => { e.preventDefault(); runAgent(inputValue); }}
                isTyping={isTyping}
                isAgentRunning={isAgentRunning}
                isOffline={isOffline}
                suggestionChips={suggestionChips}
                onRunAgent={runAgent}
                isSpeechSupported={isSpeechSupported}
                toggleListening={toggleListening}
                isListening={isListening}
                onStop={handleStop}
             />
        )}

        {/* Draft Drawer */}
        {!result && draftResult && (
             <WizardDraft 
                draftResult={draftResult}
                showMobileDraft={showMobileDraft}
                setShowMobileDraft={setShowMobileDraft}
                draftPulse={draftPulse}
             />
        )}
      </div>

      {/* Final Action Buttons (Overlay at bottom) */}
      {result && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-4 items-center z-30">
          <button onClick={handleSafeRestart} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-800 rounded-full shadow-lg hover:shadow-xl transition-all font-medium">
              <RefreshCcw size={18} />{t('wizard.restart')}
          </button>
          
          {/* Calendar Export */}
          <button 
             onClick={handleExport} 
             disabled={!TIER_CONFIGS[props.tier || 'free'].canExportCalendar}
             className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-lg transition-all font-medium cursor-pointer ${
                 !TIER_CONFIGS[props.tier || 'free'].canExportCalendar 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:shadow-xl'
             }`}
          >
             {TIER_CONFIGS[props.tier || 'free'].canExportCalendar ? <Calendar size={18} /> : <Lock size={16} />}
             {t('wizard.export')}
          </button>

          {/* PDF Export */}
          <button 
             onClick={handlePdfExport} 
             disabled={!TIER_CONFIGS[props.tier || 'free'].canExportPdf}
             className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-lg transition-all font-medium ${
                 !TIER_CONFIGS[props.tier || 'free'].canExportPdf 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-red-600 text-white hover:shadow-xl'
             }`}
          >
             {TIER_CONFIGS[props.tier || 'free'].canExportPdf ? <Download size={18} /> : <Lock size={16} />}
             PDF
          </button>

          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:shadow-xl transition-all font-medium cursor-pointer">
              <CheckCircle2 size={18} />{t('wizard.save')}
          </button>
        </div>
      )}
    </div>
  );
};
