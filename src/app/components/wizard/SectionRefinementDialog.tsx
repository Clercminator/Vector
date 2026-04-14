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
import { useLanguage } from "@/app/components/language-provider";
import type { PlanRefinementSection } from "@/lib/sectionRefinement";

const SECTION_COPY: Record<
  PlanRefinementSection,
  {
    labelKey: string;
    descriptionKey: string;
    placeholderKey: string;
  }
> = {
  diagnosis: {
    labelKey: "wizard.section.diagnosis",
    descriptionKey: "wizard.sectionRefinement.diagnosis.description",
    placeholderKey: "wizard.sectionRefinement.diagnosis.placeholder",
  },
  proof: {
    labelKey: "wizard.section.proof",
    descriptionKey: "wizard.sectionRefinement.proof.description",
    placeholderKey: "wizard.sectionRefinement.proof.placeholder",
  },
  recovery: {
    labelKey: "wizard.section.recovery",
    descriptionKey: "wizard.sectionRefinement.recovery.description",
    placeholderKey: "wizard.sectionRefinement.recovery.placeholder",
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
  const { t } = useLanguage();
  const copy = section ? SECTION_COPY[section] : null;
  const title = copy
    ? t("wizard.sectionRefinement.action").replace("{0}", t(copy.labelKey))
    : t("wizard.sectionRefinement.defaultTitle");
  const description = copy
    ? t(copy.descriptionKey)
    : t("wizard.sectionRefinement.defaultDescription");
  const placeholder = copy
    ? t(copy.placeholderKey)
    : t("wizard.sectionRefinement.defaultPlaceholder");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Sparkles size={18} /> {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
              {t("wizard.sectionRefinement.optionalContext")}
            </p>
            <Textarea
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder={placeholder}
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
              {t("common.close")}
            </Button>
            <Button
              type="button"
              onClick={onApply}
              disabled={loading || !section}
            >
              {loading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : null}
              {t("wizard.sectionRefinement.apply")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
