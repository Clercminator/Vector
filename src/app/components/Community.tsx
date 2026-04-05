import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Heart,
  Upload,
  Gift,
  Download,
  Loader2,
  ArrowLeft,
  Trophy,
  LayoutGrid,
  Search,
  Plus,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { supabase } from "@/lib/supabase";
import { isE2EMode, loadE2ECommunityTemplates } from "@/lib/e2eHarness";
import { toast } from "sonner";
import { Leaderboard } from "./Leaderboard";

interface CommunityProps {
  userId: string | null;
  onBack: () => void;
  onImport: (blueprint: any) => void;
  onCreate: () => void;
}

interface Template {
  id: string;
  title: string;
  description: string;
  author_id: string;
  author_name: string;
  votes: number;
  data: any;
  created_at: string;
  proof?: {
    progressPct?: number;
    completedMilestones?: number;
    totalMilestones?: number;
    currentStreak?: number;
    outcomeStatus?: string;
    evidenceNote?: string;
  };
  proofHistory?: Array<{
    eventType: string;
    label: string;
    detail: string;
    eventDate: string;
    metricValue?: number | null;
    metricUnit?: string | null;
  }>;
}

import { useLanguage } from "@/app/components/language-provider";

export function Community({
  userId,
  onBack,
  onImport,
  onCreate,
}: CommunityProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"templates" | "leaderboard">(
    "templates",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 12;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchTemplates = async (
    pageToLoad: number,
    isInitial: boolean = false,
  ) => {
    if (isInitial) setLoading(true);
    else setIsLoadingMore(true);

    if (isE2EMode()) {
      const localTemplates = loadE2ECommunityTemplates();
      const list: Template[] = localTemplates.map((template) => ({
        id: template.id,
        title: template.title,
        description: template.description,
        author_id: template.user_id,
        author_name: template.author_name,
        votes: 0,
        data: {
          framework: template.framework,
          title: template.title,
          answers: template.answers,
          result: template.result,
          id: template.id,
          createdAt: template.created_at,
        },
        created_at: template.created_at,
        proof: (template.result as any)?.communityProof,
        proofHistory: (template.result as any)?.communityProofHistory || [],
      }));
      setTemplates(list);
      setHasMore(false);
      setError(null);
      setLoading(false);
      setIsLoadingMore(false);
      return;
    }

    if (!supabase) {
      setLoading(false);
      setIsLoadingMore(false);
      return;
    }

    try {
      const from = pageToLoad * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: rows, error: err } = await supabase
        .from("community_templates")
        .select(
          "id, user_id, framework, title, description, answers, result, created_at",
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (err) throw err;

      if (!rows || rows.length === 0) {
        if (isInitial) setTemplates([]);
        setHasMore(false);
        return;
      }

      if (rows.length < PAGE_SIZE) {
        setHasMore(false);
      }

      const userIds = [
        ...new Set((rows as { user_id: string }[]).map((r) => r.user_id)),
      ];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const nameByUserId = new Map<string, string>();
      (profiles || []).forEach(
        (p: { user_id: string; display_name: string | null }) => {
          nameByUserId.set(
            p.user_id,
            p.display_name || t("community.author.anonymous"),
          );
        },
      );

      const templateIds = (rows as { id: string }[]).map((r) => r.id);
      const { data: votesRows } = await supabase
        .from("template_votes")
        .select("template_id")
        .in("template_id", templateIds);

      const { data: proofRows } = await supabase
        .from("community_template_proof_events")
        .select(
          "template_id, event_type, label, detail, event_date, metric_value, metric_unit",
        )
        .in("template_id", templateIds)
        .order("event_date", { ascending: false });

      const voteCountByTemplateId = new Map<string, number>();
      (votesRows || []).forEach((v: { template_id: string }) => {
        voteCountByTemplateId.set(
          v.template_id,
          (voteCountByTemplateId.get(v.template_id) || 0) + 1,
        );
      });

      const proofHistoryByTemplateId = new Map<
        string,
        Template["proofHistory"]
      >();
      (proofRows || []).forEach((row: any) => {
        const current = proofHistoryByTemplateId.get(row.template_id) || [];
        current.push({
          eventType: row.event_type,
          label: row.label,
          detail: row.detail,
          eventDate: row.event_date,
          metricValue: row.metric_value,
          metricUnit: row.metric_unit,
        });
        proofHistoryByTemplateId.set(row.template_id, current);
      });

      const list: Template[] = (rows as any[]).map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description || "",
        author_id: r.user_id,
        author_name:
          nameByUserId.get(r.user_id) || t("community.author.anonymous"),
        votes: voteCountByTemplateId.get(r.id) || 0,
        data: {
          framework: r.framework,
          title: r.title,
          answers: r.answers || [],
          result: r.result || {},
          id: r.id,
          createdAt: r.created_at,
        },
        created_at: r.created_at,
        proof: (r.result as any)?.communityProof,
        proofHistory:
          proofHistoryByTemplateId.get(r.id) ||
          (r.result as any)?.communityProofHistory ||
          [],
      }));

      if (isInitial) {
        setTemplates(list);
      } else {
        setTemplates((prev) => [...prev, ...list]);
      }
      setError(null);
    } catch (e) {
      console.error(e);
      if (isInitial) {
        setError(
          e instanceof Error
            ? e.message
            : t("community.error") || "Failed to load templates",
        );
      } else {
        toast.error(t("community.errorMore") || "Failed to load more");
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTemplates(0, true);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTemplates(nextPage, false);
  };

  // ... existing vote logic ...

  const handleVote = async (templateId: string) => {
    if (!userId) {
      toast.error(t("community.voteLogin"));
      return;
    }
    if (!supabase) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: existing } = await supabase
        .from("template_votes")
        .select("template_id")
        .eq("template_id", templateId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (existing) {
        toast.info(t("community.alreadyVoted") || "You already voted");
        return;
      }
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId ? { ...t, votes: t.votes + 1 } : t,
        ),
      );
      const { error: voteErr } = await supabase
        .from("template_votes")
        .insert({ template_id: templateId, user_id: user.id });
      if (voteErr) throw voteErr;
      toast.success(t("community.voted"));
    } catch (e) {
      console.error(e);
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId ? { ...t, votes: t.votes - 1 } : t,
        ),
      );
      toast.error(t("community.voteError") || "Vote failed");
    }
  };

  const handleImport = (template: Template) => {
    onImport(template.data);
    toast.success(t("community.imported"));
  };

  const handleGift = async (authorId: string) => {
    if (!userId) {
      toast.error(t("community.giftLogin"));
      return;
    }
    toast.success(t("community.gifted"));
  };

  const [sortBy, setSortBy] = useState<"recent" | "top">("recent");

  const sortedTemplates = [...templates]
    .filter(
      (t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.author_name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "top") {
        return b.votes - a.votes;
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-6xl mx-auto px-6 py-12"
    >
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="dark:text-white dark:hover:bg-zinc-800"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
              {t("community.title")}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {t("community.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("templates")}
              className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === "templates" ? "bg-white dark:bg-black text-black dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"}`}
            >
              <LayoutGrid size={16} />
              {t("community.title")}
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === "leaderboard" ? "bg-white dark:bg-black text-black dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"}`}
            >
              <Trophy size={16} />
              {t("leaderboard.title")}
            </button>
          </div>
        </div>
      </div>

      {activeTab === "leaderboard" ? (
        <Leaderboard />
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full md:w-96">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <Input
                placeholder={t("community.search") || "Search templates..."}
                className="pl-10 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
              />
            </div>

            <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg shrink-0">
              <button
                onClick={() => setSortBy("recent")}
                className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-all ${sortBy === "recent" ? "bg-white dark:bg-black text-black dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"}`}
              >
                {t("community.sort.recent")}
              </button>
              <button
                onClick={() => setSortBy("top")}
                className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-all ${sortBy === "top" ? "bg-white dark:bg-black text-black dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"}`}
              >
                {t("community.sort.top")}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2
                className="animate-spin text-gray-300 dark:text-gray-600"
                size={40}
              />
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedTemplates.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800 text-gray-400">
                    <p className="mb-4 text-lg">
                      {searchQuery
                        ? t("community.noResults")
                        : t("community.empty")}
                    </p>
                    {!searchQuery && (
                      <Button
                        onClick={onCreate}
                        variant="outline"
                        className="gap-2"
                      >
                        <Plus size={16} />
                        {t("community.createFirst") ||
                          "Create your first Blueprint"}
                      </Button>
                    )}
                  </div>
                ) : (
                  sortedTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                      data-testid="community-template-card"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            {template.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t("community.by")}{" "}
                            {template.author_name ||
                              t("community.author.anonymous")}
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVote(template.id);
                            }}
                            className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 p-2 rounded-xl transition-colors flex flex-col items-center min-w-[50px]"
                          >
                            <Heart
                              size={20}
                              className={
                                template.votes > 0 ? "fill-current" : ""
                              }
                            />
                            <span className="text-xs font-bold">
                              {template.votes}
                            </span>
                          </button>
                        </div>
                      </div>

                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 line-clamp-3 flex-grow">
                        {template.description || t("community.desc.empty")}
                      </p>

                      {template.proof && (
                        <div className="mb-5 space-y-3 rounded-2xl bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-4">
                          <div className="flex flex-wrap gap-2">
                            {typeof template.proof.progressPct === "number" && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                {template.proof.progressPct}% progress
                              </span>
                            )}
                            {typeof template.proof.currentStreak === "number" &&
                              template.proof.currentStreak > 0 && (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                  {template.proof.currentStreak} active days
                                </span>
                              )}
                            {template.proof.totalMilestones ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                {template.proof.completedMilestones || 0}/
                                {template.proof.totalMilestones} milestones
                              </span>
                            ) : null}
                          </div>
                          {template.proof.outcomeStatus && (
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                              {template.proof.outcomeStatus.replace("-", " ")}
                            </p>
                          )}
                          {template.proof.evidenceNote && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                              {template.proof.evidenceNote}
                            </p>
                          )}
                        </div>
                      )}

                      {template.proofHistory &&
                        template.proofHistory.length > 0 && (
                          <div
                            className="mb-5 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 p-4 bg-white/70 dark:bg-zinc-950/40"
                            data-testid="community-proof-history"
                          >
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-3">
                              Verified Outcome History
                            </p>
                            <div className="space-y-3">
                              {template.proofHistory
                                .slice(0, 3)
                                .map((event, index) => (
                                  <div
                                    key={`${event.label}-${event.eventDate}-${index}`}
                                    className="flex gap-3 items-start"
                                  >
                                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-black dark:bg-white shrink-0" />
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                          {event.label}
                                        </p>
                                        <span className="text-[11px] uppercase tracking-[0.18em] text-gray-400">
                                          {new Date(
                                            event.eventDate,
                                          ).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                          })}
                                        </span>
                                        {typeof event.metricValue ===
                                          "number" && (
                                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-gray-300">
                                            {event.metricValue}
                                            {event.metricUnit
                                              ? ` ${event.metricUnit}`
                                              : ""}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-1">
                                        {event.detail}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                      <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800">
                        <Button
                          onClick={() => handleImport(template)}
                          className="flex-1 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-800"
                          variant="outline"
                        >
                          <Download size={16} className="mr-2" />
                          {t("community.useTemplate")}
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGift(template.author_id);
                          }}
                          variant="ghost"
                          size="icon"
                          title={t("community.gift")}
                        >
                          <Gift size={20} className="text-yellow-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {hasMore && sortedTemplates.length > 0 && (
                <div className="flex justify-center mt-12">
                  <Button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    variant="ghost"
                    className="gap-2"
                  >
                    {isLoadingMore ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : null}
                    {t("community.loadMore")}
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </motion.div>
  );
}
