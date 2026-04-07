import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import {
  translations,
  Language,
  SUPPORTED_LANGUAGES,
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
  if (pathLang && Object.keys(translations).includes(pathLang))
    return pathLang as Language;
  const params = new URLSearchParams(search);
  const lang = params.get("lang")?.toLowerCase();
  if (lang && Object.keys(translations).includes(lang)) return lang as Language;
  return null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [language, setLanguage] = useState<Language>(() => {
    const urlLang = getLanguageFromLocation(location.pathname, location.search);
    if (urlLang) return urlLang;
    const saved = localStorage.getItem("vector.language") as Language | null;
    if (saved && Object.keys(translations).includes(saved)) return saved;
    return getBrowserLanguage();
  });

  useEffect(() => {
    const urlLang = getLanguageFromLocation(location.pathname, location.search);
    if (urlLang) {
      setLanguage(urlLang);
      localStorage.setItem("vector.language", urlLang);
      return;
    }
    const saved = localStorage.getItem("vector.language") as Language;
    if (saved && Object.keys(translations).includes(saved)) {
      setLanguage(saved);
    }
  }, [location.pathname, location.search]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("vector.language", lang);
  };

  const t = (key: string): string => {
    const current = translations[language] ?? translations.en;
    const value = current?.[key];
    if (value != null && typeof value === "string") return value;
    const en = translations.en as Record<string, string>;
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
