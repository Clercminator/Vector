import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/app/components/language-provider';

/** Maps app language codes to Open Graph locale format (language_TERRITORY) */
const OG_LOCALE_MAP: Record<string, string> = {
  en: 'en_US',
  es: 'es_ES',
  pt: 'pt_BR',
  fr: 'fr_FR',
  de: 'de_DE',
};

/**
 * Sets document title, meta description, and meta keywords based on current language.
 * Ensures SEO terms like "Plan generator", "Goal analyzer", "Life coach" appear
 * in the user's language for discoverability.
 */
export function SeoHead() {
  const { t, language } = useLanguage();

  const title = t('seo.title');
  const description = t('seo.description');
  const keywords = t('seo.keywords');
  const ogLocale = OG_LOCALE_MAP[language] || 'en_US';

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:locale" content={ogLocale} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <html lang={language} />
    </Helmet>
  );
}
