import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Linkedin, User } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useLanguage } from '@/app/components/language-provider';
import { InspiredBySection } from '@/app/components/InspiredBySection';

const FOUNDER_LINKEDIN = 'https://www.linkedin.com/in/david-clerc';

export function AboutPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [founderImgError, setFounderImgError] = React.useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-50 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-8 gap-2 pl-0 hover:bg-transparent hover:text-gray-600 dark:hover:text-gray-300"
        >
          <ArrowLeft size={20} />
          {t('common.back')}
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-16"
        >
          <header className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-black dark:text-white mb-3">
              {t('about.title')}
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 font-light">
              {t('about.tagline')}
            </p>
          </header>

          <section>
            <h2 className="text-xl font-bold text-black dark:text-white mb-4">
              {t('about.purpose.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('about.purpose.body')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black dark:text-white mb-4">
              {t('about.vsLLM.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('about.vsLLM.body')}
            </p>
          </section>

          {/* Thought leaders whose frameworks power Vector */}
          <section className="border-t border-gray-100 dark:border-zinc-800 pt-12">
            <InspiredBySection />
          </section>

          {/* Founder / author credibility: face, name, role, LinkedIn */}
          <section className="border-t border-gray-100 dark:border-zinc-800 pt-12">
            <h2 className="text-xl font-bold text-black dark:text-white mb-6">
              {t('about.founder.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
              {t('about.founder.body')}
            </p>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                {/* Add your photo at public/about/david-clerc.jpg to show it here */}
                {!founderImgError ? (
                  <img
                    src="/about/david-clerc.jpg"
                    alt={t('about.founder.name')}
                    className="w-full h-full object-cover"
                    onError={() => setFounderImgError(true)}
                  />
                ) : (
                  <User size={40} className="text-gray-400 dark:text-gray-500" aria-hidden />
                )}
              </div>
              <div>
                <p className="font-bold text-lg text-black dark:text-white">{t('about.founder.name')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('about.founder.role')}</p>
                <a
                  href={FOUNDER_LINKEDIN}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Linkedin size={18} />
                  {t('about.founder.linkedin')}
                </a>
              </div>
            </div>
          </section>

          {/* Video placeholder — not ready yet */}
          <section className="border-t border-gray-100 dark:border-zinc-800 pt-12">
            <h2 className="text-xl font-bold text-black dark:text-white mb-4">
              {t('about.video.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              {t('about.video.body')}
            </p>
            <div className="aspect-video rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-gray-500 font-medium">
              {t('about.video.comingSoon')}
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
