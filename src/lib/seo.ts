export const SITE_URL = "https://vectorplan.xyz";
export const SITE_NAME = "Vector";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/Logos/og-image.png`;

export const SUPPORTED_SEO_LANGUAGES = ["en", "es", "pt", "fr", "de"] as const;

export type SeoLanguage = (typeof SUPPORTED_SEO_LANGUAGES)[number];

export function isSeoLanguage(value: string): value is SeoLanguage {
  return SUPPORTED_SEO_LANGUAGES.includes(value as SeoLanguage);
}

export function getPathLanguage(pathname: string): SeoLanguage | null {
  const [firstSegment] = pathname.split("/").filter(Boolean);
  return firstSegment && isSeoLanguage(firstSegment) ? firstSegment : null;
}

export function stripLocalePrefix(pathname: string): string {
  if (!pathname || pathname === "/") return "/";

  const trimmed = pathname.replace(/\/+$/, "") || "/";
  const segments = trimmed.split("/").filter(Boolean);

  if (segments.length === 0) {
    return "/";
  }

  const [firstSegment, ...rest] = segments;

  if (!isSeoLanguage(firstSegment)) {
    return trimmed;
  }

  return rest.length === 0 ? "/" : `/${rest.join("/")}`;
}

export function normalizePathname(pathname: string): string {
  const stripped = stripLocalePrefix(pathname);
  if (!stripped || stripped === "/") return "/";
  const normalized = stripped.replace(/\/+$/, "");
  return normalized || "/";
}

export function isLocalizedPublicPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);

  return (
    normalized === "/" ||
    normalized === "/guides" ||
    normalized === "/pricing" ||
    normalized === "/about" ||
    normalized.startsWith("/frameworks/") ||
    normalized.startsWith("/articles/")
  );
}

export function buildLocalizedPath(
  pathname: string,
  language: SeoLanguage,
): string {
  const normalized = normalizePathname(pathname);

  if (!isLocalizedPublicPath(normalized)) {
    return normalized;
  }

  if (language === "en") {
    return normalized;
  }

  return normalized === "/" ? `/${language}` : `/${language}${normalized}`;
}

export function buildLocalizedUrl(
  pathname: string,
  language: SeoLanguage,
): string {
  return new URL(buildLocalizedPath(pathname, language), SITE_URL).toString();
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
