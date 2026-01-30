import React from 'react';
import { motion } from 'motion/react';
import { Check, Rocket } from 'lucide-react';
import confetti from 'canvas-confetti';

const tiers = [
  {
    name: 'Architect',
    price: '$0',
    description: 'Perfect for exploring fundamental frameworks.',
    features: [
      'Access to 3 standard frameworks',
      'Save up to 5 goal blueprints',
      'Dynamic particle background',
      'Basic AI assistant',
    ],
    cta: 'Get Started',
    popular: false,
    color: '#4285F4',
  },
  {
    name: 'Master Builder',
    price: '$19',
    description: 'Advanced tools for serious high-performers.',
    features: [
      'Unlimited goal blueprints',
      'Complex frameworks (OKRs, Eisenhower)',
      'Calendar exports (Google/Outlook)',
      'High-priority AI reasoning',
      'Strategic roadmap visualization',
    ],
    cta: 'Go Pro',
    popular: true,
    color: '#EA4335',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Scale organizational goals with team-wide alignment.',
    features: [
      'Team shared workspaces',
      'Admin dashboard & analytics',
      'Custom framework integration',
      'Dedicated support architect',
    ],
    cta: 'Contact Sales',
    popular: false,
    color: '#FBBC05',
  },
];

import { useLanguage } from '@/app/components/language-provider';

export const PricingSection: React.FC<{ onSelectTier?: (tierName: string) => void }> = ({ onSelectTier }) => {
  const { t } = useLanguage();

  const tiers = [
    {
      name: t('pricing.tier.architect'),
      price: '$0',
      description: t('pricing.tier.architect.desc'),
      features: [
        'Access to 3 standard frameworks',
        'Save up to 5 goal blueprints',
        'Dynamic particle background',
        'Basic AI assistant',
      ],
      cta: t('pricing.cta.start'),
      popular: false,
      color: '#4285F4',
    },
    {
      name: t('pricing.tier.master'),
      price: '$19',
      description: t('pricing.tier.master.desc'),
      features: [
        'Unlimited goal blueprints',
        'Complex frameworks (OKRs, Eisenhower)',
        'Calendar exports (Google/Outlook)',
        'High-priority AI reasoning',
        'Strategic roadmap visualization',
      ],
      cta: t('pricing.cta.pro'),
      popular: true,
      color: '#EA4335',
    },
    {
      name: t('pricing.tier.enterprise'),
      price: 'Custom',
      description: t('pricing.tier.enterprise.desc'),
      features: [
        'Team shared workspaces',
        'Admin dashboard & analytics',
        'Custom framework integration',
        'Dedicated support architect',
      ],
      cta: t('pricing.cta.contact'),
      popular: false,
      color: '#FBBC05',
    },
  ];

  const handleCta = (tierName: string) => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4285F4', '#EA4335', '#FBBC05', '#34A853']
    });
    onSelectTier?.(tierName);
  };

  return (
    <section className="px-6 py-24 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-black dark:text-white">{t('pricing.title')}</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto">
          {t('pricing.subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
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
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{tier.price}</span>
                {tier.price !== 'Custom' && <span className="text-gray-400">/mo</span>}
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
              onClick={() => handleCta(tier.name)}
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
