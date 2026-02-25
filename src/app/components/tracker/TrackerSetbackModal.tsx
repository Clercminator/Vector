import React, { useState } from 'react';
import { useLanguage } from '@/app/components/language-provider';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';

interface TrackerSetbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export function TrackerSetbackModal({ isOpen, onClose, onConfirm }: TrackerSetbackModalProps) {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(reason);
      setReason('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center border-4 border-red-50 dark:border-red-900/10">
                <ShieldAlert size={32} className="text-red-500" />
            </div>
        </div>
        
        <h3 className="text-2xl font-black text-center mb-2 dark:text-white">{t('tracker.logSetbackTitle') || "Log Setback"}</h3>
        <p className="text-gray-500 text-center mb-6 text-sm">
            {t('tracker.setbackDesc') || "It's okay to stumble. Tracking your setbacks honestly is the best way to understand your triggers and build a stronger streak next time."}
        </p>

        <Textarea 
            placeholder={t('tracker.setbackReasonPlaceholder') || "What happened? Identifying the trigger can help you prepare for similar situations."}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mb-6 h-24 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 rounded-xl"
        />

        <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl">{t('common.cancel')}</Button>
            <Button 
                onClick={handleConfirm} 
                disabled={isSubmitting} 
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
                {t('tracker.confirmSetback') || "Log Setback"}
            </Button>
        </div>
      </div>
    </div>
  );
}
