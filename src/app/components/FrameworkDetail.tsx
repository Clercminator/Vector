import React from 'react';
import { motion } from 'motion/react';
import { X, Check, X as XIcon, Quote, User } from 'lucide-react';
import { Button } from '@/app/components/ui/button'; // Assuming we have this or use standard button

interface FrameworkDetailProps {
  framework: any; // Using any for simplicity as framework type is in App.tsx, but ideally should be shared
  onClose: () => void;
  onStart: () => void;
}

import { useLanguage } from '@/app/components/language-provider';

// ... interface

export function FrameworkDetail({ framework, onClose, onStart }: FrameworkDetailProps) {
  const { t } = useLanguage();
  if (!framework) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-zinc-800 rounded-full transition-colors z-10 text-black dark:text-white"
        >
          <X size={20} />
        </button>

        <div className="relative h-32 overflow-hidden shrink-0" style={{ backgroundColor: framework.color }}>
           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent" />
           <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        </div>

        <div className="px-8 pt-0 pb-8 overflow-y-auto custom-scrollbar">
          <div className="-mt-12 mb-6">
            <div className="w-24 h-24 bg-white dark:bg-zinc-800 rounded-3xl flex items-center justify-center shadow-lg mx-auto md:mx-0">
               <framework.icon size={40} style={{ color: framework.color }} />
            </div>
          </div>

          {/* Title and Author are updated by App.tsx injection, but we need to ensure styling is correct */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{framework.title}</h2>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-6 text-sm font-medium">
            <User size={16} />
            <span>{framework.author}</span>
          </div>

          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                {t('common.about') || "What is it?"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                {framework.definition}
              </p>
            </section>

            <div className="grid md:grid-cols-2 gap-6">
              <section className="bg-green-50/50 dark:bg-green-900/10 p-5 rounded-2xl border border-green-100 dark:border-green-900/30">
                <h3 className="text-sm font-bold text-green-800 dark:text-green-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Check size={16} /> {t('common.pros') || "Pros"}
                </h3>
                <ul className="space-y-2">
                  {framework.pros.map((pro: string, i: number) => (
                    <li key={i} className="text-green-900 dark:text-green-300 text-sm flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 bg-green-500 rounded-full shrink-0" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-red-50/50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/30">
                <h3 className="text-sm font-bold text-red-800 dark:text-red-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <XIcon size={16} /> {t('common.cons') || "Cons"}
                </h3>
                <ul className="space-y-2">
                  {framework.cons.map((con: string, i: number) => (
                    <li key={i} className="text-red-900 dark:text-red-300 text-sm flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 bg-red-500 rounded-full shrink-0" />
                      {con}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="bg-gray-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-gray-100 dark:border-zinc-700">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                <Quote size={14} /> {t('common.example') || "Example"}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 italic font-medium">
                "{framework.example}"
              </p>
            </section>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900 flex gap-4 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          >
            {t('common.close')}
          </button>
          <button
            onClick={onStart}
            className="flex-[2] py-3 px-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10"
          >
            {t('common.use') || "Use this framework"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
