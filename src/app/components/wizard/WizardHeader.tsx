import React from 'react';
import { ArrowLeft, Flame, PlusCircle, Save } from 'lucide-react';
import { useLanguage } from '@/app/components/language-provider';

interface WizardHeaderProps {
  onBack: () => void;
  isHardMode: boolean;
  onToggleHardMode: () => void;
  onRestart: () => void;
  onSave?: () => void | Promise<void>;
  canSave?: boolean;
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({ 
  onBack, 
  isHardMode, 
  onToggleHardMode, 
  onRestart,
  onSave,
  canSave = false,
}) => {
  const { t } = useLanguage();

  return (
    <div data-print-hide data-testid="wizard-header" className="w-full max-w-full mx-auto flex-none pt-4 px-4 md:px-8 flex justify-between items-center bg-transparent z-20">
      <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors group cursor-pointer"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">{t('wizard.exit')}</span>
          </button>

           {/* Hard Mode Toggle */}
           <button
              type="button"
              onClick={onToggleHardMode}
              className={`p-2 rounded-full transition-all cursor-pointer ${isHardMode ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'text-gray-400 hover:text-black dark:hover:text-white'}`}
              title={isHardMode ? "Disable Devil's Advocate" : "Enable Devil's Advocate Mode"}
           >
              <Flame size={18} fill={isHardMode ? "currentColor" : "none"} />
           </button>

           {/* New Conversation Button - Prominent */}
           <button
              type="button"
              onClick={onRestart}
              className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full text-xs md:text-sm font-bold shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
           >
              <PlusCircle size={16} />
              <span className="hidden md:inline">{t('wizard.newConversation') || "New Conversation"}</span>
              <span className="md:hidden">New</span>
           </button>
      </div>

      {/* Save progress — visible whenever there's something to save */}
      <div className="flex items-center gap-2">
        {canSave && onSave && (
          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white text-xs md:text-sm font-medium shadow-md hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 cursor-pointer transition-colors"
            aria-label={t('wizard.save') || 'Save'}
            title={t('wizard.saveProgress') || 'Save progress'}
          >
            <Save size={16} />
            <span className="hidden sm:inline">{t('wizard.save') || 'Save'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
