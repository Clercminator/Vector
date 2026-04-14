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

function buildMandalaCategories(goal: string) {
  return [
    {
      name: "Offer",
      steps: [
        `Define the core promise for ${goal} every Monday at 09:00.`,
        `Rewrite the offer headline after one user call every Wednesday at 14:00.`,
      ],
    },
    {
      name: "Proof",
      steps: [
        `Ship one proof artifact for ${goal} every Friday at 16:00.`,
        `Capture one proof metric for ${goal} every Friday at 16:30.`,
      ],
    },
    {
      name: "Audience",
      steps: [
        `Run one user interview for ${goal} every Wednesday at 14:00.`,
        `Send five focused outreach messages for ${goal} every Tuesday at 11:00.`,
      ],
    },
    {
      name: "Delivery",
      steps: [
        `Block one 60 minute delivery rehearsal for ${goal} every Thursday at 10:00.`,
        `Review delivery friction for ${goal} every Sunday at 18:00.`,
      ],
    },
    {
      name: "Systems",
      steps: [
        `Update the scorecard for ${goal} every Friday at 17:00.`,
        `Archive low-value tasks for ${goal} every Friday at 17:15.`,
      ],
    },
    {
      name: "Focus",
      steps: [
        `Run a protected build block for ${goal} every Monday at 09:00.`,
        `Run a second protected build block for ${goal} every Thursday at 09:00.`,
      ],
    },
    {
      name: "Recovery",
      steps: [
        `If a block slips for ${goal}, reschedule it within 24 hours before checking messages.`,
        `Cut the weekly scope for ${goal} in half during the Sunday 18:00 review when proof is missing.`,
      ],
    },
    {
      name: "Accountability",
      steps: [
        `Send one proof update for ${goal} every Friday at 17:30.`,
        `Review the next best action for ${goal} every Sunday at 18:30 with an accountability partner.`,
      ],
    },
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
  const [focusBlock, proofBlock, weeklyReview] = actions;

  let raw: Record<string, unknown>;
  switch (effectiveFramework) {
    case "first-principles":
      raw = {
        type: "first-principles",
        truths: [
          `Truth: ${goal} only moves when a protected 45 minute block stays on the calendar every Monday and Thursday at 09:00.`,
          `Truth: ${goal} needs one visible proof artifact shipped by Friday 16:00 each week.`,
          `Truth: reactive admin work will crowd out ${goal} unless it is capped after the focus block.`,
        ],
        newApproach:
          "Design the week around protected build blocks, a Friday proof artifact, and a Sunday reset before any new scope is added.",
      };
      break;
    case "gps":
      raw = {
        type: "gps",
        goal,
        plan: actions.slice(0, 2),
        system: [
          "Log progress in the tracker after each focused session.",
          "Use the weekly review to cut or reschedule stale actions.",
        ],
        anti_goals: [
          `Reactive busywork before the Friday 16:00 proof shipment for ${goal}.`,
          `Context-switching during the Monday 09:00 focus block for ${goal}.`,
        ],
      };
      break;
    case "pareto":
      raw = {
        type: "pareto",
        vital: actions.slice(0, 2),
        trivial: [
          `Checking low-value updates during the Monday 09:00 focus block for ${goal}.`,
          `Letting inbox cleanup replace the Friday 16:00 proof shipment for ${goal}.`,
        ],
      };
      break;
    case "eisenhower":
      raw = {
        type: "eisenhower",
        q1: [
          `Finalize the core weekly offer asset for ${goal} by Tuesday 17:00.`,
        ],
        q2: [focusBlock, proofBlock],
        q3: [
          `Delegate inbox triage for ${goal} support requests by 12:00 each weekday.`,
        ],
        q4: [
          `Eliminate social scrolling during the 09:00-10:00 focus block for ${goal} on weekdays.`,
        ],
      };
      break;
    case "okr":
      raw = {
        type: "okr",
        objective: title,
        keyResults: [
          `Book 3 discovery calls for ${goal} by Friday 17:00.`,
          `Ship 1 proof artifact for ${goal} every Friday at 16:00.`,
          `Complete 2 protected focus blocks for ${goal} each week.`,
        ],
        initiative:
          "Run a Monday planning block and a Thursday execution block before any reactive work is allowed.",
      };
      break;
    case "dsss":
      raw = {
        type: "dsss",
        deconstruct: [
          `Break ${goal} into one weekly milestone, one Friday proof artifact, and one protected build block.`,
          `Define a Friday 16:00 proof checkpoint and a Sunday 18:00 review for ${goal}.`,
        ],
        selection: [
          `Choose the single highest-leverage action for ${goal} every Monday at 09:00.`,
          `Ignore any new task for ${goal} that does not move the Friday proof artifact.`,
        ],
        sequence: [
          `Run the protected build block for ${goal} every Tuesday at 09:00 before meetings.`,
          `Ship the proof artifact for ${goal} every Friday at 16:00 before planning the next week.`,
        ],
        stakes:
          "Send the Friday proof artifact to an accountability partner by 17:00 each week.",
      };
      break;
    case "mandalas":
      raw = {
        type: "mandalas",
        centralGoal: title,
        categories: buildMandalaCategories(goal),
      };
      break;
    case "misogi":
      raw = {
        type: "misogi",
        challenge: [
          `Attempt the bold milestone for ${goal} on June 30 after 12 protected build blocks.`,
        ],
        gap: [
          `The current system for ${goal} ships zero public proof artifacts by Friday 16:00.`,
        ],
        purification: [
          `Protect Tuesday and Thursday 09:00 focus blocks for ${goal} and delete low-value admin after 18:00.`,
        ],
      };
      break;
    case "ikigai":
      raw = {
        type: "ikigai",
        love: `Spend a protected Tuesday 09:00 block helping real people make progress on ${goal}.`,
        goodAt: `Write one evidence-driven breakdown for ${goal} every Wednesday by 12:00.`,
        worldNeeds: `Ship one practical proof artifact for ${goal} every Friday at 16:00.`,
        paidFor: `Test one paid offer tied to ${goal} every Thursday at 15:00.`,
        purpose: `Use a Sunday 18:00 review to keep ${goal} tied to visible service and measurable proof.`,
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
        plan: [focusBlock, proofBlock, weeklyReview],
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

  const reminders: BlueprintReminder[] = seed.reminders.map(
    (reminder, index) => ({
      id: `e2e-reminder-${index + 1}`,
      created_at: blueprint.createdAt,
      ...reminder,
    }),
  );

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
