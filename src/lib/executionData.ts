import { supabase } from "@/lib/supabase";
import type {
  Blueprint,
  BlueprintReminder,
  BlueprintSubGoal,
  BlueprintTask,
  BlueprintTaskCompletion,
  BlueprintTracker,
  GoalLog,
} from "@/lib/blueprints";
import {
  ensureE2EExecutionState,
  isE2EMode,
  loadE2EExecutionState,
} from "@/lib/e2eHarness";

export interface ExecutionDataContext {
  tracker?: BlueprintTracker | null;
  logs?: GoalLog[];
  reminders?: BlueprintReminder[];
  subGoals?: BlueprintSubGoal[];
  tasks?: BlueprintTask[];
  taskCompletions?: BlueprintTaskCompletion[];
}

export async function loadBlueprintExecutionContext(
  blueprint: Blueprint,
  userId?: string | null,
  seedIfNeeded: boolean = false,
): Promise<ExecutionDataContext> {
  if (isE2EMode()) {
    const local = seedIfNeeded
      ? ensureE2EExecutionState(blueprint)
      : loadE2EExecutionState(blueprint.id);
    return local || {};
  }

  if (!supabase || !blueprint.id) return {};

  const [trackerRow, remindersRow, subGoalsRow, tasksRow, logsRow] =
    await Promise.all([
      supabase
        .from("blueprint_tracker")
        .select("*")
        .eq("blueprint_id", blueprint.id)
        .maybeSingle(),
      supabase
        .from("blueprint_reminders")
        .select("*")
        .eq("blueprint_id", blueprint.id),
      supabase
        .from("blueprint_sub_goals")
        .select("*")
        .eq("blueprint_id", blueprint.id),
      supabase
        .from("blueprint_tasks")
        .select("*")
        .eq("blueprint_id", blueprint.id),
      supabase
        .from("goal_logs")
        .select("*")
        .eq("blueprint_id", blueprint.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  const taskIds = Array.isArray(tasksRow.data)
    ? tasksRow.data.map((task: any) => task.id)
    : [];
  const taskCompletionsRow = taskIds.length
    ? await supabase
        .from("blueprint_task_completions")
        .select("*")
        .in("task_id", taskIds)
    : null;

  const filterByUser = <T extends { user_id?: string | null }>(
    rows: T[] | null | undefined,
  ) => {
    if (!Array.isArray(rows)) return [] as T[];
    if (!userId) return rows;
    return rows.filter((row) => !row.user_id || row.user_id === userId);
  };

  return {
    tracker: trackerRow.data as BlueprintTracker | null,
    logs: filterByUser(logsRow.data as GoalLog[] | null | undefined),
    reminders: filterByUser(
      remindersRow.data as BlueprintReminder[] | null | undefined,
    ),
    subGoals: filterByUser(
      subGoalsRow.data as BlueprintSubGoal[] | null | undefined,
    ),
    tasks: filterByUser(tasksRow.data as BlueprintTask[] | null | undefined),
    taskCompletions: filterByUser(
      taskCompletionsRow?.data as BlueprintTaskCompletion[] | null | undefined,
    ),
  };
}
