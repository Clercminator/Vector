import React from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Textarea } from "@/app/components/ui/textarea";
import type { PlanRefinementSection } from "@/lib/sectionRefinement";

const SECTION_COPY: Record<
  PlanRefinementSection,
  {
    title: string;
    description: string;
    placeholder: string;
  }
> = {
  diagnosis: {
    title: "Tighten Diagnosis",
    description:
      "Refine the strategic read on the situation without rewriting the rest of the blueprint.",
    placeholder:
      "Optional: name a new constraint, pressure point, blind spot, or angle the diagnosis should account for.",
  },
  proof: {
    title: "Tighten Proof",
    description:
      "Strengthen only the evidence loop, scoreboards, and accountability layer.",
    placeholder:
      "Optional: describe what proof is missing, what should be measurable, or what kind of evidence you want the plan to require.",
  },
  recovery: {
    title: "Tighten Recovery",
    description:
      "Sharpen the fallback logic so the plan survives bad days and missed weeks.",
    placeholder:
      "Optional: add the exact failure pattern or recovery constraint this rescue logic should solve for.",
  },
};

interface SectionRefinementDialogProps {
  open: boolean;
  section: PlanRefinementSection | null;
  note: string;
  loading: boolean;
  onNoteChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onApply: () => Promise<void> | void;
}

export function SectionRefinementDialog({
  open,
  section,
  note,
  loading,
  onNoteChange,
  onOpenChange,
  onApply,
}: SectionRefinementDialogProps) {
  const copy = section ? SECTION_COPY[section] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles size={18} /> {copy?.title || "Tighten Section"}
          </DialogTitle>
          <DialogDescription>
            {copy?.description ||
              "Refine one section of the blueprint without regenerating the entire plan."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
              Optional context
            </p>
            <Textarea
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder={
                copy?.placeholder ||
                "Add any extra context the refinement should respect."
              }
              className="min-h-[140px]"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={onApply}
              disabled={loading || !section}
            >
              {loading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : null}
              Apply AI Update
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
