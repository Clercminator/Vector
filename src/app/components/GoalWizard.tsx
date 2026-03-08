import React, { useState } from 'react';
import { RefreshCcw, Calendar, CheckCircle2, Download, Lock, AlertTriangle, FileText, X } from 'lucide-react';
import { toast } from 'sonner';

import { Blueprint, blueprintTitleFromAnswers } from '@/lib/blueprints';
import { blueprintToEvents, downloadIcs, exportEventsToGoogleCalendar, getGoogleAccessToken, isBlueprintCalendarWorthy } from '@/lib/calendarExport';
import { exportToPdf } from '@/lib/pdfExport';
import { TIER_CONFIGS, TierId } from '@/lib/tiers';
import { useLanguage } from '@/app/components/language-provider';
import { trackEvent } from '@/lib/analytics';

import { cn } from './ui/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
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

  React.useEffect(() => {
      // Fire wizard_started once per session/mount
      // We pass framework if available
      trackEvent('wizard_started', { framework: props.framework });
  }, []);

  // Hook handles all state logic
  const {
      messages,
      inputValue,
      setInputValue,
      isTyping,
      isAgentRunning,
      agentStatus,
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
  } = useGoalWizard(props);

  // Export Logic (View Layer Concern)
  const handleExport = () => {
    const answers = finalAnswers.length ? finalAnswers : messages.filter(m => m.role === 'user').map(m => m.content);
    const bp: Blueprint = {
      id: props.initialBlueprint?.id ?? crypto.randomUUID(),
      framework: props.framework || 'first-principles', // Fallback for ID generation if undefined, likely overwritten by agent
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
        framework: props.framework || 'first-principles',
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
      <AlertDialog open={showRestartConfirm} onOpenChange={setShowRestartConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" />
              {t('wizard.restartWarning.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('wizard.restartWarning.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRestart}
              className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
            >
              {t('wizard.restartWarning.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <WizardHeader 
          onBack={props.onBack}
          isHardMode={isHardMode}
          onToggleHardMode={toggleHardMode}
          onRestart={handleSafeRestart}
      />

      <div className={cn("flex-grow flex flex-col min-h-0", result && "flex")}>
        {/* Result mode: this area scrolls so you can see full grid and chat */}
        {result ? (
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden min-w-0 custom-scrollbar">
            <WizardChat
              messages={messages}
              isTyping={isTyping}
              isAgentRunning={isAgentRunning}
              agentStatus={agentStatus}
              result={result}
              draftResult={draftResult}
              messagesEndRef={messagesEndRef}
              onEditMessage={editUserMessageOnce}
            >
              <WizardResult 
                result={result} 
                updateResult={updateResult} 
                onBack={props.onBack}
              />
            </WizardChat>
          </div>
        ) : (
          /* Draft mode: two-column layout so the right panel can use full height (no absolute/clipping) */
          <div className="flex-1 min-h-0 flex overflow-hidden min-w-0">
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative min-w-0">
              <WizardChat
                messages={messages}
                isTyping={isTyping}
                isAgentRunning={isAgentRunning}
                agentStatus={agentStatus}
                result={result}
                draftResult={draftResult}
                messagesEndRef={messagesEndRef}
                onEditMessage={editUserMessageOnce}
              >
                <WizardResult 
                  result={result} 
                  updateResult={updateResult} 
                  onBack={props.onBack}
                />
              </WizardChat>

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
                topAction={draftResult && (
                  <button
                    type="button"
                    onClick={() => setShowMobileDraft(!showMobileDraft)}
                    className="lg:hidden w-full px-4 py-2 bg-black/80 dark:bg-white/90 text-white dark:text-black rounded-full text-xs font-bold shadow-lg backdrop-blur-md flex items-center justify-center gap-2"
                  >
                    {showMobileDraft ? <X size={12} /> : <FileText size={12} />}
                    {showMobileDraft ? t('wizard.closeDraft') : t('wizard.viewDraft')}
                  </button>
                )}
              />
            </div>

            {draftResult && (
              <WizardDraft 
                draftResult={draftResult}
                showMobileDraft={showMobileDraft}
                setShowMobileDraft={setShowMobileDraft}
                draftPulse={draftPulse}
                onFinalize={promoteDraftToResult}
                isTyping={isTyping}
                isAgentRunning={isAgentRunning}
              />
            )}
          </div>
        )}

        {/* Final Action Buttons — fixed footer when result is shown (no overlay, does not block content) */}
        {result && (() => {
          const answers = finalAnswers.length ? finalAnswers : messages.filter(m => m.role === 'user').map(m => m.content);
          const bp: Blueprint = {
            id: props.initialBlueprint?.id ?? '',
            framework: props.framework || 'first-principles',
            title: props.initialBlueprint?.title ?? blueprintTitleFromAnswers(answers),
            answers,
            result,
            createdAt: props.initialBlueprint?.createdAt ?? new Date().toISOString(),
          };
          const showCalendarExport = TIER_CONFIGS[props.tier || 'architect'].canExportCalendar && isBlueprintCalendarWorthy(bp);
          const isTeaser = (result as any)?.isTeaser;
          const showCreditConsumed = !isTeaser;
          return (
          <div className="flex-none flex flex-col gap-3 py-4 px-4 pb-safe border-t border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
            {showCreditConsumed && (
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                {t('wizard.creditConsumedInPlan')}
              </p>
            )}
            <div className="flex flex-wrap gap-2 sm:gap-4 items-center justify-center px-1">
            <button 
              onClick={handleSafeRestart} 
              className="flex items-center gap-2 cursor-pointer px-4 py-2.5 sm:px-6 sm:py-3 bg-white dark:bg-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-800 rounded-full shadow-lg hover:shadow-xl transition-all font-medium text-sm sm:text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 shrink-0"
            >
                <RefreshCcw size={16} className="sm:w-[18px] sm:h-[18px]" />{t('wizard.restart')}
            </button>

            {/* Calendar Export — only when blueprint has multiple schedulable items */}
            {showCalendarExport && (
            <button 
               onClick={handleExport} 
               className="flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-full shadow-lg transition-all font-medium text-sm sm:text-base cursor-pointer bg-blue-600 text-white hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 shrink-0"
            >
               <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" />
               {t('wizard.export')}
            </button>
            )}

            {/* PDF Export */}
            <button 
               onClick={handlePdfExport} 
               disabled={!TIER_CONFIGS[props.tier || 'architect'].canExportPdf}
               className={`flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-full shadow-lg transition-all font-medium text-sm sm:text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 shrink-0 ${
                   !TIER_CONFIGS[props.tier || 'architect'].canExportPdf 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed focus-visible:ring-gray-400' 
                    : 'cursor-pointer bg-red-600 text-white hover:shadow-xl focus-visible:ring-red-500'
               }`}
            >
               {TIER_CONFIGS[props.tier || 'architect'].canExportPdf ? <Download size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Lock size={16} />}
               PDF
            </button>

            <button 
              onClick={handleSave} 
              className="flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:shadow-xl transition-all font-medium text-sm sm:text-base cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black dark:focus-visible:ring-offset-white shrink-0"
            >
                <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" />{t('wizard.save')}
            </button>
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
};
