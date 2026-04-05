import React from "react";
import { Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Blueprint } from "@/lib/blueprints";
import {
  buildCalendarExportPlan,
  defaultStartAt,
  downloadIcs,
  exportEventsToGoogleCalendar,
  getGoogleAccessToken,
  recommendCalendarStartAt,
} from "@/lib/calendarExport";
import type { ExecutionDataContext } from "@/lib/executionData";

interface CalendarExportConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blueprint: Blueprint;
  loadContext: () => Promise<ExecutionDataContext>;
  onExported?: (mode: "google" | "ics") => void;
}

type SourceKey =
  | "includeReminders"
  | "includeTasks"
  | "includeMilestones"
  | "includeScheduleHints"
  | "includePlanSteps";

const SOURCE_LABELS: Record<string, string> = {
  reminder: "Reminder",
  task: "Task",
  milestone: "Milestone",
  schedule_hint: "Schedule hint",
  plan_step: "Plan step",
};

export function CalendarExportConfirmModal({
  open,
  onOpenChange,
  blueprint,
  loadContext,
  onExported,
}: CalendarExportConfirmModalProps) {
  const [context, setContext] = React.useState<ExecutionDataContext>({});
  const [loading, setLoading] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [startDate, setStartDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("09:00");
  const [minutesPerEvent, setMinutesPerEvent] = React.useState("45");
  const [sourceToggles, setSourceToggles] = React.useState<
    Record<SourceKey, boolean>
  >({
    includeReminders: true,
    includeTasks: true,
    includeMilestones: true,
    includeScheduleHints: true,
    includePlanSteps: true,
  });

  React.useEffect(() => {
    if (!open) return;

    let active = true;
    setLoading(true);
    loadContext()
      .then((loaded) => {
        if (!active) return;
        setContext(loaded);
        setSourceToggles({
          includeReminders: Boolean(
            (loaded.reminders && loaded.reminders.length) ||
            loaded.tracker?.reminder_enabled,
          ),
          includeTasks: Boolean(loaded.tasks?.length),
          includeMilestones: Boolean(loaded.subGoals?.length),
          includeScheduleHints: true,
          includePlanSteps: true,
        });

        const recommended =
          recommendCalendarStartAt(blueprint, loaded) || defaultStartAt();
        setStartDate(recommended.toISOString().slice(0, 10));
        setStartTime(
          `${String(recommended.getHours()).padStart(2, "0")}:${String(recommended.getMinutes()).padStart(2, "0")}`,
        );
      })
      .catch((error) => {
        console.error(error);
        toast.error("Could not load execution data for calendar export.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, blueprint, loadContext]);

  const startAt = React.useMemo(() => {
    if (!startDate) return defaultStartAt();
    return new Date(`${startDate}T${startTime || "09:00"}:00`);
  }, [startDate, startTime]);

  const previewEvents = React.useMemo(() => {
    return buildCalendarExportPlan(blueprint, {
      ...context,
      ...sourceToggles,
      startAt,
      minutesPerEvent: Number(minutesPerEvent) || 45,
    });
  }, [blueprint, context, sourceToggles, startAt, minutesPerEvent]);

  const handleToggle = (key: SourceKey, checked: boolean | string) => {
    setSourceToggles((prev) => ({ ...prev, [key]: Boolean(checked) }));
  };

  const confirmExport = async () => {
    setExporting(true);
    try {
      let mode: "google" | "ics" = "google";
      try {
        const token = await getGoogleAccessToken();
        await exportEventsToGoogleCalendar(token, previewEvents);
      } catch (error) {
        mode = "ics";
        downloadIcs(`vector-${blueprint.title}`, previewEvents);
      }
      onOpenChange(false);
      onExported?.(mode);
      toast.success(
        mode === "google"
          ? "Exported to Google Calendar."
          : "Downloaded a calendar .ics file.",
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to export calendar events.");
    } finally {
      setExporting(false);
    }
  };

  const sourceSummary = [
    ["includeReminders", "Reminder blocks"],
    ["includeTasks", "Tracker tasks"],
    ["includeMilestones", "Milestones"],
    ["includeScheduleHints", "Schedule hints"],
    ["includePlanSteps", "Plan steps"],
  ] as Array<[SourceKey, string]>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar size={18} /> Confirm Calendar Export
          </DialogTitle>
          <DialogDescription>
            Confirm the schedule before exporting. Vector merges your plan
            structure with tracker reminders, tasks, and milestones so the
            calendar becomes an execution artifact instead of a raw dump.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex items-center justify-center text-sm text-gray-500">
            <Loader2 size={18} className="animate-spin mr-2" /> Loading
            execution context...
          </div>
        ) : (
          <div className="space-y-6" data-testid="calendar-export-dialog">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2 block">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2 block">
                  Start Time
                </label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2 block">
                  Minutes Per Event
                </label>
                <Input
                  type="number"
                  min="15"
                  step="5"
                  value={minutesPerEvent}
                  onChange={(event) => setMinutesPerEvent(event.target.value)}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                Cadence Sources
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {sourceSummary.map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 p-3 text-sm font-medium cursor-pointer"
                  >
                    <Checkbox
                      checked={sourceToggles[key]}
                      onCheckedChange={(checked) => handleToggle(key, checked)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 dark:bg-zinc-900/70 border border-gray-200 dark:border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-3 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                    Export Preview
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {previewEvents.length} events will be exported.
                  </p>
                </div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Better execution outcomes
                </div>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {previewEvents.map((event, index) => (
                  <div
                    key={`${event.summary}-${event.start.toISOString()}-${index}`}
                    className="rounded-xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {event.summary}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {SOURCE_LABELS[event.source] || event.source}
                        </p>
                      </div>
                      <p className="text-xs text-right text-gray-500 whitespace-nowrap">
                        {event.start.toLocaleDateString()}{" "}
                        {event.start.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={confirmExport}
            disabled={exporting || loading || previewEvents.length === 0}
            data-testid="calendar-export-confirm-button"
          >
            {exporting ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Calendar size={16} className="mr-2" />
            )}
            Confirm and Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
