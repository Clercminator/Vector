import React from "react";
import { motion } from "motion/react";
import {
  Target,
  Lock,
  Star,
  Rocket,
  Zap,
  Layers,
  Copy,
  Loader2,
  Sparkles,
} from "lucide-react";
import { EditableText, EditableList } from "../Editable";
import { useLanguage } from "@/app/components/language-provider";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MandalaView } from "./MandalaView";
import { EisenhowerView } from "./EisenhowerView";
import { ParetoView } from "./ParetoView";
import { IkigaiView } from "./IkigaiView";
import { GpsView } from "./GpsView";
import { DsssView } from "./DsssView";
import { DifficultyBadge } from "./DifficultyBadge";
import { SectionRefinementDialog } from "./SectionRefinementDialog";
import { normalizeCanonicalPlanResult } from "@/lib/planContract";
import type { PlanRefinementSection } from "@/lib/sectionRefinement";

interface WizardResultProps {
  result: any;
  updateResult: (path: (string | number)[], value: any) => void;
  onRefineSection?: (
    section: PlanRefinementSection,
    note?: string,
  ) => Promise<void> | void;
  refiningSection?: PlanRefinementSection | null;
  onBack: () => void;
}

export const WizardResult: React.FC<WizardResultProps> = ({
  result,
  updateResult,
  onRefineSection,
  refiningSection = null,
  onBack,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const replaceValue = (key: string, value: string) =>
    t(key).replace("{0}", value);
  const copyStrategyLabel = t("common.copyStrategy");

  if (!result) return null;

  const canonical = React.useMemo(
    () =>
      normalizeCanonicalPlanResult(
        result as Record<string, unknown>,
        String((result as any).type || "general"),
        { title: (result as any).shortTitle },
      ),
    [result],
  );

  // ... overlay helper ...
  const renderUpgradeOverlay = () => (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center bg-white/60 dark:bg-black/60 backdrop-blur-md rounded-[2.5rem]">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white mb-6 mx-auto shadow-lg rotate-3 hover:rotate-6 transition-transform">
          <Lock size={32} />
        </div>
        <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
          {t("wizard.upgrade.title")}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          {t("wizard.upgrade.description")}
        </p>
        <button
          type="button"
          onClick={() => navigate("/pricing")}
          className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 cursor-pointer"
        >
          <Zap size={20} className="fill-current" />
          {t("wizard.upgrade.cta")}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
        >
          {t("wizard.upgrade.back")}
        </button>
      </div>
    </div>
  );

  const isTeaser = (result as any).isTeaser;
  const difficulty = (result as any).difficulty;
  const difficultyReason = (result as any).difficultyReason;
  const showDifficultyBadge =
    difficulty != null ||
    (typeof difficultyReason === "string" && difficultyReason.trim());
  const [refinementDialogSection, setRefinementDialogSection] =
    React.useState<PlanRefinementSection | null>(null);
  const [sectionRefinementNote, setSectionRefinementNote] = React.useState("");

  const sectionTitles: Record<PlanRefinementSection, string> = {
    diagnosis: t("wizard.section.diagnosis"),
    proof: t("wizard.section.proof"),
    recovery: t("wizard.section.recovery"),
  };

  const openSectionRefinement = (section: PlanRefinementSection) => {
    if (!onRefineSection || isTeaser) return;
    setRefinementDialogSection(section);
    setSectionRefinementNote("");
  };

  const handleSectionDialogOpenChange = (open: boolean) => {
    if (!open) {
      setRefinementDialogSection(null);
      setSectionRefinementNote("");
    }
  };

  const handleApplySectionRefinement = async () => {
    if (!refinementDialogSection || !onRefineSection) return;
    await onRefineSection(refinementDialogSection, sectionRefinementNote);
    setRefinementDialogSection(null);
    setSectionRefinementNote("");
  };

  const renderRefineAction = (section: PlanRefinementSection) => {
    if (!onRefineSection || isTeaser) return null;

    const isRefining = refiningSection === section;
    return (
      <button
        type="button"
        onClick={() => openSectionRefinement(section)}
        disabled={Boolean(refiningSection)}
        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-gray-700 dark:text-gray-200 transition-colors hover:border-gray-400 dark:hover:border-zinc-500 hover:text-black dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRefining ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Sparkles size={14} />
        )}
        {isRefining
          ? t("wizard.sectionRefinement.refining")
          : replaceValue(
              "wizard.sectionRefinement.action",
              sectionTitles[section],
            )}
      </button>
    );
  };

  const renderSectionCard = (
    title: string,
    children: React.ReactNode,
    className = "",
  ) => (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-[2rem] shadow-lg border border-gray-200 dark:border-zinc-800 p-5 sm:p-7 ${className}`}
    >
      <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-gray-500 mb-4">
        {title}
      </h3>
      {children}
    </div>
  );

  const renderSectionShell = (
    id: string,
    eyebrow: string,
    title: string,
    description: string,
    children: React.ReactNode,
    action?: React.ReactNode,
  ) => (
    <section id={id} className="scroll-mt-24">
      <div className="rounded-[2.25rem] border border-gray-200 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-950/50 p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-500 mb-2">
                {eyebrow}
              </p>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                {title}
              </h2>
            </div>
            {action}
          </div>
          <p className="max-w-2xl text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            {description}
          </p>
        </div>
        {children}
      </div>
    </section>
  );

  const renderSharedPlanSections = () => (
    <div className="w-full max-w-5xl mx-auto space-y-8 mb-8">
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-8">
        <div className="flex flex-col gap-5">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.2em] bg-black text-white dark:bg-white dark:text-black mb-4">
              {t("wizard.planPack")}
            </span>
            <EditableText
              value={canonical.shortTitle}
              onChange={(val) => updateResult(["shortTitle"], val)}
              className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white border-transparent px-0"
            />
          </div>
          <EditableText
            value={canonical.executiveSummary}
            onChange={(val) => updateResult(["executiveSummary"], val)}
            multiline
            className="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed border-transparent px-0"
          />
          <div className="flex flex-wrap gap-2">
            {[
              ["#blueprint-diagnosis", t("wizard.section.diagnosis")],
              [
                "#blueprint-operating-system",
                t("wizard.section.operatingSystem"),
              ],
              ["#blueprint-proof", t("wizard.section.proof")],
              ["#blueprint-recovery", t("wizard.section.recovery")],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="inline-flex items-center rounded-full border border-gray-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:border-gray-400 dark:hover:border-zinc-500 transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
                {t("wizard.nextBestAction")}
              </p>
              <p className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                {canonical.nextBestAction}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
                {t("wizard.commitment")}
              </p>
              <EditableText
                value={canonical.commitment}
                onChange={(val) => updateResult(["commitment"], val)}
                className="text-sm md:text-base font-semibold text-gray-900 dark:text-white border-transparent px-0"
              />
            </div>
            <div className="rounded-2xl bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
                {t("wizard.weeklyReview")}
              </p>
              <EditableText
                value={canonical.weeklyReviewPrompt}
                onChange={(val) => updateResult(["weeklyReviewPrompt"], val)}
                multiline
                className="text-sm md:text-base font-semibold text-gray-900 dark:text-white border-transparent px-0"
              />
            </div>
          </div>
        </div>
      </div>

      {renderSectionShell(
        "blueprint-diagnosis",
        t("wizard.section.diagnosis"),
        t("wizard.section.diagnosis.title"),
        t("wizard.section.diagnosis.description"),
        <div className="grid lg:grid-cols-2 gap-6">
          {renderSectionCard(
            t("wizard.card.strategicDiagnosis"),
            <EditableText
              value={canonical.currentReality}
              onChange={(val) => updateResult(["currentReality"], val)}
              multiline
              className="text-gray-800 dark:text-gray-200 leading-relaxed border-transparent px-0"
            />,
          )}
          {renderSectionCard(
            t("wizard.card.strategicPillars"),
            <EditableList
              items={canonical.strategicPillars}
              onChange={(val) => updateResult(["strategicPillars"], val)}
              itemClassName="text-gray-800 dark:text-gray-200 font-medium"
            />,
          )}
          {renderSectionCard(
            t("wizard.card.constraintMap"),
            <EditableList
              items={canonical.keyConstraints}
              onChange={(val) => updateResult(["keyConstraints"], val)}
              itemClassName="text-gray-800 dark:text-gray-200 font-medium"
            />,
          )}
          {renderSectionCard(
            t("wizard.card.leverageMoves"),
            <EditableList
              items={canonical.leverageMoves}
              onChange={(val) => updateResult(["leverageMoves"], val)}
              itemClassName="text-gray-800 dark:text-gray-200 font-medium"
            />,
          )}
          {renderSectionCard(
            t("wizard.card.whyThisMatters"),
            <EditableText
              value={canonical.yourWhy}
              onChange={(val) => updateResult(["yourWhy"], val)}
              multiline
              className="text-gray-800 dark:text-gray-200 leading-relaxed border-transparent px-0"
            />,
          )}
          {renderSectionCard(
            t("wizard.card.whatToAvoid"),
            <EditableList
              items={canonical.whatToAvoid}
              onChange={(val) => updateResult(["whatToAvoid"], val)}
              itemClassName="text-gray-800 dark:text-gray-200 font-medium"
            />,
          )}
        </div>,
        renderRefineAction("diagnosis"),
      )}

      {renderSectionShell(
        "blueprint-operating-system",
        t("wizard.section.operatingSystem"),
        t("wizard.section.operatingSystem.title"),
        t("wizard.section.operatingSystem.description"),
        <div className="grid lg:grid-cols-2 gap-6">
          {renderSectionCard(
            t("wizard.card.firstWeekActions"),
            <EditableList
              items={canonical.firstWeekActions}
              onChange={(val) => updateResult(["firstWeekActions"], val)}
              itemClassName="text-gray-800 dark:text-gray-200 font-medium"
            />,
          )}
          {renderSectionCard(
            t("wizard.card.milestones"),
            <EditableList
              items={canonical.milestones}
              onChange={(val) => updateResult(["milestones"], val)}
              itemClassName="text-gray-800 dark:text-gray-200 font-medium"
            />,
          )}
          {renderSectionCard(
            t("wizard.card.ownershipSystem"),
            <>
              <EditableText
                value={canonical.trackingPrompt}
                onChange={(val) => updateResult(["trackingPrompt"], val)}
                multiline
                className="text-gray-900 dark:text-white font-semibold leading-relaxed border-transparent px-0 mb-4"
              />
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400 mb-3">
                    {t("wizard.card.cadence")}
                  </p>
                  <EditableList
                    items={canonical.ownershipCadence}
                    onChange={(val) => updateResult(["ownershipCadence"], val)}
                    itemClassName="text-gray-800 dark:text-gray-200 font-medium"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400 mb-3">
                    {t("wizard.card.supportSystem")}
                  </p>
                  <EditableList
                    items={canonical.supportSystem}
                    onChange={(val) => updateResult(["supportSystem"], val)}
                    itemClassName="text-gray-800 dark:text-gray-200 font-medium"
                  />
                </div>
              </div>
            </>,
          )}
          {renderSectionCard(
            t("wizard.card.decisionRules"),
            <EditableList
              items={canonical.decisionRules}
              onChange={(val) => updateResult(["decisionRules"], val)}
              itemClassName="text-gray-800 dark:text-gray-200 font-medium"
            />,
          )}
          {renderSectionCard(
            t("wizard.card.scheduleSnapshot"),
            <div className="grid md:grid-cols-2 gap-4">
              {(canonical.scheduleHints || []).length > 0 ? (
                (canonical.scheduleHints || []).map((hint, index) => (
                  <div
                    key={`${hint.label}-${index}`}
                    className="rounded-2xl bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-4"
                  >
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {hint.label}
                    </p>
                    <p className="text-xs uppercase tracking-[0.14em] text-gray-500 mt-2">
                      {hint.cadence}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {hint.days?.length
                        ? `${t("wizard.schedule.days")}: ${hint.days.join(", ")}`
                        : `${t("wizard.schedule.days")}: ${t("wizard.schedule.flexible")}`}
                      {hint.time
                        ? ` | ${t("wizard.schedule.time")}: ${hint.time}`
                        : ""}
                      {hint.durationMinutes
                        ? ` | ${hint.durationMinutes} ${t("wizard.schedule.minutesShort")}`
                        : ""}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("wizard.card.scheduleEmpty")}
                </p>
              )}
            </div>,
          )}
        </div>,
      )}

      {renderSectionShell(
        "blueprint-proof",
        t("wizard.section.proof"),
        t("wizard.section.proof.title"),
        t("wizard.section.proof.description"),
        <div className="grid lg:grid-cols-2 gap-6">
          {renderSectionCard(
            t("wizard.card.scoreboard"),
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400 mb-3">
                  {t("wizard.card.leadIndicators")}
                </p>
                <EditableList
                  items={canonical.leadIndicators}
                  onChange={(val) => updateResult(["leadIndicators"], val)}
                  itemClassName="text-gray-800 dark:text-gray-200 font-medium"
                />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400 mb-3">
                  {t("wizard.card.lagIndicators")}
                </p>
                <EditableList
                  items={canonical.lagIndicators}
                  onChange={(val) => updateResult(["lagIndicators"], val)}
                  itemClassName="text-gray-800 dark:text-gray-200 font-medium"
                />
              </div>
            </div>,
          )}
          {renderSectionCard(
            t("wizard.card.successCriteria"),
            <EditableText
              value={canonical.successCriteria}
              onChange={(val) => updateResult(["successCriteria"], val)}
              multiline
              className="text-gray-800 dark:text-gray-200 leading-relaxed border-transparent px-0"
            />,
          )}
          {renderSectionCard(
            t("wizard.card.proofChecklist"),
            <EditableList
              items={canonical.proofChecklist}
              onChange={(val) => updateResult(["proofChecklist"], val)}
              itemClassName="text-gray-800 dark:text-gray-200 font-medium"
            />,
          )}
          {renderSectionCard(
            t("wizard.card.setupChecklist"),
            <EditableList
              items={canonical.resourceChecklist}
              onChange={(val) => updateResult(["resourceChecklist"], val)}
              itemClassName="text-gray-800 dark:text-gray-200 font-medium"
            />,
          )}
          {renderSectionCard(
            t("wizard.card.accountabilityHooks"),
            <EditableList
              items={canonical.accountabilityHooks}
              onChange={(val) => updateResult(["accountabilityHooks"], val)}
              itemClassName="text-gray-800 dark:text-gray-200 font-medium"
            />,
            "lg:col-span-2",
          )}
        </div>,
        renderRefineAction("proof"),
      )}

      {renderSectionShell(
        "blueprint-recovery",
        t("wizard.section.recovery"),
        t("wizard.section.recovery.title"),
        t("wizard.section.recovery.description"),
        <div className="grid lg:grid-cols-2 gap-6">
          {renderSectionCard(
            t("wizard.card.failureModes"),
            <EditableList
              items={canonical.failureModes}
              onChange={(val) => updateResult(["failureModes"], val)}
              itemClassName="text-gray-800 dark:text-gray-200 font-medium"
            />,
          )}
          {renderSectionCard(
            t("wizard.card.recoveryProtocol"),
            <EditableText
              value={canonical.recoveryProtocol}
              onChange={(val) => updateResult(["recoveryProtocol"], val)}
              multiline
              className="text-gray-800 dark:text-gray-200 leading-relaxed border-transparent px-0"
            />,
          )}
          {renderSectionCard(
            t("wizard.card.revisionTriggers"),
            <EditableList
              items={canonical.revisionTriggers}
              onChange={(val) => updateResult(["revisionTriggers"], val)}
              itemClassName="text-gray-800 dark:text-gray-200 font-medium"
            />,
          )}
          {renderSectionCard(
            t("wizard.card.reviewAnchor"),
            <EditableText
              value={canonical.weeklyReviewPrompt}
              onChange={(val) => updateResult(["weeklyReviewPrompt"], val)}
              multiline
              className="text-gray-800 dark:text-gray-200 leading-relaxed border-transparent px-0"
            />,
          )}
        </div>,
        renderRefineAction("recovery"),
      )}

      <div className="rounded-[2rem] border border-dashed border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/60 px-6 py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-500 mb-2">
          {t("wizard.section.frameworkLens")}
        </p>
        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          {t("wizard.section.frameworkLens.description")}
        </p>
      </div>
    </div>
  );

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="relative w-full">
      <SectionRefinementDialog
        open={refinementDialogSection != null}
        section={refinementDialogSection}
        note={sectionRefinementNote}
        loading={refiningSection != null}
        onNoteChange={setSectionRefinementNote}
        onOpenChange={handleSectionDialogOpenChange}
        onApply={handleApplySectionRefinement}
      />
      {/* Difficulty badge – non-intrusive, informative */}
      {showDifficultyBadge && (
        <div className="absolute top-0 right-0 z-20 p-3 md:p-4 pointer-events-auto">
          <DifficultyBadge
            difficulty={difficulty || "intermediate"}
            reason={
              typeof difficultyReason === "string"
                ? difficultyReason.trim() || undefined
                : undefined
            }
          />
        </div>
      )}
      <div
        className={
          isTeaser
            ? "blur-sm select-none pointer-events-none opacity-50 transition-all duration-700"
            : ""
        }
      >
        <div className="space-y-8">
          {renderSharedPlanSections()}
          {children}
        </div>
      </div>
      {isTeaser && renderUpgradeOverlay()}
    </div>
  );

  if (result.type === "pareto") {
    return (
      <Wrapper>
        <ParetoView result={result} updateResult={updateResult} />
      </Wrapper>
    );
  }

  if (result.type === "eisenhower") {
    return (
      <Wrapper>
        <EisenhowerView result={result} updateResult={updateResult} />
      </Wrapper>
    );
  }

  if (result.type === "okr") {
    const copyOkr = () => {
      const parts = [
        `# ${t("okr.northStar")}\n${result.objective || ""}`,
        `\n## ${t("okr.keyResult")}\n${(result.keyResults || []).map((kr: string, i: number) => `${i + 1}. ${kr}`).join("\n")}`,
        result.initiative
          ? `\n## ${t("okr.initiative")}\n${result.initiative}`
          : "",
      ];
      navigator.clipboard.writeText(parts.join(""));
      toast.success(t("common.copiedToClipboard"));
    };
    return (
      <Wrapper>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 w-full max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-purple-200 dark:border-purple-900/40 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 z-10 p-4">
            <button
              type="button"
              onClick={copyOkr}
              className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all bg-white/90 dark:bg-zinc-800/90 border border-gray-200 dark:border-zinc-700 px-4 py-2.5 rounded-full shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
              aria-label={copyStrategyLabel}
            >
              <Copy size={16} />
              {copyStrategyLabel}
            </button>
          </div>
          <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600" />
          <div className="bg-purple-50/50 dark:bg-purple-900/10 p-10 text-center border-b border-purple-100 dark:border-purple-900/20">
            <span className="inline-block px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-[0.2em] mb-4">
              {t("okr.northStar")}
            </span>
            <div className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
              <EditableText
                value={result.objective}
                onChange={(val) => updateResult(["objective"], val)}
                multiline
                className="text-center"
              />
            </div>
          </div>
          <div className="p-10">
            <h4 className="text-center text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">
              {t("okr.keyResult")}
            </h4>
            <div className="grid md:grid-cols-3 gap-6">
              {(result.keyResults || []).map((kr: string, i: number) => (
                <div
                  key={i}
                  className="group p-6 bg-white dark:bg-zinc-950 rounded-3xl border-2 border-transparent hover:border-purple-100 dark:hover:border-purple-900/30 shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-700 dark:text-purple-400 font-bold mb-4">
                    {i + 1}
                  </div>
                  <EditableText
                    value={kr}
                    onChange={(val) => {
                      const newKrs = [...result.keyResults];
                      newKrs[i] = val;
                      updateResult(["keyResults"], newKrs);
                    }}
                    multiline
                    className="font-medium text-gray-800 dark:text-gray-200 leading-relaxed"
                  />
                </div>
              ))}
            </div>
            <div className="mt-12 p-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl flex items-center gap-6 text-white shadow-lg">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Rocket size={32} />
              </div>
              <div className="flex-grow">
                <span className="text-xs font-bold text-purple-200 uppercase tracking-widest">
                  {t("okr.initiative")}
                </span>
                <EditableText
                  value={result.initiative}
                  onChange={(val) => updateResult(["initiative"], val)}
                  multiline
                  className="text-xl font-bold mt-1 bg-transparent border-white/30"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </Wrapper>
    );
  }

  if (result.type === "first-principles") {
    const copyFp = () => {
      const parts = [
        `# ${t("fp.truths")}\n${(result.truths || []).map((truth: string) => `- ${truth}`).join("\n")}`,
        `\n# ${t("fp.newApproach")}\n${result.newApproach || ""}`,
      ];
      navigator.clipboard.writeText(parts.join("\n"));
      toast.success(t("common.copiedToClipboard"));
    };
    return (
      <Wrapper>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 w-full max-w-4xl mx-auto space-y-6"
        >
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={copyFp}
              className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-5 py-2.5 rounded-full shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
              aria-label={copyStrategyLabel}
            >
              <Copy size={16} />
              {copyStrategyLabel}
            </button>
          </div>
          <div className="bg-white dark:bg-zinc-900/95 backdrop-blur-xl border border-gray-200/80 dark:border-zinc-700/80 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center font-semibold">
                1
              </div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                {t("fp.truths")}
              </h4>
            </div>
            <EditableList
              items={result.truths || []}
              onChange={(val) => updateResult(["truths"], val)}
              itemClassName="text-base md:text-lg text-gray-700 dark:text-gray-200 leading-relaxed pl-5 py-2 border-l-2 border-slate-300 dark:border-zinc-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            />
          </div>
          <div className="bg-white dark:bg-zinc-900/95 backdrop-blur-xl border border-blue-100 dark:border-blue-900/40 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold">
                2
              </div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {t("fp.newApproach")}
              </h4>
            </div>
            <EditableText
              value={result.newApproach}
              onChange={(val) => updateResult(["newApproach"], val)}
              multiline
              className="text-lg md:text-xl text-gray-800 dark:text-gray-100 leading-relaxed"
            />
          </div>
        </motion.div>
      </Wrapper>
    );
  }

  if (result.type === "rpm") {
    const copyRpm = () => {
      const parts = [
        `# ${t("rpm.outcome")}\n${result.result || ""}`,
        `\n# ${t("rpm.purpose")}\n${result.purpose || ""}`,
        `\n# ${t("rpm.map")}\n${(result.plan || []).map((p: string) => `- ${p}`).join("\n")}`,
      ];
      navigator.clipboard.writeText(parts.join("\n"));
      toast.success(t("common.copiedToClipboard"));
    };
    return (
      <Wrapper>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 w-full max-w-5xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 flex flex-col md:flex-row relative"
        >
          <div className="absolute top-4 right-4 z-10">
            <button
              type="button"
              onClick={copyRpm}
              className="flex items-center gap-2 text-sm font-bold text-white/90 hover:text-white transition-all bg-black/20 hover:bg-black/30 border border-white/20 px-4 py-2.5 rounded-full shadow-sm cursor-pointer"
              aria-label={copyStrategyLabel}
            >
              <Copy size={16} />
              {copyStrategyLabel}
            </button>
          </div>
          {/* Left Sidebar: Result & Purpose */}
          <div className="md:w-2/5 bg-gray-900 text-white p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 flex flex-col h-full">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                {t("rpm.outcome")}
              </span>
              <div className="mb-12">
                <EditableText
                  value={result.result}
                  onChange={(val) => updateResult(["result"], val)}
                  multiline
                  className="text-3xl font-bold leading-tight bg-transparent border-gray-700"
                />
              </div>

              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Target size={14} /> {t("rpm.purpose")}
              </span>
              <div className="border-l-2 border-indigo-500 pl-4">
                <EditableText
                  value={result.purpose}
                  onChange={(val) => updateResult(["purpose"], val)}
                  multiline
                  className="text-lg leading-relaxed text-gray-300 font-light bg-transparent border-gray-700"
                />
              </div>
            </div>

            <div className="mt-12 opacity-30 absolute bottom-10 left-10 pointer-events-none">
              <Star size={120} />
            </div>
          </div>

          {/* Right Content: MAP */}
          <div className="md:w-3/5 p-10 bg-white dark:bg-zinc-900">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Layers size={20} />
              </div>
              <h4 className="font-bold text-xl text-gray-900 dark:text-white">
                {t("rpm.map")}
              </h4>
            </div>

            <EditableList
              items={result.plan ?? []}
              onChange={(val) => updateResult(["plan"], val)}
              itemClassName="font-medium text-lg text-gray-700 dark:text-gray-300"
            />
          </div>
        </motion.div>
      </Wrapper>
    );
  }

  if (result.type === "misogi") {
    const toStr = (v: unknown): string =>
      Array.isArray(v)
        ? v.map(String).filter(Boolean).join("\n")
        : typeof v === "string"
          ? v
          : String(v ?? "");
    const challenge = toStr(result.challenge);
    const gap = toStr(result.gap);
    const purification = toStr(result.purification);
    const copyMisogi = () => {
      const parts = [
        `# ${t("misogi.challenge")}\n${challenge}`,
        `\n# ${t("misogi.failureGap")}\n${gap}`,
        `\n# ${t("misogi.purification")}\n${purification}`,
      ];
      navigator.clipboard.writeText(parts.join("\n"));
      toast.success(t("common.copiedToClipboard"));
    };
    return (
      <Wrapper>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 w-full max-w-4xl mx-auto space-y-8"
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={copyMisogi}
              className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-5 py-2.5 rounded-full shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
              aria-label={copyStrategyLabel}
            >
              <Copy size={16} />
              {copyStrategyLabel}
            </button>
          </div>
          <div className="bg-gradient-to-br from-red-900 to-rose-900 text-white rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden border border-red-800">
            <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 text-center">
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-red-100 text-xs font-bold uppercase tracking-[0.3em] mb-8 border border-white/20">
                {t("misogi.challengeBadge")}
              </span>
              <div className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
                <EditableText
                  value={challenge}
                  onChange={(val) => updateResult(["challenge"], val)}
                  multiline
                  className="bg-transparent border-white/20 text-center"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-200 dark:border-zinc-800 shadow-xl">
              <h4 className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-sm mb-4">
                {t("misogi.failureGap")}
              </h4>
              <EditableText
                value={gap}
                onChange={(val) => updateResult(["gap"], val)}
                multiline
                className="text-xl font-medium text-gray-900 dark:text-gray-100 leading-relaxed"
              />
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-200 dark:border-zinc-800 shadow-xl">
              <h4 className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-sm mb-4">
                {t("misogi.purification")}
              </h4>
              <EditableText
                value={purification}
                onChange={(val) => updateResult(["purification"], val)}
                multiline
                className="text-xl font-medium text-gray-900 dark:text-gray-100 leading-relaxed"
              />
            </div>
          </div>
        </motion.div>
      </Wrapper>
    );
  }

  if (result.type === "mandalas") {
    return (
      <Wrapper>
        <MandalaView result={result} updateResult={updateResult} />
      </Wrapper>
    );
  }

  if (result.type === "ikigai") {
    return (
      <Wrapper>
        <IkigaiView result={result} updateResult={updateResult} />
      </Wrapper>
    );
  }

  if (result.type === "gps") {
    return (
      <Wrapper>
        <GpsView result={result} updateResult={updateResult} />
      </Wrapper>
    );
  }

  if (result.type === "dsss") {
    return (
      <Wrapper>
        <DsssView result={result} updateResult={updateResult} />
      </Wrapper>
    );
  }

  if (result.type === "general") {
    const steps = Array.isArray(result.steps) ? result.steps : [];
    const copyGeneral = () => {
      const parts = `# ${t("general.steps")}\n${steps.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}`;
      navigator.clipboard.writeText(parts);
      toast.success(t("common.copiedToClipboard"));
    };
    return (
      <Wrapper>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 w-full max-w-4xl mx-auto space-y-6"
        >
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={copyGeneral}
              className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-5 py-2.5 rounded-full shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
              aria-label={copyStrategyLabel}
            >
              <Copy size={16} />
              {copyStrategyLabel}
            </button>
          </div>
          <div className="bg-white dark:bg-zinc-900/95 backdrop-blur-xl border border-gray-200/80 dark:border-zinc-700/80 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center font-semibold">
                <Layers size={20} />
              </div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                {t("general.steps")}
              </h4>
            </div>
            <EditableList
              items={steps}
              onChange={(val) => updateResult(["steps"], val)}
              itemClassName="text-base md:text-lg text-gray-700 dark:text-gray-200 leading-relaxed pl-5 py-2 border-l-2 border-slate-300 dark:border-zinc-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            />
          </div>
        </motion.div>
      </Wrapper>
    );
  }

  return null;
};
