import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'motion/react';
import { Minimize2, ZoomIn, ZoomOut, RotateCcw, Copy, ArrowLeft, ArrowRight, Grid, Layout, MousePointerClick, ChevronLeft, ChevronRight } from 'lucide-react';
import { EditableText } from '../Editable';
import { toast } from 'sonner';
import { cn } from '../ui/utils';

// --- Types ---
interface MandalaCategory {
  name: string;
  steps: string[];
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
    className = ""
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
    className?: string;
}) => {
    return (
        <div 
            className={cn(
                "relative group/cell flex flex-col p-2 rounded-lg md:rounded-xl border transition-all duration-300 h-full min-h-0", // h-full min-h-0 for internal scrolling
                isTitle 
                    ? "bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/20" 
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-lg hover:z-20",
                className
            )}
        >
            <div className={cn("w-full h-full overflow-y-auto custom-scrollbar flex flex-col justify-center", isTitle && "items-center text-center font-bold")}>
                 <EditableText 
                    value={value} 
                    onChange={onChange}
                    multiline
                    className={cn(
                        "w-full bg-transparent border-transparent px-0 py-0 focus:ring-0 leading-snug resize-none",
                        isTitle 
                            ? "text-sm md:text-base lg:text-lg text-center font-bold placeholder:text-blue-200" 
                            : "text-xs md:text-sm text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 h-full"
                    )}
                    placeholder={isTitle ? "Title" : "Step..."}
                 />
            </div>

            {/* Controls */}
            <div className={cn(
                "absolute -bottom-1 -right-1 flex gap-1 transition-all duration-200 z-30 scale-90",
                isFocused ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 group-hover/cell:opacity-100 group-hover/cell:translate-y-0"
            )}>
                {!isTitle && onMovePrev && (
                    <div className="flex bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onMovePrev(); }}
                            disabled={!canMovePrev}
                            className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed border-r border-zinc-200 dark:border-zinc-700"
                            title="Move Previous"
                        >
                            <ArrowLeft size={14} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onMoveNext(); }}
                            disabled={!canMoveNext}
                            className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move Next"
                        >
                            <ArrowRight size={14} />
                        </button>
                    </div>
                )}
                <button 
                    onClick={(e) => { e.stopPropagation(); onCopy(); }}
                    className="p-1.5 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-lg"
                    title="Copy text"
                >
                    <Copy size={14} />
                </button>
            </div>
        </div>
    );
};

const ClusterValues = ({ 
  title, 
  items, 
  isCenter = false,
  onTitleChange,
  onItemChange,
  onFocus,
  onDoubleClick,
  isFocused, 
  isZoomedIn,
  onReorder,
  onCopy
}: { 
  title: string, 
  items: string[], 
  isCenter?: boolean,
  onTitleChange: (val: string) => void,
  onItemChange: (idx: number, val: string) => void,
  onFocus?: () => void,
  onDoubleClick?: () => void,
  isFocused?: boolean,
  isZoomedIn?: boolean,
  onReorder: (fromIdx: number, toIdx: number) => void,
  onCopy: (text: string) => void
}) => {
  const getCellData = (cellIndex: number) => {
    if (cellIndex === 4) return { value: title, isTitle: true };
    const itemIndex = cellIndex > 4 ? cellIndex - 1 : cellIndex;
    return { value: items[itemIndex] || "", isTitle: false, itemIndex };
  };

  return (
    <motion.div 
      className={cn(
        // FIX: Grid Rows 3 ensures it splits height evenly. h-full fills the parent.
        "grid grid-cols-3 grid-rows-3 gap-2 md:gap-3 p-2 md:p-3 rounded-2xl border transition-all duration-300 h-full min-h-0", 
        isCenter 
          ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700/50" 
          : "bg-white/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-800",
        isFocused && !isZoomedIn && "ring-2 ring-blue-500 shadow-xl z-10 bg-white dark:bg-black/40",
         // When zoomed in, remove borders/bg from the cluster container to let cells breathe? Or keep them?
         // Keeping them provides structure.
        isZoomedIn && "gap-4 md:gap-6 p-6 md:p-10 border-none bg-transparent shadow-none"
      )}
      onClick={(e) => { 
          if(onFocus) {
              e.stopPropagation(); 
              onFocus(); 
          }
      }}
      onDoubleClick={(e) => {
          if (onDoubleClick) {
              e.stopPropagation();
              onDoubleClick();
          }
      }}
      layoutId={isCenter ? 'center-cluster' : undefined}
    >
      {Array.from({ length: 9 }).map((_, cellIndex) => {
        const { value, isTitle, itemIndex } = getCellData(cellIndex);
        return (
          <MandalaCell 
            key={cellIndex}
            value={value}
            isTitle={isTitle}
            onChange={(val) => isTitle ? onTitleChange(val) : onItemChange(itemIndex!, val)}
            onCopy={() => onCopy(value)}
            onMovePrev={() => !isTitle && itemIndex !== undefined ? onReorder(itemIndex, itemIndex - 1) : undefined}
            onMoveNext={() => !isTitle && itemIndex !== undefined ? onReorder(itemIndex, itemIndex + 1) : undefined}
            canMovePrev={itemIndex !== undefined && itemIndex > 0}
            canMoveNext={itemIndex !== undefined && itemIndex < 7}
            isFocused={!!isFocused}
            className={cn(
                // h-full ensures it fills the row
                "h-full min-h-0", 
                isTitle && "md:col-span-1",
                isZoomedIn && "shadow-lg text-lg min-h-[120px]" 
            )}
          />
        );
      })}
    </motion.div>
  );
};

export const MandalaView: React.FC<MandalaViewProps> = ({ result, updateResult }) => {
  // State
  const [zoomIndex, setZoomIndex] = useState<number | null>(null); // null = overview, 0-8 = focused cluster
  const [viewMode, setViewMode] = useState<'spatial' | 'list'>('spatial'); // Spatial = Prezi, List = Tabs
  const [showHint, setShowHint] = useState(true);
  
  // Animation Control
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  
  // Dismiss hint
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard Navigation
  useEffect(() => {
    if (viewMode !== 'spatial' || zoomIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setZoomIndex(null);
        if (e.key === 'ArrowLeft') navigate(-1);
        if (e.key === 'ArrowRight') navigate(1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, zoomIndex]);

  // Update Animation when zoomIndex changes
  useEffect(() => {
      if (viewMode !== 'spatial') return;

      if (zoomIndex === null) {
          // Reset to Overview
          // We removed scale(0.68) because the layout is now fully responsive (h-full w-full)
          controls.start({
              scale: 1,
              x: 0,
              y: 0,
              transition: { duration: 0.6, type: "spring", bounce: 0.2 }
          });
      } else {
          // Zoom into specific cluster
          const pos = GRID_POSITIONS[zoomIndex];
          const zoomLevel = 3.2; 
          const xOffset = -(pos.x - 1) * 33.33 * zoomLevel; 
          const yOffset = -(pos.y - 1) * 33.33 * zoomLevel;

          controls.start({
              scale: zoomLevel,
              x: `${xOffset}%`,
              y: `${yOffset}%`,
              transition: { duration: 0.8, type: "spring", bounce: 0.2 }
          });
      }
  }, [zoomIndex, viewMode]);

  const navigate = (direction: -1 | 1) => {
      if (zoomIndex === null) return;
      if (zoomIndex === CENTER_INDEX) {
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
      toast.success("Copied to clipboard");
  };
  const handleCopyFull = () => {
      const lines = [`# ${result.centralGoal || "Mandala Chart"}`, ""];
      (result.categories || []).forEach((cat, i) => {
          lines.push(`## ${i + 1}. ${cat.name || "Untitled Category"}`);
          (cat.steps || []).forEach((step, j) => step && lines.push(`   - ${step}`));
          lines.push("");
      });
      handleCopy(lines.join('\n'));
  };

  if (viewMode === 'list') {
      return (
          <div className="w-full h-[85vh] overflow-y-auto bg-slate-50 dark:bg-[#0a0a0a] rounded-[2rem] border border-slate-200 dark:border-white/5 p-8 custom-scrollbar">
              <div className="flex justify-between items-center mb-8 sticky top-0 bg-slate-50/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md z-20 py-4">
                  <h2 className="text-2xl font-bold">List View</h2>
                  <button onClick={() => setViewMode('spatial')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                      <Grid size={18} /> Switch to Grid
                  </button>
              </div>
              <div className="max-w-3xl mx-auto space-y-12 pb-20">
                  <div className="text-center mb-12">
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Central Goal</span>
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
                                placeholder="Category Name"
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
                                            placeholder="Add step..."
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
    <div className="relative w-full h-[85vh] bg-slate-50 dark:bg-[#0a0a0a] rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-inner select-none group overflow-hidden">
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
             style={{ 
                 backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`, 
                 backgroundSize: '20px 20px' 
             }} 
        />

        {/* Top Controls */}
        <div className="absolute top-6 right-6 z-50 flex gap-2">
            <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-1 rounded-xl border border-white/20 flex gap-1 shadow-sm">
                 <button 
                    onClick={() => setViewMode('list')}
                    className="p-2 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="List View"
                 >
                     <Layout size={18} />
                 </button>
            </div>
             <button onClick={handleCopyFull} className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-2 rounded-xl border border-white/20 text-zinc-600 dark:text-zinc-300 hover:text-blue-600 transition-colors shadow-sm" title="Copy Full Strategy">
                <Copy size={20} />
            </button>
        </div>

        {/* Navigation Overlays (Only when zoomed) */}
        <AnimatePresence>
            {zoomIndex !== null && (
                <>
                    {/* Back Button */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-6 left-6 z-50"
                    >
                        <button 
                            onClick={() => setZoomIndex(null)}
                            className="flex items-center gap-2 px-4 py-2 bg-black/70 text-white rounded-full backdrop-blur-md hover:bg-black/90 transition-colors shadow-xl"
                        >
                            <Minimize2 size={16} /> <span className="text-sm font-medium">Overview</span>
                        </button>
                    </motion.div>

                    {/* Side Arrows */}
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onClick={() => navigate(-1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/80 rounded-full shadow-lg border border-white/20 backdrop-blur-sm transition-all text-zinc-600 dark:text-zinc-300 hover:scale-110"
                        title="Previous Cluster (Left Arrow)"
                    >
                        <ChevronLeft size={24} />
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onClick={() => navigate(1)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/80 rounded-full shadow-lg border border-white/20 backdrop-blur-sm transition-all text-zinc-600 dark:text-zinc-300 hover:scale-110"
                        title="Next Cluster (Right Arrow)"
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 bg-black/70 text-white px-6 py-3 rounded-full backdrop-blur-md text-sm pointer-events-none flex items-center gap-2 shadow-xl border border-white/10"
                >
                    <MousePointerClick size={16} className="animate-pulse" />
                    Double-click any cluster to dive in
                </motion.div>
            )}
        </AnimatePresence>

        {/* Main Infinite Canvas */}
        <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing">
            <motion.div
                animate={controls}
                initial={{ scale: 1, x: 0, y: 0 }}
                drag={zoomIndex === null}
                dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                dragElastic={0.1}
                onDragStart={() => setShowHint(false)}
                // THE FIX: w-full h-full matches container, grid-rows-3 ensures vertical fit
                // Removed fixed aspect ratios and max-width that cause vertical overflow
                className="w-full h-full max-w-[1600px] grid grid-cols-3 grid-rows-3 gap-2 md:gap-4 lg:gap-6 p-4 md:p-6 origin-center"
            >
                {GRID_POSITIONS.map((pos, gridIndex) => {
                    const isCenter = gridIndex === CENTER_INDEX;
                    const isZoomedIn = zoomIndex === gridIndex;
                    
                    if (isCenter) {
                        return (
                            <ClusterValues 
                                key={gridIndex}
                                title={result.centralGoal}
                                items={(result.categories ?? []).map(c => c.name)}
                                isCenter={true}
                                onTitleChange={(val) => updateResult(['centralGoal'], val)}
                                onItemChange={(idx, val) => updateCategoryName(idx, val)}
                                onFocus={() => setZoomIndex(gridIndex)}
                                onDoubleClick={() => setZoomIndex(gridIndex)}
                                isFocused={zoomIndex === null} 
                                isZoomedIn={isZoomedIn}
                                onReorder={(from, to) => reorderCategories(from, to)}
                                onCopy={handleCopy}
                            />
                        );
                    } else {
                        const catIndex = CATEGORY_GRID_INDICES.indexOf(gridIndex);
                        const category = result.categories?.[catIndex];
                        if (!category) return <div key={gridIndex} className="bg-transparent" />;
                        
                        return (
                            <ClusterValues 
                                key={gridIndex}
                                title={category?.name ?? ""}
                                items={category?.steps ?? []}
                                isCenter={false}
                                onTitleChange={(val) => updateCategoryName(catIndex, val)}
                                onItemChange={(stepIdx, val) => updateStep(catIndex, stepIdx, val)}
                                onFocus={() => setZoomIndex(gridIndex)}
                                onDoubleClick={() => setZoomIndex(gridIndex)}
                                isFocused={zoomIndex === null} 
                                isZoomedIn={isZoomedIn}
                                onReorder={(from, to) => reorderSteps(catIndex, from, to)}
                                onCopy={handleCopy}
                            />
                        );
                    }
                })}
            </motion.div>
        </div>
    </div>
  );
};
