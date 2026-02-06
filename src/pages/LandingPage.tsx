import React from 'react';
import { motion } from 'motion/react'; // Keeping consistent with App.tsx
import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button'; // Assuming this path is correct
import { FrameworkCard } from '@/app/components/FrameworkCard';
import { InspirationalQuote } from '@/app/components/InspirationalQuote';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/app/components/language-provider';
import { frameworks, Framework } from '@/lib/frameworks';
import { canUseFramework, TierId } from '@/lib/tiers';
import { toast } from 'sonner';

interface LandingPageProps {
    onStartWizard: (fwId?: Framework) => void;
    onShowHelpChoose: () => void;
    onViewFramework: (fw: typeof frameworks[0]) => void;
    tier: TierId;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
    onStartWizard, 
    onShowHelpChoose, 
    onViewFramework, 
    tier 
}) => {
    const { t } = useLanguage();
    const navigate = useNavigate();

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
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <button 
                            onClick={() => onStartWizard()}
                            className="group px-10 py-5 bg-black text-white rounded-full text-lg font-bold flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20"
                        >
                            {t('landing.hero.startBuilding')}
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button 
                            onClick={() => navigate('/pricing')}
                            className="px-10 py-5 bg-white border border-gray-200 text-gray-900 rounded-full text-lg font-bold hover:bg-gray-50 transition-colors"
                        >
                            {t('landing.hero.viewPricing')}
                        </button>
                    </div>
                </motion.div>
            </section>

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
                        <Button 
                            onClick={onShowHelpChoose}
                            variant="outline" 
                            className="gap-2 dark:text-white dark:border-zinc-700"
                        >
                            <Sparkles size={16} className="text-purple-500" />
                            {t('frameworks.helpMeChoose')}
                        </Button>
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
                                        toast.info("This framework is included in the Standard plan.", {
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
