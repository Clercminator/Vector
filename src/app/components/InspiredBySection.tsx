import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useLanguage } from '@/app/components/language-provider';
import { FEATURED_AUTHORS, getAuthorInitials, AUTHOR_IMAGE_EXTENSIONS } from '@/lib/featuredAuthors';

export function InspiredBySection() {
  const { t } = useLanguage();
  /** Per-author index into AUTHOR_IMAGE_EXTENSIONS; when >= length, show initials */
  const [formatIndex, setFormatIndex] = useState<Record<string, number>>({});
  const [activeAuthor, setActiveAuthor] = useState<typeof FEATURED_AUTHORS[0] | null>(null);

  const handleImageError = (slug: string) => {
    setFormatIndex((prev) => {
      const next = (prev[slug] ?? 0) + 1;
      return { ...prev, [slug]: next };
    });
  };

  const getAuthorImageData = (author: typeof FEATURED_AUTHORS[0]) => {
    const idx = formatIndex[author.slug] ?? 0;
    const useCustomFile = !!author.imageFile;
    const showFallback = useCustomFile
      ? (formatIndex[author.slug] ?? 0) >= 1
      : idx >= AUTHOR_IMAGE_EXTENSIONS.length;
    const ext = AUTHOR_IMAGE_EXTENSIONS[idx];
    const src = useCustomFile
      ? `/images/authors/${encodeURIComponent(author.imageFile!)}`
      : `/images/authors/${author.slug}.${ext}`;
    return { showFallback, src };
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
            const { showFallback, src } = getAuthorImageData(author);
            return (
              <motion.div
                key={author.slug}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="flex flex-col items-center text-center group cursor-pointer"
                onClick={() => setActiveAuthor(author)}
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-gray-200/80 dark:ring-zinc-700/80 group-hover:ring-gray-300 dark:group-hover:ring-zinc-600 transition-all group-hover:scale-105">
                  {!showFallback ? (
                    <img
                      src={src}
                      alt={author.name}
                      width={96}
                      height={96}
                      loading="lazy"
                      decoding="async"
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

      <AnimatePresence>
        {activeAuthor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setActiveAuthor(null)}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800"
            >
              <button
                onClick={() => setActiveAuthor(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X size={20} />
              </button>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 ring-4 ring-gray-50 dark:ring-zinc-800/50 mb-6">
                  {!getAuthorImageData(activeAuthor).showFallback ? (
                    <img
                      src={getAuthorImageData(activeAuthor).src}
                      alt={activeAuthor.name}
                      width={96}
                      height={96}
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(activeAuthor.slug)}
                    />
                  ) : (
                    <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                      {getAuthorInitials(activeAuthor.name)}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {activeAuthor.name}
                </h3>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-6">
                  {t(activeAuthor.taglineKey)}
                </p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                  {t(activeAuthor.achievementKey)}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
