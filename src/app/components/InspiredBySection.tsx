import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '@/app/components/language-provider';
import { FEATURED_AUTHORS, getAuthorInitials, AUTHOR_IMAGE_EXTENSIONS } from '@/lib/featuredAuthors';

export function InspiredBySection() {
  const { t } = useLanguage();
  /** Per-author index into AUTHOR_IMAGE_EXTENSIONS; when >= length, show initials */
  const [formatIndex, setFormatIndex] = useState<Record<string, number>>({});

  const handleImageError = (slug: string) => {
    setFormatIndex((prev) => {
      const next = (prev[slug] ?? 0) + 1;
      return { ...prev, [slug]: next };
    });
  };

  return (
    <section className="px-6 py-16 md:py-20 border-t border-gray-100 dark:border-zinc-800/80">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            {t('landing.inspiredBy.title')}
          </h2>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto">
            {t('landing.inspiredBy.subtitle')}
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          {FEATURED_AUTHORS.map((author, i) => {
            const idx = formatIndex[author.slug] ?? 0;
            const useCustomFile = !!author.imageFile;
            const showFallback = useCustomFile
              ? (formatIndex[author.slug] ?? 0) >= 1
              : idx >= AUTHOR_IMAGE_EXTENSIONS.length;
            const ext = AUTHOR_IMAGE_EXTENSIONS[idx];
            const src = useCustomFile
              ? `/images/authors/${encodeURIComponent(author.imageFile!)}`
              : `/images/authors/${author.slug}.${ext}`;
            return (
              <motion.div
                key={author.slug}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-gray-200/80 dark:ring-zinc-700/80 group-hover:ring-gray-300 dark:group-hover:ring-zinc-600 transition-all">
                  {!showFallback ? (
                    <img
                      src={src}
                      alt={author.name}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(author.slug)}
                    />
                  ) : (
                    <span className="text-xl md:text-2xl font-bold text-gray-400 dark:text-gray-500">
                      {getAuthorInitials(author.name)}
                    </span>
                  )}
                </div>
                <p className="mt-3 font-semibold text-gray-900 dark:text-white text-sm md:text-base">
                  {author.name}
                </p>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  {t(author.taglineKey)}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
