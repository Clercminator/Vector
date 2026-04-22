import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { BlueprintTaskType, BlueprintTracker } from "@/lib/blueprints";
import {
  buildTrackerIntentSuggestion,
  deriveTrackerIntentDraft,
} from "@/lib/trackerIntent";
import { formatTaskTarget, isMetricTask } from "@/lib/trackerSurface";
import { useLanguage } from "@/app/components/language-provider";
import {
  Plus,
  CheckSquare,
  Trash2,
  CheckCircle2,
  Clock3,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Progress } from "@/app/components/ui/progress";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  target_count: number;
  task_type?: BlueprintTaskType | null;
  input_type?: "count" | "number" | "duration" | "currency" | null;
  target_value?: number | null;
  unit_label?: string | null;
}

const TASK_TYPE_ORDER: Record<BlueprintTaskType, number> = {
  task: 0,
  review: 1,
  proof_entry: 2,
  rescue_action: 3,
};

const TASK_TYPE_META: Record<
  BlueprintTaskType,
  { label: string; className: string }
> = {
  task: {
    label: "Task",
    className: "border-transparent bg-transparent text-transparent p-0",
  },
  review: {
    label: "Review",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  proof_entry: {
    label: "Proof",
    className:
      "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/40 dark:bg-cyan-950/40 dark:text-cyan-300",
  },
  rescue_action: {
    label: "Rescue",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300",
  },
};

function normalizeTaskType(
  taskType?: BlueprintTaskType | null,
): BlueprintTaskType {
  return taskType || "task";
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (left, right) =>
      TASK_TYPE_ORDER[normalizeTaskType(left.task_type)] -
      TASK_TYPE_ORDER[normalizeTaskType(right.task_type)],
  );
}

function normalizeTaskKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function formatFrequencyLabel(
  frequency: NonNullable<BlueprintTracker["frequency"]>,
): string {
  if (frequency === "daily") return "Daily";
  if (frequency === "weekly") return "Weekly";
  return "Custom";
}

function formatReminderLabel(time: string | null, days: string[]): string {
  if (!time && days.length === 0) return "No reminder suggested";

  const dayLabel =
    days.length === 7
      ? "Every day"
      : days.length > 0
        ? days.map((day) => day.toUpperCase()).join(", ")
        : "Flexible days";

  return time ? `${dayLabel} at ${time}` : dayLabel;
}

export function TrackerTasks({
  blueprintId,
  userId,
  color,
  blueprintTitle,
  fallbackQuestion,
  leadIndicators,
  weeklyReviewPrompt,
  onTrackerUpdated,
  onTasksUpdated,
}: {
  blueprintId: string;
  userId: string;
  color?: string;
  blueprintTitle?: string;
  fallbackQuestion?: string | null;
  leadIndicators?: string[];
  weeklyReviewPrompt?: string | null;
  onTrackerUpdated?: (patch: Partial<BlueprintTracker>) => void;
  onTasksUpdated?: (tasks: Task[]) => void;
}) {
  const { t } = useLanguage();
  const copy = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState(1);
  const [composerText, setComposerText] = useState("");
  const [isApplyingIntent, setIsApplyingIntent] = useState(false);

  const smartSuggestion = buildTrackerIntentSuggestion({
    blueprintTitle,
    fallbackQuestion,
    leadIndicators,
    weeklyReviewPrompt,
  });
  const smartDraft = deriveTrackerIntentDraft(composerText, {
    blueprintTitle,
    fallbackQuestion,
    leadIndicators,
    weeklyReviewPrompt,
  });

  useEffect(() => {
    if (!blueprintId || !supabase) return;

    const fetchTasks = async () => {
      // 1. Fetch tasks
      const { data: tsks, error: tErr } = await supabase
        .from("blueprint_tasks")
        .select("*")
        .eq("blueprint_id", blueprintId)
        .order("created_at", { ascending: true });

      if (!tErr && tsks) {
        const nextTasks = sortTasks(tsks);
        setTasks(nextTasks);
        onTasksUpdated?.(nextTasks);

        // 2. Fetch completions
        const taskIds = tsks.map((t) => t.id);
        if (taskIds.length > 0) {
          const { data: comps } = await supabase
            .from("blueprint_task_completions")
            .select("task_id")
            .in("task_id", taskIds);

          if (comps) {
            const map: Record<string, number> = {};
            comps.forEach((c) => (map[c.task_id] = (map[c.task_id] || 0) + 1));
            setCompletions(map);
          }
        }
      }
      setLoading(false);
    };

    fetchTasks();
  }, [blueprintId]);

  const handleAddTask = async () => {
    if (!newTitle.trim() || !supabase) return;

    const newTask = {
      blueprint_id: blueprintId,
      user_id: userId,
      title: newTitle.trim(),
      target_count: Math.max(1, newTarget),
      task_type: "task" as const,
      input_type: "count" as const,
      target_value: null,
      unit_label: null,
    };

    const { data, error } = await supabase
      .from("blueprint_tasks")
      .insert(newTask)
      .select()
      .single();
    if (error) {
      toast.error(t("common.error"));
      return;
    }

    const nextTasks = sortTasks([...tasks, data]);
    setTasks(nextTasks);
    onTasksUpdated?.(nextTasks);
    setNewTitle("");
    setNewTarget(1);
    setIsAdding(false);
    toast.success("Task added");
  };

  const handleApplyIntent = async () => {
    if (!smartDraft || !supabase) return;

    setIsApplyingIntent(true);

    const trackerPatch: Partial<BlueprintTracker> = {
      tracking_question: smartDraft.trackingQuestion,
      frequency: smartDraft.frequency,
      reminder_enabled: smartDraft.reminderEnabled,
      reminder_time: smartDraft.reminderTime,
      reminder_days: smartDraft.reminderDays,
    };

    const existingTaskKeys = new Set(
      tasks.map((task) => normalizeTaskKey(task.title)),
    );
    const tasksToInsert = smartDraft.tasks
      .filter((task) => {
        const key = normalizeTaskKey(task.title);
        if (!key || existingTaskKeys.has(key)) return false;
        existingTaskKeys.add(key);
        return true;
      })
      .map((task) => ({
        blueprint_id: blueprintId,
        user_id: userId,
        title: task.title,
        target_count: Math.max(1, task.targetCount),
        task_type: "task" as const,
        input_type: task.inputType,
        target_value: task.targetValue,
        unit_label: task.unitLabel,
      }));

    try {
      const [trackerResult, insertResult] = await Promise.all([
        supabase
          .from("blueprint_tracker")
          .update(trackerPatch)
          .eq("blueprint_id", blueprintId)
          .eq("user_id", userId),
        tasksToInsert.length > 0
          ? supabase.from("blueprint_tasks").insert(tasksToInsert).select()
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (trackerResult.error) throw trackerResult.error;
      if (insertResult.error) throw insertResult.error;

      if (insertResult.data && insertResult.data.length > 0) {
        const nextTasks = sortTasks([
          ...tasks,
          ...(insertResult.data as Task[]),
        ]);
        setTasks(nextTasks);
        onTasksUpdated?.(nextTasks);
      }

      onTrackerUpdated?.(trackerPatch);
      setComposerText("");
      toast.success(
        tasksToInsert.length > 0
          ? copy(
              "tracker.smartSetupApplied",
              `Smart setup applied with ${tasksToInsert.length} new task${tasksToInsert.length === 1 ? "" : "s"}.`,
            )
          : copy(
              "tracker.smartSetupUpdated",
              "Smart setup applied. Your tracker question and cadence were updated.",
            ),
      );
    } catch (error) {
      console.error(error);
      toast.error(
        copy(
          "tracker.smartSetupError",
          "Couldn't apply the smart setup. Please try again.",
        ),
      );
    } finally {
      setIsApplyingIntent(false);
    }
  };

  const handleAddCompletion = async (
    taskId: string,
    current: number,
    target: number,
  ) => {
    if (current >= target || !supabase) return;

    // Optimistic update
    setCompletions((prev) => ({ ...prev, [taskId]: (prev[taskId] || 0) + 1 }));

    const { error } = await supabase
      .from("blueprint_task_completions")
      .insert({ task_id: taskId });
    if (error) {
      setCompletions((prev) => ({
        ...prev,
        [taskId]: Math.max(0, (prev[taskId] || 1) - 1),
      }));
      toast.error(t("common.error"));
    } else {
      if (current + 1 >= target) {
        toast.success("Task milestone completed!");
      }
    }
  };

  const handleDelete = async (id: string) => {
    const oldTasks = [...tasks];
    const nextTasks = tasks.filter((t) => t.id !== id);
    setTasks(nextTasks);
    onTasksUpdated?.(nextTasks);

    if (supabase) {
      const { error } = await supabase
        .from("blueprint_tasks")
        .delete()
        .eq("id", id);
      if (error) {
        setTasks(oldTasks);
        onTasksUpdated?.(oldTasks);
        toast.error(t("common.error"));
      }
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CheckSquare size={20} className="text-cyan-500" />{" "}
          {t("tracker.relatedTasks") || "Related Tasks"}
        </h2>
        <Button
          onClick={() => setIsAdding(true)}
          variant="outline"
          size="sm"
          className="gap-1 rounded-xl cursor-pointer"
        >
          <Plus size={16} /> {t("tracker.addTask") || "Add"}
        </Button>
      </div>

      <div className="mb-6 rounded-2xl border border-cyan-200/70 bg-cyan-50/70 p-4 shadow-sm dark:border-cyan-900/40 dark:bg-cyan-950/20">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
              <Sparkles size={16} />
              {copy("tracker.smartSetupTitle", "Smart Setup")}
            </p>
            <p className="text-sm leading-relaxed text-cyan-900/80 dark:text-cyan-100/80">
              {copy(
                "tracker.smartSetupDescription",
                "Describe what you want to track in plain English. Vector will turn it into a tracking question, cadence, reminder suggestion, and concrete tasks.",
              )}
            </p>
          </div>
          {smartSuggestion && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setComposerText(smartSuggestion)}
              className="rounded-xl border-cyan-200 bg-white/80 text-cyan-700 hover:bg-white dark:border-cyan-900/40 dark:bg-cyan-950/20 dark:text-cyan-200"
            >
              {copy("tracker.smartSetupUsePlan", "Use Plan Cues")}
            </Button>
          )}
        </div>

        <div className="mt-4 space-y-4">
          <textarea
            value={composerText}
            onChange={(event) => setComposerText(event.target.value)}
            placeholder={copy(
              "tracker.smartSetupPlaceholder",
              "Try: workouts 4x/week at 07:00; protein daily; Sunday review at 18:00",
            )}
            className="min-h-[110px] w-full rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:ring-2 focus:ring-cyan-500 dark:border-cyan-900/40 dark:bg-zinc-900 dark:text-white"
          />

          {smartDraft ? (
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/80">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                    {copy("tracker.smartSetupQuestion", "Tracking Question")}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                    {smartDraft.trackingQuestion}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/80">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                    {copy("tracker.smartSetupCadence", "Cadence")}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                    {formatFrequencyLabel(smartDraft.frequency)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/80">
                  <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                    <Clock3 size={12} />
                    {copy("tracker.smartSetupReminder", "Reminder")}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                    {formatReminderLabel(
                      smartDraft.reminderTime,
                      smartDraft.reminderDays,
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                  {copy("tracker.smartSetupTasks", "Generated Tasks")}
                </p>
                {smartDraft.tasks.length > 0 ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    {smartDraft.tasks.map((task) => (
                      <div
                        key={`${task.title}-${task.targetCount}`}
                        className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900/80"
                      >
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {task.title}
                        </div>
                        <div className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                          {task.targetValue != null && task.unitLabel
                            ? `${task.targetValue} ${task.unitLabel}`
                            : `${task.targetCount} target${task.targetCount === 1 ? "" : "s"}`}
                          {task.inputType !== "count"
                            ? ` • ${task.inputType}`
                            : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {copy(
                      "tracker.smartSetupNoTasks",
                      "Vector will still update the tracker question and cadence even if you only want a lighter check-in flow.",
                    )}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-cyan-900/80 dark:text-cyan-100/80">
              {copy(
                "tracker.smartSetupHint",
                "Use commas, new lines, or semicolons to describe multiple things you want to track.",
              )}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleApplyIntent}
              disabled={!smartDraft || isApplyingIntent}
              className="rounded-xl bg-cyan-600 text-white hover:bg-cyan-700"
            >
              {isApplyingIntent ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  {copy("tracker.smartSetupApplying", "Applying")}
                </>
              ) : (
                copy("tracker.smartSetupApply", "Apply Smart Setup")
              )}
            </Button>
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-700">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder={t("tracker.taskTitle") || "Task description"}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
            />
            <input
              type="number"
              min={1}
              value={newTarget}
              onChange={(e) => setNewTarget(parseInt(e.target.value) || 1)}
              className="w-24 px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-cyan-500 font-medium text-center"
              title="Target count"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAddTask}
                disabled={!newTitle.trim()}
                className="bg-cyan-600 hover:bg-cyan-700 text-white flex-1 md:flex-none"
              >
                Save
              </Button>
              <Button
                onClick={() => setIsAdding(false)}
                variant="outline"
                className="flex-1 md:flex-none"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {tasks.length === 0 && !isAdding ? (
        <p className="text-gray-500 text-center py-4 font-medium">
          {t("tracker.noTasks") ||
            "No related tasks yet. Add complementary habits!"}
        </p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const taskType = normalizeTaskType(task.task_type);
            const taskMeta = TASK_TYPE_META[taskType];
            const metricTask = isMetricTask(task as any);
            const current = metricTask ? 0 : completions[task.id] || 0;
            const target = task.target_count;
            const isDone = metricTask ? false : current >= target;
            const progressPct = Math.min(100, (current / target) * 100);
            const targetLabel = formatTaskTarget(task as any);

            return (
              <div
                key={task.id}
                className={`flex flex-col gap-2 rounded-xl border-2 p-4 transition-all ${isDone ? "bg-gray-50 dark:bg-zinc-800/30 border-gray-200 dark:border-zinc-800 opacity-80" : metricTask ? "bg-cyan-50/50 dark:bg-cyan-950/10 border-cyan-200/70 dark:border-cyan-900/40 shadow-sm" : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 shadow-sm"}`}
              >
                <div className="flex items-start md:items-center justify-between gap-4">
                  <div className="flex items-start md:items-center gap-3 flex-1 min-w-0">
                    <div className="pt-1 md:pt-0 shrink-0">
                      {metricTask ? (
                        <div className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-cyan-200 bg-white px-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-900/40 dark:bg-cyan-950/20 dark:text-cyan-300">
                          Log
                        </div>
                      ) : isDone ? (
                        <CheckCircle2 size={24} className="text-cyan-500" />
                      ) : (
                        <div className="flex h-6 min-w-6 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 px-1 text-[10px] font-bold text-cyan-700 dark:border-cyan-900/40 dark:bg-cyan-950/40 dark:text-cyan-300">
                          {current}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col w-full truncate">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-bold truncate ${isDone ? "text-gray-500 line-through" : "text-gray-900 dark:text-white"}`}
                        >
                          {task.title}
                        </span>
                        {taskType !== "task" && (
                          <Badge
                            variant="outline"
                            className={taskMeta.className}
                          >
                            {taskMeta.label}
                          </Badge>
                        )}
                        {metricTask && (
                          <Badge
                            variant="outline"
                            className="border-cyan-200 bg-cyan-100/80 text-cyan-700 dark:border-cyan-900/40 dark:bg-cyan-950/40 dark:text-cyan-300"
                          >
                            {task.input_type}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs font-bold text-gray-400 mt-1">
                        {metricTask
                          ? `Target: ${targetLabel} • Logged from quick check-in`
                          : `${current} / ${target}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isDone && !metricTask && (
                      <Button
                        onClick={() =>
                          handleAddCompletion(task.id, current, target)
                        }
                        variant="default"
                        size="icon"
                        aria-label={`Increment ${task.title}`}
                        className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-900/40 hover:bg-cyan-200 dark:hover:bg-cyan-800/60 text-cyan-700 dark:text-cyan-300 shadow-none border hover:scale-105 active:scale-95 transition-all"
                      >
                        <Plus size={16} />
                      </Button>
                    )}
                    <button
                      onClick={() => handleDelete(task.id)}
                      title={`Delete ${task.title}`}
                      aria-label={`Delete ${task.title}`}
                      className="text-gray-300 hover:text-red-500 transition-colors p-2 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {!isDone && !metricTask && (
                  <Progress
                    value={progressPct}
                    className="mt-2 h-1.5 bg-gray-100 dark:bg-zinc-800 [&_[data-slot=progress-indicator]]:bg-cyan-500"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
