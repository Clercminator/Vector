import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ReactMarkdown, { type Components } from "react-markdown";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock3,
  Quote,
  Rocket,
  ShieldCheck,
  Sparkles,
  User2,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useLanguage } from "@/app/components/language-provider";
import { trackClick, trackEvent } from "@/lib/analytics";
import { editorialArticles } from "@/lib/editorialArticles";
import { getFrameworkGuide, frameworkGuides } from "@/lib/frameworkGuides";
import type { Framework } from "@/lib/frameworks";
import {
  buildLanguageAlternates,
  buildLocalizedUrl,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

const seoTitleMap: Partial<Record<Framework, string>> = {
  "first-principles":
    "How to Use First Principles for Business Planning | Vector AI",
  pareto:
    "Using the Pareto Principle (80/20) to Architect Your Life | Vector AI",
  okr: "The Best AI OKR Generator for 2026 | Vector Goal Architect",
  eisenhower: "Eisenhower Matrix for Prioritization | Vector AI Planner",
  rpm: "Tony Robbins RPM Planning Method | Vector AI",
  gps: "GPS Method: Goal, Plan, System | Vector AI",
  ikigai: "Find Your Ikigai with AI | Vector Life Architect",
  misogi: "The Misogi Challenge: One Defining Challenge | Vector AI",
  dsss: "Tim Ferriss DSSS Meta-Learning | Vector AI",
  mandalas: "Mandala Chart Goal Mapping | Vector AI",
};

const FRAMEWORK_REVIEWED_AT = "2026-04-04";
const FRAMEWORK_EDITORIAL_STANDARDS = [
  "Framework guide is aligned with the definitions and blueprint structures used inside Vector.",
  "Tradeoffs and use cases are reviewed against real planning workflows rather than abstract summaries.",
  "Guide is updated when the framework library or public product positioning changes.",
];

export function FrameworkPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (id) {
      trackEvent("framework_selected", { framework_id: id });
    }
  }, [id]);

  const guide = id ? getFrameworkGuide(id as Framework) : undefined;

  if (!guide) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">Framework Not Found</h1>
          <Button onClick={() => navigate("/guides")}>Browse articles</Button>
        </div>
      </div>
    );
  }

  const localizedTitle = t(`fw.${guide.id}.title`) || guide.framework.title;
  const localizedDescription =
    t(`fw.${guide.id}.desc`) || guide.framework.description;
  const Icon = guide.framework.icon;
  const canonicalUrl = buildLocalizedUrl(`/frameworks/${guide.id}`, language);
  const alternates = buildLanguageAlternates(`/frameworks/${guide.id}`);
  const seoTitle =
    seoTitleMap[guide.id] || `${localizedTitle} Framework Guide | ${SITE_NAME}`;
  const seoDescription = `${localizedDescription} Learn when to use ${localizedTitle}, how it works, and how Vector turns it into an execution-ready plan.`;
  const relatedGuides = frameworkGuides
    .filter((entry) => entry.id !== guide.id)
    .slice(0, 3);
  const relatedArticles = editorialArticles
    .filter((entry) => entry.relatedFrameworks.includes(guide.id))
    .slice(0, 2);
  const formattedReviewedAt = new Date(
    `${FRAMEWORK_REVIEWED_AT}T12:00:00Z`,
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const markdownComponents: Components = {
    p: ({ children }) => (
      <p className="mb-5 text-base leading-8 text-zinc-700 dark:text-zinc-300 md:text-lg">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="mb-6 space-y-3 text-base leading-8 text-zinc-700 marker:text-zinc-500 dark:text-zinc-300 md:text-lg">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-6 space-y-3 text-base leading-8 text-zinc-700 marker:font-semibold marker:text-zinc-500 dark:text-zinc-300 md:text-lg">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="ml-5 pl-1">{children}</li>,
    h3: ({ children }) => (
      <h3 className="mb-3 mt-8 text-xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-2xl">
        {children}
      </h3>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-zinc-950 dark:text-white">
        {children}
      </strong>
    ),
    a: ({ href = "", children }) => {
      const isInternal = href.startsWith("/");

      return (
        <a
          href={href}
          className="font-medium text-zinc-950 underline decoration-zinc-300 underline-offset-4 transition hover:decoration-zinc-950 dark:text-white dark:decoration-zinc-600 dark:hover:decoration-white"
          onClick={(event) => {
            if (isInternal) {
              event.preventDefault();
              navigate(href);
            }
          }}
          target={isInternal ? undefined : "_blank"}
          rel={isInternal ? undefined : "noreferrer noopener"}
        >
          {children}
        </a>
      );
    },
  };
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: SITE_NAME,
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Framework Articles",
            item: `${SITE_URL}/guides`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: localizedTitle,
            item: canonicalUrl,
          },
        ],
      },
      {
        "@type": "Article",
        headline: seoTitle,
        description: seoDescription,
        mainEntityOfPage: canonicalUrl,
        inLanguage: language,
        datePublished: FRAMEWORK_REVIEWED_AT,
        dateModified: FRAMEWORK_REVIEWED_AT,
        author: {
          "@type": "Person",
          name: guide.framework.author,
        },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          logo: {
            "@type": "ImageObject",
            url: DEFAULT_OG_IMAGE,
          },
        },
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        description:
          "Framework-based AI planning tool that turns goals into structured blueprints with milestones, first-week actions, and execution systems.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: guide.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white text-zinc-950 transition-colors duration-300 dark:bg-zinc-950 dark:text-white">
      <Helmet prioritizeSeoTags>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta
          name="robots"
          content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        />
        <meta
          name="googlebot"
          content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        />
        <link rel="canonical" href={canonicalUrl} />
        {alternates.map((alternate) => (
          <link
            key={alternate.hreflang}
            rel="alternate"
            hrefLang={alternate.hreflang}
            href={alternate.href}
          />
        ))}
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <section
        className={`relative overflow-hidden bg-gradient-to-br ${guide.theme.hero}`}
      >
        <div
          className={`absolute left-[-8rem] top-20 h-64 w-64 rounded-full blur-3xl ${guide.theme.heroGlow}`}
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.22),transparent_45%,rgba(0,0,0,0.18))]" />
        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-28 md:pb-20 md:pt-36">
          <Button
            variant="ghost"
            className="mb-10 -ml-4 text-white hover:bg-white/15 hover:text-white"
            onClick={() => navigate("/guides")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to articles
          </Button>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)] lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md">
                <BookOpen className="h-4 w-4" /> Framework article
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl md:leading-[1.02]">
                {localizedTitle}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/85 md:text-xl">
                {localizedDescription}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/85">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/10 px-4 py-2 backdrop-blur-sm">
                  <User2 className="h-4 w-4" /> {guide.framework.author}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/10 px-4 py-2 backdrop-blur-sm">
                  <CalendarDays className="h-4 w-4" /> Reviewed{" "}
                  {formattedReviewedAt}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/10 px-4 py-2 backdrop-blur-sm">
                  <Clock3 className="h-4 w-4" /> {guide.readingTime}
                </div>
              </div>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-[2rem] border border-white/20 bg-black/15 p-6 text-white shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                    Audience
                  </p>
                  <p className="mt-1 text-sm leading-6 text-white/90">
                    {guide.audience}
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-3 border-t border-white/15 pt-6">
                <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                  Key takeaways
                </p>
                {guide.takeaways.map((takeaway) => (
                  <div
                    key={takeaway}
                    className="flex items-start gap-3 text-sm leading-6 text-white/90"
                  >
                    <Sparkles className="mt-1 h-4 w-4 shrink-0 text-white/80" />
                    <span>{takeaway}</span>
                  </div>
                ))}
              </div>
            </motion.aside>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {guide.keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-14 md:py-18">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_320px]">
          <div className="space-y-8">
            <section
              className={`rounded-[2rem] border p-8 shadow-sm ${guide.theme.surface} ${guide.theme.border}`}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                Overview
              </p>
              <div className="mt-5 max-w-none">
                <ReactMarkdown components={markdownComponents}>
                  {guide.intro}
                </ReactMarkdown>
              </div>
            </section>

            {guide.sections.map((section, index) => (
              <section
                key={section.anchor}
                id={section.anchor}
                className="rounded-[2rem] border border-zinc-200/80 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-6 flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold ${guide.theme.surfaceStrong} ${guide.theme.accentText}`}
                  >
                    {index + 1}
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-3xl">
                    {section.title}
                  </h2>
                </div>
                <ReactMarkdown components={markdownComponents}>
                  {section.markdown}
                </ReactMarkdown>
              </section>
            ))}

            <section className="rounded-[2rem] border border-zinc-200/80 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-3xl">
                FAQ
              </h2>
              <div className="mt-8 space-y-4">
                {guide.faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className={`group rounded-2xl border p-5 ${guide.theme.surface} ${guide.theme.border}`}
                  >
                    <summary className="cursor-pointer list-none text-lg font-medium text-zinc-950 dark:text-white">
                      <span className="inline-flex items-center gap-3">
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${guide.theme.surfaceStrong}`}
                        />
                        {faq.question}
                      </span>
                    </summary>
                    <p className="mt-4 pl-5 text-base leading-8 text-zinc-700 dark:text-zinc-300">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[2rem] border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                Use this framework
              </p>
              <p className="mt-4 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                Vector can turn {localizedTitle} into a concrete blueprint with
                milestones, constraints, and next actions.
              </p>
              <Button
                className={`mt-6 w-full ${guide.theme.button}`}
                onClick={() => {
                  trackClick(
                    `framework_start_blueprint_${guide.id}`,
                    localizedTitle,
                  );
                  navigate("/wizard", { state: { framework: guide.id } });
                }}
              >
                Start blueprint <Rocket className="ml-2 h-4 w-4" />
              </Button>

              <div className="mt-6 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/80">
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  <Quote className="h-4 w-4" /> Example use case
                </p>
                <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                  “{guide.framework.example}”
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                Why trust this guide
              </p>
              <p className="mt-4 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                This guide is based on the same framework definitions, blueprint
                structures, and planning workflows Vector uses when converting
                goals into structured plans.
              </p>
              <div className="mt-5 space-y-3">
                {FRAMEWORK_EDITORIAL_STANDARDS.map((standard) => (
                  <div
                    key={standard}
                    className="flex items-start gap-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300"
                  >
                    <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-zinc-500" />
                    <span>{standard}</span>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="mt-6 w-full"
                onClick={() => navigate("/about")}
              >
                About Vector editorial standards
              </Button>
            </div>

            <div className="rounded-[2rem] border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                Explore next
              </p>
              <div className="mt-5 space-y-4">
                {relatedGuides.map((entry) => {
                  const entryTitle =
                    t(`fw.${entry.id}.title`) || entry.framework.title;
                  const entryDescription =
                    t(`fw.${entry.id}.desc`) || entry.framework.description;

                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => navigate(`/frameworks/${entry.id}`)}
                      className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${entry.theme.surface} ${entry.theme.border}`}
                    >
                      <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                        {entryTitle}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {entryDescription}
                      </p>
                      <span
                        className={`mt-3 inline-flex items-center gap-2 text-sm font-medium ${entry.theme.accentText}`}
                      >
                        Read article <ArrowRight className="h-4 w-4" />
                      </span>
                    </button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                className="mt-5 w-full"
                onClick={() => navigate("/guides")}
              >
                Browse all articles
              </Button>
            </div>

            {relatedArticles.length > 0 && (
              <div className="rounded-[2rem] border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                  Compare and choose
                </p>
                <div className="mt-5 space-y-4">
                  {relatedArticles.map((entry) => (
                    <button
                      key={entry.slug}
                      type="button"
                      onClick={() => navigate(`/articles/${entry.slug}`)}
                      className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${entry.theme.surface} ${entry.theme.border}`}
                    >
                      <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                        {entry.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {entry.description}
                      </p>
                      <span
                        className={`mt-3 inline-flex items-center gap-2 text-sm font-medium ${entry.theme.accentText}`}
                      >
                        Read article <ArrowRight className="h-4 w-4" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
