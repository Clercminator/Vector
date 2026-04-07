import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Github, Linkedin, User } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useLanguage } from "@/app/components/language-provider";
import { InspiredBySection } from "@/app/components/InspiredBySection";
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  buildLocalizedPath,
  buildLocalizedUrl,
} from "@/lib/seo";

const FOUNDER_LINKEDIN = "https://www.linkedin.com/in/david-clerc";
const FOUNDER_GITHUB = "https://github.com/Clercminator";

export function AboutPage() {
  const { t, language } = useLanguage();
  const [founderImgError, setFounderImgError] = React.useState(false);
  const aboutUrl = buildLocalizedUrl("/about", language);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        name: `${t("about.title")} | ${SITE_NAME}`,
        url: aboutUrl,
        description: t("about.tagline"),
      },
      {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: DEFAULT_OG_IMAGE,
        founder: {
          "@type": "Person",
          name: t("about.founder.name"),
          jobTitle: t("about.founder.role"),
          sameAs: [FOUNDER_LINKEDIN, FOUNDER_GITHUB],
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-zinc-900/30 backdrop-blur-sm text-gray-900 dark:text-gray-50 px-6 py-12">
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      <div className="max-w-3xl mx-auto relative z-10">
        <Button
          variant="ghost"
          className="mb-8 gap-2 pl-0 hover:bg-transparent hover:text-gray-600 dark:hover:text-gray-300"
          asChild
        >
          <Link to={buildLocalizedPath("/", language)}>
            <ArrowLeft size={20} />
            {t("common.back")}
          </Link>
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-16"
        >
          <header className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-black dark:text-white mb-3">
              {t("about.title")}
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 font-light">
              {t("about.tagline")}
            </p>
          </header>

          <section>
            <h2 className="text-xl font-bold text-black dark:text-white mb-4">
              {t("about.purpose.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {t("about.purpose.body")}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black dark:text-white mb-4">
              {t("about.vsLLM.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {t("about.vsLLM.body")}
            </p>
          </section>

          {/* Thought leaders whose frameworks power Vector */}
          <section className="border-t border-gray-100 dark:border-zinc-800 pt-12">
            <InspiredBySection />
          </section>

          {/* Founder / author credibility: face, name, role, bio, LinkedIn, GitHub */}
          <section className="border-t border-gray-100 dark:border-zinc-800 pt-12">
            <h2 className="text-xl font-bold text-black dark:text-white mb-6">
              {t("about.founder.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
              {t("about.founder.body")}
            </p>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
              <div className="w-52 h-52 sm:w-64 sm:h-64 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                {!founderImgError ? (
                  <img
                    src="/images/authors/David%20Clerc%20empresarial%20traje.webp"
                    alt={t("about.founder.name")}
                    width={512}
                    height={512}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-top"
                    onError={() => setFounderImgError(true)}
                  />
                ) : (
                  <User
                    size={40}
                    className="text-gray-400 dark:text-gray-500"
                    aria-hidden
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg text-black dark:text-white">
                  {t("about.founder.name")}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {t("about.founder.role")}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                  {t("about.founder.bio")}
                </p>
                <div className="flex flex-wrap gap-4">
                  <a
                    href={FOUNDER_LINKEDIN}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Linkedin size={18} />
                    {t("about.founder.linkedin")}
                  </a>
                  <a
                    href={FOUNDER_GITHUB}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:underline"
                  >
                    <Github size={18} />
                    {t("about.founder.github")}
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Video placeholder — not ready yet */}
          <section className="border-t border-gray-100 dark:border-zinc-800 pt-12">
            <h2 className="text-xl font-bold text-black dark:text-white mb-4">
              {t("about.video.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              {t("about.video.body")}
            </p>
            <div className="aspect-video rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-gray-500 font-medium">
              {t("about.video.comingSoon")}
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
