import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '@/app/components/language-provider';
import { TIER_CONFIGS, type TierId } from '@/lib/tiers';

export const PricingSection: React.FC<{ onSelectTier?: (tierName: string, tierId?: string) => void }> = ({ onSelectTier }) => {
  const { t } = useLanguage();

  const tierIds: TierId[] = ['architect', 'standard', 'max', 'enterprise'];
  const tiers = tierIds.map((id) => {
    const config = TIER_CONFIGS[id];
    const isFree = config.priceUsd === 0;
    const isCustom = config.priceUsd < 0;
    const priceStr = isFree ? '$0' : isCustom ? t('pricing.custom') || 'Custom' : `$${config.priceUsd}`;
    const nameKey = `pricing.tier.${id}`;
    const descKey = `pricing.tier.${id}.desc`;
    const ctaKey = id === 'architect' ? 'pricing.cta.start' : id === 'enterprise' ? 'pricing.cta.contact' : `pricing.cta.${id}`;
    
    const features: string[] =
      id === 'architect'
        ? [
            t('pricing.feature.architect.frameworks').replace('{0}', String(config.allowedFrameworks.length)),
            t('pricing.feature.architect.blueprints').replace('{0}', String(config.maxBlueprints)),
            t('pricing.feature.architect.credits').replace('{0}', String(config.credits)),
            t('pricing.feature.architect.ai'),
          ]
        : id === 'standard'
          ? [
              t('pricing.feature.standard.credits').replace('{0}', String(config.credits)),
              t('pricing.feature.standard.frameworks'),
              t('pricing.feature.standard.blueprints').replace('{0}', String(config.maxBlueprints)),
              t('pricing.feature.standard.ai'),
            ]
          : id === 'max'
            ? [
                t('pricing.feature.max.credits').replace('{0}', String(config.credits)),
                t('pricing.feature.max.frameworks'),
                t('pricing.feature.max.calendar'),
                t('pricing.feature.max.pdf'),
                t('pricing.feature.max.priority'),
                t('pricing.feature.max.blueprints').replace('{0}', String(config.maxBlueprints)),
              ]
            : [
                t('pricing.feature.enterprise.workspaces'),
                t('pricing.feature.enterprise.admin'),
                t('pricing.feature.enterprise.integration'),
                t('pricing.feature.enterprise.support'),
              ];
    return {
      id,
      name: t(nameKey),
      price: priceStr,
      description: t(descKey),
      features: features.filter(Boolean),
      cta: t(ctaKey),
      popular: id === 'max',
      color: id === 'architect' ? '#4285F4' : id === 'standard' ? '#34A853' : id === 'max' ? '#EA4335' : '#FBBC05',
      oneTime: !isFree && !isCustom,
    };
  });

  const handleCta = (tierName: string, tierId: string) => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4285F4', '#EA4335', '#FBBC05', '#34A853']
    });
    onSelectTier?.(tierName, tierId);
  };

  return (
    <section className="px-6 py-24 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-black dark:text-white">{t('pricing.title')}</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto">
          {t('pricing.subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {tiers.map((tier) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            className={`relative p-8 rounded-3xl border ${
              tier.popular ? 'border-black dark:border-white shadow-2xl scale-105 z-10' : 'border-gray-100 dark:border-zinc-800 shadow-sm'
            } bg-white dark:bg-zinc-900 flex flex-col`}
          >
            {tier.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full">
                {t('pricing.mostPopular')}
              </div>
            )}
            
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{tier.name}</h3>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{tier.price}</span>
                {tier.oneTime && <span className="text-gray-400 text-sm">({t('pricing.oneTime')})</span>}
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-4 leading-relaxed">{tier.description}</p>
            </div>

            <ul className="space-y-4 mb-8 flex-grow">
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <Check size={18} className="text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCta(tier.name, tier.id)}
              className={`w-full py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                tier.popular
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-xl shadow-black/20 dark:shadow-white/10'
                  : 'bg-gray-50 dark:bg-zinc-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700'
              }`}
            >
              {tier.cta}
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
