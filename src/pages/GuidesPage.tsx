import React from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Compass, Filter, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useLanguage } from "@/app/components/language-provider";
import { trackClick } from "@/lib/analytics";
import {
  editorialArticles,
  editorialCategoryLabels,
  type EditorialArticleCategory,
} from "@/lib/editorialArticles";
import { frameworkGuides } from "@/lib/frameworkGuides";
import type { Framework } from "@/lib/frameworks";
import {
  buildLanguageAlternates,
  buildLocalizedUrl,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
} from "@/lib/seo";

type GuidesFilter = "all" | "frameworks" | EditorialArticleCategory;

interface TopicCluster {
  id: string;
  title: string;
  description: string;
  articleSlugs: string[];
  frameworkIds: Framework[];
}

const topicClusters: TopicCluster[] = [
  {
    id: "career-planning-system",
    title: "Career planning system",
    description:
      "A hub for career-change structure, role clarity, proof-of-work priorities, and quarter-level transition execution.",
    articleSlugs: [
      "career-planning-system",
      "career-change-planner",
      "best-framework-for-career-change",
      "how-to-use-ikigai-for-career-clarity",
      "example-okr-for-career-change",
    ],
    frameworkIds: ["ikigai", "pareto", "okr"],
  },
  {
    id: "personal-okr-system",
    title: "Personal OKR system",
    description:
      "A hub for personal OKR design, generator-style searches, quarterly review cadence, and personal-goal execution.",
    articleSlugs: [
      "personal-okr-system",
      "okr-generator",
      "how-to-use-okrs-for-personal-goals",
      "okr-vs-smart-goals",
      "okrs-in-vector-vs-spreadsheet-tracking",
    ],
    frameworkIds: ["okr", "gps"],
  },
  {
    id: "goal-prioritization-system",
    title: "Goal prioritization system",
    description:
      "A hub for people drowning in competing goals, urgent work, and noisy calendars who need a priority system that holds up under pressure.",
    articleSlugs: [
      "goal-prioritization-system",
      "eisenhower-matrix-tool",
      "pareto-analysis-template",
      "how-to-stop-feeling-overwhelmed",
      "how-to-prioritize-too-many-goals",
    ],
    frameworkIds: ["pareto", "eisenhower", "gps"],
  },
  {
    id: "study-planning-system",
    title: "Study planning system",
    description:
      "A hub for study-system design, high-yield focus, skill acquisition, and example planning outputs for learning goals.",
    articleSlugs: [
      "study-planning-system",
      "best-framework-for-studying",
      "how-to-use-pareto-for-studying",
      "example-study-plan-using-pareto",
      "pareto-analysis-template",
    ],
    frameworkIds: ["dsss", "pareto", "okr", "gps"],
  },
  {
    id: "life-planning-framework",
    title: "Life planning framework",
    description:
      "A hub for long-range direction, purpose, life design, and the tools that turn reflection into a structured planning architecture.",
    articleSlugs: [
      "life-planning-framework",
      "life-planning-tool",
      "ikigai-template",
      "goal-breakdown-tool",
      "best-goal-setting-method",
    ],
    frameworkIds: ["ikigai", "mandalas", "first-principles"],
  },
];

export function GuidesPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [activeFilter, setActiveFilter] = React.useState<GuidesFilter>("all");
  const formatGuidesText = React.useCallback(
    (key: string, ...values: Array<string | number>) =>
      values.reduce(
        (message, value, index) => message.replace(`{${index}}`, String(value)),
        t(key),
      ),
    [t],
  );
  const localizedCategoryLabels: Record<EditorialArticleCategory, string> = {
    selection: t("guides.filter.selection"),
    "use-case": t("guides.filter.useCase"),
    comparison: t("guides.filter.comparison"),
    application: t("guides.filter.application"),
    problem: t("guides.filter.problem"),
    system: t("guides.filter.system"),
    tool: t("guides.filter.tool"),
    example: t("guides.filter.example"),
    synonym: t("guides.filter.synonym"),
    commercial: t("guides.filter.commercial"),
  };
  const canonicalUrl = buildLocalizedUrl("/guides", language);
  const alternates = buildLanguageAlternates("/guides");
  const seoTitle = t("guides.seoTitle");
  const seoDescription = t("guides.seoDescription");
  const featuredGuide = frameworkGuides[0];
  const articleBySlug = new Map(
    editorialArticles.map((article) => [article.slug, article]),
  );
  const filterOptions: Array<{
    id: GuidesFilter;
    label: string;
    count: number;
  }> = [
    {
      id: "all",
      label: t("guides.filter.all"),
      count: frameworkGuides.length + editorialArticles.length,
    },
    {
      id: "frameworks",
      label: t("guides.filter.frameworks"),
      count: frameworkGuides.length,
    },
    ...Object.keys(editorialCategoryLabels).map((category) => ({
      id: category as EditorialArticleCategory,
      label: localizedCategoryLabels[category as EditorialArticleCategory],
      count: editorialArticles.filter(
        (article) => article.category === category,
      ).length,
    })),
  ];
  const filteredEditorialArticles = editorialArticles.filter(
    (article) => activeFilter === "all" || article.category === activeFilter,
  );
  const showFrameworkGuides =
    activeFilter === "all" || activeFilter === "frameworks";
  const collectionItemList = [
    ...editorialArticles.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: article.title,
      url: buildLocalizedUrl(`/articles/${article.slug}`, language),
    })),
    ...frameworkGuides.map((guide, index) => ({
      "@type": "ListItem",
      position: editorialArticles.length + index + 1,
      name: t(`fw.${guide.id}.title`) || guide.framework.title,
      url: buildLocalizedUrl(`/frameworks/${guide.id}`, language),
    })),
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <Helmet prioritizeSeoTags>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        {alternates.map((alternate) => (
          <link
            key={alternate.hreflang}
            rel="alternate"
            hrefLang={alternate.hreflang}
            href={alternate.href}
          />
        ))}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: seoTitle,
            description: seoDescription,
            url: canonicalUrl,
            hasPart: collectionItemList.map((item) => item.url),
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: t("guides.structuredListName"),
            itemListElement: collectionItemList,
          })}
        </script>
      </Helmet>

      <section className="relative overflow-hidden border-b border-zinc-200/70 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(244,63,94,0.14),transparent_28%),linear-gradient(180deg,#fafafa_0%,#ffffff_56%)] dark:border-zinc-800 dark:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(244,63,94,0.14),transparent_24%),linear-gradient(180deg,#111827_0%,#09090b_58%)]">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-10 md:pb-24 md:pt-14">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-6xl md:leading-[1.02]">
              {t("guides.hero.title")}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300 md:text-xl">
              {t("guides.hero.subtitle")}
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div
              className={`rounded-[2rem] border p-8 shadow-sm ${featuredGuide.theme.surface} ${featuredGuide.theme.border}`}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                {t("guides.hero.featured")}
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                {t(`fw.${featuredGuide.id}.title`) ||
                  featuredGuide.framework.title}
              </h2>
              <p className="mt-4 text-base leading-8 text-zinc-700 dark:text-zinc-300">
                {featuredGuide.intro}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {featuredGuide.keywords.slice(0, 4).map((keyword) => (
                  <span
                    key={keyword}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ${featuredGuide.theme.chip}`}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  className={featuredGuide.theme.button}
                  onClick={() => {
                    trackClick(
                      `guides_featured_read_${featuredGuide.id}`,
                      featuredGuide.framework.title,
                    );
                    navigate(`/frameworks/${featuredGuide.id}`);
                  }}
                >
                  {t("guides.hero.readFeatured")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate("/wizard", {
                      state: { framework: featuredGuide.id },
                    })
                  }
                >
                  {t("guides.hero.startWithFramework")}
                  <Rocket className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-zinc-200/80 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-3 text-zinc-950 dark:text-white">
                <Compass className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                  {t("guides.hero.summaryTitle")}
                </p>
              </div>
              <div className="mt-6 space-y-4 text-base leading-8 text-zinc-700 dark:text-zinc-300">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-zinc-500" />
                  <span>{t("guides.hero.summary.0")}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-zinc-500" />
                  <span>{t("guides.hero.summary.1")}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-zinc-500" />
                  <span>{t("guides.hero.summary.2")}</span>
                </div>
              </div>
              <div className="mt-8 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/70">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  {formatGuidesText(
                    "guides.hero.availableCount",
                    frameworkGuides.length,
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-14 md:py-18">
        <section className="mb-16">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                {t("guides.topicClusters.eyebrow")}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-4xl">
                {t("guides.topicClusters.title")}
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
              {t("guides.topicClusters.description")}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {topicClusters.map((cluster) => {
              const clusterArticles = cluster.articleSlugs
                .map((slug) => articleBySlug.get(slug))
                .filter((article): article is NonNullable<typeof article> =>
                  Boolean(article),
                );

              return (
                <article
                  key={cluster.id}
                  className="rounded-[2rem] border border-zinc-200/80 bg-white p-7 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="inline-flex rounded-full border border-zinc-200/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                      {formatGuidesText(
                        "guides.cluster.resourceCount",
                        clusterArticles.length + cluster.frameworkIds.length,
                      )}
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                      {t("guides.cluster.label")}
                    </span>
                  </div>

                  <h3 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                    {cluster.title}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-300">
                    {cluster.description}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {cluster.frameworkIds.map((frameworkId) => {
                      const guide = frameworkGuides.find(
                        (item) => item.id === frameworkId,
                      );
                      const label = guide
                        ? t(`fw.${guide.id}.title`) || guide.framework.title
                        : frameworkId;

                      return (
                        <button
                          key={frameworkId}
                          type="button"
                          className="cursor-pointer rounded-full border border-zinc-200/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 transition hover:border-zinc-950 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-200 dark:hover:text-zinc-200"
                          onClick={() => navigate(`/frameworks/${frameworkId}`)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 space-y-3 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/70">
                    {clusterArticles.map((article) => (
                      <button
                        key={article.slug}
                        type="button"
                        className="flex w-full cursor-pointer items-center justify-between gap-4 text-left text-sm font-medium text-zinc-700 transition hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                        onClick={() => {
                          trackClick(
                            `guides_cluster_${cluster.id}_${article.slug}`,
                            article.title,
                          );
                          navigate(`/articles/${article.slug}`);
                        }}
                      >
                        <span>{article.title}</span>
                        <ArrowRight className="h-4 w-4 shrink-0" />
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mb-16">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                {t("guides.library.eyebrow")}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-4xl">
                {t("guides.library.title")}
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
              {t("guides.library.description")}
            </p>
          </div>

          <div className="-mx-6 mb-8 overflow-x-auto px-6 pb-2 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
            <div className="flex w-max min-w-full gap-2 sm:flex-wrap sm:gap-3">
              {filterOptions.map((filterOption) => {
                const isActive = activeFilter === filterOption.id;

                return (
                  <button
                    key={filterOption.id}
                    type="button"
                    className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition sm:px-4 ${
                      isActive
                        ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                        : "border-zinc-200/80 bg-white text-zinc-600 hover:border-zinc-950 hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-200 dark:hover:text-white"
                    }`}
                    onClick={() => setActiveFilter(filterOption.id)}
                  >
                    <Filter className="h-4 w-4" />
                    {filterOption.label}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-white/15 dark:bg-zinc-950/10" : "bg-zinc-100 dark:bg-zinc-800"}`}
                    >
                      {filterOption.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredEditorialArticles.length > 0 && (
            <div className="mb-16">
              <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                    {t("guides.editorial.eyebrow")}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-3xl">
                    {t("guides.editorial.title")}
                  </h3>
                </div>
                <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
                  {t("guides.editorial.description")}
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {filteredEditorialArticles.map((article) => (
                  <article
                    key={article.slug}
                    className="group flex h-full flex-col rounded-[2rem] border border-zinc-200/80 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${article.theme.chip}`}
                      >
                        {localizedCategoryLabels[article.category]}
                      </div>
                      <span className="rounded-full border border-zinc-200/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                        {article.readingTime}
                      </span>
                    </div>
                    <h3 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                      {article.title}
                    </h3>
                    <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-300">
                      {article.description}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {article.keywords.slice(0, 3).map((keyword) => (
                        <span
                          key={keyword}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium ${article.theme.chip}`}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                    <div
                      className={`mt-6 rounded-2xl border p-5 ${article.theme.surface} ${article.theme.border}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                        {t("guides.editorial.whyThisExists")}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                        {article.takeaways[0]}
                      </p>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {article.relatedArticles.slice(0, 2).map((slug) => {
                        const relatedArticle = articleBySlug.get(slug);

                        if (!relatedArticle) {
                          return null;
                        }

                        return (
                          <button
                            key={slug}
                            type="button"
                            className="cursor-pointer rounded-full border border-zinc-200/80 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-950 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-200 dark:hover:text-white"
                            onClick={() =>
                              navigate(`/articles/${relatedArticle.slug}`)
                            }
                          >
                            {relatedArticle.title}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Button
                        className={`sm:flex-1 ${article.theme.button}`}
                        onClick={() => {
                          trackClick(
                            `guides_editorial_read_${article.slug}`,
                            article.title,
                          );
                          navigate(`/articles/${article.slug}`);
                        }}
                      >
                        {t("guides.editorial.readArticle")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="sm:flex-1"
                        onClick={() =>
                          navigate(`/frameworks/${article.primaryFramework}`)
                        }
                      >
                        {t("guides.editorial.readFrameworkGuide")}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        {showFrameworkGuides && (
          <section>
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                  {t("guides.frameworks.eyebrow")}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-4xl">
                  {t("guides.frameworks.title")}
                </h2>
              </div>
              <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
                {t("guides.frameworks.description")}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {frameworkGuides.map((guide) => {
                const title =
                  t(`fw.${guide.id}.title`) || guide.framework.title;
                const description =
                  t(`fw.${guide.id}.desc`) || guide.framework.description;
                const Icon = guide.framework.icon;

                return (
                  <article
                    key={guide.id}
                    className="group flex h-full flex-col rounded-[2rem] border border-zinc-200/80 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${guide.theme.surfaceStrong} ${guide.theme.accentText}`}
                      >
                        <Icon className="h-7 w-7" />
                      </div>
                      <span className="rounded-full border border-zinc-200/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                        {guide.readingTime}
                      </span>
                    </div>

                    <h2 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                      {title}
                    </h2>
                    <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-300">
                      {description}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {guide.keywords.slice(0, 3).map((keyword) => (
                        <span
                          key={keyword}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium ${guide.theme.chip}`}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>

                    <div
                      className={`mt-6 rounded-2xl border p-5 ${guide.theme.surface} ${guide.theme.border}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                        {t("guides.frameworks.bestFor")}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                        {guide.audience}
                      </p>
                    </div>

                    <div className="mt-6 space-y-3">
                      {guide.takeaways.slice(0, 2).map((takeaway) => (
                        <div
                          key={takeaway}
                          className="flex items-start gap-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300"
                        >
                          <Sparkles className="mt-1 h-4 w-4 shrink-0 text-zinc-500" />
                          <span>{takeaway}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Button
                        className={`sm:flex-1 ${guide.theme.button}`}
                        onClick={() => {
                          trackClick(
                            `guides_read_${guide.id}`,
                            guide.framework.title,
                          );
                          navigate(`/frameworks/${guide.id}`);
                        }}
                      >
                        {t("guides.frameworks.readArticle")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="sm:flex-1"
                        onClick={() =>
                          navigate("/wizard", {
                            state: { framework: guide.id },
                          })
                        }
                      >
                        {t("guides.frameworks.startBlueprint")}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
