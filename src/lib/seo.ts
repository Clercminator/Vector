export const SITE_URL = "https://vectorplan.xyz";
export const SITE_NAME = "Vector";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/Logos/og-image.png`;

export const SUPPORTED_SEO_LANGUAGES = ["en", "es", "pt", "fr", "de"] as const;

export type SeoLanguage = (typeof SUPPORTED_SEO_LANGUAGES)[number];

export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  const normalized = pathname.replace(/\/+$/, "");
  return normalized || "/";
}

export function buildLocalizedUrl(
  pathname: string,
  language: SeoLanguage,
): string {
  const url = new URL(normalizePathname(pathname), SITE_URL);
  if (language !== "en") {
    url.searchParams.set("lang", language);
  }
  return url.toString();
}

export function buildLanguageAlternates(pathname: string) {
  const normalizedPath = normalizePathname(pathname);

  return [
    ...SUPPORTED_SEO_LANGUAGES.map((language) => ({
      hreflang: language,
      href: buildLocalizedUrl(normalizedPath, language),
    })),
    {
      hreflang: "x-default",
      href: buildLocalizedUrl(normalizedPath, "en"),
    },
  ];
}
