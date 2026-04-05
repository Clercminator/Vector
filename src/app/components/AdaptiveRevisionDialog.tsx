import React from "react";
import { Loader2, RotateCcw, Sparkles } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Textarea } from "@/app/components/ui/textarea";

interface AdaptiveRevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggested: boolean;
  revisionReasons: string[];
  currentSuggestion: string;
  note: string;
  onNoteChange: (value: string) => void;
  generating: boolean;
  applying: boolean;
  revisionSummary: string | null;
  changeHighlights: string[];
  onGenerate: () => void;
  onApply: () => void;
}

export function AdaptiveRevisionDialog({
  open,
  onOpenChange,
  suggested,
  revisionReasons,
  currentSuggestion,
  note,
  onNoteChange,
  generating,
  applying,
  revisionSummary,
  changeHighlights,
  onGenerate,
  onApply,
}: AdaptiveRevisionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl"
        data-testid="adaptive-revision-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <RotateCcw size={18} /> Guided Revision Loop
          </DialogTitle>
          <DialogDescription>
            Rebuild the plan using real execution data instead of only showing
            warning signals.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div
            className={`rounded-2xl border p-4 ${suggested ? "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/40" : "border-gray-200 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-950/40"}`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
              {suggested ? "Revision Triggered" : "Manual Revision"}
            </p>
            <p className="text-sm text-gray-800 dark:text-gray-200">
              {currentSuggestion}
            </p>
            {revisionReasons.length > 0 && (
              <ul className="mt-3 space-y-2">
                {revisionReasons.map((reason) => (
                  <li
                    key={reason}
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {reason}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
              What changed?
            </p>
            <Textarea
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="Add new constraints, schedule changes, setbacks, or anything the current plan missed."
              className="min-h-[120px]"
            />
          </div>

          {revisionSummary && (
            <div
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/40"
              data-testid="adaptive-revision-result"
            >
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 mb-3 text-sm font-bold uppercase tracking-[0.18em]">
                <Sparkles size={16} /> Revision Ready
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                {revisionSummary}
              </p>
              {changeHighlights.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {changeHighlights.map((item) => (
                    <li
                      key={item}
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={generating || applying}
            >
              Close
            </Button>
            {revisionSummary ? (
              <Button
                type="button"
                onClick={onApply}
                disabled={applying}
                data-testid="adaptive-revision-apply-button"
              >
                {applying ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : null}
                Apply Revision
              </Button>
            ) : (
              <Button
                type="button"
                onClick={onGenerate}
                disabled={generating}
                data-testid="adaptive-revision-generate-button"
              >
                {generating ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : null}
                Generate Revision
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
