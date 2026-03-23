import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/app/components/language-provider';
import { useIsMobileSync } from '@/app/components/ui/use-mobile';

const CHUNK_COUNT = 6;
const INTERVAL_MS = 5000;

export function HeroSubtitleChunks() {
  const { t } = useLanguage();
  const isMobile = useIsMobileSync();
  const crossMs = isMobile ? 0.22 : 0.4;
  const [index, setIndex] = useState(0);

  const chunks = [1, 2, 3, 4, 5, 6].map((i) => t(`landing.hero.subtitleChunk.${i}`));

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % CHUNK_COUNT);
    }, INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center min-h-[6.5rem] md:min-h-[5rem] overflow-hidden relative mb-8">
      <div className="w-full flex justify-center items-center overflow-hidden relative min-h-[6.5rem] md:min-h-[5rem]">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: isMobile ? 10 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isMobile ? -10 : -16 }}
            transition={{ duration: crossMs }}
            className="text-xl md:text-2xl text-gray-500 font-light max-w-4xl mx-auto leading-relaxed text-center absolute inset-x-0 px-2"
          >
            {chunks[index]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-2 mt-4" aria-hidden="true">
        <span className="text-xs text-gray-400 tabular-nums">
          {index + 1} / {CHUNK_COUNT}
        </span>
        <div className="flex gap-1.5">
          {chunks.map((_, i) => (
            <span
              key={i}
              className={`block w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === index
                  ? 'bg-gray-500 dark:bg-gray-400 scale-125'
                  : i < index
                    ? 'bg-gray-300 dark:bg-gray-600'
                    : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
