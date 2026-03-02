import React, { useRef } from 'react';
import { motion } from 'motion/react'; // Keeping consistent with App.tsx
import { useNavigate } from 'react-router-dom';
import { FrameworkCard } from '@/app/components/FrameworkCard';
import { InspirationalQuote } from '@/app/components/InspirationalQuote';
import { ArrowRight, Sparkles, Target, MessageSquare, Download } from 'lucide-react';
import { InspiredBySection } from '@/app/components/InspiredBySection';
import { useLanguage } from '@/app/components/language-provider';
import { frameworks, Framework } from '@/lib/frameworks';
import { canUseFramework, DEFAULT_TIER_ID, TierId } from '@/lib/tiers';
import { toast } from 'sonner';

interface LandingPageProps {
    onStartWizard: (fwId?: Framework) => void;
    onShowHelpChoose: () => void;
    /** Hero CTA: when not logged in opens auth modal, when logged in opens help-choose modal */
    onHeroGetStarted?: () => void;
    onViewFramework: (fw: typeof frameworks[0]) => void;
    tier: TierId;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
    onStartWizard, 
    onShowHelpChoose, 
    onHeroGetStarted, 
    onViewFramework, 
    tier: tierProp 
}) => {
    const { t } = useLanguage();
    const tier = tierProp ?? DEFAULT_TIER_ID;
    const navigate = useNavigate();
    const howItWorksRef = useRef<HTMLElement>(null);

    // Dynamic frameworks list with translation
    const frameworksList = frameworks.map(f => ({
        ...f,
        title: t(`fw.${f.id}.title`) || f.title,
        description: t(`fw.${f.id}.desc`) || f.description,
        definition: t(`fw.${f.id}.definition`) || f.definition,
        example: t(`fw.${f.id}.example`) || f.example,
        pros: [0, 1, 2].map(i => t(`fw.${f.id}.pros.${i}`)).filter(Boolean).length > 0 
              ? [0, 1, 2].map(i => t(`fw.${f.id}.pros.${i}`)) 
              : f.pros,
        cons: [0, 1, 2].map(i => t(`fw.${f.id}.cons.${i}`)).filter(Boolean).length > 0
              ? [0, 1, 2].map(i => t(`fw.${f.id}.cons.${i}`)) 
              : f.cons,
    }));

    return (
        <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10"
        >
            {/* Hero Section */}
            <section className="px-6 pt-24 pb-32 md:pt-20 md:pb-48 text-center max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <h1 className="text-6xl md:text-9xl font-bold tracking-tighter text-gray-900 mb-8 leading-[0.9]">
                        {t('landing.hero.architectYour')} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-red-500 to-yellow-500">{t('landing.hero.ambition')}</span>
                    </h1>
                    
                    <InspirationalQuote />

                    <p className="text-xl md:text-2xl text-gray-500 font-light max-w-2xl mx-auto mb-12 leading-relaxed">
                        {t('landing.hero.subtitle')}
                    </p>
                    <div className="flex justify-center">
                        <motion.button
                            onClick={onHeroGetStarted ?? onShowHelpChoose}
                            className="cursor-pointer group relative px-12 py-6 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-xl md:text-2xl font-bold flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-2xl shadow-black/25 dark:shadow-white/10 border-2 border-transparent hover:border-gray-300 dark:hover:border-zinc-600 overflow-hidden"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <motion.span
                                className="relative flex items-center gap-3"
                                animate={{ x: [0, 4, 0] }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                            >
                                <Sparkles size={28} className="text-amber-400 dark:text-amber-500 shrink-0" />
                                {t('landing.hero.helpMePlan')}
                                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform shrink-0" />
                            </motion.span>
                        </motion.button>
                    </div>
                    <button
                        type="button"
                        onClick={() => howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' })}
                        className="mt-8 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline underline-offset-2"
                    >
                        {t('landing.hero.newHere')}
                    </button>
                </motion.div>
            </section>

            {/* How it works — value prop & steps (same speckled background as "Elige tu método") */}
            <section
                ref={howItWorksRef}
                className="px-6 py-16 md:py-20 border-t border-gray-100 dark:border-zinc-800/80 bg-gray-50/30 dark:bg-zinc-900/30 backdrop-blur-sm"
            >
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
                            {t('landing.howItWorks.title')}
                        </h2>
                        <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto">
                            {t('landing.howItWorks.subtitle')}
                        </p>
                    </motion.div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {[
                            { Icon: Target, titleKey: 'landing.howItWorks.step1.title', descKey: 'landing.howItWorks.step1.desc', color: 'text-blue-500', step: 1 },
                            { Icon: Sparkles, titleKey: 'landing.howItWorks.step2.title', descKey: 'landing.howItWorks.step2.desc', color: 'text-amber-500', step: 2 },
                            { Icon: MessageSquare, titleKey: 'landing.howItWorks.step3.title', descKey: 'landing.howItWorks.step3.desc', color: 'text-emerald-500', step: 3 },
                            { Icon: Download, titleKey: 'landing.howItWorks.step4.title', descKey: 'landing.howItWorks.step4.desc', color: 'text-violet-500 dark:text-violet-400', step: 4 },
                        ].map(({ Icon, titleKey, descKey, color, step }, i) => {
                            const hoverRing = step === 1 ? 'hover:shadow-blue-500/15 hover:ring-blue-500/25 dark:hover:shadow-blue-400/10 dark:hover:ring-blue-400/20' :
                                step === 2 ? 'hover:shadow-amber-500/15 hover:ring-amber-500/25 dark:hover:shadow-amber-400/10 dark:hover:ring-amber-400/20' :
                                step === 3 ? 'hover:shadow-emerald-500/15 hover:ring-emerald-500/25 dark:hover:shadow-emerald-400/10 dark:hover:ring-emerald-400/20' :
                                'hover:shadow-violet-500/15 hover:ring-violet-500/25 dark:hover:shadow-violet-400/10 dark:hover:ring-violet-400/20';
                            return (
                                <motion.div
                                    key={titleKey}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-30px' }}
                                    transition={{ duration: 0.4, delay: i * 0.08 }}
                                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                    className={`group relative p-6 rounded-2xl bg-gray-50/90 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800/80 text-left overflow-hidden transition-all duration-300 hover:shadow-xl hover:ring-2 ${hoverRing}`}
                                >
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5" />
                                    <div className="relative">
                                        <motion.div
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color} bg-current/10 ring-1 ring-current/10 group-hover:ring-current/20 transition-all duration-300`}
                                            whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0] }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                        >
                                            <Icon size={22} className={color} strokeWidth={2} />
                                        </motion.div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5">{t(titleKey)}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t(descKey)}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Inspired by — thought leaders behind the frameworks */}
            <InspiredBySection />

            {/* Frameworks Section */}
            <section className="px-6 py-24 bg-gray-50/30 dark:bg-zinc-900/30 backdrop-blur-sm border-t border-gray-100 dark:border-zinc-800">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                        <div className="max-w-2xl">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-black dark:text-white">{t('frameworks.title')}</h2>
                            <p className="text-lg text-gray-500 dark:text-gray-400 font-light">
                                {t('frameworks.subtitle')}
                            </p>
                        </div>
                        <motion.button
                            onClick={onShowHelpChoose}
                            className="group flex items-center gap-3 px-8 py-5 rounded-2xl text-lg font-semibold border-2 border-purple-500/50 dark:border-purple-400/50 bg-purple-500/10 dark:bg-purple-400/10 text-gray-900 dark:text-white hover:bg-purple-500/20 dark:hover:bg-purple-400/20 hover:border-purple-500 dark:hover:border-purple-400 transition-colors shadow-lg hover:shadow-purple-500/20 cursor-pointer"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <motion.span
                                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                            >
                                <Sparkles size={22} className="text-purple-500 dark:text-purple-400" />
                            </motion.span>
                            {t('frameworks.helpMeChoose')}
                            <ArrowRight size={20} className="opacity-70 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {frameworksList.map((fw) => (
                            <FrameworkCard
                                key={fw.id}
                                {...fw}
                                title={t(`fw.${fw.id}.title`) || fw.title}
                                description={t(`fw.${fw.id}.desc`) || fw.description} 
                                onClick={() => {
                                    if (!canUseFramework(tier, fw.id)) {
                                        toast.info(t('wizard.lockedError'), {
                                            action: {
                                                label: t('nav.pricing'),
                                                onClick: () => navigate('/pricing')
                                            },
                                            duration: 4000
                                        });
                                        return;
                                    }
                                    onStartWizard(fw.id);
                                }}
                                onLearnMore={() => onViewFramework(fw)}
                                isLocked={!canUseFramework(tier, fw.id)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Experience Liftoff Footer-like Section */}
            <section className="px-6 py-40 text-center overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                >
                    <p className="text-xl md:text-2xl font-light text-gray-400 mb-6 uppercase tracking-[0.4em]">{t('footer.liftoff')}</p>
                    <p className="text-5xl md:text-8xl font-bold tracking-tighter text-gray-900 dark:text-white">
                        {t('landing.liftoff.vector')}
                    </p>
                </motion.div>
            </section>
        </motion.div>
    );
};
