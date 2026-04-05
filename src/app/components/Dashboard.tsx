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
import {
  Trash2,
  ArrowRight,
  Rocket,
  Download,
  Plus,
  Search,
  Filter,
  Star,
  Zap,
  Target,
  Clock,
  Layers,
  Flame,
  Heart,
  Layout,
  WifiOff,
  LayoutGrid,
  List,
  BarChart,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { trackEvent, trackClick } from "@/lib/analytics";
import { BulkExportModal } from "@/app/components/BulkExportModal";
import { PdfBranding } from "@/lib/pdfExport";
import { supabase } from "@/lib/supabase";
import {
  TIER_CONFIGS,
  TierId,
  DEFAULT_TIER_ID,
  normalizeTierId,
} from "@/lib/tiers";

import { useLanguage } from "@/app/components/language-provider";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getStepIdsAndLabels } from "@/lib/trackerSteps";
import { TrackerHeatmap } from "@/app/components/tracker/TrackerHeatmap";

// Theme Configuration
const FRAMEWORK_THEMES: Record<
  string,
  { bg: string; border: string; iconBg: string; iconColor: string; icon: any }
> = {
  pareto: {
    bg: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
    border: "border-blue-200 dark:border-blue-800",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    icon: Zap,
  },
  okr: {
    bg: "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
    border: "border-purple-200 dark:border-purple-800",
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    iconColor: "text-purple-600 dark:text-purple-400",
    icon: Target,
  },
  eisenhower: {
    bg: "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20",
    border: "border-amber-200 dark:border-amber-800",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    icon: Clock,
  },
  rpm: {
    bg: "from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    icon: Layers,
  },
  misogi: {
    bg: "from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20",
    border: "border-red-200 dark:border-red-800",
    iconBg: "bg-red-100 dark:bg-red-900/40",
    iconColor: "text-red-600 dark:text-red-400",
    icon: Flame,
  },
  ikigai: {
    bg: "from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20",
    border: "border-rose-200 dark:border-rose-800",
    iconBg: "bg-rose-100 dark:bg-rose-900/40",
    iconColor: "text-rose-600 dark:text-rose-400",
    icon: Heart,
  },
  dsss: {
    bg: "from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20",
    border: "border-orange-200 dark:border-orange-800",
    iconBg: "bg-orange-100 dark:bg-orange-900/40",
    iconColor: "text-orange-600 dark:text-orange-400",
    icon: Layers,
  },
  "first-principles": {
    bg: "from-zinc-50 to-slate-50 dark:from-zinc-900/20 dark:to-slate-900/20",
    border: "border-zinc-200 dark:border-zinc-800",
    iconBg: "bg-zinc-200 dark:bg-zinc-800",
    iconColor: "text-zinc-700 dark:text-zinc-300",
    icon: Target,
  },
  gps: {
    bg: "from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20",
    border: "border-sky-200 dark:border-sky-800",
    iconBg: "bg-sky-100 dark:bg-sky-900/40",
    iconColor: "text-sky-600 dark:text-sky-400",
    icon: Layout,
  },
  mandalas: {
    bg: "from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20",
    border: "border-yellow-200 dark:border-yellow-800",
    iconBg: "bg-yellow-100 dark:bg-yellow-900/40",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    icon: LayoutGrid,
  },
  general: {
    bg: "from-gray-50 to-zinc-50 dark:from-zinc-900/20 dark:to-zinc-800/20",
    border: "border-gray-200 dark:border-zinc-800",
    iconBg: "bg-gray-100 dark:bg-zinc-800",
    iconColor: "text-gray-600 dark:text-gray-400",
    icon: Layout,
  },
  default: {
    bg: "from-gray-50 to-zinc-50 dark:from-zinc-900/20 dark:to-zinc-800/20",
    border: "border-gray-200 dark:border-zinc-800",
    iconBg: "bg-gray-100 dark:bg-zinc-800",
    iconColor: "text-gray-600 dark:text-gray-400",
    icon: Layout,
  },
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
  isLoadingMore,
  syncError,
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
  syncError?: string | null;
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBulkExport, setBulkExportOpen] = useState(false);
  const [trackers, setTrackers] = useState<Record<string, any>>({});
  const [logsMap, setLogsMap] = useState<Record<string, any[]>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [filterFramework, setFilterFramework] = useState<string>("ALL");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "reports">("grid");

  useEffect(() => {
    trackEvent("view_dashboard");
    // Load pinned IDs
    const pinned = localStorage.getItem("pinned_blueprints");
    if (pinned) {
      setPinnedIds(JSON.parse(pinned));
    }
    const savedView = localStorage.getItem("dashboard_view_mode") as any;
    if (
      savedView === "grid" ||
      savedView === "list" ||
      savedView === "reports"
    ) {
      setViewMode(savedView);
    }
  }, []);

  const handleViewModeChange = (mode: "grid" | "list" | "reports") => {
    setViewMode(mode);
    localStorage.setItem("dashboard_view_mode", mode);
  };

  const togglePin = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newPinned = pinnedIds.includes(id)
      ? pinnedIds.filter((pid) => pid !== id)
      : [...pinnedIds, id];
    setPinnedIds(newPinned);
    try {
      localStorage.setItem("pinned_blueprints", JSON.stringify(newPinned));
    } catch (err: any) {
      if (
        err.name === "QuotaExceededError" ||
        err.name === "NS_ERROR_DOM_QUOTA_REACHED"
      ) {
        toast.error(
          t("errors.storageFull") ||
            "Storage full: Cannot pin more items. Please unpin some first.",
          { duration: 15000 },
        );
        // Rollback state
        setPinnedIds(pinnedIds);
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      try {
        await onDeleteBlueprint(deleteId);
      } catch (deleteErr) {
        console.error("Failed to delete blueprint:", deleteErr);
        // Error is handled by App.tsx usually, but this prevents Dashboard from crashing
      }
      setDeleteId(null);
    }
  };

  const availableTags = React.useMemo(() => {
    const set = new Set<string>();
    Object.values(trackers).forEach((t: any) => {
      if (t.tags && Array.isArray(t.tags)) {
        t.tags.forEach((tag: string) => set.add(tag));
      }
    });
    return Array.from(set).sort();
  }, [trackers]);

  const filteredBlueprints = blueprints
    .filter((bp) => {
      const matchesSearch = bp.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const effectiveFramework = (bp.result?.type as string) ?? bp.framework;
      const matchesFilter =
        filterFramework === "ALL" ||
        bp.framework === filterFramework ||
        effectiveFramework === filterFramework;
      const matchesTag =
        !filterTag || trackers[bp.id]?.tags?.includes(filterTag);
      return matchesSearch && matchesFilter && matchesTag;
    })
    .sort((a, b) => {
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
  const [trackerPrefs, setTrackerPrefs] = useState<any>({});

  React.useEffect(() => {
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from("profiles")
            .select("branding_logo_url, branding_color, tier, metadata")
            .eq("user_id", user.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setBranding({
                  logoUrl: data.branding_logo_url,
                  primaryColor: data.branding_color || "#000000",
                });
                const tier = normalizeTierId(data.tier || DEFAULT_TIER_ID);
                setCanBulkExport(TIER_CONFIGS[tier]?.canExportPdf ?? false);
                if (data.metadata?.tracker_preferences) {
                  setTrackerPrefs(data.metadata.tracker_preferences);
                }
              }
            });
        }
      });
    }
  }, []);

  const fetchTrackersAndLogs = React.useCallback(() => {
    if (!supabase || filteredBlueprints.length === 0) return;
    const ids = filteredBlueprints.map((b) => b.id);

    supabase
      .from("blueprint_tracker")
      .select("*")
      .in("blueprint_id", ids)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, any> = {};
          data.forEach((t) => (map[t.blueprint_id] = t));
          setTrackers(map);
        }
      });

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    supabase
      .from("goal_logs")
      .select("id, blueprint_id, created_at, kind, payload")
      .in("blueprint_id", ids)
      .gte("created_at", fourteenDaysAgo.toISOString())
      .then(({ data }) => {
        if (data) {
          const map: Record<string, any[]> = {};
          ids.forEach((id) => (map[id] = []));
          data.forEach((l) => map[l.blueprint_id].push(l));
          setLogsMap(map);
        }
      });
  }, [filteredBlueprints]);

  useEffect(() => {
    fetchTrackersAndLogs();
  }, [fetchTrackersAndLogs]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchTrackersAndLogs();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [fetchTrackersAndLogs]);

  return (
    <ErrorBoundary name="Dashboard">
      <section className="px-6 pb-24 pt-8 max-w-7xl mx-auto min-h-screen">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight text-black dark:text-white">
              {t("dashboard.title")}
            </h1>
            <p className="text-gray-500 text-lg">{t("dashboard.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {canBulkExport && blueprints.length > 0 && (
              <Button
                onClick={() => setBulkExportOpen(true)}
                variant="outline"
                className="gap-2 rounded-full border-gray-300 dark:border-zinc-700"
              >
                <Download size={18} />
                {t("dashboard.exportAll")}
              </Button>
            )}
            {onStartWizard && (
              <Button
                onClick={() => {
                  trackClick("dashboard_new_plan");
                  onStartWizard();
                }}
                className="gap-2 bg-black dark:bg-white text-white dark:text-black rounded-full hover:scale-105 transition-transform shadow-lg"
              >
                <Plus size={18} />
                {t("dashboard.new")}
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
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder={t("dashboard.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-100 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500 transition-all outline-none text-base"
              />
            </div>
            <div className="flex gap-2 py-2 overflow-x-auto scrollbar-hide shrink-0 items-center">
              {[
                "ALL",
                "pareto",
                "okr",
                "eisenhower",
                "rpm",
                "misogi",
                "ikigai",
                "dsss",
                "mandalas",
                "first-principles",
                "gps",
              ].map((fw) => (
                <button
                  key={fw}
                  onClick={() => setFilterFramework(fw)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    filterFramework === fw
                      ? "bg-black dark:bg-white text-white dark:text-black border-transparent shadow-md"
                      : "bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
                  }`}
                >
                  {fw === "ALL"
                    ? t("dashboard.filterAll")
                    : fw.charAt(0).toUpperCase() + fw.slice(1)}
                </button>
              ))}
              {availableTags.length > 0 && (
                <>
                  <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-2 hidden md:block" />
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() =>
                        setFilterTag(filterTag === tag ? null : tag)
                      }
                      className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border cursor-pointer ${
                        filterTag === tag
                          ? "bg-blue-600 dark:bg-blue-500 text-white border-transparent shadow-md"
                          : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700"
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 border-t border-gray-100 dark:border-zinc-800 pt-4">
            <div className="text-sm font-bold text-gray-500">
              {filteredBlueprints.length}{" "}
              {filteredBlueprints.length === 1 ? "Plan" : "Plans"}
            </div>
            <div className="flex bg-gray-100 dark:bg-zinc-800/80 p-1 rounded-xl">
              <button
                onClick={() => handleViewModeChange("grid")}
                className={`p-1.5 rounded-lg flex items-center justify-center transition-colors ${viewMode === "grid" ? "bg-white dark:bg-zinc-700 shadow-sm text-black dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => handleViewModeChange("list")}
                className={`p-1.5 rounded-lg flex items-center justify-center transition-colors ${viewMode === "list" ? "bg-white dark:bg-zinc-700 shadow-sm text-black dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                title="List View"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => handleViewModeChange("reports")}
                className={`p-1.5 rounded-lg flex items-center justify-center transition-colors ${viewMode === "reports" ? "bg-white dark:bg-zinc-700 shadow-sm text-black dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                title="Reports View"
              >
                <BarChart size={16} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-gray-100 dark:bg-zinc-900 rounded-[2rem] animate-pulse"
              />
            ))}
          </div>
        ) : filteredBlueprints.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-zinc-800">
            <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
              {syncError ? (
                <WifiOff className="text-red-400" size={32} />
              ) : (
                <Search className="text-gray-400" size={32} />
              )}
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              {syncError
                ? "Couldn't load your blueprints"
                : searchQuery
                  ? "No matching blueprints found"
                  : t("dashboard.emptyTitle")}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {syncError
                ? "Please check your connection and try again."
                : searchQuery
                  ? "Try adjusting your search or filters."
                  : t("dashboard.emptyDesc")}
            </p>
            {syncError ? (
              <Button
                onClick={() => window.location.reload()}
                size="lg"
                className="rounded-full px-8 bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-500/20"
              >
                Retry
              </Button>
            ) : (
              !searchQuery &&
              onStartWizard && (
                <Button
                  onClick={() => {
                    trackClick("dashboard_create_first");
                    onStartWizard();
                  }}
                  size="lg"
                  className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 cursor-pointer"
                >
                  {t("dashboard.createFirst")}
                </Button>
              )
            )}
          </div>
        ) : (
          <>
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredBlueprints.map((bp) => {
                    const frameworkKey =
                      (bp.result?.type as string) ?? bp.framework;
                    const theme =
                      FRAMEWORK_THEMES[frameworkKey] ||
                      FRAMEWORK_THEMES[bp.framework] ||
                      FRAMEWORK_THEMES["default"];
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
                        className={`cursor-pointer group relative bg-gradient-to-br ${theme.bg} rounded-[2rem] p-6 border ${theme.border} shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden`}
                        onClick={() => onOpenBlueprint(bp)}
                      >
                        {/* Background Decor */}
                        <div
                          className={`absolute -right-10 -top-10 w-40 h-40 ${theme.iconBg} rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity`}
                        />

                        <div className="relative z-10 flex flex-col h-full justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme.iconBg} ${theme.iconColor} shadow-inner`}
                              >
                                <Icon size={24} />
                              </div>
                              <button
                                onClick={(e) => togglePin(e, bp.id)}
                                className={`cursor-pointer p-2 rounded-full transition-colors hover:bg-white/50 dark:hover:bg-black/20 ${isPinned ? "text-yellow-400" : "text-gray-300 dark:text-gray-600 hover:text-yellow-400"}`}
                                title={
                                  isPinned
                                    ? t("dashboard.unpin") || "Unpin"
                                    : t("dashboard.pin") || "Pin"
                                }
                                aria-label={
                                  isPinned
                                    ? t("dashboard.unpin") || "Unpin"
                                    : t("dashboard.pin") || "Pin"
                                }
                              >
                                <Star
                                  size={20}
                                  fill={isPinned ? "currentColor" : "none"}
                                />
                              </button>
                            </div>

                            <div className="mb-2">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider ${theme.iconColor} bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md`}
                              >
                                {frameworkKey}
                              </span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {bp.title}
                            </h3>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                {new Date(bp.createdAt).toLocaleDateString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </p>
                              {/* Tracker Status Badge */}
                              {(() => {
                                const tracker = trackers[bp.id];
                                if (!tracker) return null;

                                if (tracker.plan_kind === "finite") {
                                  const totalSteps = getStepIdsAndLabels(
                                    bp.result,
                                    bp.framework,
                                  ).length;
                                  const completed =
                                    tracker.completed_step_ids?.length || 0;
                                  const pct =
                                    totalSteps > 0
                                      ? (completed / totalSteps) * 100
                                      : 0;
                                  return trackerPrefs?.show_score !== false ? (
                                    <div className="flex items-center gap-1">
                                      <div className="w-16 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-blue-500 rounded-full"
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] font-bold text-gray-500">
                                        {completed}/{totalSteps}
                                      </span>
                                    </div>
                                  ) : null;
                                }

                                // Infinite plans - just show last done
                                const lastActive = tracker.last_activity_at
                                  ? new Date(
                                      tracker.last_activity_at,
                                    ).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : null;
                                return lastActive ? (
                                  <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">
                                    Last: {lastActive}
                                  </span>
                                ) : null;
                              })()}
                            </div>

                            {/* Mini Heatmap */}
                            {trackerPrefs?.show_heatmap !== false && (
                              <div className="mt-4 flex justify-end">
                                <TrackerHeatmap
                                  logs={logsMap[bp.id] || []}
                                  daysBack={14}
                                  color={trackers[bp.id]?.color}
                                  className="w-fit"
                                />
                              </div>
                            )}
                          </div>

                          <div className="mt-8 flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                              Open <ArrowRight size={14} />
                            </span>

                            <div
                              className="flex gap-2 items-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {onPublishBlueprint && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onPublishBlueprint(bp);
                                  }}
                                  data-testid="dashboard-publish-button"
                                  className="min-h-[44px] px-4 py-2.5 text-sm font-bold bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-800/60 text-emerald-700 dark:text-emerald-300 rounded-full transition-colors cursor-pointer touch-manipulation flex items-center gap-2"
                                >
                                  <Rocket size={14} /> Publish
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/track/${bp.id}`);
                                }}
                                className="min-h-[44px] px-4 py-2.5 text-sm font-bold bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-800/60 text-blue-700 dark:text-blue-300 rounded-full transition-colors cursor-pointer touch-manipulation"
                              >
                                {t("dashboard.track")}
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(bp.id); // Trigger dialog
                                }}
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors cursor-pointer touch-manipulation"
                                title={t("dashboard.delete") || "Delete"}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {viewMode === "list" && (
              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {filteredBlueprints.map((bp) => {
                    const frameworkKey =
                      (bp.result?.type as string) ?? bp.framework;
                    const theme =
                      FRAMEWORK_THEMES[frameworkKey] ||
                      FRAMEWORK_THEMES[bp.framework] ||
                      FRAMEWORK_THEMES["default"];
                    const Icon = theme.icon;
                    const isPinned = pinnedIds.includes(bp.id);

                    return (
                      <motion.div
                        key={bp.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 rounded-2xl hover:border-gray-300 dark:hover:border-zinc-700 transition-all cursor-pointer group"
                        onClick={() => onOpenBlueprint(bp)}
                      >
                        <div className="flex items-center gap-4 mb-3 md:mb-0 shrink-0">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.iconBg} ${theme.iconColor}`}
                          >
                            <Icon size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 group-hover:text-blue-500 transition-colors">
                              {bp.title}
                              {isPinned && (
                                <Star
                                  size={14}
                                  fill="currentColor"
                                  className="text-yellow-400"
                                />
                              )}
                            </h3>
                            <span className="text-xs text-gray-500 uppercase">
                              {frameworkKey}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto overflow-hidden">
                          <div className="flex-1 md:flex-none flex justify-start md:justify-center overflow-x-auto scrollbar-hide">
                            {trackerPrefs?.show_heatmap !== false && (
                              <TrackerHeatmap
                                logs={logsMap[bp.id] || []}
                                daysBack={10}
                                color={trackers[bp.id]?.color}
                                className="shrink-0"
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {onPublishBlueprint && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPublishBlueprint(bp);
                                }}
                                data-testid="dashboard-publish-button"
                                className="min-h-[44px] text-emerald-700 dark:text-emerald-300 font-bold text-sm bg-emerald-100/70 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-800/60 transition-colors px-4 py-2 rounded-xl touch-manipulation flex items-center gap-2"
                                title="Publish"
                              >
                                <Rocket size={14} /> Publish
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/track/${bp.id}`);
                              }}
                              className="min-h-[44px] text-blue-600 dark:text-blue-400 font-bold text-sm bg-blue-100/50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-800/60 transition-colors px-4 py-2 rounded-xl touch-manipulation"
                              title={t("dashboard.track")}
                            >
                              {t("dashboard.track")}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(bp.id);
                              }}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                              title={t("dashboard.delete") || "Delete"}
                              aria-label={t("dashboard.delete") || "Delete"}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {viewMode === "reports" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <AnimatePresence>
                  {filteredBlueprints.map((bp) => {
                    const frameworkKey =
                      (bp.result?.type as string) ?? bp.framework;
                    const theme =
                      FRAMEWORK_THEMES[frameworkKey] ||
                      FRAMEWORK_THEMES[bp.framework] ||
                      FRAMEWORK_THEMES["default"];
                    const Icon = theme.icon;

                    return (
                      <motion.div
                        key={`report-${bp.id}`}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                        onClick={() => navigate(`/track/${bp.id}`)}
                      >
                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.iconBg} ${theme.iconColor}`}
                            >
                              <Icon size={18} />
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(bp.id);
                              }}
                              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                              title={t("dashboard.delete") || "Delete"}
                              aria-label={t("dashboard.delete") || "Delete"}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 line-clamp-2">
                            {bp.title}
                          </h3>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 dark:border-zinc-800 pb-4">
                            {frameworkKey} Report
                          </p>
                        </div>

                        <div className="flex-1 flex flex-col justify-end">
                          {trackerPrefs?.show_heatmap !== false && (
                            <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                              <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-2">
                                <Clock size={12} /> Last 28 Days Activity
                              </span>
                              <TrackerHeatmap
                                logs={logsMap[bp.id] || []}
                                daysBack={28}
                                color={trackers[bp.id]?.color}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {hasMore && blueprints.length > 0 && onLoadMore && (
          <div className="flex justify-center mt-12">
            <Button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              variant="ghost"
              className="gap-2 dark:text-white dark:hover:bg-zinc-800"
            >
              {isLoadingMore ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black dark:border-white"></div>
              ) : null}
              {t("common.loadMore") || "Load More"}
            </Button>
          </div>
        )}

        <AlertDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
        >
          <AlertDialogContent className="dark:bg-zinc-900 dark:border-zinc-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="dark:text-white">
                {t("dashboard.deleteTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription className="dark:text-zinc-400">
                {t("dashboard.deleteDesc")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 dark:border-zinc-700">
                {t("dashboard.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700"
              >
                {t("dashboard.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </ErrorBoundary>
  );
}
