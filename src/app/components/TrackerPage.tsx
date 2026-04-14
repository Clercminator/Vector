import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";
import {
  Blueprint,
  loadLocalBlueprints,
  saveLocalBlueprints,
  upsertBlueprint,
} from "@/lib/blueprints";
import { useLanguage } from "@/app/components/language-provider";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Textarea } from "@/app/components/ui/textarea";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Gauge,
  ListChecks,
  MessageSquare,
  Target,
  PenLine,
  Settings,
  ShieldAlert,
  Share2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { getStepIdsAndLabels, inferPlanKind } from "@/lib/trackerSteps";
import {
  getBestStreaks,
  getExecutionInsight,
  getScorePercentage,
  generateCalendarHighlights,
  getCurrentStreakDetails,
  toLocalDateKey,
} from "@/lib/trackerStats";
import { isBlueprintCalendarWorthy } from "@/lib/calendarExport";
import { loadBlueprintExecutionContext } from "@/lib/executionData";
import {
  generateAdaptiveRevision,
  deriveRevisionExecutionArtifacts,
  type AdaptiveRevisionOutput,
} from "@/lib/adaptiveRevision";
import { normalizeCanonicalPlanResult } from "@/lib/planContract";
import { AdaptiveRevisionDialog } from "./AdaptiveRevisionDialog";
import {
  isE2EMode,
  ensureE2EExecutionState,
  persistE2ESharePayload,
  rememberE2EShareUrl,
  saveE2EExecutionState,
} from "@/lib/e2eHarness";
import {
  isOnline,
  addPendingGoalLog,
  addPendingTrackerUpdate,
  addPendingGoalLogDelete,
  flushPendingQueue,
  onTrackerSynced,
} from "@/lib/trackerOffline";
import { deriveTrackerSeed } from "@/lib/trackerSeed";

import { TrackerHeatmap } from "./tracker/TrackerHeatmap";
import { TrackerScore } from "./tracker/TrackerScore";
import { TrackerCalendar } from "./tracker/TrackerCalendar";
import { TrackerStreakCounter } from "./tracker/TrackerStreakCounter";
import { TrackerStreaksList } from "./tracker/TrackerStreaksList";
import { TrackerGoalTemplates } from "./tracker/TrackerGoalTemplates";
import { TrackerSubGoals } from "./tracker/TrackerSubGoals";
import { TrackerTasks } from "./tracker/TrackerTasks";
import { TrackerQuickLog } from "./tracker/TrackerQuickLog";
import { TrackerEditPanel } from "./tracker/TrackerEditPanel";
import { TrackerPastEditModal } from "./tracker/TrackerPastEditModal";
import { TrackerSetbackModal } from "./tracker/TrackerSetbackModal";
import { TrackerMotivation } from "./tracker/TrackerMotivation";
import { CalendarExportConfirmModal } from "./CalendarExportConfirmModal";

const FRAMEWORK_THEMES: Record<string, string> = {
  pareto: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  okr: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  eisenhower:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  rpm: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  misogi: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  ikigai: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300",
  dsss: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  "first-principles":
    "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300",
  gps: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
  mandalas:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  general: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  default: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const EXECUTION_STATE_STYLES = {
  "on-track": {
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    panel:
      "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30",
    signal: "text-emerald-600 dark:text-emerald-300",
    button: "bg-emerald-600 text-white hover:bg-emerald-500",
  },
  "at-risk": {
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    panel:
      "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30",
    signal: "text-amber-600 dark:text-amber-300",
    button: "bg-amber-500 text-black hover:bg-amber-400",
  },
  stalled: {
    badge:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    panel:
      "border-orange-200 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-950/30",
    signal: "text-orange-600 dark:text-orange-300",
    button: "bg-orange-500 text-black hover:bg-orange-400",
  },
  rescue: {
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    panel: "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30",
    signal: "text-red-600 dark:text-red-300",
    button: "bg-red-600 text-white hover:bg-red-500",
  },
} as const;

interface TrackerPageProps {
  effectiveUserId?: string | null;
  isImpersonating?: boolean;
}

function getMissingTrackerSeedPatch(
  tracker: any,
  defaults: Record<string, unknown>,
) {
  const patch: Record<string, unknown> = {};

  if (!tracker?.tracking_question && defaults.tracking_question) {
    patch.tracking_question = defaults.tracking_question;
  }
  if (!tracker?.frequency && defaults.frequency) {
    patch.frequency = defaults.frequency;
  }
  if (!tracker?.reminder_time && defaults.reminder_time) {
    patch.reminder_time = defaults.reminder_time;
  }
  if (
    (!Array.isArray(tracker?.reminder_days) || !tracker.reminder_days.length) &&
    Array.isArray(defaults.reminder_days) &&
    defaults.reminder_days.length
  ) {
    patch.reminder_days = defaults.reminder_days;
  }
  if (tracker?.reminder_enabled == null && defaults.reminder_enabled != null) {
    patch.reminder_enabled = defaults.reminder_enabled;
  }

  return patch;
}

export function TrackerPage({
  effectiveUserId: effectiveUserIdProp,
  isImpersonating,
}: TrackerPageProps = {}) {
  const { blueprintId } = useParams<{ blueprintId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const replaceValue = (key: string, value: string) =>
    t(key).replace("{0}", value);
  const executionStateKey = {
    "on-track": "onTrack",
    "at-risk": "atRisk",
    stalled: "stalled",
    rescue: "rescue",
  } as const;
  const riskKey = {
    low: "low",
    medium: "medium",
    high: "high",
  } as const;
  const translateExecutionText = (value: string) => {
    const noActivityMatch = value.match(
      /^No logged activity for (\d+) days\.$/,
    );
    if (noActivityMatch) {
      return replaceValue(
        "tracker.execution.overdue.noActivity",
        noActivityMatch[1],
      );
    }

    if (
      value ===
      "No tracked steps completed yet. Start with the next best action."
    ) {
      return t("tracker.execution.overdue.noSteps");
    }
    if (value === "Progress is still below the first milestone threshold.") {
      return t("tracker.execution.overdue.lowProgress");
    }
    if (value === "No proof or reflection has been logged this week.") {
      return t("tracker.execution.proof.noLog");
    }
    if (
      value ===
      "The tracker shows friction, but there is no recent proof note explaining what changed."
    ) {
      return t("tracker.execution.proof.noProofAfterSetback");
    }
    if (
      value ===
      "Tighten this week: restore a proof loop before you add more scope."
    ) {
      return t("tracker.execution.adaptive.restoreProofLoop");
    }
    if (value === "Review whether the current cadence still fits your week.") {
      return t("tracker.execution.adaptive.reviewFit");
    }

    const resetPrefix = "Reset with one small win today: ";
    if (value.startsWith(resetPrefix)) {
      return `${t("tracker.execution.recovery.resetPrefix")}${value.slice(resetPrefix.length)}`;
    }

    const shorterPrefix =
      "If today slips, do a shorter version of this action: ";
    if (value.startsWith(shorterPrefix)) {
      return `${t("tracker.execution.recovery.shorterPrefix")}${value.slice(shorterPrefix.length)}`;
    }

    const tightenPrefix = "Tighten this week: ";
    if (value.startsWith(tightenPrefix)) {
      return `${t("tracker.execution.adaptive.tightenPrefix")}: ${value.slice(tightenPrefix.length)}`;
    }

    return value;
  };

  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [tracker, setTracker] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"not-found" | "unauthorized" | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [journalContent, setJournalContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI Modals state
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [isPastEditModalOpen, setIsPastEditModalOpen] = useState(false);
  const [isSetbackModalOpen, setIsSetbackModalOpen] = useState(false);
  const [isCalendarExportOpen, setIsCalendarExportOpen] = useState(false);
  const [isAdaptiveRevisionOpen, setIsAdaptiveRevisionOpen] = useState(false);
  const [adaptiveRevisionNote, setAdaptiveRevisionNote] = useState("");
  const [adaptiveRevisionGenerating, setAdaptiveRevisionGenerating] =
    useState(false);
  const [adaptiveRevisionApplying, setAdaptiveRevisionApplying] =
    useState(false);
  const [adaptiveRevisionDraft, setAdaptiveRevisionDraft] =
    useState<AdaptiveRevisionOutput | null>(null);
  const [revisionNonce, setRevisionNonce] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [dateRange, setDateRange] = useState<
    "all" | "7days" | "30days" | "this_year"
  >("all");

  const loadData = async () => {
    if (isE2EMode() && blueprintId) {
      const localBlueprints = loadLocalBlueprints();
      const activeBlueprint = (() => {
        try {
          const raw = localStorage.getItem("vector.e2e.activeBlueprint");
          return raw ? (JSON.parse(raw) as Blueprint) : null;
        } catch {
          return null;
        }
      })();
      const localBlueprint =
        localBlueprints.find((item) => item.id === blueprintId) ||
        activeBlueprint ||
        localBlueprints[0] ||
        null;
      if (!localBlueprint) {
        setError("not-found");
        setLoading(false);
        return;
      }

      const execution = ensureE2EExecutionState(localBlueprint);
      setUserId("e2e-user");
      setBlueprint(localBlueprint);
      setTracker(execution.tracker);
      setLogs(execution.logs);
      setLoading(false);
      return;
    }

    if (!supabase) return;
    if (!blueprintId) {
      setError("not-found");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const effectiveUserForPage =
      isImpersonating && effectiveUserIdProp ? effectiveUserIdProp : user?.id;
    if (!effectiveUserForPage) {
      setError("unauthorized");
      setLoading(false);
      return;
    }
    setUserId(effectiveUserForPage);

    // Fetch blueprint
    const { data: bpData, error: bpError } = await supabase
      .from("blueprints")
      .select("*")
      .eq("id", blueprintId)
      .single();

    if (bpError || !bpData) {
      setError("not-found");
      setLoading(false);
      return;
    }

    const bp = bpData as unknown as Blueprint;
    if ((bpData as any).user_id !== effectiveUserForPage) {
      setError("unauthorized");
      setLoading(false);
      return;
    }

    setBlueprint(bp);

    const trackerSeed = deriveTrackerSeed(bp, effectiveUserForPage, new Date());

    // Fetch or create tracker (skip create when impersonating - view-only)
    let { data: trkData, error: trkError } = await supabase
      .from("blueprint_tracker")
      .select("*")
      .eq("blueprint_id", blueprintId)
      .eq("user_id", effectiveUserForPage)
      .single();

    if (trkError && trkError.code === "PGRST116" && !isImpersonating && user) {
      const kind = inferPlanKind(bp.result, bp.framework);
      const { data: newTrk } = await supabase
        .from("blueprint_tracker")
        .insert({
          blueprint_id: blueprintId,
          user_id: user.id,
          plan_kind: kind,
          status: "active",
          completed_step_ids: [],
          tracking_question: trackerSeed.trackerDefaults.tracking_question,
          frequency: trackerSeed.trackerDefaults.frequency,
          reminder_time: trackerSeed.trackerDefaults.reminder_time,
          reminder_days: trackerSeed.trackerDefaults.reminder_days,
          reminder_enabled: trackerSeed.trackerDefaults.reminder_enabled,
        })
        .select()
        .single();
      trkData = newTrk;
    }

    // Fetch goal logs
    const { data: gLogs } = await supabase
      .from("goal_logs")
      .select("*")
      .eq("blueprint_id", blueprintId)
      .eq("user_id", effectiveUserForPage)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!isImpersonating && trkData) {
      try {
        const executionContext = await loadBlueprintExecutionContext(
          bp,
          effectiveUserForPage,
          false,
        );
        const trackerPatch = getMissingTrackerSeedPatch(
          trkData,
          trackerSeed.trackerDefaults as Record<string, unknown>,
        );

        if (Object.keys(trackerPatch).length > 0) {
          const { error: trackerPatchError } = await supabase
            .from("blueprint_tracker")
            .update(trackerPatch)
            .eq("blueprint_id", blueprintId)
            .eq("user_id", effectiveUserForPage);
          if (!trackerPatchError) {
            trkData = { ...trkData, ...trackerPatch };
          }
        }

        if (
          (!executionContext.subGoals ||
            executionContext.subGoals.length === 0) &&
          trackerSeed.subGoals.length > 0
        ) {
          await supabase
            .from("blueprint_sub_goals")
            .insert(trackerSeed.subGoals);
        }

        if (
          (!executionContext.tasks || executionContext.tasks.length === 0) &&
          trackerSeed.tasks.length > 0
        ) {
          await supabase.from("blueprint_tasks").insert(trackerSeed.tasks);
        }

        if (
          (!executionContext.reminders ||
            executionContext.reminders.length === 0) &&
          trackerSeed.reminders.length > 0
        ) {
          await supabase
            .from("blueprint_reminders")
            .insert(trackerSeed.reminders);
        }
      } catch (seedError) {
        console.warn("Tracker seed skipped", seedError);
      }
    }

    setTracker(trkData);
    setLogs(gLogs || []);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [blueprintId, effectiveUserIdProp, isImpersonating]);

  const filteredLogs = React.useMemo(() => {
    if (dateRange === "all") return logs;
    const now = new Date();
    if (dateRange === "7days") {
      const cutoff = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      return logs.filter((l) => new Date(l.created_at) >= cutoff);
    }
    if (dateRange === "30days") {
      const cutoff = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      return logs.filter((l) => new Date(l.created_at) >= cutoff);
    }
    if (dateRange === "this_year") {
      const cutoff = new Date(now.getFullYear(), 0, 1);
      return logs.filter((l) => new Date(l.created_at) >= cutoff);
    }
    return logs;
  }, [logs, dateRange]);

  useEffect(() => {
    if (!supabase || !userId) return;
    if (isImpersonating) return; // view-only: don't flush offline queues
    const runFlushThenReload = () => {
      flushPendingQueue(supabase, userId).then(({ flushed }) => {
        if (flushed > 0) loadData();
      });
    };
    if (isOnline()) runFlushThenReload();
    const unsub = onTrackerSynced(() => loadData());
    const onOnline = () => runFlushThenReload();
    window.addEventListener("online", onOnline);
    return () => {
      unsub();
      window.removeEventListener("online", onOnline);
    };
  }, [blueprintId, userId, isImpersonating]);

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    if (isImpersonating) {
      toast.error(
        t("tracker.viewOnly") || "View-only mode. Changes are disabled.",
      );
      return;
    }
    if (!tracker) return;
    const newStatus = e.target.value;
    const oldStatus = tracker.status;
    setTracker({ ...tracker, status: newStatus });

    if (supabase) {
      const { error } = await supabase
        .from("blueprint_tracker")
        .update({ status: newStatus })
        .eq("blueprint_id", blueprintId);
      if (error) {
        setTracker({ ...tracker, status: oldStatus });
        toast.error(
          t("errors.trackerUpdateFailed") ||
            "Couldn't update. Please try again.",
        );
      }
    }
  };

  const handleToggleStep = async (stepId: string) => {
    if (isImpersonating) {
      toast.error(
        t("tracker.viewOnly") || "View-only mode. Changes are disabled.",
      );
      return;
    }
    if (!tracker || !blueprintId) return;
    const isCompleted = tracker.completed_step_ids?.includes(stepId);
    const newCompleted = isCompleted
      ? tracker.completed_step_ids.filter((id: string) => id !== stepId)
      : [...(tracker.completed_step_ids || []), stepId];
    const oldTracker = { ...tracker };
    setTracker({ ...tracker, completed_step_ids: newCompleted });

    if (!isOnline()) {
      addPendingTrackerUpdate(blueprintId, newCompleted);
      if (!isCompleted && userId) {
        addPendingGoalLog(blueprintId, userId, "step_done", {
          payload: { step_id: stepId },
        });
        setLogs(
          (prev) =>
            [
              {
                id: `offline_${Date.now()}`,
                blueprint_id: blueprintId,
                user_id: userId,
                kind: "step_done",
                payload: { step_id: stepId },
                created_at: new Date().toISOString(),
              },
              ...prev,
            ] as any[],
        );
        setTracker((prev) =>
          prev ? { ...prev, last_activity_at: new Date().toISOString() } : null,
        );
      }
      toast.success(
        t("tracker.savedOffline") ||
          "Saved locally. Will sync when back online.",
      );
      return;
    }

    if (!supabase || !userId) return;
    const ops = [
      supabase
        .from("blueprint_tracker")
        .update({ completed_step_ids: newCompleted })
        .eq("blueprint_id", blueprintId),
    ];
    if (!isCompleted) {
      ops.push(
        supabase
          .from("goal_logs")
          .insert({
            blueprint_id: blueprintId,
            user_id: userId,
            kind: "step_done",
            payload: { step_id: stepId },
          })
          .select()
          .single(),
      );
    }
    try {
      const results = await Promise.all(ops);
      if (results[0].error) throw results[0].error;
      if (!isCompleted && results[1] && !(results[1] as any).error) {
        setLogs([(results[1] as any).data, ...logs]);
        setTracker((prev) =>
          prev ? { ...prev, last_activity_at: new Date().toISOString() } : null,
        );
      }
    } catch (e) {
      console.error(e);
      toast.error(
        t("errors.trackerUpdateFailed") || "Couldn't update. Please try again.",
      );
      setTracker(oldTracker);
    }
  };

  const handleLogToday = async (note?: string) => {
    if (isImpersonating) {
      toast.error(
        t("tracker.viewOnly") || "View-only mode. Changes are disabled.",
      );
      return;
    }
    if (!userId) return;
    const newLog = {
      blueprint_id: blueprintId,
      user_id: userId,
      kind: "check_in" as const,
      content: note?.trim() ?? null,
      payload: { done: true },
    };
    if (!isOnline()) {
      addPendingGoalLog(blueprintId, userId, "check_in", {
        content: newLog.content,
        payload: newLog.payload,
      });
      setLogs([
        {
          ...newLog,
          id: `offline_${Date.now()}`,
          created_at: new Date().toISOString(),
        } as any,
        ...logs,
      ]);
      setTracker((prev) =>
        prev ? { ...prev, last_activity_at: new Date().toISOString() } : null,
      );
      toast.success(
        t("tracker.savedOffline") ||
          "Saved locally. Will sync when back online.",
      );
      return;
    }
    if (!supabase) return;
    const { data, error } = await supabase
      .from("goal_logs")
      .insert(newLog)
      .select()
      .single();
    if (error) {
      toast.error(
        t("errors.trackerUpdateFailed") || "Couldn't update. Please try again.",
      );
      throw error;
    }
    setLogs([data, ...logs]);
    setTracker((prev) =>
      prev ? { ...prev, last_activity_at: new Date().toISOString() } : null,
    );
    toast.success("Activity logged! ✔️");
  };

  const handleAddJournal = async () => {
    if (isImpersonating) {
      toast.error(
        t("tracker.viewOnly") || "View-only mode. Changes are disabled.",
      );
      return;
    }
    if (!userId || !journalContent.trim()) return;
    setIsSubmitting(true);
    const content = journalContent.trim();
    const newLog = {
      blueprint_id: blueprintId,
      user_id: userId,
      kind: "journal" as const,
      content,
    };
    if (!isOnline()) {
      addPendingGoalLog(blueprintId, userId, "journal", { content });
      setLogs(
        (
          [
            {
              ...newLog,
              id: `offline_${Date.now()}`,
              created_at: new Date().toISOString(),
              payload: {},
            } as any,
            ...logs,
          ] as any[]
        ).sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      );
      setTracker((prev) =>
        prev ? { ...prev, last_activity_at: new Date().toISOString() } : null,
      );
      setJournalContent("");
      toast.success(
        t("tracker.savedOffline") ||
          "Saved locally. Will sync when back online.",
      );
      setIsSubmitting(false);
      return;
    }
    if (!supabase) {
      setIsSubmitting(false);
      return;
    }
    const { data, error } = await supabase
      .from("goal_logs")
      .insert(newLog)
      .select()
      .single();
    if (error) {
      toast.error(
        t("errors.trackerUpdateFailed") || "Couldn't update. Please try again.",
      );
    } else {
      setLogs(
        [data, ...logs].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      );
      setTracker((prev) =>
        prev ? { ...prev, last_activity_at: new Date().toISOString() } : null,
      );
      setJournalContent("");
      toast.success("Journal saved.");
    }
    setIsSubmitting(false);
  };

  const handleLogSetback = async (reason: string) => {
    if (isImpersonating) {
      toast.error(
        t("tracker.viewOnly") || "View-only mode. Changes are disabled.",
      );
      return;
    }
    if (!userId) return;
    const newLog = {
      blueprint_id: blueprintId,
      user_id: userId,
      kind: "setback" as const,
      content: reason || null,
    };
    if (!isOnline()) {
      addPendingGoalLog(blueprintId, userId, "setback", {
        content: newLog.content,
      });
      setLogs(
        (
          [
            {
              ...newLog,
              id: `offline_${Date.now()}`,
              created_at: new Date().toISOString(),
              payload: {},
            } as any,
            ...logs,
          ] as any[]
        ).sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      );
      setTracker((prev) =>
        prev ? { ...prev, last_activity_at: new Date().toISOString() } : null,
      );
      toast.success(
        t("tracker.savedOffline") ||
          "Saved locally. Will sync when back online.",
      );
      return;
    }
    if (!supabase) return;
    const { data, error } = await supabase
      .from("goal_logs")
      .insert(newLog)
      .select()
      .single();
    if (error) {
      toast.error(
        t("errors.trackerUpdateFailed") || "Couldn't update. Please try again.",
      );
      throw error;
    }
    setLogs(
      [data, ...logs].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    );
    setTracker((prev) =>
      prev ? { ...prev, last_activity_at: new Date().toISOString() } : null,
    );
    toast.success(t("tracker.setbackLogged"));
  };

  const handleSaveSettings = async (bpUpdates: any, trUpdates: any) => {
    if (isImpersonating) {
      toast.error(
        t("tracker.viewOnly") || "View-only mode. Changes are disabled.",
      );
      return;
    }
    if (!supabase) return;

    const p1 = supabase
      .from("blueprints")
      .update(bpUpdates)
      .eq("id", blueprintId);
    const p2 = supabase
      .from("blueprint_tracker")
      .update(trUpdates)
      .eq("blueprint_id", blueprintId);

    const [r1, r2] = await Promise.all([p1, p2]);
    if (r1.error || r2.error) throw r1.error || r2.error;

    setBlueprint({ ...blueprint, ...bpUpdates } as any);
    setTracker({ ...tracker, ...trUpdates });
    toast.success("Settings saved");
  };

  const handleSavePastEdit = async (date: Date, markActive: boolean) => {
    if (isImpersonating) {
      toast.error(
        t("tracker.viewOnly") || "View-only mode. Changes are disabled.",
      );
      return;
    }
    if (!userId) return;
    const dateStr = toLocalDateKey(date);
    const existingLog = logs.find(
      (l) =>
        l.kind === "check_in" &&
        toLocalDateKey(new Date(l.created_at)) === dateStr &&
        l.payload?.done,
    );

    if (markActive && !existingLog) {
      const pastDate = new Date(date);
      pastDate.setHours(12, 0, 0, 0);
      const created_at = pastDate.toISOString();
      if (!isOnline()) {
        addPendingGoalLog(blueprintId, userId, "check_in", {
          payload: { done: true },
          created_at,
        });
        setLogs(
          (
            [
              {
                id: `offline_${Date.now()}`,
                blueprint_id: blueprintId,
                user_id: userId,
                kind: "check_in",
                payload: { done: true },
                created_at,
              } as any,
              ...logs,
            ] as any[]
          ).sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          ),
        );
        setTracker((prev) =>
          prev ? { ...prev, last_activity_at: new Date().toISOString() } : null,
        );
        toast.success(
          t("tracker.savedOffline") ||
            "Saved locally. Will sync when back online.",
        );
        return;
      }
      if (!supabase) return;
      const { data, error } = await supabase
        .from("goal_logs")
        .insert({
          blueprint_id: blueprintId,
          user_id: userId,
          kind: "check_in",
          payload: { done: true },
          created_at,
        })
        .select()
        .single();
      if (error) throw error;
      setLogs(
        [data, ...logs].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      );
      setTracker((prev) =>
        prev ? { ...prev, last_activity_at: new Date().toISOString() } : null,
      );
      toast.success("Past activity logged!");
    } else if (!markActive && existingLog) {
      if (!isOnline()) {
        addPendingGoalLogDelete(existingLog.id);
        setLogs(logs.filter((l) => l.id !== existingLog.id));
        toast.success(
          t("tracker.savedOffline") ||
            "Saved locally. Will sync when back online.",
        );
        return;
      }
      if (!supabase) return;
      const { error } = await supabase
        .from("goal_logs")
        .delete()
        .eq("id", existingLog.id);
      if (error) throw error;
      setLogs(logs.filter((l) => l.id !== existingLog.id));
      toast.success("Activity removed.");
    }
  };

  const handleShare = async () => {
    if (isImpersonating) {
      toast.error(
        t("tracker.viewOnly") || "View-only mode. Changes are disabled.",
      );
      return;
    }
    if (isE2EMode() && blueprint && tracker && blueprintId) {
      const shareToken = crypto.randomUUID().replace(/-/g, "");
      const shareUrl = `${window.location.origin}/share/${shareToken}`;
      persistE2ESharePayload(shareToken, { blueprint, tracker, logs });
      rememberE2EShareUrl(shareUrl);
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t("tracker.share.copied"));
      return;
    }

    if (!supabase || !blueprintId) return;

    try {
      // Check if token exists
      const { data: existing } = await supabase
        .from("blueprint_shares")
        .select("share_token")
        .eq("blueprint_id", blueprintId)
        .maybeSingle();

      let shareToken = existing?.share_token;

      if (!shareToken) {
        // Create new token
        shareToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const { error } = await supabase.from("blueprint_shares").insert({
          blueprint_id: blueprintId,
          share_token: shareToken,
          permission: "view",
        });

        if (error) throw error;
      }

      const shareUrl = `${window.location.origin}/share/${shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t("tracker.share.copied"));
    } catch (e: any) {
      console.error(e);
      toast.error(t("tracker.share.error"));
    }
  };

  const handleGenerateAdaptiveRevision = async () => {
    if (!blueprint) return;
    setAdaptiveRevisionGenerating(true);
    try {
      const executionContext = await loadBlueprintExecutionContext(
        blueprint,
        userId,
        true,
      );
      const revision = await generateAdaptiveRevision({
        blueprint,
        tracker: executionContext.tracker ?? tracker,
        logs: executionContext.logs ?? logs,
        subGoals: executionContext.subGoals,
        tasks: executionContext.tasks,
        taskCompletions: executionContext.taskCompletions,
        userNote: adaptiveRevisionNote,
      });
      setAdaptiveRevisionDraft(revision);
    } catch (error) {
      console.error(error);
      toast.error("Could not generate a revision right now.");
    } finally {
      setAdaptiveRevisionGenerating(false);
    }
  };

  const handleApplyAdaptiveRevision = async () => {
    if (!blueprint || !adaptiveRevisionDraft || !blueprintId) return;
    setAdaptiveRevisionApplying(true);
    const revisedBlueprint: Blueprint = {
      ...blueprint,
      result: adaptiveRevisionDraft.revisedResult,
    };
    const revisionContent = `Adaptive revision applied.\n\n${adaptiveRevisionDraft.revisionSummary}`;
    const nowIso = new Date().toISOString();

    try {
      if (isE2EMode()) {
        const updatedBlueprints = upsertBlueprint(
          loadLocalBlueprints(),
          revisedBlueprint,
        ) as Blueprint[];
        saveLocalBlueprints(updatedBlueprints);
        localStorage.setItem(
          "vector.e2e.activeBlueprint",
          JSON.stringify(revisedBlueprint),
        );

        const existingExecution = ensureE2EExecutionState(revisedBlueprint);
        const derivedArtifacts = deriveRevisionExecutionArtifacts(
          revisedBlueprint,
          "e2e-user",
          new Date(),
        );
        saveE2EExecutionState(revisedBlueprint.id, {
          ...existingExecution,
          tracker: existingExecution.tracker
            ? {
                ...existingExecution.tracker,
                completed_step_ids:
                  existingExecution.tracker.plan_kind === "finite"
                    ? []
                    : existingExecution.tracker.completed_step_ids,
                progress_pct:
                  existingExecution.tracker.plan_kind === "finite"
                    ? 0
                    : existingExecution.tracker.progress_pct,
                updated_at: nowIso,
                last_activity_at: nowIso,
              }
            : existingExecution.tracker,
          subGoals: derivedArtifacts.subGoals.map((goal, index) => ({
            id: `e2e-revision-subgoal-${index + 1}`,
            created_at: nowIso,
            ...goal,
          })),
          tasks: derivedArtifacts.tasks.map((task, index) => ({
            id: `e2e-revision-task-${index + 1}`,
            created_at: nowIso,
            ...task,
          })),
          taskCompletions: [],
          logs: [
            {
              id: `e2e-revision-log-${Date.now()}`,
              blueprint_id: revisedBlueprint.id,
              user_id: "e2e-user",
              kind: "journal",
              content: revisionContent,
              payload: {
                revision: true,
                changeHighlights: adaptiveRevisionDraft.changeHighlights,
              },
              created_at: nowIso,
            },
            ...existingExecution.logs,
          ],
        });
      } else {
        if (!supabase || !userId) {
          throw new Error("You must be signed in to apply a revision.");
        }

        const executionContext = await loadBlueprintExecutionContext(
          blueprint,
          userId,
          false,
        );
        const derivedArtifacts = deriveRevisionExecutionArtifacts(
          revisedBlueprint,
          userId,
          new Date(),
        );
        const taskIds = (executionContext.tasks || []).map((task) => task.id);

        const { error: blueprintError } = await supabase
          .from("blueprints")
          .update({ result: revisedBlueprint.result, updated_at: nowIso })
          .eq("id", revisedBlueprint.id)
          .eq("user_id", userId);
        if (blueprintError) throw blueprintError;

        if (tracker) {
          const { error: trackerError } = await supabase
            .from("blueprint_tracker")
            .update({
              completed_step_ids:
                tracker.plan_kind === "finite"
                  ? []
                  : tracker.completed_step_ids,
              progress_pct:
                tracker.plan_kind === "finite" ? 0 : tracker.progress_pct,
              updated_at: nowIso,
              last_activity_at: nowIso,
            })
            .eq("blueprint_id", revisedBlueprint.id)
            .eq("user_id", userId);
          if (trackerError) throw trackerError;
        }

        if (taskIds.length > 0) {
          const { error: completionDeleteError } = await supabase
            .from("blueprint_task_completions")
            .delete()
            .in("task_id", taskIds);
          if (completionDeleteError) throw completionDeleteError;
        }

        const { error: subGoalDeleteError } = await supabase
          .from("blueprint_sub_goals")
          .delete()
          .eq("blueprint_id", revisedBlueprint.id);
        if (subGoalDeleteError) throw subGoalDeleteError;

        const { error: taskDeleteError } = await supabase
          .from("blueprint_tasks")
          .delete()
          .eq("blueprint_id", revisedBlueprint.id);
        if (taskDeleteError) throw taskDeleteError;

        if (derivedArtifacts.subGoals.length > 0) {
          const { error: subGoalInsertError } = await supabase
            .from("blueprint_sub_goals")
            .insert(derivedArtifacts.subGoals);
          if (subGoalInsertError) throw subGoalInsertError;
        }

        if (derivedArtifacts.tasks.length > 0) {
          const { error: taskInsertError } = await supabase
            .from("blueprint_tasks")
            .insert(derivedArtifacts.tasks);
          if (taskInsertError) throw taskInsertError;
        }

        const { error: logError } = await supabase.from("goal_logs").insert({
          blueprint_id: revisedBlueprint.id,
          user_id: userId,
          kind: "journal",
          content: revisionContent,
          payload: {
            revision: true,
            changeHighlights: adaptiveRevisionDraft.changeHighlights,
          },
        });
        if (logError) throw logError;
      }

      await loadData();
      setRevisionNonce((value) => value + 1);
      setAdaptiveRevisionOpen(false);
      setAdaptiveRevisionDraft(null);
      setAdaptiveRevisionNote("");
      toast.success("Adaptive revision applied to the plan.");
    } catch (error) {
      console.error(error);
      toast.error("Could not apply the revision.");
    } finally {
      setAdaptiveRevisionApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white" />
      </div>
    );
  }

  if (error === "not-found" || !blueprint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Target size={48} className="text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t("tracker.planNotFound")}</h2>
        <Button onClick={() => navigate("/dashboard")} className="mt-4">
          {t("tracker.backToPlans")}
        </Button>
      </div>
    );
  }

  if (error === "unauthorized") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold mb-2">{t("tracker.unauthorized")}</h2>
        <Button onClick={() => navigate("/dashboard")} className="mt-4">
          {t("tracker.backToPlans")}
        </Button>
      </div>
    );
  }

  const steps = getStepIdsAndLabels(blueprint.result, blueprint.framework);
  const canonicalPlan = normalizeCanonicalPlanResult(
    (blueprint.result as Record<string, unknown>) || {},
    blueprint.framework,
    { title: blueprint.title, goal: blueprint.answers?.[0] },
  );
  const isInfinite = tracker?.plan_kind === "infinite";
  const showCalendarExport = isBlueprintCalendarWorthy(blueprint);

  const themeClass =
    FRAMEWORK_THEMES[blueprint.framework] || FRAMEWORK_THEMES["default"];
  const colorAccent = tracker?.color || undefined;

  const highlights = generateCalendarHighlights(filteredLogs);
  const bestStreaks = getBestStreaks(filteredLogs);
  const { streakStartedAt, count: currentStreak } =
    getCurrentStreakDetails(filteredLogs);
  // When impersonating and the user has no tracker row yet, `tracker` may be null.
  // Score/tracker-dependent UI should degrade gracefully instead of crashing.
  const score = tracker
    ? getScorePercentage(filteredLogs, tracker, steps.length, 7)
    : 0; // 7-day trailing score
  const executionInsight = tracker
    ? getExecutionInsight(blueprint, tracker, filteredLogs as any)
    : null;
  const isDoneToday = highlights.has(toLocalDateKey(new Date()));

  const savingsAmount =
    tracker?.savings_enabled && tracker?.savings_baseline
      ? currentStreak * tracker.savings_baseline
      : null;
  const savingsUnit = tracker?.savings_unit || "$";
  const revisionReasons = executionInsight
    ? [
        ...executionInsight.overdueSignals,
        ...executionInsight.proofSignals,
        executionInsight.missedDayRecovery,
      ]
        .filter(Boolean)
        .map(translateExecutionText)
    : [];
  const shouldSuggestAdaptiveRevision =
    !!executionInsight &&
    (executionInsight.executionState === "stalled" ||
      executionInsight.executionState === "rescue" ||
      executionInsight.overdueSignals.length > 0 ||
      executionInsight.proofSignals.length > 0);
  const executionStateStyle = executionInsight
    ? EXECUTION_STATE_STYLES[executionInsight.executionState]
    : null;
  const revisionCtaLabel =
    executionInsight && executionInsight.executionState !== "on-track"
      ? t("tracker.execution.revisionTighten")
      : t("tracker.execution.revisionStandard");
  const executionStateLabel = executionInsight
    ? t(
        `tracker.execution.state.${
          executionStateKey[executionInsight.executionState]
        }`,
      )
    : null;
  const executionStateSummary = executionInsight
    ? t(
        `tracker.execution.summary.${
          executionStateKey[executionInsight.executionState]
        }`,
      )
    : null;
  const streakRiskLabel = executionInsight
    ? replaceValue(
        "tracker.execution.riskLabel",
        t(`tracker.execution.risk.${riskKey[executionInsight.streakRisk]}`),
      )
    : null;

  const lastActivityDate = tracker?.last_activity_at
    ? new Date(tracker.last_activity_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 pb-32"
    >
      <CalendarExportConfirmModal
        open={isCalendarExportOpen}
        onOpenChange={setIsCalendarExportOpen}
        blueprint={blueprint}
        loadContext={() =>
          loadBlueprintExecutionContext(blueprint, userId, true)
        }
      />

      <AdaptiveRevisionDialog
        open={isAdaptiveRevisionOpen}
        onOpenChange={(open) => {
          setIsAdaptiveRevisionOpen(open);
          if (!open) {
            setAdaptiveRevisionDraft(null);
            setAdaptiveRevisionNote("");
          }
        }}
        suggested={shouldSuggestAdaptiveRevision}
        revisionReasons={revisionReasons}
        currentSuggestion={
          (executionInsight
            ? translateExecutionText(
                executionInsight.adaptiveRevisionSuggestion,
              )
            : null) || t("tracker.execution.useRealData")
        }
        note={adaptiveRevisionNote}
        onNoteChange={setAdaptiveRevisionNote}
        generating={adaptiveRevisionGenerating}
        applying={adaptiveRevisionApplying}
        revisionSummary={adaptiveRevisionDraft?.revisionSummary || null}
        changeHighlights={adaptiveRevisionDraft?.changeHighlights || []}
        onGenerate={handleGenerateAdaptiveRevision}
        onApply={handleApplyAdaptiveRevision}
      />

      {/* Header */}
      <div className="mb-8 border-b border-gray-200 dark:border-zinc-800 pb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft size={16} className="mr-1" /> {t("tracker.backToPlans")}
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${themeClass}`}
              >
                {blueprint.framework}
              </span>
              {lastActivityDate && (
                <span className="text-xs text-gray-500 font-bold flex items-center gap-1">
                  <Clock size={12} />{" "}
                  {t("tracker.lastDone").replace("{0}", lastActivityDate)}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-black dark:text-white leading-tight mt-2 flex items-center gap-3 line-clamp-3 break-words">
              {blueprint.title}
            </h1>
          </div>

          <div
            data-testid="tracker-header-actions"
            className="shrink-0 flex flex-wrap items-center gap-2"
          >
            <div className="flex items-center gap-2">
              {isInfinite && !isImpersonating && (
                <button
                  onClick={() => setIsSetbackModalOpen(true)}
                  className="min-h-[44px] px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-900/40 text-sm font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer touch-manipulation"
                >
                  {t("tracker.logSetback") || "Log Setback"}
                </button>
              )}
              {!isImpersonating && (
                <>
                  {showCalendarExport && (
                    <button
                      type="button"
                      onClick={() => setIsCalendarExportOpen(true)}
                      data-testid="tracker-export-button"
                      className="min-h-[44px] px-3 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 text-sm font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer touch-manipulation"
                      title="Export schedule"
                    >
                      Export
                    </button>
                  )}
                  <button
                    onClick={handleShare}
                    data-testid="tracker-share-button"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer touch-manipulation"
                    title={t("tracker.share.title") || "Share Plan"}
                  >
                    <Share2 size={20} />
                  </button>
                  <button
                    onClick={() => setIsEditPanelOpen(true)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer touch-manipulation"
                    title={t("tracker.settings") || "Settings"}
                    aria-label={t("tracker.settings") || "Settings"}
                  >
                    <Settings size={20} />
                  </button>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="min-h-[44px] bg-white dark:bg-zinc-800 border font-bold border-gray-200 dark:border-zinc-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer touch-manipulation flex-1 sm:flex-none min-w-0"
                aria-label={t("tracker.rangeAll") || "Date range"}
                title={t("tracker.rangeAll") || "Date range"}
              >
                <option value="all">
                  {t("tracker.rangeAll") || "All Time"}
                </option>
                <option value="7days">
                  {t("tracker.range7Days") || "Last 7 Days"}
                </option>
                <option value="30days">
                  {t("tracker.range30Days") || "Last 30 Days"}
                </option>
                <option value="this_year">
                  {t("tracker.rangeYear") || "This Year"}
                </option>
              </select>
              <select
                value={tracker?.status || "active"}
                onChange={handleStatusChange}
                disabled={isImpersonating}
                className="min-h-[44px] bg-white dark:bg-zinc-800 border font-bold border-gray-200 dark:border-zinc-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer touch-manipulation flex-1 sm:flex-none min-w-0 disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label={t("tracker.status.active") || "Plan status"}
                title={t("tracker.status.active") || "Plan status"}
              >
                <option value="active">{t("tracker.status.active")}</option>
                <option value="completed">
                  {t("tracker.status.completed")}
                </option>
                <option value="paused">{t("tracker.status.paused")}</option>
                <option value="abandoned">
                  {t("tracker.status.abandoned")}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="rounded-2xl border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-gray-500 mb-3">
                <Gauge size={16} className="text-indigo-500" />{" "}
                {t("wizard.card.strategicDiagnosis")}
              </div>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {canonicalPlan.currentReality}
              </p>
            </Card>

            <Card className="rounded-2xl border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-gray-500 mb-3">
                <ListChecks size={16} className="text-cyan-500" />{" "}
                {t("wizard.card.scoreboard")}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2">
                    {t("wizard.card.leadIndicators")}
                  </p>
                  <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                    {canonicalPlan.leadIndicators.slice(0, 3).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2">
                    {t("wizard.card.lagIndicators")}
                  </p>
                  <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                    {canonicalPlan.lagIndicators.slice(0, 2).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-gray-500 mb-3">
                <Users size={16} className="text-emerald-500" />{" "}
                {t("wizard.card.ownershipSystem")}
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                {tracker?.tracking_question || canonicalPlan.trackingPrompt}
              </p>
              <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300 mb-3">
                {canonicalPlan.ownershipCadence.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2">
                {t("wizard.card.supportSystem")}
              </p>
              <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                {canonicalPlan.supportSystem.slice(0, 2).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Quick Log Box */}
          {isInfinite && (
            <TrackerQuickLog
              tracker={tracker}
              isDoneToday={isDoneToday}
              onLog={handleLogToday}
              color={colorAccent}
            />
          )}

          {/* Finite Steps Checkboxes */}
          {!isInfinite && steps.length > 0 && (
            <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Target size={20} className="text-blue-500" />{" "}
                  {t("tracker.steps")}
                </h2>
                <div className="text-sm font-bold text-gray-400">
                  {tracker.completed_step_ids?.length || 0} / {steps.length}
                </div>
              </div>

              <div className="space-y-3">
                {steps.map((step) => {
                  const isComplete = tracker.completed_step_ids?.includes(
                    step.stepId,
                  );
                  return (
                    <div
                      key={step.stepId}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${isComplete ? "bg-gray-50 dark:bg-zinc-800/30 border-gray-200 dark:border-zinc-800" : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 shadow-sm"}`}
                      onClick={() => handleToggleStep(step.stepId)}
                    >
                      <div className="pt-0.5 pointer-events-none">
                        {isComplete ? (
                          <CheckCircle2
                            size={24}
                            color={colorAccent || "#3b82f6"}
                            fill={
                              colorAccent ? `${colorAccent}20` : "#3b82f620"
                            }
                          />
                        ) : (
                          <Circle
                            size={24}
                            className="text-gray-300 dark:text-zinc-600"
                          />
                        )}
                      </div>
                      <div
                        className={`text-base md:text-lg font-bold ${isComplete ? "text-gray-400 dark:text-gray-600 line-through" : "text-gray-800 dark:text-gray-200"}`}
                      >
                        {step.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!isInfinite && steps.length === 0 && (
            <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 text-center text-gray-500">
              <p className="font-medium mb-2">
                {t("tracker.noStepsToTrack") ||
                  "No trackable steps found for this plan."}
              </p>
              <p className="text-sm">
                {t("tracker.useRelatedTasks") ||
                  "You can use related tasks, sub-goals, or journal entries below instead."}
              </p>
            </div>
          )}

          {/* Calendar Heatmap (Mobile only, or above timeline) */}
          <div className="block lg:hidden">
            <TrackerCalendar
              highlightedDates={highlights}
              color={colorAccent}
              onDayClick={(d) => {
                setSelectedDate(d);
                setIsPastEditModalOpen(true);
              }}
            />
          </div>

          <div className="mb-8">
            <TrackerGoalTemplates
              key={`templates-${blueprint.id}-${revisionNonce}`}
              blueprint={blueprint}
              color={colorAccent}
              onApplied={() => window.location.reload()}
            />
            <TrackerSubGoals
              key={`subgoals-${blueprint.id}-${revisionNonce}`}
              blueprintId={blueprint.id}
              userId={blueprint.user_id}
              color={colorAccent}
            />
          </div>

          <div className="mb-8">
            <TrackerTasks
              key={`tasks-${blueprint.id}-${revisionNonce}`}
              blueprintId={blueprint.id}
              userId={blueprint.user_id}
              color={colorAccent}
            />
          </div>

          {/* Journal Entry Area */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PenLine size={20} className="text-purple-500" />{" "}
              {t("tracker.journal")}
            </h2>
            <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-2 flex flex-col focus-within:ring-2 focus-within:ring-purple-500/50 transition-all shadow-sm">
              <Textarea
                placeholder={t("tracker.journalPlaceholder")}
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                className="border-none bg-transparent shadow-none focus-visible:ring-0 resize-none min-h-[100px] text-base font-medium"
              />
              <div className="flex justify-end p-2 border-t border-gray-100 dark:border-zinc-800/50 mt-2">
                <Button
                  onClick={handleAddJournal}
                  disabled={isSubmitting || !journalContent.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 font-bold"
                >
                  {t("tracker.addEntry")}
                </Button>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MessageSquare size={20} className="text-gray-400" />{" "}
              {t("tracker.timeline")}
            </h2>
            {filteredLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-8 font-medium">
                {t("tracker.noActivity")}
              </p>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gray-200 dark:before:bg-zinc-800">
                {filteredLogs.map((log) => {
                  const isJournal = log.kind === "journal";
                  const isCheckIn = log.kind === "check_in";
                  const isStepDone = log.kind === "step_done";
                  const isSetback = log.kind === "setback";

                  let stepLabel = "";
                  if (isStepDone) {
                    const s = steps.find(
                      (x) => x.stepId === log.payload?.step_id,
                    );
                    stepLabel = s ? s.label : log.payload?.step_id;
                  }

                  return (
                    <div
                      key={log.id}
                      className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                    >
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-black shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 ${isSetback ? "bg-red-50 dark:bg-red-900 border-red-100 dark:border-red-900/20 text-red-500" : "bg-white dark:bg-zinc-900 text-gray-500"}`}
                      >
                        {isJournal && <PenLine size={16} />}
                        {isCheckIn && (
                          <CheckCircle2 size={16} className="text-green-500" />
                        )}
                        {isStepDone && (
                          <Target size={16} className="text-blue-500" />
                        )}
                        {isSetback && <ShieldAlert size={16} />}
                      </div>
                      <div
                        className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border ${isSetback ? "border-red-200 dark:border-red-900/40 shadow-red-500/10" : "border-gray-200 dark:border-zinc-800"} shadow-sm ml-4 md:ml-0 md:group-odd:text-right transition-all hover:shadow-md`}
                      >
                        <div className="flex items-center justify-between md:group-odd:flex-row-reverse mb-2">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider ${isSetback ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}
                          >
                            {isJournal && t("tracker.journal")}
                            {isCheckIn && t("tracker.checkIn")}
                            {isStepDone && t("tracker.completedStep")}
                            {isSetback && t("tracker.setbackLogged")}
                          </span>
                          <span className="text-xs font-bold text-gray-400">
                            {new Date(log.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {log.content && (
                          <p className="text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap font-medium">
                            {log.content}
                          </p>
                        )}
                        {isStepDone && stepLabel && (
                          <p className="text-blue-600 dark:text-blue-400 text-sm mt-2 font-bold">
                            {stepLabel}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {isInfinite && (
            <TrackerStreakCounter
              startDate={streakStartedAt}
              className="w-full"
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-center items-center h-48">
              <TrackerScore
                score={score}
                label="Last 7 Days"
                color={colorAccent}
                savingsAmount={savingsAmount}
                savingsUnit={savingsUnit}
              />
            </div>
            <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between h-48">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Activity
              </span>
              <div className="flex-1 flex items-end">
                <TrackerHeatmap
                  logs={filteredLogs}
                  daysBack={28}
                  color={colorAccent}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <TrackerCalendar
              highlightedDates={highlights}
              color={colorAccent}
              onDayClick={(d) => {
                setSelectedDate(d);
                setIsPastEditModalOpen(true);
              }}
            />
          </div>

          {executionInsight && (
            <Card className="p-5 rounded-2xl border-gray-200 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                {t("tracker.execution.signals")}
              </h3>
              <div className="space-y-4">
                {executionStateStyle && (
                  <div
                    className={`rounded-2xl border p-4 ${executionStateStyle.panel}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
                          {t("tracker.execution.stateLabel")}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${executionStateStyle.badge}`}
                          >
                            {executionStateLabel}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                            {streakRiskLabel}
                          </span>
                        </div>
                      </div>
                      {lastActivityDate && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {replaceValue(
                            "tracker.execution.lastActivity",
                            lastActivityDate,
                          )}
                        </p>
                      )}
                    </div>
                    <p className="mt-3 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                      {executionStateSummary}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
                    {t("tracker.execution.nextBestAction")}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {executionInsight.nextBestAction}
                  </p>
                </div>
                {executionInsight.overdueSignals.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
                      {t("tracker.execution.overdueSignals")}
                    </p>
                    <ul className="space-y-2">
                      {executionInsight.overdueSignals.map((signal) => (
                        <li
                          key={signal}
                          className={`text-sm font-medium ${executionStateStyle?.signal || (executionInsight.streakRisk === "high" ? "text-red-500" : "text-amber-500")}`}
                        >
                          {translateExecutionText(signal)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {executionInsight.proofSignals.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
                      {t("tracker.execution.proofSignals")}
                    </p>
                    <ul className="space-y-2">
                      {executionInsight.proofSignals.map((signal) => (
                        <li
                          key={signal}
                          className={`text-sm font-medium ${executionStateStyle?.signal || "text-amber-500"}`}
                        >
                          {translateExecutionText(signal)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
                    {t("tracker.execution.recoveryMove")}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {translateExecutionText(executionInsight.rescueAction)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
                    {t("wizard.weeklyReview")}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {executionInsight.weeklyReviewPrompt}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
                    {t("tracker.execution.adaptiveRevision")}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {translateExecutionText(
                      executionInsight.adaptiveRevisionSuggestion,
                    )}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdaptiveRevisionOpen(true)}
                    data-testid="tracker-revise-button"
                    className={`min-h-[44px] w-full rounded-xl px-4 py-2.5 text-sm font-bold transition-colors cursor-pointer ${shouldSuggestAdaptiveRevision && executionStateStyle ? executionStateStyle.button : "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"}`}
                  >
                    {shouldSuggestAdaptiveRevision
                      ? revisionCtaLabel
                      : t("tracker.execution.revisionStandard")}
                  </button>
                </div>
              </div>
            </Card>
          )}

          {isInfinite && <TrackerStreaksList streaks={bestStreaks} />}

          <Card className="p-5 mt-8 bg-gray-50 dark:bg-zinc-900/30 border-none shadow-none rounded-2xl">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              {t("tracker.planSummary")}
            </h3>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {blueprint.result && typeof blueprint.result === "object" && (
                <div className="space-y-3">
                  {"purpose" in blueprint.result && (
                    <p>
                      <strong className="text-gray-900 dark:text-gray-200 block mb-1">
                        Purpose:
                      </strong>{" "}
                      {String((blueprint.result as any).purpose)}
                    </p>
                  )}
                  {"objective" in blueprint.result && (
                    <p>
                      <strong className="text-gray-900 dark:text-gray-200 block mb-1">
                        Objective:
                      </strong>{" "}
                      {String((blueprint.result as any).objective)}
                    </p>
                  )}
                  {"centralGoal" in blueprint.result && (
                    <p>
                      <strong className="text-gray-900 dark:text-gray-200 block mb-1">
                        Goal:
                      </strong>{" "}
                      {String((blueprint.result as any).centralGoal)}
                    </p>
                  )}
                  {"newApproach" in blueprint.result && (
                    <p>
                      <strong className="text-gray-900 dark:text-gray-200 block mb-1">
                        New Approach:
                      </strong>{" "}
                      {String((blueprint.result as any).newApproach)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {tracker && (
        <TrackerEditPanel
          isOpen={isEditPanelOpen}
          onClose={() => setIsEditPanelOpen(false)}
          blueprint={blueprint}
          tracker={tracker}
          onSave={handleSaveSettings}
        />
      )}

      <TrackerPastEditModal
        isOpen={isPastEditModalOpen}
        onClose={() => setIsPastEditModalOpen(false)}
        date={selectedDate}
        isActive={
          selectedDate ? highlights.has(toLocalDateKey(selectedDate)) : false
        }
        color={colorAccent}
        onSave={handleSavePastEdit}
      />

      <TrackerSetbackModal
        isOpen={isSetbackModalOpen}
        onClose={() => setIsSetbackModalOpen(false)}
        onConfirm={handleLogSetback}
      />
    </motion.div>
  );
}
