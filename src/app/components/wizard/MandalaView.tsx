import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Minimize2, Copy, Grid, Layout, MousePointerClick, ChevronLeft, ChevronRight, ArrowLeft, ListTodo, X } from 'lucide-react';
import { EditableText, EditableList } from '../Editable';
import { toast } from 'sonner';
import { cn } from '../ui/utils';
import { useLanguage } from '@/app/components/language-provider';
import { useIsMobile } from '../ui/use-mobile';
import { DesktopRecommendedBanner } from './DesktopRecommendedBanner';

// --- Types ---
interface MandalaCategory {
  name: string;
  steps: string[];
  why?: string;
  stepWhys?: string[];
  stepSubTasks?: string[][];
}
interface MandalaResult {
  type: 'mandalas';
  centralGoal: string;
  categories: MandalaCategory[];
}
interface MandalaViewProps {
  result: MandalaResult;
  updateResult: (path: (string | number)[], value: any) => void;
}

// --- Constants ---
const GRID_POSITIONS = [
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
  { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
  { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }
];
const CENTER_INDEX = 4;
// Logical ordering for "Next/Prev" navigation
const NAVIGATION_ORDER = [0, 1, 2, 5, 8, 7, 6, 3]; // Clockwise starting top-left
// Map grid index to category index
const CATEGORY_GRID_INDICES = [0, 1, 2, 3, 5, 6, 7, 8];

// --- Components ---

const MandalaCell = ({
    value,
    isTitle,
    onChange,
    onCopy,
    onMovePrev,
    onMoveNext,
    canMovePrev,
    canMoveNext,
    isFocused,
    onOpenDetail,
    className = "",
    t
}: {
    value: string;
    isTitle: boolean;
    onChange: (val: string) => void;
    onCopy: () => void;
    onMovePrev?: () => void;
    onMoveNext?: () => void;
    canMovePrev?: boolean;
    canMoveNext?: boolean;
    isFocused: boolean;
    onOpenDetail?: () => void;
    className?: string;
    t: (key: string) => string;
}) => {
    return (
        <div 
            className={cn(
                "relative group/cell flex flex-col p-3 rounded-xl md:rounded-2xl border transition-all duration-300 h-full min-h-0",
                isTitle 
                    ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-500/80 shadow-lg shadow-blue-500/10 ring-2 ring-blue-400/25" 
                    : "bg-white dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-700/80 hover:border-blue-400/50 dark:hover:border-blue-500/40 hover:shadow-md hover:z-20 active:scale-[0.99]",
                className
            )}
        >
            <div className={cn("w-full h-full overflow-y-auto custom-scrollbar flex flex-col justify-center px-2", isTitle && "items-center text-center font-bold")}>
                 <EditableText 
                    value={value} 
                    onChange={onChange}
                    multiline
                    className={cn(
                        "w-full bg-transparent border-transparent py-0 focus:ring-0 leading-snug resize-none min-w-0",
                        isTitle 
                            ? "text-sm md:text-base lg:text-lg text-center font-bold placeholder:text-blue-200 px-1" 
                            : "text-xs md:text-sm text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 h-full px-1"
                    )}
                    placeholder={isTitle ? t('mandala.titlePlaceholder') : t('mandala.stepPlaceholder')}
                 />
            </div>

            {/* Controls — stopPropagation so reorder/copy never bubble and trigger Back/Overview */}
            <div
                className={cn(
                    "absolute -bottom-1 -right-1 flex gap-1 transition-all duration-200 z-30 scale-90",
                    isFocused ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 group-hover/cell:opacity-100 group-hover/cell:translate-y-0"
                )}
                onClick={(e) => e.stopPropagation()}
                role="group"
                aria-label="Cell actions"
            >
                {!isTitle && onMovePrev && (
                    <div className="flex bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMovePrev(); }}
                            disabled={!canMovePrev}
                            className="p-1.5 cursor-pointer text-zinc-500 hover:text-blue-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed border-r border-zinc-200 dark:border-zinc-700"
                            title={t('mandala.moveStepEarlier')}
                        >
                            <ArrowLeft size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMoveNext(); }}
                            disabled={!canMoveNext}
                            className="p-1.5 cursor-pointer text-zinc-500 hover:text-blue-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
                            title={t('mandala.moveStepLater')}
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCopy(); }}
                    className="p-1.5 cursor-pointer bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-lg"
                    title={t('mandala.copyText')}
                >
                    <Copy size={14} />
                </button>
                {!isTitle && onOpenDetail && (
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenDetail(); }}
                        className="p-1.5 cursor-pointer bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-lg"
                        title={t('mandala.addSubTasks')}
                    >
                        <ListTodo size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

const ClusterDrillDown = ({ 
  title, 
  items, 
  isCenter = false,
  catIndex,
  category,
  onTitleChange,
  onItemChange,
  onReorder,
  onCopy,
  onOpenStepDetail,
  t
}: { 
  title: string; 
  items: string[]; 
  isCenter?: boolean;
  catIndex?: number;
  category?: MandalaCategory;
  onTitleChange: (val: string) => void;
  onItemChange: (idx: number, val: string) => void;
  onReorder: (fromIdx: number, toIdx: number) => void;
  onCopy: (text: string) => void;
  onOpenStepDetail?: (stepIndex: number) => void;
  t: (key: string) => string;
}) => {
  const getCellData = (cellIndex: number) => {
    if (cellIndex === 4) return { value: title, isTitle: true };
    const itemIndex = cellIndex > 4 ? cellIndex - 1 : cellIndex;
    return { value: items[itemIndex] || "", isTitle: false, itemIndex };
  };

  const showCategoryWhy = !isCenter && category?.why?.trim();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full h-full flex flex-col min-h-0"
    >
      {showCategoryWhy && (
        <div className="flex-none mb-3 px-1">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">{t('mandala.whyThisPillar')}</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-snug">{category!.why}</p>
        </div>
      )}
      <div className={cn("flex-1 min-h-0 grid grid-cols-3 grid-rows-3 gap-3 md:gap-5 p-4 md:p-8", "bg-transparent")}>
      {Array.from({ length: 9 }).map((_, cellIndex) => {
        const { value, isTitle, itemIndex } = getCellData(cellIndex);
        return (
          <motion.div
            key={cellIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: cellIndex * 0.02, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="h-full min-h-0"
          >
            <MandalaCell 
              value={value}
              isTitle={isTitle}
              onChange={(val) => isTitle ? onTitleChange(val) : onItemChange(itemIndex!, val)}
              onCopy={() => onCopy(value)}
              onMovePrev={() => !isTitle && itemIndex !== undefined ? onReorder(itemIndex, itemIndex - 1) : undefined}
              onMoveNext={() => !isTitle && itemIndex !== undefined ? onReorder(itemIndex, itemIndex + 1) : undefined}
              canMovePrev={itemIndex !== undefined && itemIndex > 0}
              canMoveNext={itemIndex !== undefined && itemIndex < 7}
              isFocused={true}
              onOpenDetail={!isTitle && onOpenStepDetail && itemIndex !== undefined ? () => onOpenStepDetail(itemIndex) : undefined}
              className={cn(
                "h-full min-h-0 shadow-lg",
                isTitle ? "text-lg md:text-xl lg:text-2xl" : "text-base md:text-lg"
              )}
              t={t}
            />
          </motion.div>
        );
      })}
      </div>
    </motion.div>
  );
};

const OverviewCard = ({
    title,
    isCenter,
    onClick,
    onChange,
    index,
    t
}: {
    title: string;
    isCenter: boolean;
    onClick: () => void;
    onChange: (val: string) => void;
    index: number;
    t: (key: string) => string;
}) => {
    return (
        <motion.div
            layoutId={isCenter ? 'center-cluster-card' : undefined}
            onClick={onClick}
            title={title ? `${title}` : (isCenter ? t('mandala.centralGoalPlaceholder') : t('mandala.categoryPlaceholder'))}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, delay: index * 0.03, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "group cursor-pointer relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-colors duration-200 h-full min-h-[100px]",
                "shadow-md hover:shadow-xl",
                isCenter 
                    ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-500/80 shadow-blue-500/20 ring-2 ring-blue-400/30 hover:ring-blue-400/50" 
                    : "bg-white dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-700/80 hover:border-blue-400/60 dark:hover:border-blue-500/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
            )}
        >
             <div className="w-full text-center pointer-events-none group-hover:pointer-events-auto overflow-visible px-3 min-w-0">
                 <div onClick={(e) => e.stopPropagation()} className="overflow-visible min-w-0 w-full"> 
                    <EditableText
                        value={title}
                        onChange={onChange}
                        multiline
                        className={cn(
                            "text-center font-bold bg-transparent border-transparent w-full resize-none mx-0 px-1 line-clamp-2",
                            isCenter 
                                ? "text-lg md:text-xl text-white placeholder:text-blue-200/80 cursor-text drop-shadow-sm" 
                                : "text-base md:text-lg text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 cursor-text"
                        )}
                        placeholder={isCenter ? t('mandala.centralGoalPlaceholder') : t('mandala.categoryPlaceholder')}
                    />
                 </div>
             </div>
             
             <div className="absolute inset-x-0 bottom-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-center pointer-events-none">
                <span className={cn("text-[10px] uppercase tracking-widest font-medium", isCenter ? "text-blue-200/90" : "text-zinc-400 dark:text-zinc-500")}>
                    {t('mandala.clickToOpen')}
                </span>
             </div>
        </motion.div>
    );
};

export const MandalaView: React.FC<MandalaViewProps> = ({ result, updateResult }) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  // State — default to list on mobile to avoid cramped spatial grid
  const [zoomIndex, setZoomIndex] = useState<number | null>(null); // null = overview, 0-8 = focused cluster
  const [viewMode, setViewMode] = useState<'spatial' | 'list'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'spatial'
  );
  const [showHint, setShowHint] = useState(true);
  const [selectedCellDetail, setSelectedCellDetail] = useState<{ catIndex: number; stepIndex: number } | null>(null);

  // Sync to list when resizing to mobile (e.g. devtools or rotate)
  useEffect(() => {
    if (isMobile) setViewMode('list');
  }, [isMobile]);
  
  // Dismiss hint
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard Navigation
  useEffect(() => {
    if (viewMode !== 'spatial') return;

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (selectedCellDetail) setSelectedCellDetail(null);
          else if (zoomIndex !== null) setZoomIndex(null);
        }
        if (zoomIndex === null || selectedCellDetail) return;
        if (e.key === 'ArrowLeft') navigate(-1);
        if (e.key === 'ArrowRight') navigate(1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, zoomIndex, selectedCellDetail]);

  const navigate = (direction: -1 | 1) => {
      if (zoomIndex === null) return;
      if (zoomIndex === CENTER_INDEX) {
          // Navigating from center usually goes to first category or stays
          setZoomIndex(0);
          return;
      }
      const currentNavIdx = NAVIGATION_ORDER.indexOf(zoomIndex);
      if (currentNavIdx === -1) return; 

      let nextNavIdx = currentNavIdx + direction;
      if (nextNavIdx < 0) nextNavIdx = NAVIGATION_ORDER.length - 1;
      if (nextNavIdx >= NAVIGATION_ORDER.length) nextNavIdx = 0;

      setZoomIndex(NAVIGATION_ORDER[nextNavIdx]);
  };

  // Data Handlers
  const updateCategoryName = (catIndex: number, val: string) => updateResult(['categories', catIndex, 'name'], val);
  const updateStep = (catIndex: number, stepIndex: number, val: string) => {
    const currentSteps = result.categories?.[catIndex]?.steps ?? [];
    const newSteps = [...currentSteps];
    while (newSteps.length <= stepIndex) newSteps.push("");
    newSteps[stepIndex] = val;
    updateResult(['categories', catIndex, 'steps'], newSteps);
  };
  const reorderSteps = (catIndex: number, fromIdx: number, toIdx: number) => {
      const currentSteps = [...(result.categories?.[catIndex]?.steps ?? [])];
      while (currentSteps.length < 8) currentSteps.push("");
      const [moved] = currentSteps.splice(fromIdx, 1);
      currentSteps.splice(toIdx, 0, moved);
      updateResult(['categories', catIndex, 'steps'], currentSteps);
  };
  const reorderCategories = (fromIdx: number, toIdx: number) => {
      const currentCats = [...(result.categories ?? [])];
      if (currentCats.length <= fromIdx || currentCats.length <= toIdx) return;
      const [moved] = currentCats.splice(fromIdx, 1);
      currentCats.splice(toIdx, 0, moved);
      updateResult(['categories'], currentCats);
  };
  const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      toast.success(t('common.copiedToClipboard'));
  };
  const handleCopyFull = () => {
      const lines = [`# ${result.centralGoal || t('mandala.centralGoalPlaceholder')}`, ""];
      (result.categories || []).forEach((cat, i) => {
          lines.push(`## ${i + 1}. ${cat.name || t('mandala.categoryPlaceholder')}`);
          (cat.steps || []).forEach((step, j) => step && lines.push(`   - ${step}`));
          lines.push("");
      });
      handleCopy(lines.join('\n'));
  };

  const updateStepWhy = (catIndex: number, stepIndex: number, val: string) => {
    const cat = result.categories?.[catIndex];
    const current = (cat?.stepWhys ?? []) as string[];
    const next = [...current];
    while (next.length <= stepIndex) next.push("");
    next[stepIndex] = val;
    updateResult(['categories', catIndex, 'stepWhys'], next);
  };
  const updateStepSubTasks = (catIndex: number, stepIndex: number, subTasks: string[]) => {
    const cat = result.categories?.[catIndex];
    const current = (cat?.stepSubTasks ?? []) as string[][];
    const next = current.slice(0, 8).map((arr, i) => (arr ?? []).slice());
    while (next.length <= stepIndex) next.push([]);
    next[stepIndex] = subTasks;
    updateResult(['categories', catIndex, 'stepSubTasks'], next);
  };

  if (viewMode === 'list') {
      return (
          <div className="w-full h-[85vh] overflow-y-auto bg-slate-50 dark:bg-[#0a0a0a] rounded-[2rem] border border-slate-200 dark:border-white/5 p-8 custom-scrollbar">
              {/* Desktop recommendation banner — mobile only */}
              {isMobile && (
                <DesktopRecommendedBanner message={t('mandala.desktopRecommended')} className="mb-6" />
              )}
              <div className="flex justify-between items-center mb-8 sticky top-0 bg-slate-50/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md z-20 py-4">
                  <h2 className="text-2xl font-bold">{t('mandala.listView')}</h2>
                  <button onClick={() => setViewMode('spatial')} className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors">
                      <Grid size={18} /> {t('mandala.switchToGrid')}
                  </button>
              </div>
              <div className="max-w-3xl mx-auto space-y-12 pb-20">
                  <div className="text-center mb-12">
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{t('mandala.centralGoalPlaceholder')}</span>
                      <EditableText 
                        value={result.centralGoal} 
                        onChange={(val) => updateResult(['centralGoal'], val)} 
                        className="text-4xl font-black text-center mt-2 bg-transparent border-transparent"
                      />
                  </div>
                  {result.categories?.map((cat, i) => (
                      <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                          <div className="flex items-center gap-4 mb-6">
                              <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">{i+1}</span>
                              <EditableText 
                                value={cat.name} 
                                onChange={(val) => updateCategoryName(i, val)} 
                                className="text-xl font-bold flex-grow bg-transparent border-transparent"
                                placeholder={t('mandala.categoryPlaceholder')}
                              />
                          </div>
                          <div className="grid md:grid-cols-2 gap-4 pl-12">
                               {Array.from({length: 8}).map((_, j) => (
                                   <div key={j} className="flex gap-2 group/item">
                                        <span className="text-zinc-400 text-sm font-mono mt-1 w-6">{j+1}.</span>
                                        <EditableText 
                                            value={cat.steps[j] || ""} 
                                            onChange={(val) => updateStep(i, j, val)}
                                            className="flex-grow text-sm border-b border-zinc-100 dark:border-zinc-800 focus:border-blue-500"
                                            placeholder={t('mandala.stepPlaceholder')}
                                        />
                                   </div>
                               ))}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )
  }

  return (
    <div className="relative w-full min-h-[60vh] h-[calc(100vh-12rem)] bg-gradient-to-b from-slate-50 to-slate-100/80 dark:from-[#0a0a0a] dark:to-zinc-950/80 rounded-[2rem] border border-slate-200/80 dark:border-white/5 shadow-xl shadow-slate-200/20 dark:shadow-black/20 select-none group overflow-hidden flex flex-col">
        
        {/* Desktop recommendation banner — mobile only (when user switches to grid) */}
        {isMobile && (
          <DesktopRecommendedBanner message={t('mandala.desktopRecommended')} className="flex-none mx-4 mt-4 z-50 [&_p]:text-xs" />
        )}
        
        {/* Background Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06] pointer-events-none bg-[radial-gradient(circle,currentColor_1px,transparent_1px)] [background-size:20px_20px]" 
        />

        {/* Top Controls */}
        <div className="absolute top-6 right-6 z-50 flex gap-2">
            <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-1 rounded-xl border border-white/20 flex gap-1 shadow-sm">
                 <button 
                    onClick={() => setViewMode('list')}
                    className="p-2 cursor-pointer rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    title={t('mandala.listView')}
                 >
                     <Layout size={18} />
                 </button>
            </div>
             <button onClick={handleCopyFull} className="cursor-pointer bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-2 rounded-xl border border-white/20 text-zinc-600 dark:text-zinc-300 hover:text-blue-600 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2" title={t('mandala.copyFullStrategy')}>
                <Copy size={20} />
            </button>
        </div>

        {/* Navigation & Back Button (Only when zoomed) */}
        <AnimatePresence>
            {zoomIndex !== null && (
                <>
                    {/* Back Button */}
                    <motion.div 
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="absolute top-6 left-6 z-50"
                    >
                        <button 
                            onClick={() => setZoomIndex(null)}
                            title={t('mandala.backToOverviewTitle')}
                            className="flex items-center gap-2 cursor-pointer px-4 py-2.5 bg-white/95 dark:bg-zinc-900/95 text-zinc-800 dark:text-zinc-200 rounded-full border border-zinc-200/80 dark:border-zinc-700/80 backdrop-blur-md hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:shadow-md active:scale-[0.98] transition-all duration-200 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        >
                            <Minimize2 size={16} /> <span className="text-sm font-medium">{t('mandala.backToOverview')}</span>
                        </button>
                    </motion.div>

                    {/* Side Arrows */}
                    <motion.button
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.25, delay: 0.05 }}
                        onClick={() => navigate(-1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 cursor-pointer bg-white/90 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 rounded-full shadow-lg border border-zinc-200/80 dark:border-zinc-700/80 backdrop-blur-sm transition-all duration-200 text-zinc-600 dark:text-zinc-300 hover:scale-110 hover:shadow-xl active:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        title={t('mandala.previousCluster')}
                    >
                        <ChevronLeft size={24} />
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        transition={{ duration: 0.25, delay: 0.05 }}
                        onClick={() => navigate(1)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 cursor-pointer bg-white/90 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 rounded-full shadow-lg border border-zinc-200/80 dark:border-zinc-700/80 backdrop-blur-sm transition-all duration-200 text-zinc-600 dark:text-zinc-300 hover:scale-110 hover:shadow-xl active:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        title={t('mandala.nextCluster')}
                    >
                        <ChevronRight size={24} />
                    </motion.button>
                </>
            )}
        </AnimatePresence>

        {/* Helper Hint */}
        <AnimatePresence>
            {showHint && zoomIndex === null && (
                <motion.div 
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-zinc-900/90 dark:bg-white/10 text-white dark:text-zinc-100 px-5 py-2.5 rounded-full backdrop-blur-md text-sm pointer-events-none flex items-center gap-2 shadow-lg border border-white/10"
                >
                    <MousePointerClick size={14} className="animate-pulse text-blue-300" />
                    <span>{t('mandala.clickAnyCardToEdit')}</span>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Drill-down hint: Esc to go back */}
        <AnimatePresence>
            {zoomIndex !== null && !selectedCellDetail && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 text-xs text-zinc-500 dark:text-zinc-400 pointer-events-none"
                >
                    {t('mandala.pressEscToGoBack')}
                </motion.div>
            )}
        </AnimatePresence>

        {/* Cell detail panel: sub-tasks and "why" for one step */}
        <AnimatePresence>
            {selectedCellDetail && (() => {
              const { catIndex, stepIndex } = selectedCellDetail;
              const category = result.categories?.[catIndex];
              if (!category) return null;
              const stepText = category.steps?.[stepIndex] ?? "";
              const stepWhy = (category.stepWhys ?? [])[stepIndex] ?? "";
              const subTasks = (category.stepSubTasks ?? [])[stepIndex] ?? [];
              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
                  onClick={() => setSelectedCellDetail(null)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl p-6 custom-scrollbar"
                  >
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        {t('mandala.stepDetail')} — {t('mandala.stepOf').replace('{0}', String(stepIndex + 1)).replace('{1}', '8')}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setSelectedCellDetail(null)}
                        className="p-2 cursor-pointer rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        aria-label={t('common.close')}
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <p className="text-base font-medium text-zinc-800 dark:text-zinc-200 mb-4 pr-8">{stepText || t('mandala.untitledStep')}</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">{t('mandala.whyThisStep')}</label>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-1">{t('mandala.whyThisStepHelp')}</p>
                        <EditableText
                          value={stepWhy}
                          onChange={(val) => updateStepWhy(catIndex, stepIndex, val)}
                          multiline
                          className="text-sm text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 w-full min-h-[80px]"
                          placeholder={t('mandala.whyThisStepPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">{t('mandala.subTasks')}</label>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-1">{t('mandala.subTasksHelp')}</p>
                        <EditableList
                          items={Array.isArray(subTasks) ? subTasks : []}
                          onChange={(items) => updateStepSubTasks(catIndex, stepIndex, items)}
                          placeholder={t('mandala.subTasksPlaceholder')}
                          className="space-y-2"
                          itemClassName="text-sm"
                        />
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })()}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="w-full h-full flex items-center justify-center p-4 md:p-8 lg:p-12 overflow-hidden">
            <AnimatePresence mode="wait">
                {zoomIndex === null ? (
                    // OVERVIEW MODE
                    <motion.div 
                        key="overview"
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="w-full h-full max-w-[1200px] grid grid-cols-3 grid-rows-3 gap-3 md:gap-4 lg:gap-6"
                    >
                        {GRID_POSITIONS.map((_, gridIndex) => {
                            const isCenter = gridIndex === CENTER_INDEX;
                            if (isCenter) {
                                return (
                                    <OverviewCard
                                        key={gridIndex}
                                        index={gridIndex}
                                        title={result.centralGoal}
                                        isCenter={true}
                                        onClick={() => setZoomIndex(gridIndex)}
                                        onChange={(val) => updateResult(['centralGoal'], val)}
                                        t={t}
                                    />
                                );
                            } else {
                                const catIndex = CATEGORY_GRID_INDICES.indexOf(gridIndex);
                                const category = result.categories?.[catIndex];
                                return (
                                    <OverviewCard
                                        key={gridIndex}
                                        index={gridIndex}
                                        title={category?.name ?? ""}
                                        isCenter={false}
                                        onClick={() => setZoomIndex(gridIndex)}
                                        onChange={(val) => updateCategoryName(catIndex, val)}
                                        t={t}
                                    />
                                );
                            }
                        })}
                    </motion.div>
                ) : (
                    // DRILL-DOWN MODE
                    <motion.div 
                        key="drilldown"
                        className="w-full h-full max-w-[1200px] flex items-center justify-center"
                    >
                         {/* We render the specific DrillDown cluster based on zoomIndex */}
                         {(() => {
                             if (zoomIndex === CENTER_INDEX) {
                                  return (
                                      <ClusterDrillDown 
                                        title={result.centralGoal}
                                        items={(result.categories ?? []).map(c => c.name)}
                                        isCenter={true}
                                        onTitleChange={(val) => updateResult(['centralGoal'], val)}
                                        onItemChange={(idx, val) => updateCategoryName(idx, val)}
                                        onReorder={(from, to) => reorderCategories(from, to)}
                                        onCopy={handleCopy}
                                        t={t}
                                      />
                                  );
                             } else {
                                 const catIndex = CATEGORY_GRID_INDICES.indexOf(zoomIndex);
                                 const category = result.categories?.[catIndex];
                                 if (!category) return null;
                                 
                                 return (
                                     <ClusterDrillDown 
                                        title={category?.name ?? ""}
                                        items={category?.steps ?? []}
                                        isCenter={false}
                                        catIndex={catIndex}
                                        category={category}
                                        onTitleChange={(val) => updateCategoryName(catIndex, val)}
                                        onItemChange={(stepIdx, val) => updateStep(catIndex, stepIdx, val)}
                                        onReorder={(from, to) => reorderSteps(catIndex, from, to)}
                                        onCopy={handleCopy}
                                        onOpenStepDetail={(stepIndex) => setSelectedCellDetail({ catIndex, stepIndex })}
                                        t={t}
                                     />
                                 );
                             }
                         })()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
};
