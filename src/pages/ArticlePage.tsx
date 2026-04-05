import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ReactMarkdown, { type Components } from "react-markdown";
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
import { trackClick } from "@/lib/analytics";
import {
  editorialArticles,
  editorialCategoryLabels,
  getEditorialArticle,
} from "@/lib/editorialArticles";
import { frameworkGuides } from "@/lib/frameworkGuides";
import {
  buildLanguageAlternates,
  buildLocalizedUrl,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const article = slug ? getEditorialArticle(slug) : undefined;

  if (!article) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">Article Not Found</h1>
          <Button onClick={() => navigate("/guides")}>Browse articles</Button>
        </div>
      </div>
    );
  }

  const canonicalUrl = buildLocalizedUrl(`/articles/${article.slug}`, language);
  const alternates = buildLanguageAlternates(`/articles/${article.slug}`);
  const relatedFrameworks = frameworkGuides.filter((guide) =>
    article.relatedFrameworks.includes(guide.id),
  );
  const relatedArticles = editorialArticles.filter((entry) =>
    article.relatedArticles.includes(entry.slug),
  );
  const primaryFrameworkGuide = frameworkGuides.find(
    (guide) => guide.id === article.primaryFramework,
  );
  const primaryFrameworkTitle = primaryFrameworkGuide
    ? t(`fw.${primaryFrameworkGuide.id}.title`) ||
      primaryFrameworkGuide.framework.title
    : "recommended framework";
  const formattedReviewedAt = article.reviewedAt
    ? new Date(`${article.reviewedAt}T12:00:00Z`).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
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
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Articles",
            item: `${SITE_URL}/guides`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: article.title,
            item: canonicalUrl,
          },
        ],
      },
      {
        "@type": "Article",
        headline: article.seoTitle,
        description: article.description,
        mainEntityOfPage: canonicalUrl,
        inLanguage: language,
        keywords: article.keywords.join(", "),
        datePublished: article.reviewedAt ?? "2026-04-04",
        dateModified: article.reviewedAt ?? "2026-04-04",
        author: {
          "@type": "Person",
          name: article.authorName ?? "David Clerc",
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
        mainEntity: article.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
      ...(article.howToSteps
        ? [
            {
              "@type": "HowTo",
              name: article.title,
              description: article.description,
              totalTime: "PT15M",
              step: article.howToSteps.map((step, index) => ({
                "@type": "HowToStep",
                position: index + 1,
                name: `Step ${index + 1}`,
                text: step,
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <div className="min-h-screen bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <Helmet prioritizeSeoTags>
        <title>{article.seoTitle}</title>
        <meta name="description" content={article.description} />
        <meta
          name="robots"
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
        <meta property="og:title" content={article.seoTitle} />
        <meta property="og:description" content={article.description} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.seoTitle} />
        <meta name="twitter:description" content={article.description} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <section
        className={`relative overflow-hidden bg-gradient-to-br ${article.theme.hero}`}
      >
        <div
          className={`absolute left-[-8rem] top-20 h-64 w-64 rounded-full blur-3xl ${article.theme.heroGlow}`}
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
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md">
                <BookOpen className="h-4 w-4" />{" "}
                {editorialCategoryLabels[article.category]}
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl md:leading-[1.02]">
                {article.title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/85 md:text-xl">
                {article.description}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/85">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/10 px-4 py-2 backdrop-blur-sm">
                  <User2 className="h-4 w-4" /> {article.authorName}
                </div>
                {formattedReviewedAt && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/10 px-4 py-2 backdrop-blur-sm">
                    <CalendarDays className="h-4 w-4" /> Reviewed{" "}
                    {formattedReviewedAt}
                  </div>
                )}
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/10 px-4 py-2 backdrop-blur-sm">
                  <Clock3 className="h-4 w-4" /> {article.readingTime}
                </div>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-white/20 bg-black/15 p-6 text-white shadow-2xl backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                Key takeaways
              </p>
              <div className="mt-5 space-y-3">
                {article.takeaways.map((takeaway) => (
                  <div
                    key={takeaway}
                    className="flex items-start gap-3 text-sm leading-6 text-white/90"
                  >
                    <Sparkles className="mt-1 h-4 w-4 shrink-0 text-white/80" />
                    <span>{takeaway}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {article.keywords.map((keyword) => (
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
              className={`rounded-[2rem] border p-8 shadow-sm ${article.theme.surface} ${article.theme.border}`}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                Overview
              </p>
              <div className="mt-5 max-w-none">
                <ReactMarkdown components={markdownComponents}>
                  {article.intro}
                </ReactMarkdown>
              </div>
            </section>

            {article.howToSteps && article.howToSteps.length > 0 && (
              <section className="rounded-[2rem] border border-zinc-200/80 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-3xl">
                  How to use this inside Vector
                </h2>
                <ol className="mt-8 space-y-4">
                  {article.howToSteps.map((step, index) => (
                    <li
                      key={step}
                      className="flex items-start gap-4 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/70"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${article.theme.surfaceStrong} ${article.theme.accentText}`}
                      >
                        {index + 1}
                      </div>
                      <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {article.sections.map((section, index) => (
              <section
                key={section.anchor}
                id={section.anchor}
                className="rounded-[2rem] border border-zinc-200/80 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-6 flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold ${article.theme.surfaceStrong} ${article.theme.accentText}`}
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

            {article.planPreview && (
              <section
                className={`rounded-[2rem] border p-8 shadow-sm ${article.theme.surface} ${article.theme.border}`}
              >
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-3xl">
                  {article.planPreview.title}
                </h2>
                <p className="mt-4 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                  {article.planPreview.summary}
                </p>
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  {article.planPreview.blocks.map((block) => (
                    <div
                      key={block.title}
                      className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60"
                    >
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                        {block.title}
                      </p>
                      {block.body ? (
                        <p className="mt-3 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                          {block.body}
                        </p>
                      ) : null}
                      {block.items && block.items.length > 0 ? (
                        <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                          {block.items.map((item) => (
                            <li key={item} className="ml-5 list-disc pl-1">
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-[2rem] border border-zinc-200/80 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-3xl">
                FAQ
              </h2>
              <div className="mt-8 space-y-4">
                {article.faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className={`group rounded-2xl border p-5 ${article.theme.surface} ${article.theme.border}`}
                  >
                    <summary className="cursor-pointer list-none text-lg font-medium text-zinc-950 dark:text-white">
                      <span className="inline-flex items-center gap-3">
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${article.theme.surfaceStrong}`}
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
                Recommended next step
              </p>
              <p className="mt-4 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                If this article matches your situation, start with{" "}
                {primaryFrameworkTitle} inside Vector and turn it into a
                concrete blueprint.
              </p>
              <Button
                className={`mt-6 w-full ${article.theme.button}`}
                onClick={() => {
                  trackClick(
                    `article_start_blueprint_${article.primaryFramework}`,
                    article.title,
                  );
                  navigate("/wizard", {
                    state: { framework: article.primaryFramework },
                  });
                }}
              >
                Start blueprint <Rocket className="ml-2 h-4 w-4" />
              </Button>
              {primaryFrameworkGuide && (
                <div className="mt-6 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/80">
                  <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                    <Quote className="h-4 w-4" /> Framework to read next
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/frameworks/${primaryFrameworkGuide.id}`)
                    }
                    className="mt-3 text-left text-sm leading-7 text-zinc-700 transition hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                  >
                    {primaryFrameworkTitle}:{" "}
                    {t(`fw.${primaryFrameworkGuide.id}.desc`) ||
                      primaryFrameworkGuide.framework.description}
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                Why trust this page
              </p>
              <p className="mt-4 text-base leading-7 text-zinc-700 dark:text-zinc-300">
                {article.trustStatement}
              </p>
              <div className="mt-5 space-y-3">
                {(article.editorialStandards ?? []).map((standard) => (
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
                Related frameworks
              </p>
              <div className="mt-5 space-y-4">
                {relatedFrameworks.map((guide) => {
                  const title =
                    t(`fw.${guide.id}.title`) || guide.framework.title;
                  const description =
                    t(`fw.${guide.id}.desc`) || guide.framework.description;

                  return (
                    <button
                      key={guide.id}
                      type="button"
                      onClick={() => navigate(`/frameworks/${guide.id}`)}
                      className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${guide.theme.surface} ${guide.theme.border}`}
                    >
                      <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                        {title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {description}
                      </p>
                      <span
                        className={`mt-3 inline-flex items-center gap-2 text-sm font-medium ${guide.theme.accentText}`}
                      >
                        Read framework guide <ArrowRight className="h-4 w-4" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {relatedArticles.length > 0 && (
              <div className="rounded-[2rem] border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                  Related reading
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
