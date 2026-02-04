import React, { useState, useEffect } from "react";
import { Blueprint } from "@/lib/blueprints";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Trash2, ArrowRight, Rocket, Download, Plus, Search, Filter, Star, Zap, Target, Clock, Layers, Flame, Layout, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { trackEvent } from '@/lib/analytics';
import { BulkExportModal } from "@/app/components/BulkExportModal";
import { PdfBranding } from "@/lib/pdfExport";
import { supabase } from "@/lib/supabase";
import { TIER_CONFIGS, TierId, DEFAULT_TIER_ID } from '@/lib/tiers';

import { useLanguage } from '@/app/components/language-provider';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

// Theme Configuration
const FRAMEWORK_THEMES: Record<string, { bg: string, border: string, iconBg: string, iconColor: string, icon: any }> = {
  'pareto': { bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20', border: 'border-blue-200 dark:border-blue-800', iconBg: 'bg-blue-100 dark:bg-blue-900/40', iconColor: 'text-blue-600 dark:text-blue-400', icon: Zap },
  'okr': { bg: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20', border: 'border-purple-200 dark:border-purple-800', iconBg: 'bg-purple-100 dark:bg-purple-900/40', iconColor: 'text-purple-600 dark:text-purple-400', icon: Target },
  'eisenhower': { bg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20', border: 'border-amber-200 dark:border-amber-800', iconBg: 'bg-amber-100 dark:bg-amber-900/40', iconColor: 'text-amber-600 dark:text-amber-400', icon: Clock },
  'rpm': { bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20', border: 'border-emerald-200 dark:border-emerald-800', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40', iconColor: 'text-emerald-600 dark:text-emerald-400', icon: Layers },
  'misogi': { bg: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20', border: 'border-red-200 dark:border-red-800', iconBg: 'bg-red-100 dark:bg-red-900/40', iconColor: 'text-red-600 dark:text-red-400', icon: Flame },
  'default': { bg: 'from-gray-50 to-zinc-50 dark:from-zinc-900/20 dark:to-zinc-800/20', border: 'border-gray-200 dark:border-zinc-800', iconBg: 'bg-gray-100 dark:bg-zinc-800', iconColor: 'text-gray-600 dark:text-gray-400', icon: Layout },
};

export function Dashboard({
  blueprints,
  loading = false,
  onOpenBlueprint,
  onDeleteBlueprint,
  onStartWizard,
  onPublishBlueprint,
  onLoadMore,
  hasMore,
  isLoadingMore
}: {
  blueprints: Blueprint[];
  loading?: boolean;
  onOpenBlueprint: (bp: Blueprint) => void;
  onDeleteBlueprint: (id: string) => void;
  onStartWizard?: () => void;
  onPublishBlueprint?: (bp: Blueprint) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  error?: string | null;
}) {
  const { t } = useLanguage();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBulkExport, setBulkExportOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFramework, setFilterFramework] = useState<string>('ALL');
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  useEffect(() => {
    trackEvent('view_dashboard');
    // Load pinned IDs
    const pinned = localStorage.getItem('pinned_blueprints');
    if (pinned) {
        setPinnedIds(JSON.parse(pinned));
    }
  }, []);

  const togglePin = (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      const newPinned = pinnedIds.includes(id) 
        ? pinnedIds.filter(pid => pid !== id)
        : [...pinnedIds, id];
      setPinnedIds(newPinned);
      try {
          localStorage.setItem('pinned_blueprints', JSON.stringify(newPinned));
      } catch (e: any) {
          if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
              toast.error("Storage full: Cannot pin more items. Please unpin some first.");
              // Rollback state
              setPinnedIds(pinnedIds); 
          }
      }
  };
  
  const handleConfirmDelete = () => {
    if (deleteId) {
      onDeleteBlueprint(deleteId);
      setDeleteId(null);
    }
  };

  const filteredBlueprints = blueprints.filter(bp => {
    const matchesSearch = bp.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterFramework === 'ALL' || bp.framework === filterFramework;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
      // Pinned first
      const aPinned = pinnedIds.includes(a.id);
      const bPinned = pinnedIds.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      // Then by date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const [branding, setBranding] = useState<PdfBranding | undefined>(undefined);
  const [canBulkExport, setCanBulkExport] = useState(false);

  React.useEffect(() => {
    if (supabase) {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                supabase.from('profiles').select('branding_logo_url, branding_color, tier').eq('user_id', user.id).single()
                .then(({ data }) => {
                    if (data) {
                        setBranding({
                            logoUrl: data.branding_logo_url,
                            primaryColor: data.branding_color || '#000000'
                        });
                        const tier = (data.tier || DEFAULT_TIER_ID) as TierId;
                        setCanBulkExport(TIER_CONFIGS[tier]?.canExportPdf ?? false);
                    }
                });
            }
        });
    }
  }, []);

  return (
    <ErrorBoundary name="Dashboard">
    <section className="px-6 py-24 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight text-black dark:text-white">{t('dashboard.title')}</h1>
          <p className="text-gray-500 text-lg">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {canBulkExport && blueprints.length > 0 && (
             <Button onClick={() => setBulkExportOpen(true)} variant="outline" className="gap-2 rounded-full border-gray-300 dark:border-zinc-700">
                <Download size={18} />
                {t('dashboard.exportAll')}
             </Button>
          )}
          {onStartWizard && (
              <Button onClick={onStartWizard} className="gap-2 bg-black dark:bg-white text-white dark:text-black rounded-full hover:scale-105 transition-transform shadow-lg">
                <Plus size={18} />
                {t('dashboard.new')}
              </Button>
          )}
        </div>
      </div>

       {showBulkExport && (
          <BulkExportModal 
            blueprints={blueprints} 
            onClose={() => setBulkExportOpen(false)} 
            branding={branding}
          />
       )}

      {/* Search & Filter Bar */}
      <div className="mb-10 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search blueprints..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-100 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500 transition-all outline-none text-base"
                  />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                  {['ALL', 'pareto', 'okr', 'eisenhower', 'rpm', 'misogi'].map(fw => (
                      <button
                        key={fw}
                        onClick={() => setFilterFramework(fw)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                            filterFramework === fw 
                            ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-md' 
                            : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                        }`}
                      >
                          {fw === 'ALL' ? 'All' : fw.charAt(0).toUpperCase() + fw.slice(1)}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3].map(i => (
                <div key={i} className="h-64 bg-gray-100 dark:bg-zinc-900 rounded-[2rem] animate-pulse" />
            ))}
        </div>
      ) : filteredBlueprints.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-zinc-800">
          <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
            {error ? <WifiOff className="text-red-400" size={32} /> : <Search className="text-gray-400" size={32} />}
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              {error ? "Couldn't load your blueprints" : (searchQuery ? "No matching blueprints found" : t('dashboard.emptyTitle'))}
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {error ? "Please check your connection and try again." : (searchQuery ? "Try adjusting your search or filters." : t('dashboard.emptyDesc'))}
          </p>
          {error ? (
              <Button onClick={() => window.location.reload()} size="lg" className="rounded-full px-8 bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-500/20">
                Retry
              </Button>
          ) : (!searchQuery && onStartWizard && (
              <Button onClick={onStartWizard} size="lg" className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20">
                {t('dashboard.createFirst')}
              </Button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredBlueprints.map((bp) => {
              const theme = FRAMEWORK_THEMES[bp.framework] || FRAMEWORK_THEMES['default'];
              const Icon = theme.icon;
              const isPinned = pinnedIds.includes(bp.id);

              return (
              <motion.div
                key={bp.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -5 }}
                className={`group relative bg-gradient-to-br ${theme.bg} rounded-[2rem] p-6 border ${theme.border} shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden`}
                onClick={() => onOpenBlueprint(bp)}
              >
                {/* Background Decor */}
                <div className={`absolute -right-10 -top-10 w-40 h-40 ${theme.iconBg} rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity`} />

                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme.iconBg} ${theme.iconColor} shadow-inner`}>
                                <Icon size={24} />
                            </div>
                            <button 
                                onClick={(e) => togglePin(e, bp.id)}
                                className={`p-2 rounded-full transition-colors hover:bg-white/50 dark:hover:bg-black/20 ${isPinned ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'}`}
                            >
                                <Star size={20} fill={isPinned ? "currentColor" : "none"} />
                            </button>
                        </div>
                        
                        <div className="mb-2">
                             <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.iconColor} bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md`}>
                                {bp.framework}
                             </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {bp.title}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            {new Date(bp.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>

                    <div className="mt-8 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                        <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                            Open <ArrowRight size={14} />
                        </span>
                        
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                             {/* Delete Button - small and subtle */}
                             <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteId(bp.id); // Trigger dialog
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                title="Delete"
                             >
                                 <Trash2 size={16} />
                             </button>
                        </div>
                    </div>
                </div>
              </motion.div>
            )})}
          </AnimatePresence>
        </div>
      )}
      
      {hasMore && blueprints.length > 0 && onLoadMore && (
        <div className="flex justify-center mt-12">
            <Button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            variant="ghost"
            className="gap-2 dark:text-white dark:hover:bg-zinc-800"
            >
            {isLoadingMore ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black dark:border-white"></div> : null}
            {t('common.loadMore') || 'Load More'}
            </Button>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="dark:bg-zinc-900 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">{t('dashboard.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-zinc-400">
              {t('dashboard.deleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 dark:border-zinc-700">{t('dashboard.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700">
              {t('dashboard.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
    </ErrorBoundary>
  );
}
