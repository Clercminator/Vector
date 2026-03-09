import React, { useRef } from 'react';
import { motion } from 'motion/react'; // Keeping consistent with App.tsx
import { useNavigate } from 'react-router-dom';
import { FrameworkCard } from '@/app/components/FrameworkCard';
import { InspirationalQuote } from '@/app/components/InspirationalQuote';
import { HeroSubtitleChunks } from '@/app/components/HeroSubtitleChunks';
import { ArrowRight, Sparkles, Target, MessageSquare, Download, Gift } from 'lucide-react';
import { InspiredBySection } from '@/app/components/InspiredBySection';
import { useLanguage } from '@/app/components/language-provider';
import { frameworks, Framework } from '@/lib/frameworks';
import { canUseFramework, DEFAULT_TIER_ID, TierId } from '@/lib/tiers';
import { toast } from 'sonner';

interface LandingPageProps {
    onStartWizard: (fwId?: Framework) => void;
    onShowHelpChoose: () => void;
    /** Go directly to ChatUI (wizard with consultant, no framework modal) */
    onGoToChat?: () => void;
    /** Hero CTA: when not logged in opens auth modal, when logged in opens help-choose modal */
    onHeroGetStarted?: () => void;
    onViewFramework: (fw: typeof frameworks[0]) => void;
    tier: TierId;
    userId?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
    onStartWizard, 
    onShowHelpChoose, 
    onGoToChat,
    onHeroGetStarted, 
    onViewFramework, 
    tier: tierProp,
    userId 
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
            {/* Gift badge — corner of screen, only when not logged in */}
            {!userId && (
            <div className="fixed top-24 right-4 md:top-20 md:right-6 z-30">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/90 dark:bg-emerald-500/80 text-white shadow-lg border border-emerald-400/30 backdrop-blur-sm">
                    <Gift size={18} className="shrink-0" />
                    <span className="text-sm font-medium whitespace-nowrap">{t('landing.hero.giftBadge')}</span>
                </div>
            </div>
            )}

            {/* Hero Section */}
            <section className="px-6 pt-12 pb-16 md:pt-14 md:pb-20 text-center max-w-5xl md:max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <h1 className="text-6xl md:text-9xl font-bold tracking-tighter text-gray-900 mb-8 leading-[0.9]">
                        {t('landing.hero.architectYour')} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-red-500 to-yellow-500">{t('landing.hero.ambition')}</span>
                    </h1>

                    <HeroSubtitleChunks />
                    <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 font-light">
                        {t('landing.hero.pathHint')}
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <motion.button
                            onClick={onHeroGetStarted ?? onShowHelpChoose}
                            className="cursor-pointer group relative px-10 py-5 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-lg md:text-xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-2xl shadow-black/25 dark:shadow-white/10 border-2 border-transparent hover:border-gray-300 dark:hover:border-zinc-600 overflow-hidden"
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
                                <Sparkles size={24} className="text-amber-400 dark:text-amber-500 shrink-0" />
                                {t('landing.hero.helpMePlan')}
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform shrink-0" />
                            </motion.span>
                        </motion.button>
                        {onGoToChat && (
                            <motion.button
                                onClick={onGoToChat}
                                className="cursor-pointer px-8 py-4 rounded-2xl text-base md:text-lg font-semibold border-2 border-gray-300 dark:border-zinc-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 hover:border-gray-400 dark:hover:border-zinc-500 transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25, duration: 0.5 }}
                            >
                                {t('nav.getStarted')}
                            </motion.button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' })}
                        className="mt-8 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline underline-offset-2"
                    >
                        {t('landing.hero.newHere')}
                    </button>
                    <div className="mt-6">
                        <InspirationalQuote />
                    </div>
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
                        <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto mb-8">
                            {t('landing.howItWorks.subtitle')}
                        </p>
                        <div className="inline-block px-5 py-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100/80 dark:border-indigo-900/40 max-w-2xl mx-auto">
                            <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-1">{t('landing.whatIsVector.title')}</h3>
                            <p className="text-sm text-indigo-700/90 dark:text-indigo-300/90 leading-relaxed">{t('landing.whatIsVector.desc')}</p>
                        </div>
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
                    
                    <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 w-full">
                        {/* VS General LLMs Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 md:p-10 shadow-xl"
                        >
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                {t('landing.howItWorks.vsLLM.title')}
                            </h3>
                            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                {t('landing.howItWorks.vsLLM.desc')}
                            </p>
                        </motion.div>

                        {/* Examples Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl p-8 md:p-10 shadow-xl"
                        >
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                {t('landing.howItWorks.examples.title')}
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                        <span>{t('landing.howItWorks.examples.vague1')}</span>
                                    </div>
                                    <div className="flex gap-3 items-start">
                                        <ArrowRight className="text-indigo-500 shrink-0 mt-1" size={18} />
                                        <span className="text-gray-800 dark:text-gray-200 leading-relaxed">{t('landing.howItWorks.examples.actionable1')}</span>
                                    </div>
                                </div>
                                <div className="space-y-2 pt-4 border-t border-indigo-200/50 dark:border-indigo-800/30">
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                        <span>{t('landing.howItWorks.examples.vague2')}</span>
                                    </div>
                                    <div className="flex gap-3 items-start">
                                        <ArrowRight className="text-indigo-500 shrink-0 mt-1" size={18} />
                                        <span className="text-gray-800 dark:text-gray-200 leading-relaxed">{t('landing.howItWorks.examples.actionable2')}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* The Vector Advantage (Bento Box Section) */}
            <section className="px-6 py-20 md:py-32 bg-white dark:bg-black border-t border-gray-100 dark:border-zinc-900">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                            {t('landing.advantage.title')}
                        </h2>
                        <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto">
                            {t('landing.advantage.subtitle')}
                        </p>
                    </motion.div>

                    {/* Bento Box Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 auto-rows-[minmax(200px,auto)]">
                        
                        {/* Box 1: A Living Blueprint (Spans 2 columns) */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="md:col-span-2 group relative overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-[2rem] p-8 md:p-10 border border-indigo-100 dark:border-indigo-900/30 hover:shadow-2xl transition-all duration-500"
                        >
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 flex items-center justify-center shadow-lg mb-6 ring-1 ring-black/5 dark:ring-white/10 group-hover:scale-110 transition-transform duration-500">
                                    <Target className="text-indigo-600 dark:text-indigo-400" size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t('landing.advantage.livingPlan.title')}</h3>
                                    <p className="text-indigo-900/70 dark:text-indigo-200/70 text-lg leading-relaxed max-w-lg">{t('landing.advantage.livingPlan.desc')}</p>
                                </div>
                            </div>
                            <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform translate-x-1/4 translate-y-1/4">
                                <Target size={250} />
                            </div>
                        </motion.div>

                        {/* Box 2: Quality over Advice (1 col) */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="group relative overflow-hidden bg-black dark:bg-white rounded-[2rem] p-8 md:p-10 hover:shadow-2xl transition-all duration-500"
                        >
                            <div className="relative z-10 flex flex-col h-full justify-between text-white dark:text-black">
                                <div className="w-14 h-14 rounded-2xl bg-white/10 dark:bg-black/5 flex items-center justify-center backdrop-blur-sm mb-6 group-hover:rotate-12 transition-transform duration-500">
                                    <Sparkles className="text-amber-400 dark:text-amber-500" size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-3">{t('landing.advantage.quality.title')}</h3>
                                    <p className="text-white/70 dark:text-black/70 leading-relaxed text-base">{t('landing.advantage.quality.desc')}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Box 3: Built for Execution (1 col) */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="group relative overflow-hidden bg-white dark:bg-zinc-900 rounded-[2rem] p-8 md:p-10 border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-2xl hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all duration-500"
                        >
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-6 ring-1 ring-emerald-100 dark:ring-emerald-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                                    <Download className="text-emerald-600 dark:text-emerald-400" size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t('landing.advantage.execution.title')}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-base">{t('landing.advantage.execution.desc')}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Box 4: Zero Prompt Engineering (1 col) */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="group relative overflow-hidden bg-white dark:bg-zinc-900 rounded-[2rem] p-8 md:p-10 border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-2xl hover:border-violet-500/30 dark:hover:border-violet-500/30 transition-all duration-500"
                        >
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center mb-6 ring-1 ring-violet-100 dark:ring-violet-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                    <MessageSquare className="text-violet-600 dark:text-violet-400" size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t('landing.advantage.noPrompting.title')}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-base">{t('landing.advantage.noPrompting.desc')}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Box 5: Community Validated (1 col) */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="group relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-[2rem] p-8 md:p-10 border border-amber-100 dark:border-orange-900/30 hover:shadow-2xl transition-all duration-500"
                        >
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 flex items-center justify-center shadow-lg mb-6 ring-1 ring-black/5 dark:ring-white/10 group-hover:scale-110 transition-transform duration-500">
                                    <ArrowRight className="text-amber-600 dark:text-amber-500" size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t('landing.advantage.community.title')}</h3>
                                    <p className="text-amber-900/70 dark:text-amber-200/70 leading-relaxed text-base">{t('landing.advantage.community.desc')}</p>
                                </div>
                            </div>
                        </motion.div>

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
