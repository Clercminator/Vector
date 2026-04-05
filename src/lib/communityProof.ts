import type {
  Blueprint,
  BlueprintSubGoal,
  BlueprintTask,
  BlueprintTaskCompletion,
  BlueprintTracker,
  GoalLog,
} from "@/lib/blueprints";
import type { CommunityProofSnapshot } from "@/lib/planContract";

export type CommunityProofEventType =
  | "published"
  | "progress"
  | "milestone"
  | "consistency"
  | "execution"
  | "completion";

export interface CommunityProofEvent {
  eventType: CommunityProofEventType;
  label: string;
  detail: string;
  eventDate: string;
  metricValue?: number;
  metricUnit?: string;
}

interface CommunityProofInput {
  blueprint: Blueprint;
  tracker?: BlueprintTracker | null;
  logs?: GoalLog[];
  subGoals?: BlueprintSubGoal[];
  tasks?: BlueprintTask[];
  taskCompletions?: BlueprintTaskCompletion[];
}

function dedupeActiveDays(logs: GoalLog[]) {
  return Array.from(
    new Set(
      logs
        .filter(
          (log) =>
            log.kind === "step_done" ||
            (log.kind === "check_in" && log.payload?.done),
        )
        .map((log) => new Date(log.created_at).toDateString()),
    ),
  );
}

export function buildCommunityProofArtifacts(input: CommunityProofInput): {
  snapshot: CommunityProofSnapshot;
  events: CommunityProofEvent[];
} {
  const {
    blueprint,
    tracker,
    logs = [],
    subGoals = [],
    tasks = [],
    taskCompletions = [],
  } = input;
  const milestoneCount = Array.isArray((blueprint.result as any)?.milestones)
    ? (blueprint.result as any).milestones.length
    : 0;
  const progressPct =
    typeof tracker?.progress_pct === "number" ? tracker.progress_pct : 0;
  const completedSubGoals = subGoals.filter(
    (goal) => goal.status === "completed",
  );
  const completedMilestones =
    completedSubGoals.length ||
    (milestoneCount > 0
      ? Math.min(
          milestoneCount,
          Math.round((progressPct / 100) * milestoneCount),
        )
      : 0);
  const activeDays = dedupeActiveDays(logs);
  const currentStreak = activeDays.length;
  const outcomeStatus: CommunityProofSnapshot["outcomeStatus"] =
    tracker?.status === "completed"
      ? "completed"
      : progressPct >= 65 || currentStreak >= 7
        ? "consistent"
        : progressPct > 0 || currentStreak > 0
          ? "in-progress"
          : "not-started";

  const snapshot: CommunityProofSnapshot = {
    progressPct,
    completedMilestones,
    totalMilestones: milestoneCount,
    currentStreak,
    lastActivityAt: tracker?.last_activity_at || null,
    planKind: tracker?.plan_kind,
    outcomeStatus,
    evidenceNote:
      progressPct > 0 || currentStreak > 0
        ? `Execution evidence: ${progressPct}% progress, ${currentStreak} active day${currentStreak === 1 ? "" : "s"}, and ${taskCompletions.length} completed task${taskCompletions.length === 1 ? "" : "s"}.`
        : "Published with a tracker-ready plan, milestones, and scheduling structure.",
  };

  const events: CommunityProofEvent[] = [
    {
      eventType: "published",
      label: "Structured plan published",
      detail:
        "The plan was published with tracker-ready milestones, schedule hints, and validation checks.",
      eventDate: blueprint.createdAt,
    },
  ];

  if (progressPct > 0) {
    events.push({
      eventType: "progress",
      label: "Progress verified",
      detail: `Tracker data shows ${progressPct}% completion against the current plan.`,
      eventDate:
        tracker?.updated_at || tracker?.last_activity_at || blueprint.createdAt,
      metricValue: progressPct,
      metricUnit: "percent",
    });
  }

  if (currentStreak > 0) {
    events.push({
      eventType: "consistency",
      label: "Consistency evidence",
      detail: `Logged execution on ${currentStreak} distinct day${currentStreak === 1 ? "" : "s"}.`,
      eventDate:
        tracker?.last_activity_at || logs[0]?.created_at || blueprint.createdAt,
      metricValue: currentStreak,
      metricUnit: "days",
    });
  }

  completedSubGoals.slice(0, 3).forEach((goal) => {
    events.push({
      eventType: "milestone",
      label: "Milestone achieved",
      detail: goal.title,
      eventDate: `${goal.target_date}T09:00:00.000Z`,
    });
  });

  if (taskCompletions.length > 0) {
    const completedTaskIds = new Set(
      taskCompletions.map((completion) => completion.task_id),
    );
    const completedTaskTitles = tasks
      .filter((task) => completedTaskIds.has(task.id))
      .slice(0, 2)
      .map((task) => task.title);
    events.push({
      eventType: "execution",
      label: "Task execution verified",
      detail: completedTaskTitles.length
        ? completedTaskTitles.join(" | ")
        : `${taskCompletions.length} execution event${taskCompletions.length === 1 ? "" : "s"} recorded.`,
      eventDate:
        taskCompletions[0]?.completed_at ||
        tracker?.last_activity_at ||
        blueprint.createdAt,
      metricValue: taskCompletions.length,
      metricUnit: "tasks",
    });
  }

  if (tracker?.status === "completed") {
    events.push({
      eventType: "completion",
      label: "Outcome completed",
      detail: "The owner marked the plan as completed in the tracker.",
      eventDate:
        tracker.updated_at || tracker.last_activity_at || blueprint.createdAt,
    });
  }

  return {
    snapshot,
    events: events.sort(
      (left, right) =>
        new Date(right.eventDate).getTime() -
        new Date(left.eventDate).getTime(),
    ),
  };
}
