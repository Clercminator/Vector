import React from 'react';
import { motion } from 'motion/react';
import { Zap, Clock, Share2, Layers, Copy, ArrowUp, ArrowDown, X, Plus } from 'lucide-react';
import { EditableText } from '../Editable';
import { useLanguage } from '@/app/components/language-provider';
import { useIsMobile } from '../ui/use-mobile';
import { DesktopRecommendedBanner } from './DesktopRecommendedBanner';
import { toast } from 'sonner';

interface EisenhowerResult {
  type: 'eisenhower';
  q1: string[];
  q2: string[];
  q3: string[];
  q4: string[];
}

interface EisenhowerViewProps {
  result: EisenhowerResult;
  updateResult: (path: (string | number)[], value: any) => void;
}

const Quadrant = ({ 
  title, 
  items, 
  colorClass, 
  icon, 
  onUpdate, 
  onCopy,
  description
}: { 
  title: string, 
  items: string[], 
  colorClass: string, 
  icon: React.ReactNode, 
  onUpdate: (items: string[]) => void,
  onCopy: () => void,
  description: string
}) => {
  const { t } = useLanguage();

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
    <div className={`p-6 rounded-[2rem] border relative overflow-hidden flex flex-col h-full transition-all hover:shadow-xl ${colorClass}`}>
       {/* Header */}
       <div className="flex items-start justify-between mb-6">
           <div className="flex flex-col gap-1">
               <div className="flex items-center gap-3">
                   {icon}
                   <h4 className="font-bold text-lg uppercase tracking-wide opacity-90">{title}</h4>
               </div>
               <p className="text-xs font-medium opacity-60 ml-11">{description}</p>
           </div>
           
           <button 
                onClick={onCopy}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 opacity-40 hover:opacity-100 transition-all"
                title="Copy list"
                aria-label="Copy list"
           >
               <Copy size={18} />
           </button>
       </div>
       
       {/* List Area */}
       <div className="flex-grow space-y-3 overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 pr-2">
           {items.map((item, i) => (
               <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i} 
                    className="flex items-start gap-3 group relative pl-1"
                >
                   {/* Drag/Move Controls */}
                   <div className="mt-3 flex flex-col gap-1 opacity-0 group-hover:opacity-40 transition-opacity absolute -left-1">
                       <button 
                            onClick={() => handleMove(i, -1)} 
                            disabled={i === 0}
                            className="hover:text-blue-600 disabled:opacity-20 transition-colors"
                            title="Move Up"
                            aria-label="Move Up"
                        >
                           <ArrowUp size={10} strokeWidth={3} />
                       </button>
                       <button 
                            onClick={() => handleMove(i, 1)} 
                            disabled={i === items.length - 1}
                            className="hover:text-blue-600 disabled:opacity-20 transition-colors"
                            title="Move Down"
                            aria-label="Move Down"
                        >
                           <ArrowDown size={10} strokeWidth={3} />
                       </button>
                   </div>

                   {/* Item Content */}
                   <div className="flex-grow bg-white dark:bg-black/20 rounded-2xl p-3 shadow-sm border border-transparent hover:border-black/5 dark:hover:border-white/10 transition-all flex items-start gap-2 relative group/item">
                       <div className="mt-1.5 min-w-[6px] h-[6px] rounded-full bg-current opacity-40" />
                       <EditableText 
                           value={item} 
                           onChange={(val) => handleUpdateItem(i, val)} 
                           multiline
                           className="bg-transparent text-sm md:text-base font-medium leading-relaxed w-full outline-none"
                           placeholder="Type a task..."
                       />
                       
                       <button 
                            onClick={() => handleDeleteItem(i)}
                            className="opacity-0 group-hover/item:opacity-100 p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all absolute top-1 right-1"
                            title="Delete item"
                            aria-label="Delete item"
                       >
                           <X size={14} />
                       </button>
                   </div>
               </motion.div>
           ))}
           
           <button 
                onClick={handleAddItem}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold opacity-50 hover:opacity-100 transition-all mt-4 py-3 rounded-xl border border-dashed border-current hover:bg-black/5 dark:hover:bg-white/5"
           >
               <Plus size={16} />
               {t('common.addItem')}
           </button>
       </div>
    </div>
  );
};

export const EisenhowerView: React.FC<EisenhowerViewProps> = ({ result, updateResult }) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const handleCopy = (items: string[], title: string) => {
      const text = [`# ${title}`, ...items.map(i => `- ${i}`)].join('\n');
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
  };

  const handleCopyFull = () => {
     const sections = [
         { title: t('eisenhower.do'), items: result.q1 },
         { title: t('eisenhower.schedule'), items: result.q2 },
         { title: t('eisenhower.delegate'), items: result.q3 },
         { title: t('eisenhower.eliminate'), items: result.q4 },
     ];
     const text = sections.map(s => `# ${s.title}\n${s.items.map(i => `- ${i}`).join('\n')}`).join('\n\n');
     navigator.clipboard.writeText(text);
     toast.success("Copied full matrix");
  };

  return (
    <div className="mt-8 w-full max-w-[90rem] mx-auto px-4 md:px-8">
       {isMobile && <DesktopRecommendedBanner className="mb-6" />}
       <div className="flex justify-end mb-6">
           <button 
                onClick={handleCopyFull}
                className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-5 py-2.5 rounded-full shadow-sm hover:shadow-md active:scale-95"
           >
               <Copy size={16} />
               Copy Strategy
           </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 p-4 md:p-8 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[3rem] border border-white/40 dark:border-white/5 shadow-2xl relative overflow-hidden">
          
          {/* Background Gradient Orbs */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30 dark:opacity-20">
              <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-400/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-400/20 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gray-400/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
          </div>

          <Quadrant 
              title={t('eisenhower.do')} 
              description={t('eisenhower.desc.urgentImportant')}
              items={result.q1 || []}
              onUpdate={(val) => updateResult(['q1'], val)}
              onCopy={() => handleCopy(result.q1 || [], t('eisenhower.do'))}
              icon={<span className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm"><Zap size={20} className="fill-current" /></span>}
              colorClass="bg-red-50/50 dark:bg-red-950/10 border-red-100/50 dark:border-red-900/30 text-red-900 dark:text-red-100"
          />

          <Quadrant 
              title={t('eisenhower.schedule')} 
              description={t('eisenhower.desc.notUrgentImportant')}
              items={result.q2 || []}
              onUpdate={(val) => updateResult(['q2'], val)}
              onCopy={() => handleCopy(result.q2 || [], t('eisenhower.schedule'))}
              icon={<span className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm"><Clock size={20} className="fill-current" /></span>}
              colorClass="bg-blue-50/50 dark:bg-blue-950/10 border-blue-100/50 dark:border-blue-900/30 text-blue-900 dark:text-blue-100"
          />

          <Quadrant 
              title={t('eisenhower.delegate')} 
              description={t('eisenhower.desc.urgentNotImportant')}
              items={result.q3 || []}
              onUpdate={(val) => updateResult(['q3'], val)}
              onCopy={() => handleCopy(result.q3 || [], t('eisenhower.delegate'))}
              icon={<span className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm"><Share2 size={20} className="fill-current" /></span>}
              colorClass="bg-amber-50/50 dark:bg-amber-950/10 border-amber-100/50 dark:border-amber-900/30 text-amber-900 dark:text-amber-100"
          />

          <Quadrant 
              title={t('eisenhower.eliminate')} 
              description={t('eisenhower.desc.notUrgentNotImportant')}
              items={result.q4 || []}
              onUpdate={(val) => updateResult(['q4'], val)}
              onCopy={() => handleCopy(result.q4 || [], t('eisenhower.eliminate'))}
              icon={<span className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-gray-700/50 flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-sm"><Layers size={20} className="fill-current" /></span>}
              colorClass="bg-gray-100/50 dark:bg-zinc-900/30 border-gray-200/50 dark:border-zinc-800 text-gray-700 dark:text-gray-400"
          />

       </div>
    </div>
  );
};
