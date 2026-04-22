import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/app/components/language-provider";
import { Check, Clock3 } from "lucide-react";
import type { BlueprintTask, BlueprintTracker } from "@/lib/blueprints";
import {
  formatTaskTarget,
  getMetricTasks,
  type TrackerMetricLogEntry,
} from "@/lib/trackerSurface";
import { motion, AnimatePresence } from "motion/react";

interface TrackerQuickLogProps {
  tracker: BlueprintTracker;
  tasks?: BlueprintTask[];
  isDoneToday: boolean;
  onLog: (payload?: {
    note?: string;
    metrics?: TrackerMetricLogEntry[];
  }) => Promise<void>;
  color?: string;
}

export function TrackerQuickLog({
  tracker,
  tasks = [],
  isDoneToday,
  onLog,
  color,
}: TrackerQuickLogProps) {
  const { t } = useLanguage();
  const [note, setNote] = useState("");
  const [isNoteVisible, setIsNoteVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [metricValues, setMetricValues] = useState<Record<string, string>>({});

  const question = tracker.tracking_question || t("tracker.didItToday");
  const metricTasks = useMemo(() => getMetricTasks(tasks), [tasks]);

  useEffect(() => {
    setMetricValues({});
  }, [metricTasks]);

  const metrics = metricTasks
    .map((task) => {
      const rawValue = metricValues[task.id] ?? "";
      if (!rawValue.trim()) return null;
      const parsedValue = Number(rawValue);
      if (!Number.isFinite(parsedValue)) return null;
      return {
        taskId: task.id,
        title: task.title,
        inputType: task.input_type || "number",
        value: parsedValue,
        unitLabel: task.unit_label,
        targetValue: task.target_value ?? null,
      } satisfies TrackerMetricLogEntry;
    })
    .filter(Boolean) as TrackerMetricLogEntry[];

  const hasMetricInputs = metricTasks.length > 0;
  const isDisabled =
    isDoneToday ||
    isSubmitting ||
    (hasMetricInputs && metrics.length === 0 && !note.trim());

  const handleLog = async () => {
    setIsSubmitting(true);
    try {
      await onLog({
        note,
        metrics,
      });
      setNote("");
      setMetricValues({});
      setIsNoteVisible(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 md:p-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="space-y-2 text-left sm:text-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-gray-500">
            {hasMetricInputs
              ? t("tracker.quickLog.title") === "tracker.quickLog.title"
                ? "Quick Log"
                : t("tracker.quickLog.title")
              : t("tracker.logToday")}
          </p>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white md:text-3xl">
            {question}
          </h2>
          {hasMetricInputs && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("tracker.quickLog.metricsHint") ===
              "tracker.quickLog.metricsHint"
                ? "Log the actual values for your metric-based tasks here, then save one check-in for the day."
                : t("tracker.quickLog.metricsHint")}
            </p>
          )}
        </div>

        {hasMetricInputs && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {metricTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                      Target {formatTaskTarget(task)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:bg-zinc-900 dark:text-cyan-300">
                    <Clock3 size={12} />
                    {task.input_type}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-cyan-200 bg-white px-3 py-2 dark:border-cyan-900/40 dark:bg-zinc-900">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={metricValues[task.id] ?? ""}
                    onChange={(event) =>
                      setMetricValues((prev) => ({
                        ...prev,
                        [task.id]: event.target.value,
                      }))
                    }
                    placeholder={
                      task.target_value != null
                        ? String(task.target_value)
                        : "0"
                    }
                    title={`Log ${task.title}`}
                    aria-label={`Log ${task.title}`}
                    className="min-w-0 flex-1 bg-transparent text-base font-semibold text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                  />
                  {task.unit_label && (
                    <span className="shrink-0 text-sm font-bold text-gray-500 dark:text-gray-400">
                      {task.unit_label}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="w-full">
          <button
            onClick={handleLog}
            disabled={isDisabled}
            className={`group relative flex min-h-[72px] w-full items-center justify-center overflow-hidden rounded-2xl px-6 py-4 text-center text-white shadow-lg transition-all duration-300 ${isDoneToday ? "bg-green-500 shadow-green-500/20" : color ? "bg-cyan-600 hover:bg-cyan-700" : "bg-blue-500 hover:bg-blue-600"} disabled:cursor-not-allowed disabled:opacity-80`}
          >
            {isSubmitting ? (
              <div className="h-8 w-8 rounded-full border-4 border-white border-t-transparent animate-spin" />
            ) : isDoneToday ? (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Check size={20} strokeWidth={4} className="text-white" />
                </div>
                <span className="text-lg font-black uppercase tracking-wider md:text-2xl">
                  {t("tracker.status.completed")}!
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-lg font-black uppercase tracking-wider md:text-2xl">
                  {hasMetricInputs
                    ? t("tracker.quickLog.save") === "tracker.quickLog.save"
                      ? "Save Quick Log"
                      : t("tracker.quickLog.save")
                    : t("tracker.logToday")}
                </span>
                {hasMetricInputs && (
                  <span className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                    {metrics.length > 0
                      ? `${metrics.length} metric${metrics.length === 1 ? "" : "s"} ready`
                      : t("tracker.quickLog.metricPrompt") ===
                          "tracker.quickLog.metricPrompt"
                        ? "Enter at least one value or note"
                        : t("tracker.quickLog.metricPrompt")}
                  </span>
                )}
              </div>
            )}
          </button>
        </div>

        <AnimatePresence>
          {!isDoneToday && !isNoteVisible && (
            <motion.button
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onClick={() => setIsNoteVisible(true)}
              className="self-start text-sm font-bold text-gray-500 underline decoration-dashed underline-offset-4 hover:text-gray-900 dark:hover:text-white sm:self-center"
            >
              {t("tracker.addNote")}
            </motion.button>
          )}

          {!isDoneToday && isNoteVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full"
            >
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t("tracker.journalPlaceholder")}
                className="min-h-[88px] w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-white"
                rows={3}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
