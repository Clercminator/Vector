import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Check, ArrowRight, Lightbulb, Calendar, Save } from 'lucide-react';
import { Button } from '@/app/components/ui/button'; // Assuming button exists, else standard html button

interface OnboardingModalProps {
  onComplete: () => void;
}

import { useLanguage } from '@/app/components/language-provider';

// ... interface

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useLanguage();

  const steps = [
    {
      id: 'welcome',
      title: t('onboarding.welcome.title'),
      description: t('onboarding.welcome.desc'),
      icon: Rocket,
    },
    {
      id: 'frameworks',
      title: t('onboarding.step1.title'),
      description: t('onboarding.step1.desc'),
      icon: Lightbulb,
    },
    {
      id: 'tips',
      title: t('onboarding.step3.title'),
      description: t('onboarding.step3.desc'),
      icon: Calendar,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onComplete, 300); // Wait for exit animation
  };

  if (!isOpen) return null;

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        <div className="p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-black/20 dark:shadow-white/10">
            <StepIcon size={32} />
          </div>
          
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
            {steps[currentStep].title}
          </h2>
          
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed max-w-sm">
            {steps[currentStep].description}
          </p>

          <div className="flex items-center gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep ? 'w-8 bg-black dark:bg-white' : 'w-2 bg-gray-200 dark:bg-zinc-800'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-4 w-full">
            <button
              onClick={handleClose}
              className="flex-1 py-3 px-6 text-gray-500 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              {t('onboarding.skip')}
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-3 px-6 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {currentStep === steps.length - 1 ? t('nav.getStarted') : t('onboarding.btn.next')}
              {currentStep === steps.length - 1 ? <Rocket size={18} /> : <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
