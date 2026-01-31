import React from 'react';
import { LucideIcon, ArrowRight, Info, Lock } from 'lucide-react';

interface FrameworkCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
  onLearnMore?: () => void; // Optional for now
  isLocked?: boolean;
}

export const FrameworkCard = React.memo(function FrameworkCard({ title, description, icon: Icon, color, onClick, onLearnMore, isLocked = false }: FrameworkCardProps) {
  return (
    <div 
      className={`group relative bg-white dark:bg-zinc-900 border transition-all duration-300 overflow-hidden ${
        isLocked 
          ? 'border-gray-100 dark:border-zinc-800 opacity-60 grayscale cursor-not-allowed' 
          : 'border-gray-100 dark:border-zinc-800 rounded-3xl p-8 hover:shadow-xl hover:shadow-blue-900/5 cursor-pointer'
      }`}
      onClick={isLocked ? undefined : onClick}
    >
      <div 
        className="absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" 
        style={{ backgroundColor: color }}
      />
      
      <div className="relative z-10">
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300"
          style={{ backgroundColor: color }}
        >
          <Icon size={28} />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">{description}</p>
        
        <div className="flex items-center gap-2 font-bold text-sm" style={{ color: isLocked ? '#9ca3af' : color }}>
          {isLocked ? (
             <>
               <Lock size={16} />
               <span>Included in Standard</span>
             </>
          ) : (
             <>
               <span>Start Architecting</span>
               <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
             </>
          )}
        </div>
        
        {onLearnMore && (
           <div 
             role="button"
             tabIndex={0}
             onClick={(e) => {
               e.stopPropagation();
               onLearnMore();
             }}
             className="absolute top-6 right-6 p-2 text-gray-300 dark:text-zinc-600 hover:text-gray-500 dark:hover:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-full transition-colors z-20"
             title="Learn more"
           >
             <Info size={20} />
           </div>
        )}
      </div>
    </div>
  );
});
