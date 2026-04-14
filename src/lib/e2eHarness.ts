import {
  Blueprint,
  BlueprintReminder,
  BlueprintSubGoal,
  BlueprintTask,
  BlueprintTaskCompletion,
  BlueprintTracker,
  GoalLog,
  type BlueprintResult,
  type FrameworkId,
} from "@/lib/blueprints";
import { normalizeCanonicalPlanResult } from "@/lib/planContract";
import { deriveTrackerSeed } from "@/lib/trackerSeed";
import { getStepIdsAndLabels, inferPlanKind } from "@/lib/trackerSteps";

const E2E_USER_ID = "e2e-user";
const E2E_USER_EMAIL = "e2e@vector.local";

type ExecutionState = {
  tracker: BlueprintTracker | null;
  logs: GoalLog[];
  reminders: BlueprintReminder[];
  subGoals: BlueprintSubGoal[];
  tasks: BlueprintTask[];
  taskCompletions: BlueprintTaskCompletion[];
};

type SharedPayload = {
  blueprint: Blueprint;
  tracker: BlueprintTracker | null;
  logs: GoalLog[];
};

export type E2ECommunityTemplate = {
  id: string;
  user_id: string;
  framework: Blueprint["framework"];
  title: string;
  description: string;
  answers: string[];
  result: BlueprintResult;
  created_at: string;
  author_name: string;
};

const executionKey = (blueprintId: string) =>
  `vector.e2e.execution.${blueprintId}`;
const shareKey = (token: string) => `vector.e2e.share.${token}`;
const lastShareUrlKey = "vector.e2e.lastShareUrl";
const communityTemplatesKey = "vector.e2e.communityTemplates";

export function isE2EMode(): boolean {
  return import.meta.env.VITE_E2E_MODE === "true";
}

export function getE2EUser() {
  return {
    id: E2E_USER_ID,
    email: E2E_USER_EMAIL,
    tier: "max" as const,
  };
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function saveJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function buildTrackableActions(goal: string) {
  return [
    `Run a 45 minute focus block every Monday and Thursday at 09:00 for ${goal}.`,
    `Ship one measurable milestone for ${goal} by Friday 16:00 each week.`,
    `Review progress every Sunday at 18:00 and choose the next best action for ${goal}.`,
  ];
}

export function buildE2EWizardResult(
  framework: FrameworkId | string | undefined,
  answers: string[],
): BlueprintResult {
  const effectiveFramework = (framework || "rpm") as FrameworkId;
  const goal = answers[0]?.trim() || "Make steady progress on the goal";
  const title = goal.length > 72 ? `${goal.slice(0, 69).trim()}...` : goal;
  const actions = buildTrackableActions(goal);

  let raw: Record<string, unknown>;
  switch (effectiveFramework) {
    case "gps":
      raw = {
        type: "gps",
        goal,
        plan: actions.slice(0, 2),
        system: [
          "Log progress in the tracker after each focused session.",
          "Use the weekly review to cut or reschedule stale actions.",
        ],
        anti_goals: ["Reactive busywork without a deadline."],
      };
      break;
    case "pareto":
      raw = {
        type: "pareto",
        vital: actions.slice(0, 2),
        trivial: ["Checking low-value updates without acting on the plan."],
      };
      break;
    case "general":
      raw = {
        type: "general",
        steps: actions,
      };
      break;
    case "rpm":
    default:
      raw = {
        type: "rpm",
        result: title,
        purpose: `Create visible execution momentum around ${goal}.`,
        plan: actions,
      };
      break;
  }

  return normalizeCanonicalPlanResult(raw, effectiveFramework, {
    title,
    goal,
  }) as BlueprintResult;
}

function buildDefaultExecutionState(blueprint: Blueprint): ExecutionState {
  const now = new Date();
  const canonical = normalizeCanonicalPlanResult(
    (blueprint.result as Record<string, unknown>) || {},
    blueprint.framework,
    { title: blueprint.title, goal: blueprint.answers?.[0] },
  );
  const steps = getStepIdsAndLabels(canonical, blueprint.framework);
  const completedStepIds =
    inferPlanKind(canonical, blueprint.framework) === "finite" && steps[0]
      ? [steps[0].id]
      : [];
  const tracker: BlueprintTracker = {
    blueprint_id: blueprint.id,
    user_id: E2E_USER_ID,
    plan_kind: inferPlanKind(canonical, blueprint.framework),
    status: "active",
    progress_pct: completedStepIds.length ? 34 : 18,
    completed_step_ids: completedStepIds,
    last_activity_at: now.toISOString(),
    created_at: blueprint.createdAt,
    updated_at: now.toISOString(),
    reminder_enabled: true,
    reminder_time: canonical.scheduleHints[0]?.time || "09:00",
    reminder_days: canonical.scheduleHints[0]?.days || ["mon", "thu"],
    frequency:
      canonical.scheduleHints[0]?.cadence === "daily" ? "daily" : "weekly",
    color: "#2563eb",
  };

  const seed = deriveTrackerSeed(blueprint, E2E_USER_ID, now);

  const reminders: BlueprintReminder[] = seed.reminders.map((reminder, index) => ({
    id: `e2e-reminder-${index + 1}`,
    created_at: blueprint.createdAt,
    ...reminder,
  }));

  const subGoals: BlueprintSubGoal[] = seed.subGoals.map((goal, index) => ({
    id: `e2e-subgoal-${index + 1}`,
    created_at: blueprint.createdAt,
    status: index === 0 ? "completed" : goal.status,
    ...goal,
  }));

  const tasks: BlueprintTask[] = seed.tasks.map((task, index) => ({
    id: `e2e-task-${index + 1}`,
    created_at: blueprint.createdAt,
    ...task,
  }));

  const taskCompletions: BlueprintTaskCompletion[] = tasks
    .slice(0, 1)
    .map((task) => ({
      id: `e2e-task-completion-${task.id}`,
      task_id: task.id,
      user_id: E2E_USER_ID,
      completed_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    }));

  const logs: GoalLog[] = [
    {
      id: "e2e-log-checkin",
      blueprint_id: blueprint.id,
      user_id: E2E_USER_ID,
      kind: "check_in",
      payload: { done: true },
      created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    },
    ...(steps[0]
      ? [
          {
            id: "e2e-log-step",
            blueprint_id: blueprint.id,
            user_id: E2E_USER_ID,
            kind: "step_done" as const,
            payload: { step_id: steps[0].id },
            created_at: now.toISOString(),
          },
        ]
      : []),
  ];

  return {
    tracker,
    logs,
    reminders,
    subGoals,
    tasks,
    taskCompletions,
  };
}

export function loadE2EExecutionState(
  blueprintId: string,
): ExecutionState | null {
  return safeParse<ExecutionState>(
    localStorage.getItem(executionKey(blueprintId)),
  );
}

export function ensureE2EExecutionState(blueprint: Blueprint): ExecutionState {
  const existing = loadE2EExecutionState(blueprint.id);
  if (existing) return existing;
  const seeded = buildDefaultExecutionState(blueprint);
  saveJson(executionKey(blueprint.id), seeded);
  return seeded;
}

export function saveE2EExecutionState(
  blueprintId: string,
  state: ExecutionState,
) {
  saveJson(executionKey(blueprintId), state);
}

export function persistE2ESharePayload(token: string, payload: SharedPayload) {
  saveJson(shareKey(token), payload);
}

export function loadE2ESharePayload(token: string): SharedPayload | null {
  return safeParse<SharedPayload>(localStorage.getItem(shareKey(token)));
}

export function rememberE2EShareUrl(url: string) {
  localStorage.setItem(lastShareUrlKey, url);
}

export function loadLastE2EShareUrl(): string | null {
  return localStorage.getItem(lastShareUrlKey);
}

export function loadE2ECommunityTemplates(): E2ECommunityTemplate[] {
  return (
    safeParse<E2ECommunityTemplate[]>(
      localStorage.getItem(communityTemplatesKey),
    ) || []
  );
}

export function persistE2ECommunityTemplate(template: E2ECommunityTemplate) {
  const existing = loadE2ECommunityTemplates().filter(
    (item) => item.id !== template.id,
  );
  saveJson(communityTemplatesKey, [template, ...existing]);
}
