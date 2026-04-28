import enTranslations from "./translations/en";

export type TranslationDictionary = Record<string, string>;
export type Language = "en" | "es" | "pt" | "fr" | "de";

export const DEFAULT_LANGUAGE: Language = "en";
export const SUPPORTED_LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
];

const supportedLanguageSet = new Set<Language>(
  SUPPORTED_LANGUAGES.map((language) => language.code),
);

const translationLoaders: Record<Language, () => Promise<TranslationDictionary>> = {
  en: async () => enTranslations,
  es: async () => (await import("./translations/es")).default,
  pt: async () => (await import("./translations/pt")).default,
  fr: async () => (await import("./translations/fr")).default,
  de: async () => (await import("./translations/de")).default,
};

const translationCache = new Map<Language, TranslationDictionary>([
  [DEFAULT_LANGUAGE, enTranslations],
]);

export const defaultTranslations = enTranslations;

export function isSupportedLanguage(
  value: string | null | undefined,
): value is Language {
  return Boolean(value && supportedLanguageSet.has(value as Language));
}

export function getCachedTranslations(
  language: Language,
): TranslationDictionary | null {
  return translationCache.get(language) ?? null;
}

export async function loadTranslations(
  language: Language,
): Promise<TranslationDictionary> {
  const cached = getCachedTranslations(language);
  if (cached) return cached;

  const translations = await translationLoaders[language]();
  translationCache.set(language, translations);
  return translations;
}
