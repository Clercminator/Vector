import React from 'react';
import { motion } from 'motion/react';
import { Zap, Layers, Copy, ArrowUp, ArrowDown, X, Plus, TrendingUp, Archive } from 'lucide-react';
import { EditableText } from '../Editable';
import { useLanguage } from '@/app/components/language-provider';
import { useIsMobile } from '../ui/use-mobile';
import { DesktopRecommendedBanner } from './DesktopRecommendedBanner';
import { toast } from 'sonner';

interface ParetoResult {
  type: 'pareto';
  vital: string[];
  trivial: string[];
}

interface ParetoViewProps {
  result: ParetoResult;
  updateResult: (path: (string | number)[], value: any) => void;
}

const ParetoList = ({ 
  title, 
  subtitle,
  items, 
  onUpdate, 
  onCopy,
  variant
}: { 
  title: string, 
  subtitle: string,
  items: string[], 
  onUpdate: (items: string[]) => void,
  onCopy: () => void,
  variant: 'vital' | 'trivial'
}) => {
  const { t } = useLanguage();
  const isVital = variant === 'vital';

  const handleUpdateItem = (index: number, val: string) => {
    const newItems = [...items];
    newItems[index] = val;
    onUpdate(newItems);
  };

  const handleDeleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onUpdate(newItems);
  };

  const handleAddItem = () => {
    onUpdate([...items, ""]);
  };

  const handleMove = (index: number, direction: -1 | 1) => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= items.length) return;
      
      const newItems = [...items];
      const [moved] = newItems.splice(index, 1);
      newItems.splice(newIndex, 0, moved);
      onUpdate(newItems);
  };

  return (
    <div className={`p-8 md:p-10 rounded-[2.5rem] border relative overflow-hidden flex flex-col h-full transition-all duration-500 ${
        isVital 
        ? 'bg-gradient-to-br from-white to-blue-50/50 dark:from-zinc-900 dark:to-blue-950/20 border-blue-500/20 shadow-2xl z-10 scale-[1.02]' 
        : 'bg-gray-50/50 dark:bg-zinc-900/30 border-gray-200/60 dark:border-zinc-800'
    }`}>
       {isVital && (
           <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600" />
       )}
       
       {/* Background Decoration */}
       {isVital && (
           <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
       )}

       <div className="flex items-start justify-between mb-8 relative z-10">
           <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl shadow-sm ${
                    isVital 
                    ? 'bg-blue-600 text-white shadow-blue-500/30' 
                    : 'bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-gray-400'
                }`}>
                    {isVital ? <TrendingUp size={24} /> : <Archive size={24} />}
                </div>
                <div>
                     <h4 className={`font-black text-2xl uppercase tracking-tight ${
                         isVital ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                     }`}>{title}</h4>
                     <p className="text-sm font-medium opacity-60 mt-1">{subtitle}</p>
                </div>
           </div>
           
           <button 
                onClick={onCopy}
                className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 opacity-40 hover:opacity-100 transition-all"
                title="Copy list"
                aria-label="Copy list"
           >
               <Copy size={20} />
           </button>
       </div>
       
       <div className="flex-grow space-y-4 relative z-10">
           {items.map((item, i) => (
               <motion.div 
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="flex items-start gap-4 group relative"
                >
                   <div className="mt-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-40 transition-opacity absolute -left-6">
                       <button 
                            type="button"
                            onClick={() => handleMove(i, -1)} 
                            disabled={i === 0}
                            className="hover:text-blue-600 disabled:opacity-20 transition-colors"
                            title="Move up"
                            aria-label="Move up"
                       >
                           <ArrowUp size={12} strokeWidth={3} />
                       </button>
                       <button 
                            type="button"
                            onClick={() => handleMove(i, 1)} 
                            disabled={i === items.length - 1}
                            className="hover:text-blue-600 disabled:opacity-20 transition-colors"
                            title="Move down"
                            aria-label="Move down"
                       >
                           <ArrowDown size={12} strokeWidth={3} />
                       </button>
                   </div>
                   
                   <div className={`
                       font-bold text-lg flex items-center justify-center w-8 h-8 rounded-full border shrink-0 mt-0.5 transition-colors
                       ${isVital 
                           ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400' 
                           : 'bg-transparent border-gray-300 dark:border-zinc-700 text-gray-400 text-base'}
                   `}>
                       {i + 1}
                   </div>

                   <div className="flex-grow">
                       <EditableText 
                           value={item} 
                           onChange={(val) => handleUpdateItem(i, val)} 
                           multiline
                           className={`bg-transparent outline-none w-full ${
                               isVital 
                               ? 'text-gray-900 dark:text-gray-100 font-bold text-xl leading-snug' 
                               : 'text-gray-600 dark:text-gray-400 font-medium text-lg'
                           }`}
                           placeholder="Type a task..."
                       />
                   </div>
                   
                   <button 
                        onClick={() => handleDeleteItem(i)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title="Delete item"
                        aria-label="Delete item"
                   >
                       <X size={18} />
                   </button>
               </motion.div>
           ))}
           <button 
                onClick={handleAddItem}
                className={`flex items-center gap-2 font-bold transition-all mt-6 px-4 py-3 rounded-xl border-2 border-dashed w-full justify-center ${
                    isVital 
                    ? 'border-blue-200 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-zinc-700 text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
           >
               <Plus size={20} />
               {t('common.addItem')}
           </button>
       </div>
    </div>
  );
};

export const ParetoView: React.FC<ParetoViewProps> = ({ result, updateResult }) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const handleCopy = (items: string[], title: string) => {
      const text = [`# ${title}`, ...items.map(i => `- ${i}`)].join('\n');
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
  };

  const handleCopyFull = () => {
     const sections = [
         { title: t('pareto.vital'), items: result.vital },
         { title: t('pareto.trivial'), items: result.trivial },
     ];
     const text = sections.map(s => `# ${s.title}\n${s.items.map(i => `- ${i}`).join('\n')}`).join('\n\n');
     navigator.clipboard.writeText(text);
     toast.success("Copied full Pareto");
  };

  return (
    <div className="mt-8 w-full max-w-[90rem] mx-auto px-4">
        {isMobile && <DesktopRecommendedBanner className="mb-8 max-w-6xl mx-auto" />}
        <div className="flex justify-end mb-8 max-w-6xl mx-auto">
           <button 
                onClick={handleCopyFull}
                className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-5 py-2.5 rounded-full shadow-sm hover:shadow-md active:scale-95"
           >
               <Copy size={16} />
               Copy Strategy
           </button>
       </div>

        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-8 w-full max-w-6xl mx-auto items-start">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col h-full"
          >
            <ParetoList 
                title={t('pareto.vital')}
                subtitle="High Impact (20%)"
                items={result.vital || []}
                onUpdate={(val) => updateResult(['vital'], val)}
                onCopy={() => handleCopy(result.vital || [], t('pareto.vital'))}
                variant="vital"
            />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
             className="flex flex-col h-full opacity-90 hover:opacity-100 transition-opacity"
          >
             <ParetoList 
                title={t('pareto.trivial')}
                subtitle="Lower Impact (80%)"
                items={result.trivial || []}
                onUpdate={(val) => updateResult(['trivial'], val)}
                onCopy={() => handleCopy(result.trivial || [], t('pareto.trivial'))}
                variant="trivial"
            />
          </motion.div>
        </div>
    </div>
  );
};
