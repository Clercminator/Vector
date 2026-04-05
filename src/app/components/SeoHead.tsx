import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/app/components/language-provider";
import {
  buildLanguageAlternates,
  buildLocalizedUrl,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  normalizePathname,
} from "@/lib/seo";

/** Maps app language codes to Open Graph locale format (language_TERRITORY) */
const OG_LOCALE_MAP: Record<string, string> = {
  en: "en_US",
  es: "es_ES",
  pt: "pt_BR",
  fr: "fr_FR",
  de: "de_DE",
};

/**
 * Sets document title, meta description, and meta keywords based on current language.
 * Ensures SEO terms like "Plan generator", "Goal analyzer", "Life coach" appear
 * in the user's language for discoverability.
 */
export function SeoHead() {
  const { t, language } = useLanguage();
  const location = useLocation();

  const pathname = normalizePathname(location.pathname);
  const isFrameworkPage = pathname.startsWith("/frameworks/");
  const isKnownPublicPage =
    pathname === "/" ||
    pathname === "/pricing" ||
    pathname === "/community" ||
    pathname === "/about" ||
    isFrameworkPage;
  const shouldIndex = isKnownPublicPage;

  const routeMeta = (() => {
    if (pathname === "/pricing") {
      return {
        title: `${t("pricing.title")} | ${SITE_NAME}`,
        description: t("pricing.subtitle"),
      };
    }

    if (pathname === "/community") {
      return {
        title: `${t("community.title")} | ${SITE_NAME}`,
        description: t("community.subtitle"),
      };
    }

    if (pathname === "/about") {
      return {
        title: `${t("about.title")} | ${SITE_NAME}`,
        description: t("about.tagline"),
      };
    }

    if (pathname === "/legal") {
      return {
        title: `Legal | ${SITE_NAME}`,
        description: "Legal and policy information for Vector.",
      };
    }

    if (pathname === "/wizard") {
      return {
        title: `Goal Planner Wizard | ${SITE_NAME}`,
        description: "Build a framework-based action plan with Vector.",
      };
    }

    if (pathname === "/community") {
      return {
        title: `${t("community.title")} | ${SITE_NAME}`,
        description: t("community.subtitle"),
      };
    }

    return {
      title: t("seo.title"),
      description: t("seo.description"),
    };
  })();

  const title = routeMeta.title;
  const description = routeMeta.description;
  const ogLocale = OG_LOCALE_MAP[language] || "en_US";
  const canonical = buildLocalizedUrl(pathname, shouldIndex ? language : "en");
  const alternates = shouldIndex ? buildLanguageAlternates(pathname) : [];
  const robots = shouldIndex
    ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
    : "noindex,nofollow";

  const structuredData =
    pathname === "/"
      ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              name: SITE_NAME,
              url: SITE_URL,
              logo: DEFAULT_OG_IMAGE,
              sameAs: [
                "https://github.com/Clercminator",
                "https://www.linkedin.com/in/david-clerc",
              ],
            },
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              url: SITE_URL,
              name: SITE_NAME,
              inLanguage: language,
              description,
            },
            {
              "@type": "SoftwareApplication",
              name: SITE_NAME,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: canonical,
              description,
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            },
          ],
        }
      : null;

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <link rel="canonical" href={canonical} />
      {alternates.map((alternate) => (
        <link
          key={alternate.hreflang}
          rel="alternate"
          hrefLang={alternate.hreflang}
          href={alternate.href}
        />
      ))}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={DEFAULT_OG_IMAGE} />
      <meta property="og:locale" content={ogLocale} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
      <html lang={language} />
      {structuredData ? (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      ) : null}
    </Helmet>
  );
}
