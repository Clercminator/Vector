import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote } from 'lucide-react';
import { useLanguage } from '@/app/components/language-provider';

export function InspirationalQuote() {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);

  // Since translations might be loaded asynchronously or key-based, 
  // we can reconstruct the array on each render or use a memo.
  // Given we just have 6 quotes standardly indexed:
  const quotes = [1, 2, 3, 4, 5, 6].map(i => ({
    text: t(`quote.${i}.text`),
    author: t(`quote.${i}.author`)
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  return (
    <div className="flex justify-center my-0 md:my-8">
      <div className="relative w-full max-w-2xl px-4 py-3 md:px-8 md:py-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-2xl md:rounded-full border border-gray-100 dark:border-zinc-800 shadow-sm flex items-start md:items-center gap-3 md:gap-4">
        <Quote className="text-gray-300 dark:text-zinc-700 shrink-0 mt-0.5 md:mt-0" size={18} />
        <div className="min-h-[3rem] md:h-12 flex items-center overflow-hidden relative flex-1 py-1">
           <AnimatePresence mode="wait">
             <motion.div
               key={index}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.5 }}
               className="text-left md:text-center w-full"
             >
               <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
                 &quot;{quotes[index].text}&quot; <span className="text-gray-400 dark:text-zinc-600">— {quotes[index].author}</span>
               </p>
             </motion.div>
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
