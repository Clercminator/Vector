import React, { useState, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Minimize2, ZoomIn, ZoomOut, RotateCcw, Copy, ArrowLeft, ArrowRight } from 'lucide-react';
import { EditableText } from '../Editable';
import { toast } from 'sonner';

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
// Grid is 3x3 clusters. Each cluster is 3x3 cells.
// Center cluster (1,1) is the Core Goal + Categories.
// Surrounding 8 clusters are Category + 8 Steps.
// We map the 8 categories to the surrounding grid positions (0-3, 5-8).
// Index mapping:
// 0 1 2
// 3 4 5
// 6 7 8
// Center Cluster is index 4.
// Categories [0..7] map to indices [0,1,2,3,5,6,7,8] in order.
const GRID_POSITIONS = [
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
  { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
  { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }
];
const CENTER_INDEX = 4;
// Map category index (0-7) to grid index (excluding 4)
const CATEGORY_GRID_INDICES = [0, 1, 2, 3, 5, 6, 7, 8];

// --- Components ---

// A single 3x3 Grid Cluster (The "Block")
const ClusterValues = ({ 
  title, 
  items, 
  isCenter = false,
  onTitleChange,
  onItemChange,
  onFocus,
  isFocused,
  onReorder,
  onCopy
}: { 
  title: string, 
  items: string[], 
  isCenter?: boolean,
  onTitleChange: (val: string) => void,
  onItemChange: (idx: number, val: string) => void,
  onFocus: () => void,
  isFocused: boolean,
  onReorder: (fromIdx: number, toIdx: number) => void,
  onCopy: (text: string) => void
}) => {
  // Center cluster: Center cell is Title (Goal), surrounding are Items (Cat names).
  // Satellite cluster: Center cell is Title (Cat name), surrounding are Items (Steps).
  
  // We render 9 cells. 
  // Map 0-8 to correct data.
  // Center cell is index 4.
  const getCellData = (cellIndex: number) => {
    if (cellIndex === 4) return { value: title, isTitle: true };
    // Map surrounding 0-3, 5-8 to items 0-7
    const itemIndex = cellIndex > 4 ? cellIndex - 1 : cellIndex;
    return { value: items[itemIndex] || "", isTitle: false, itemIndex };
  };

  return (
    <motion.div 
      className={`grid grid-cols-3 gap-1 md:gap-2 p-1 md:p-2 rounded-xl border transition-all duration-300 ${
        isCenter 
          ? 'bg-zinc-900/10 dark:bg-zinc-100/5 border-zinc-500/20' 
          : 'bg-white/40 dark:bg-black/20 border-white/10 hover:border-blue-500/30'
      } ${isFocused ? 'ring-2 ring-blue-500 shadow-2xl scale-[1.02] z-10' : ''}`}
      onClick={(e) => { e.stopPropagation(); onFocus(); }}
      layoutId={isCenter ? 'center-cluster' : undefined}
    >
      {Array.from({ length: 9 }).map((_, cellIndex) => {
        const { value, isTitle, itemIndex } = getCellData(cellIndex);
        return (
          <div 
            key={cellIndex} 
            className={`aspect-square flex flex-col items-center justify-center p-1 relative group/cell rounded-md md:rounded-lg backdrop-blur-sm transition-colors border ${
              isTitle 
                ? 'bg-blue-600 text-white font-bold border-blue-500 shadow-inner' 
                : 'bg-white/60 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-800 border-white/20 dark:border-white/5'
            }`}
          >
            <div className={`w-full h-full flex items-center justify-center overflow-auto scrollbar-hide ${isTitle ? 'text-xs md:text-sm lg:text-base' : 'text-[8px] md:text-[10px] lg:text-xs text-zinc-700 dark:text-zinc-300'}`}>
               <EditableText 
                  value={value} 
                  onChange={(val) => isTitle ? onTitleChange(val) : onItemChange(itemIndex!, val)}
                  multiline
                  className="w-full text-center bg-transparent border-transparent min-h-0 focus:ring-0 p-0"
               />
            </div>

            {/* Cell Controls (Hover) */}
            {isFocused && (value || isTitle) && (
                <div className="absolute -top-2 -right-2 opacity-0 group-hover/cell:opacity-100 transition-opacity flex gap-1 z-20">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onCopy(value); }}
                        className="p-1 bg-white dark:bg-zinc-800 rounded-full shadow-md border border-gray-100 dark:border-zinc-700 text-gray-500 hover:text-blue-500"
                        title="Copy text"
                        aria-label="Copy text"
                    >
                        <Copy size={10} />
                    </button>
                    {!isTitle && typeof itemIndex === 'number' && (
                        <>
                             <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newIdx = itemIndex - 1;
                                    if (newIdx >= 0) onReorder(itemIndex, newIdx);
                                }}
                                disabled={itemIndex === 0}
                                className="p-1 bg-white dark:bg-zinc-800 rounded-full shadow-md border border-gray-100 dark:border-zinc-700 text-gray-500 hover:text-blue-500 disabled:opacity-30"
                                title="Move Previous"
                                aria-label="Move Previous"
                            >
                                <ArrowLeft size={10} />
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newIdx = itemIndex + 1;
                                    if (newIdx < 8) onReorder(itemIndex, newIdx);
                                }}
                                disabled={itemIndex === 7}
                                className="p-1 bg-white dark:bg-zinc-800 rounded-full shadow-md border border-gray-100 dark:border-zinc-700 text-gray-500 hover:text-blue-500 disabled:opacity-30"
                                title="Move Next"
                                aria-label="Move Next"
                            >
                                <ArrowRight size={10} />
                            </button>
                        </>
                    )}
                </div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
};

export const MandalaView: React.FC<MandalaViewProps> = ({ result, updateResult }) => {
  const [scale, setScale] = useState(1);
  const [focusedCluster, setFocusedCluster] = useState<number | null>(null); // Grid Index (0-8)
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  // Reset View
  const resetView = () => {
    setScale(1);
    setFocusedCluster(null);
    controls.start({ scale: 1, x: 0, y: 0, transition: { duration: 0.5, type: 'spring' } });
  };

  // Focus on a cluster
  const focusCluster = (index: number) => {
      if (focusedCluster === index) return;
      
      const pos = GRID_POSITIONS[index];
      const xOffset = -(pos.x - 1) * 33.33; // % shift
      const yOffset = -(pos.y - 1) * 33.33; // % shift
      const newScale = 2.5; // Zoom level
      
      setFocusedCluster(index);
      setScale(newScale);
      
      controls.start({
          scale: newScale,
          x: `${xOffset}%`,
          y: `${yOffset}%`,
          transition: { duration: 0.6, type: "spring", damping: 25 }
      });
  };

  // Handlers for Data Updates
  const updateCategoryName = (catIndex: number, val: string) => {
    updateResult(['categories', catIndex, 'name'], val);
  };

  const updateStep = (catIndex: number, stepIndex: number, val: string) => {
    const currentSteps = result.categories?.[catIndex]?.steps ?? [];
    const newSteps = [...currentSteps];
    // Ensure array is long enough if editing a new index
    while (newSteps.length <= stepIndex) newSteps.push("");
    newSteps[stepIndex] = val;
    updateResult(['categories', catIndex, 'steps'], newSteps);
  };

  // Reorder Logic
  // For steps within a category
  const reorderSteps = (catIndex: number, fromIdx: number, toIdx: number) => {
      const currentSteps = [...(result.categories?.[catIndex]?.steps ?? [])];
      // Ensure we have enough items to swap
      while (currentSteps.length < 8) currentSteps.push("");
      
      const [moved] = currentSteps.splice(fromIdx, 1);
      currentSteps.splice(toIdx, 0, moved);
      
      updateResult(['categories', catIndex, 'steps'], currentSteps);
  };

  // For categories
  const reorderCategories = (fromIdx: number, toIdx: number) => {
      const currentCats = [...(result.categories ?? [])];
      if (currentCats.length <= fromIdx || currentCats.length <= toIdx) return;
      
      const [moved] = currentCats.splice(fromIdx, 1);
      currentCats.splice(toIdx, 0, moved);
      
      updateResult(['categories'], currentCats);
  };

  // Copy Logic
  const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
  };

  const handleCopyFull = () => {
      const lines = [];
      lines.push(`# ${result.centralGoal || "Mandala Chart"}`);
      lines.push("");
      
      (result.categories || []).forEach((cat, i) => {
          lines.push(`## ${i + 1}. ${cat.name || "Untitled Category"}`);
          (cat.steps || []).forEach((step, j) => {
              if (step) lines.push(`   - ${step}`);
          });
          lines.push("");
      });
      
      handleCopy(lines.join('\n'));
  };

  return (
    <div className="relative w-full h-[85vh] overflow-hidden bg-slate-50 dark:bg-[#0a0a0a] rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-inner select-none group">
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
             style={{ 
                 backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`, 
                 backgroundSize: '20px 20px' 
             }} 
        />

        {/* Floating Controls */}
        <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-2 rounded-xl shadow-xl border border-white/20">
            <button type="button" onClick={() => { const s = Math.min(scale + 0.5, 5); setScale(s); controls.start({ scale: s }); }} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-zinc-600 dark:text-zinc-300 transition-colors" title="Zoom in" aria-label="Zoom in">
                <ZoomIn size={20} />
            </button>
            <button type="button" onClick={() => { const s = Math.max(scale - 0.5, 0.5); setScale(s); controls.start({ scale: s }); }} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-zinc-600 dark:text-zinc-300 transition-colors" title="Zoom out" aria-label="Zoom out">
                <ZoomOut size={20} />
            </button>
            <button type="button" onClick={resetView} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-zinc-600 dark:text-zinc-300 transition-colors" title="Reset view" aria-label="Reset view">
                <RotateCcw size={20} />
            </button>
            <div className="w-full h-px bg-gray-200 dark:bg-white/10 my-1" />
            <button type="button" onClick={handleCopyFull} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-zinc-600 dark:text-zinc-300 transition-colors" title="Copy full chart" aria-label="Copy full chart">
                <Copy size={20} />
            </button>
        </div>

        {/* Infinite Canvas */}
        <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing">
            <motion.div
                animate={controls}
                drag
                dragConstraints={containerRef}
                dragElastic={0.2}
                dragMomentum={false}
                initial={{ scale: 1, x: 0, y: 0 }}
                className="w-[95%] aspect-square max-w-[1000px] grid grid-cols-3 gap-2 md:gap-6 p-2 md:p-6 origin-center"
            >
                {/* 9 CLUSTERS */}
                {GRID_POSITIONS.map((pos, gridIndex) => {
                    const isCenter = gridIndex === CENTER_INDEX;
                    
                    if (isCenter) {
                        // CENTER CLUSTER
                        return (
                            <ClusterValues 
                                key={gridIndex}
                                title={result.centralGoal}
                                items={(result.categories ?? []).map(c => c.name)}
                                isCenter={true}
                                onTitleChange={(val) => updateResult(['centralGoal'], val)}
                                onItemChange={(idx, val) => updateCategoryName(idx, val)}
                                onFocus={() => focusCluster(gridIndex)}
                                isFocused={focusedCluster === gridIndex}
                                onReorder={(from, to) => reorderCategories(from, to)}
                                onCopy={handleCopy}
                            />
                        );
                    } else {
                        // SATELLITE CLUSTER
                        const catIndex = CATEGORY_GRID_INDICES.indexOf(gridIndex);
                        const category = result.categories?.[catIndex];
                        
                        // Guard against missing category
                        // If missing, render potential placeholder or empty? 
                        // The user can't add categories easily if they don't exist in data structure.
                        // Assuming data structure is initialized with 8 slots. 
                        // If strictly undefined, we render empty state but it might be uneditable.
                        // Let's assume initialized.
                        
                        // Added Guard: Only render if category exists, else render empty text to prevent breaking grid layout
                        if (!category) {
                            return (
                                <div key={gridIndex} className="bg-transparent" />
                            );
                        }
                        
                        return (
                            <ClusterValues 
                                key={gridIndex}
                                title={category?.name ?? ""}
                                items={category?.steps ?? []}
                                isCenter={false}
                                onTitleChange={(val) => updateCategoryName(catIndex, val)}
                                onItemChange={(stepIdx, val) => updateStep(catIndex, stepIdx, val)}
                                onFocus={() => focusCluster(gridIndex)}
                                isFocused={focusedCluster === gridIndex}
                                onReorder={(from, to) => reorderSteps(catIndex, from, to)}
                                onCopy={handleCopy}
                            />
                        );
                    }
                })}
            </motion.div>
        </div>
        
        {/* Helper overlay when focused */}
        {focusedCluster !== null && (
             <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="absolute top-6 left-6 z-40 bg-black/60 text-white px-4 py-2 rounded-full backdrop-blur-md text-sm cursor-pointer hover:bg-black/80 transition-colors flex items-center gap-2"
                onClick={resetView}
             >
                <Minimize2 size={14} /> Tap to zoom out
             </motion.div>
        )}
    </div>
  );
};
