import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { SupportResource } from '@/lib/blueprints';
import { motion, AnimatePresence } from 'motion/react';
import { HeartHandshake, X, ExternalLink, Phone } from 'lucide-react';
import { useLanguage } from '@/app/components/language-provider';
import { cn } from '@/app/components/ui/utils';

export function SupportButton() {
  const { t } = useLanguage();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isWizard = location.pathname.startsWith('/wizard');
  const [resources, setResources] = useState<SupportResource[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && resources.length === 0) {
      setLoading(true);
      if (supabase) {
        supabase.from('support_resources').select('*').eq('enabled', true).order('country_code', { ascending: false })
          .then(({ data }) => {
            if (data) setResources(data);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }
  }, [isOpen, resources.length]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 left-6 md:bottom-8 md:left-8 z-40 bg-white dark:bg-zinc-900 text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-zinc-800 transition-colors group cursor-pointer flex items-center gap-2",
          isWizard && "hidden md:flex"
        )}
        title={t('support.title') || "Get Support"}
      >
        <HeartHandshake size={24} className="group-hover:scale-110 transition-transform" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap font-bold text-sm">
           {t('support.buttonLabel') || "Get Support"}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 md:p-6"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-full md:max-w-2xl bg-white dark:bg-zinc-900 md:rounded-3xl shadow-2xl z-[70] flex flex-col max-h-[100dvh] md:max-h-[85vh] overflow-hidden border border-gray-200 dark:border-zinc-800"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-3 text-rose-500">
                   <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-xl">
                      <HeartHandshake size={24} />
                   </div>
                   <h2 className="text-2xl font-black">{t('support.title') || "Support Resources"}</h2>
                </div>
                <button onClick={() => setIsOpen(false)} aria-label={t('common.close') || "Close"} className="p-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors text-gray-500 cursor-pointer">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-gray-50/50 dark:bg-zinc-900/50">
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                  {t('support.description') || "If you or someone you know is going through a tough time, please reach out. There is help available anonymously and confidentially."}
                </p>

                {loading ? (
                    <div className="py-12 flex justify-center">
                        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : resources.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white dark:bg-zinc-800 shadow-sm rounded-2xl border border-gray-100 dark:border-zinc-700">
                        {t('support.noResources') || "No active support resources found at the moment. In an emergency, please call your local emergency services."}
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {resources.map((resource) => (
                            <div key={resource.id} className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-5 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <h3 className="font-bold text-gray-900 dark:text-white text-lg">{resource.title}</h3>
                                          {resource.category && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded">
                                              {resource.category.replace('_', ' ')}
                                            </span>
                                          )}
                                        </div>
                                        {resource.description && (
                                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-5">{resource.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-3">
                                            {resource.phone && (
                                                <a href={`tel:${resource.phone}`} className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 text-white font-bold text-sm rounded-xl hover:bg-rose-600 transition-colors shadow-sm cursor-pointer">
                                                    <Phone size={16} /> {resource.phone}
                                                </a>
                                            )}
                                            {resource.url && (
                                                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 font-bold text-sm rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors cursor-pointer">
                                                    <ExternalLink size={16} /> {t('support.visitWebsite') || "Visit Website"}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    {resource.country_code && (
                                        <span className="text-xs font-bold uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 px-2 py-1 rounded-lg shrink-0">
                                            {resource.country_code}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
