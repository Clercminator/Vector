import React from 'react';
import { motion } from 'motion/react';
import { Heart, Star, Globe, DollarSign, Copy, Target } from 'lucide-react';
import { EditableText } from '../Editable';
import { useLanguage } from '@/app/components/language-provider';
import { useIsMobile } from '../ui/use-mobile';
import { DesktopRecommendedBanner } from './DesktopRecommendedBanner';
import { toast } from 'sonner';

interface IkigaiResult {
  type: 'ikigai';
  love: string;
  goodAt: string;
  worldNeeds: string;
  paidFor: string;
  purpose: string;
}

interface IkigaiViewProps {
  result: IkigaiResult;
  updateResult: (path: (string | number)[], value: any) => void;
}

interface IkigaiSectionProps {
  title: string;
  icon: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  onCopy: () => void;
  colorClass: string;
  delay?: number;
}

const IkigaiSection: React.FC<IkigaiSectionProps> = ({ 
  title, 
  icon, 
  value, 
  onChange, 
  onCopy, 
  colorClass,
  delay = 0 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`relative p-8 rounded-[2rem] border overflow-hidden group hover:shadow-xl transition-all duration-300 ${colorClass}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {icon}
          <h4 className="font-bold text-lg uppercase tracking-wide opacity-90">{title}</h4>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 opacity-40 hover:opacity-100 transition-all cursor-pointer"
          title="Copy section"
          aria-label="Copy section"
        >
          <Copy size={18} />
        </button>
      </div>

      <EditableText 
        value={value} 
        onChange={onChange}
        multiline
        className="text-lg font-medium leading-relaxed bg-transparent outline-none w-full"
        placeholder="Type here..."
      />
    </motion.div>
  );
};

export const IkigaiView: React.FC<IkigaiViewProps> = ({ result, updateResult }) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const handleCopySection = (text: string, title: string) => {
    navigator.clipboard.writeText(`# ${title}\n${text}`);
    toast.success(t('common.copiedToClipboard'));
  };

  const handleCopyFull = () => {
    const parts = [
      `# ${t('ikigai.purpose')}\n${result.purpose || ''}`,
      `\n## ${t('ikigai.love')}\n${result.love || ''}`,
      `\n## ${t('ikigai.goodAt')}\n${result.goodAt || ''}`,
      `\n## ${t('ikigai.worldNeeds')}\n${result.worldNeeds || ''}`,
      `\n## ${t('ikigai.paidFor')}\n${result.paidFor || ''}`,
    ];
    navigator.clipboard.writeText(parts.join('\n'));
    toast.success(t('common.copiedToClipboard'));
  };

  return (
    <div className="mt-8 w-full max-w-6xl mx-auto px-4 pb-12">
      {isMobile && <DesktopRecommendedBanner className="mb-8" />}
      {/* Top Bar with Copy Strategy */}
      <div className="flex justify-end mb-8">
        <button
          type="button"
          onClick={handleCopyFull}
          className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-5 py-2.5 rounded-full shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
        >
          <Copy size={16} />
          Copy Strategy
        </button>
      </div>

      {/* Main Content Helper Wrapper */}
      <div className="space-y-6">
        
        {/* Central Purpose - The "Core" */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-gradient-to-br from-rose-500 to-pink-600 rounded-[2.5rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden text-center"
        >
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            
            <div className="relative z-10 max-w-3xl mx-auto">
                <div className="flex items-center justify-center gap-2 mb-6 opacity-90">
                    <Target size={20} className="text-rose-200" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">{t('ikigai.purpose')}</span>
                </div>
                
                <div className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
                    <EditableText 
                        value={result.purpose}
                        onChange={(val) => updateResult(['purpose'], val)}
                        multiline
                        className="bg-transparent text-center placeholder:text-rose-200/50"
                        placeholder="Your Purpose..."
                    />
                </div>
            </div>
        </motion.div>

        {/* The 4 Circles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Love */}
           <IkigaiSection 
              title={t('ikigai.love')}
              icon={<Heart className="text-rose-500 fill-rose-500/20" size={24} />}
              value={result.love}
              onChange={(val) => updateResult(['love'], val)}
              onCopy={() => handleCopySection(result.love, t('ikigai.love'))}
              colorClass="bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-900 dark:text-rose-100"
              delay={0.1}
           />

           {/* Good At */}
           <IkigaiSection 
              title={t('ikigai.goodAt')}
              icon={<Star className="text-amber-500 fill-amber-500/20" size={24} />}
              value={result.goodAt}
              onChange={(val) => updateResult(['goodAt'], val)}
              onCopy={() => handleCopySection(result.goodAt, t('ikigai.goodAt'))}
              colorClass="bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-900 dark:text-amber-100"
              delay={0.2}
           />

           {/* World Needs */}
           <IkigaiSection 
              title={t('ikigai.worldNeeds')}
              icon={<Globe className="text-blue-500 fill-blue-500/20" size={24} />}
              value={result.worldNeeds}
              onChange={(val) => updateResult(['worldNeeds'], val)}
              onCopy={() => handleCopySection(result.worldNeeds, t('ikigai.worldNeeds'))}
              colorClass="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-900 dark:text-blue-100"
              delay={0.3}
           />

           {/* Paid For */}
           <IkigaiSection 
              title={t('ikigai.paidFor')}
              icon={<DollarSign className="text-emerald-500 fill-emerald-500/20" size={24} />}
              value={result.paidFor}
              onChange={(val) => updateResult(['paidFor'], val)}
              onCopy={() => handleCopySection(result.paidFor, t('ikigai.paidFor'))}
              colorClass="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-100"
              delay={0.4}
           />
        </div>

      </div>
    </div>
  );
};
