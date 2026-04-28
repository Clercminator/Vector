import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import {
  defaultTranslations,
  getCachedTranslations,
  Language,
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
  loadTranslations,
  type TranslationDictionary,
} from "@/lib/translations";
import { getPathLanguage } from "@/lib/seo";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

function getBrowserLanguage(): Language {
  if (typeof navigator === "undefined") return "en";
  const raw = navigator.language || (navigator as any).userLanguage || "";
  const code = raw.split(/[-_]/)[0].toLowerCase();
  const supported = SUPPORTED_LANGUAGES.map((x) => x.code);
  if (supported.includes(code as Language)) return code as Language;
  return "en";
}

function getLanguageFromLocation(
  pathname: string,
  search: string,
): Language | null {
  const pathLang = getPathLanguage(pathname);
  if (isSupportedLanguage(pathLang)) return pathLang;
  const params = new URLSearchParams(search);
  const lang = params.get("lang")?.toLowerCase();
  if (isSupportedLanguage(lang)) return lang;
  return null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [language, setLanguage] = useState<Language>(() => {
    const urlLang = getLanguageFromLocation(location.pathname, location.search);
    if (urlLang) return urlLang;
    const saved = localStorage.getItem("vector.language") as Language | null;
    if (isSupportedLanguage(saved)) return saved;
    return getBrowserLanguage();
  });
  const [translationMap, setTranslationMap] = useState<TranslationDictionary>(
    () => getCachedTranslations(language) ?? defaultTranslations,
  );

  useEffect(() => {
    const urlLang = getLanguageFromLocation(location.pathname, location.search);
    if (urlLang) {
      setLanguage(urlLang);
      localStorage.setItem("vector.language", urlLang);
      return;
    }
    const saved = localStorage.getItem("vector.language") as Language;
    if (isSupportedLanguage(saved)) {
      setLanguage(saved);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const cachedTranslations = getCachedTranslations(language);
    if (cachedTranslations) {
      setTranslationMap(cachedTranslations);
      return;
    }

    let cancelled = false;
    setTranslationMap(defaultTranslations);

    void loadTranslations(language)
      .then((loadedTranslations) => {
        if (!cancelled) {
          setTranslationMap(loadedTranslations);
        }
      })
      .catch((error) => {
        console.error(`Failed to load translations for ${language}`, error);
        if (!cancelled) {
          setTranslationMap(defaultTranslations);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("vector.language", lang);
  };

  const t = (key: string): string => {
    const current = translationMap;
    const value = current?.[key];
    if (value != null && typeof value === "string") return value;
    const en = defaultTranslations;
    return en?.[key] ?? key;
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: handleSetLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
