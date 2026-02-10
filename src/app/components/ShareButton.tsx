import React from 'react';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/app/components/language-provider';

export function ShareButton() {
  const { t } = useLanguage();

  const handleShare = async () => {
    const shareData = {
      title: t('share.title'),
      text: t('share.text'),
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Share failed/cancelled", err);
      }
    } else {
      // Fallback
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast.success(t('share.success'));
      } catch (err) {
        toast.error(t('share.error'));
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors rounded px-1 hover:bg-gray-100 dark:hover:bg-zinc-800 h-6"
      aria-label={t('share.button')}
    >
      <Share2 size={16} className="shrink-0" />
      <span>{t('share.button')}</span>
    </button>
  );
}
