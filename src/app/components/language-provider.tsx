import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, SUPPORTED_LANGUAGES } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getBrowserLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en';
  const raw = navigator.language || (navigator as any).userLanguage || '';
  const code = raw.split(/[-_]/)[0].toLowerCase();
  const supported = SUPPORTED_LANGUAGES.map((x) => x.code);
  if (supported.includes(code as Language)) return code as Language;
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('vector.language') as Language | null;
    if (saved && Object.keys(translations).includes(saved)) return saved;
    return getBrowserLanguage();
  });

  useEffect(() => {
    const saved = localStorage.getItem('vector.language') as Language;
    if (saved && Object.keys(translations).includes(saved)) {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('vector.language', lang);
  };

  const t = (key: string): string => {
    const current = translations[language] ?? translations.en;
    const value = current?.[key];
    if (value != null && typeof value === 'string') return value;
    const en = translations.en as Record<string, string>;
    return en?.[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
