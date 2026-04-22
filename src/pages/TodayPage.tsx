import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { Blueprint, BlueprintTask, BlueprintTracker } from "@/lib/blueprints";
import { getStepIdsAndLabels } from "@/lib/trackerSteps";
import {
  isOnline,
  addPendingGoalLog,
  flushPendingQueue,
  onTrackerSynced,
} from "@/lib/trackerOffline";
import { ExecutionInsight, getExecutionInsight } from "@/lib/trackerStats";
import {
  getMetricSummary,
  getMetricTasks,
  getQuickLogCadenceState,
  hasTrackerQuickLogSurface,
} from "@/lib/trackerSurface";
import { useLanguage } from "@/app/components/language-provider";
import { Button } from "@/app/components/ui/button";
import {
  Plus,
  CheckCircle2,
  Clock,
  CalendarHeart,
  Target,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

type TodayItem = {
  blueprint: Blueprint;
  tracker: BlueprintTracker;
  insight: ExecutionInsight;
  completedToday: boolean;
  streakOrLast: string;
  hasQuickLog: boolean;
  hasMetricInputs: boolean;
  question: string | null;
  metricSummary: string | null;
  completedSteps: number;
  totalSteps: number;
};

export function TodayPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [dueItems, setDueItems] = useState<TodayItem[]>([]);

  useEffect(() => {
    loadTodayData();
  }, []);

  useEffect(() => {
    if (!supabase || !userId) return;
    const runFlushThenReload = () => {
      flushPendingQueue(supabase, userId).then(({ flushed }) => {
        if (flushed > 0) loadTodayData();
      });
    };
    if (isOnline()) runFlushThenReload();
    const unsub = onTrackerSynced(() => loadTodayData());
    window.addEventListener("online", runFlushThenReload);
    return () => {
      unsub();
      window.removeEventListener("online", runFlushThenReload);
    };
  }, [userId]);

  const loadTodayData = async () => {
    if (!supabase) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }
      setUserId(user.id);

      const { data: blueprints } = await supabase
        .from("blueprints")
        .select("*")
        .eq("user_id", user.id);
      const { data: trackers } = await supabase
        .from("blueprint_tracker")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (!blueprints || !trackers) {
        setLoading(false);
        return;
      }

      const trackerIds = trackers.map((tracker) => tracker.blueprint_id);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const [{ data: logs }, { data: tasks }] = await Promise.all([
        supabase
          .from("goal_logs")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", todayDate.toISOString()),
        trackerIds.length > 0
          ? supabase
              .from("blueprint_tasks")
              .select("*")
              .eq("user_id", user.id)
              .in("blueprint_id", trackerIds)
          : Promise.resolve({ data: [] as BlueprintTask[] }),
      ]);

      const logsByBlueprint = (logs || []).reduce(
        (acc: Record<string, any[]>, log: any) => {
          if (!acc[log.blueprint_id]) acc[log.blueprint_id] = [];
          acc[log.blueprint_id].push(log);
          return acc;
        },
        {},
      );
      const tasksByBlueprint = (tasks || []).reduce(
        (acc: Record<string, BlueprintTask[]>, task: BlueprintTask) => {
          if (!acc[task.blueprint_id]) acc[task.blueprint_id] = [];
          acc[task.blueprint_id].push(task);
          return acc;
        },
        {},
      );

      const nextItems: TodayItem[] = [];

      for (const tracker of trackers as BlueprintTracker[]) {
        const blueprint = blueprints.find(
          (item) => item.id === tracker.blueprint_id,
        );
        if (!blueprint) continue;

        const blueprintLogs = logsByBlueprint[blueprint.id] || [];
        const trackerTasks = tasksByBlueprint[blueprint.id] || [];
        const steps = getStepIdsAndLabels(
          blueprint.result,
          blueprint.framework,
        );
        const totalSteps = steps.length;
        const completedSteps = tracker.completed_step_ids?.length ?? 0;
        const hasQuickLog = hasTrackerQuickLogSurface(tracker, trackerTasks);
        const cadenceState = hasQuickLog
          ? getQuickLogCadenceState(tracker, blueprintLogs)
          : null;

        if (hasQuickLog && cadenceState && !cadenceState.isDue) {
          continue;
        }
        if (!hasQuickLog && totalSteps === 0) {
          continue;
        }

        nextItems.push({
          blueprint,
          tracker,
          insight: getExecutionInsight(blueprint, tracker, blueprintLogs),
          completedToday: cadenceState?.completedToday || false,
          streakOrLast: cadenceState?.streakOrLast || "Not started",
          hasQuickLog,
          hasMetricInputs: getMetricTasks(trackerTasks).length > 0,
          question: tracker.tracking_question || null,
          metricSummary: getMetricSummary(trackerTasks, blueprintLogs),
          completedSteps,
          totalSteps,
        });
      }

      setDueItems(nextItems);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleQuickLog = async (blueprintId: string) => {
    if (!userId) return;
    if (!isOnline()) {
      addPendingGoalLog(blueprintId, userId, "check_in", {
        payload: { done: true },
      });
      setDueItems((prev) =>
        prev.map((item) =>
          item.blueprint.id === blueprintId
            ? { ...item, completedToday: true, streakOrLast: "Active" }
            : item,
        ),
      );
      toast.success(
        t("tracker.savedOffline") ||
          "Saved locally. Will sync when back online.",
      );
      return;
    }
    if (!supabase) return;
    try {
      const { error } = await supabase.from("goal_logs").insert({
        blueprint_id: blueprintId,
        user_id: userId,
        kind: "check_in",
        payload: { done: true },
      });
      if (error) throw error;
      setDueItems((prev) =>
        prev.map((item) =>
          item.blueprint.id === blueprintId
            ? { ...item, completedToday: true, streakOrLast: "Active" }
            : item,
        ),
      );
      toast.success(t("tracker.loggedSummary") || "Activity logged!");
    } catch (error) {
      toast.error(t("common.error"));
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 pb-32 pt-24 md:px-6 lg:max-w-6xl lg:px-8 xl:max-w-7xl">
      <div className="mb-10 text-center">
        <h1 className="mb-3 flex flex-col items-center gap-2 text-4xl font-black uppercase tracking-tight text-black dark:text-white md:text-5xl">
          <CalendarHeart size={48} className="mb-2 text-blue-500" />
          {t("tracker.todayTitle") || "Due today"}
        </h1>
        <p className="text-lg text-gray-500">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : dueItems.length === 0 ? (
        <div className="rounded-[3rem] border-2 border-dashed border-gray-200 bg-gray-50 py-20 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800">
            <CheckCircle2 className="text-gray-400" size={32} />
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            {t("tracker.todayEmpty") || "Nothing due today"}
          </h3>
          <Button
            onClick={() => navigate("/dashboard")}
            className="mt-6 rounded-full px-8"
          >
            {t("tracker.backToPlans") || "Dashboard"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {dueItems.map((item) => {
              const allDone =
                item.totalSteps > 0 && item.completedSteps >= item.totalSteps;
              const borderClass = item.hasQuickLog
                ? "border-blue-200 dark:border-blue-900"
                : "border-amber-200 dark:border-amber-900/50";
              const iconClass = item.hasQuickLog
                ? "text-blue-500"
                : "text-amber-500";

              return (
                <motion.div
                  key={item.blueprint.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border-2 p-4 shadow-sm transition-all md:p-5 ${allDone && !item.hasQuickLog ? "bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-800" : `bg-white dark:bg-zinc-900 ${borderClass}`}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <button
                      type="button"
                      onClick={() => navigate(`/track/${item.blueprint.id}`)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`line-clamp-3 break-words text-lg font-bold md:text-xl ${allDone && !item.hasQuickLog ? "text-gray-400 line-through" : "text-gray-900 dark:text-white"}`}
                        >
                          {item.blueprint.title}
                        </h3>
                        {item.hasQuickLog && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            <Sparkles size={12} />
                            Quick log
                          </span>
                        )}
                      </div>

                      {item.question && (
                        <p className="mt-2 line-clamp-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {item.question}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-bold text-gray-500">
                        {item.hasQuickLog ? (
                          <span className="flex items-center gap-2">
                            <Clock size={14} className={iconClass} />
                            {item.streakOrLast}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Target size={14} className={iconClass} />
                            {item.completedSteps} / {item.totalSteps}{" "}
                            {t("tracker.steps") || "Steps"}
                          </span>
                        )}
                        {item.totalSteps > 0 && item.hasQuickLog && (
                          <span className="flex items-center gap-2">
                            <Target size={14} className="text-amber-500" />
                            {item.completedSteps} / {item.totalSteps}{" "}
                            {t("tracker.steps") || "Steps"}
                          </span>
                        )}
                      </div>

                      {item.metricSummary && (
                        <p className="mt-2 line-clamp-2 text-sm font-medium text-cyan-700 dark:text-cyan-300">
                          {item.metricSummary}
                        </p>
                      )}

                      <p className="mt-2 line-clamp-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                        Next: {item.insight.nextBestAction}
                      </p>
                      {item.insight.overdueSignals[0] && (
                        <p
                          className={`mt-2 text-xs font-bold ${item.insight.streakRisk === "high" ? "text-red-500" : "text-amber-500"}`}
                        >
                          {item.insight.overdueSignals[0]}
                        </p>
                      )}
                    </button>

                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                      {item.hasQuickLog && item.completedToday ? (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                          <CheckCircle2
                            size={28}
                            className="text-green-600 dark:text-green-400"
                          />
                        </div>
                      ) : item.hasQuickLog && !item.hasMetricInputs ? (
                        <button
                          type="button"
                          aria-label={t("tracker.logToday") || "Log today"}
                          onClick={() => handleQuickLog(item.blueprint.id)}
                          className="flex h-14 min-h-[48px] w-14 min-w-[48px] flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-700 cursor-pointer touch-manipulation"
                        >
                          <Plus size={30} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          aria-label={
                            t("tracker.openTracker") || "Open tracker"
                          }
                          onClick={() =>
                            navigate(`/track/${item.blueprint.id}`)
                          }
                          className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-bold transition-colors cursor-pointer touch-manipulation ${item.hasQuickLog ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60" : "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60"}`}
                        >
                          {item.hasMetricInputs
                            ? t("tracker.openTracker") || "Open"
                            : allDone
                              ? t("tracker.status.completed") || "Done"
                              : t("tracker.openTracker") || "Open"}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
