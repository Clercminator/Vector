import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { BlueprintTaskType } from "@/lib/blueprints";
import { useLanguage } from "@/app/components/language-provider";
import { Plus, CheckSquare, Trash2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Progress } from "@/app/components/ui/progress";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  target_count: number;
  task_type?: BlueprintTaskType | null;
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

export function TrackerTasks({
  blueprintId,
  userId,
  color,
}: {
  blueprintId: string;
  userId: string;
  color?: string;
}) {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState(1);

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
        const sortedTasks = [...tsks].sort(
          (left: any, right: any) =>
            TASK_TYPE_ORDER[normalizeTaskType(left.task_type)] -
            TASK_TYPE_ORDER[normalizeTaskType(right.task_type)],
        );
        setTasks(sortedTasks);

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

    setTasks(
      [...tasks, data].sort(
        (left, right) =>
          TASK_TYPE_ORDER[normalizeTaskType(left.task_type)] -
          TASK_TYPE_ORDER[normalizeTaskType(right.task_type)],
      ),
    );
    setNewTitle("");
    setNewTarget(1);
    setIsAdding(false);
    toast.success("Task added");
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
    setTasks(tasks.filter((t) => t.id !== id));

    if (supabase) {
      const { error } = await supabase
        .from("blueprint_tasks")
        .delete()
        .eq("id", id);
      if (error) {
        setTasks(oldTasks);
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
            const current = completions[task.id] || 0;
            const target = task.target_count;
            const isDone = current >= target;
            const progressPct = Math.min(100, (current / target) * 100);

            return (
              <div
                key={task.id}
                className={`flex flex-col gap-2 p-4 rounded-xl border-2 transition-all ${isDone ? "bg-gray-50 dark:bg-zinc-800/30 border-gray-200 dark:border-zinc-800 opacity-80" : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 shadow-sm"}`}
              >
                <div className="flex items-start md:items-center justify-between gap-4">
                  <div className="flex items-start md:items-center gap-3 flex-1 min-w-0">
                    <div className="pt-1 md:pt-0 shrink-0">
                      {isDone ? (
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
                      </div>
                      <span className="text-xs font-bold text-gray-400 mt-1">
                        {current} / {target}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isDone && (
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

                {!isDone && (
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
