import React, { useEffect, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ParticleBackground } from '@/app/components/ParticleBackground';
import { FrameworkCard } from '@/app/components/FrameworkCard';
import { Toaster } from '@/app/components/ui/sonner';
import { AuthModal } from '@/app/components/AuthModal';
import { Rocket, Brain, Layers, Target, ChevronRight, Menu, X, ArrowRight, WifiOff } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { Blueprint, loadLocalBlueprints, saveLocalBlueprints, upsertBlueprint, removeBlueprint } from '@/lib/blueprints';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

import { useLanguage } from '@/app/components/language-provider';
import { ShareButton } from '@/app/components/ShareButton';
import { LanguageToggle } from '@/app/components/language-toggle';
import { ThemeToggle } from '@/app/components/theme-toggle';
import { InspirationalQuote } from '@/app/components/InspirationalQuote';
import { FrameworkDetail } from '@/app/components/FrameworkDetail';
import { OnboardingModal } from '@/app/components/OnboardingModal';

// Lazy load screens
const GoalWizard = React.lazy(() => import('@/app/components/GoalWizard').then(module => ({ default: module.GoalWizard })));
const PricingSection = React.lazy(() => import('@/app/components/PricingSection').then(module => ({ default: module.PricingSection })));
const Dashboard = React.lazy(() => import('@/app/components/Dashboard').then(module => ({ default: module.Dashboard })));
const Community = React.lazy(() => import('@/app/components/Community').then(module => ({ default: module.Community })));
const Profile = React.lazy(() => import('@/app/components/Profile').then(module => ({ default: module.Profile })));

type Framework = 'first-principles' | 'pareto' | 'rpm' | 'eisenhower' | 'okr';

const frameworks = [
  {
    id: 'first-principles' as Framework,
    title: 'Elon Musk First Principles',
    description: 'Break down complex problems into basic elements and then reassemble them from the ground up.',
    icon: Brain,
    color: '#4285F4', // Blue
    author: 'Elon Musk / Aristotle',
    definition: 'A problem-solving mental model that involves breaking a problem down into its basic elements (fundamental truths) and then reassembling them from the ground up, rather than reasoning by analogy.',
    pros: ['Encourages innovation', 'Removes assumptions', 'Creates unique solutions'],
    cons: ['Time-consuming', 'Mentally taxing', 'Requires deep understanding'],
    example: 'SpaceX lowered rocket costs by calculating the raw material cost of a rocket instead of buying pre-assembled parts.'
  },
  {
    id: 'pareto' as Framework,
    title: 'Pareto Principle (80/20)',
    description: 'Identify the 20% of efforts that lead to 80% of your results to achieve radical efficiency.',
    icon: Layers,
    color: '#34A853', // Green
    author: 'Vilfredo Pareto',
    definition: 'The concept that for many outcomes, roughly 80% of consequences come from 20% of causes.',
    pros: ['Increases efficiency', 'Focuses resources', 'Simple to apply'],
    cons: ['Oversimplifies complex systems', '80/20 ratio is an estimate', 'May ignore small but crucial details'],
    example: 'A software company fixes the top 20% of reported bugs to solve 80% of user crashes.'
  },
  {
    id: 'rpm' as Framework,
    title: 'Tony Robbins RPM',
    description: 'A results-focused planning system: Result, Purpose, and Massive Action Plan.',
    icon: Target,
    color: '#EA4335', // Red
    author: 'Tony Robbins',
    definition: 'Rapid Planning Method (RPM) focuses on the outcome (Result), the "why" (Purpose), and the "how" (Massive Action Plan).',
    pros: ['Highly motivating', 'Aligns actions with values', 'Reduces busy work'],
    cons: ['Can be overwhelming initially', 'Requires emotional buy-in', 'Less rigid structure'],
    example: 'Instead of "Go to gym", the goal is "Vibrant Health" (Result) because "I want energy for my kids" (Purpose) by "Running 3x/week" (Map).'
  },
  {
    id: 'eisenhower' as Framework,
    title: 'Eisenhower Matrix',
    description: 'Categorize tasks by urgency and importance to master prioritization.',
    icon: Layers,
    color: '#FBBC05', // Yellow
    author: 'Dwight D. Eisenhower',
    definition: 'A decision-making tool that splits tasks into four quadrants based on urgency and importance.',
    pros: ['Clear prioritization', 'Reduces procrastination', 'Delegation framework'],
    cons: ['Subjective categorization', 'Does not account for effort', 'Can become a procrastination tool itself'],
    example: 'Urgent & Important: "Server crash". Important not Urgent: "Strategic planning". Urgent not Important: "Most emails".'
  },
  {
    id: 'okr' as Framework,
    title: 'OKR Goal System',
    description: 'Set ambitious Objectives and define measurable Key Results to track progress.',
    icon: Rocket,
    color: '#9333EA', // Purple
    author: 'John Doerr / Andy Grove',
    definition: 'Objectives and Key Results (OKR) is a goal-setting framework for defining and tracking objectives and their outcomes.',
    pros: ['Aligns teams', 'Measurable progress', 'Encourages ambition'],
    cons: ['Can be too rigid', 'Hard to set correct metrics', 'Can demotivate if targets are missed'],
    example: 'Objective: "Increase brand awareness". Key Result: "Achieve 10,000 active monthly users".'
  },
];

const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
    </div>
);

// Helper to retry async operations
async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryOperation(operation, retries - 1, delay * 2);
        }
        throw error;
    }
}

function App() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedFramework, setSelectedFramework] = useState<Framework>('first-principles');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [activeBlueprint, setActiveBlueprint] = useState<Blueprint | undefined>(undefined);
  const [blueprintsLoading, setBlueprintsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [viewingFramework, setViewingFramework] = useState<typeof frameworks[0] | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Check for onboarding
    const onboardingDone = localStorage.getItem('vector.onboarding_done');
    if (!onboardingDone) {
      setShowOnboarding(true);
    }
    
    // Load local cache immediately.
    setBlueprints(loadLocalBlueprints());

    // Offline listener
    const handleOnline = () => { setIsOffline(false); toast.success("Back online!"); };
    const handleOffline = () => { setIsOffline(true); toast.error("You are offline. Changes saved locally."); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('vector.onboarding_done', 'true');
    setShowOnboarding(false);
  };
  // Navigation helper
  const navTo = (path: string) => navigate(path);

  // Auth & Data effects
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // Get session
    retryOperation(() => supabase!.auth.getSession())
    .then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
      setUserId(session?.user?.id ?? null);
      if (session?.user?.id) loadRemoteBlueprints(session.user.id);
    })
    .catch(err => console.error("Failed to get session", err));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
      setUserId(session?.user?.id ?? null);
      if (session?.user?.id) loadRemoteBlueprints(session.user.id);
      else setBlueprints(loadLocalBlueprints());
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadRemoteBlueprints = async (uid: string) => {
    if (!supabase) return;
    setBlueprintsLoading(true);
    try {
        const { data } = await retryOperation(async () => {
            const res = await supabase!.from('blueprints').select('*').eq('user_id', uid).order('updated_at', { ascending: false });
            if (res.error) throw res.error;
            return res;
        });
        if (data) {
           setBlueprints(data as Blueprint[]);
        }
    } catch (e) {
        console.error("Failed to load blueprints", e);
        toast.error("Could not sync blueprints");
    } finally {
        setBlueprintsLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserEmail(null);
    setUserId(null);
    setBlueprints(loadLocalBlueprints()); // revert to local
    navTo('/');
    toast.success("Signed out");
  };

  const handleStartWizard = (fwId: Framework) => {
    setSelectedFramework(fwId);
    setActiveBlueprint(undefined); // New blueprint
    navigate('/wizard');
  };

  const handleOpenBlueprint = (bp: Blueprint) => {
    setSelectedFramework(bp.framework as Framework);
    setActiveBlueprint(bp);
    navigate('/wizard');
  };

  const handleSaveBlueprint = async (bp: Blueprint) => {
    // 1. Update local state
    const existingIndex = blueprints.findIndex(b => b.id === bp.id);
    let updated = [...blueprints];
    if (existingIndex >= 0) {
      updated[existingIndex] = bp;
    } else {
      updated = [bp, ...updated];
    }
    setBlueprints(updated);
    saveLocalBlueprints(updated);
    
    // 2. Persist to Supabase if logged in
    if (userId && supabase && !isOffline) {
      try {
          // Gamification: Update points and check level up
          await retryOperation(async () => {
              await upsertBlueprint(supabase!, bp, userId);
              
              // Increment points
              const { data: profile } = await supabase!.from('profiles').select('points, level').eq('user_id', userId).single();
              if (profile) {
                  const newPoints = (profile.points || 0) + 10;
                  const newLevel = Math.floor(newPoints / 100) + 1;
                  
                  await supabase!.from('profiles').update({ 
                      points: newPoints,
                      level: newLevel
                  }).eq('user_id', userId);

                  if (newLevel > (profile.level || 1)) {
                      toast.success(`🎉 Level Up! You are now Level ${newLevel}!`, { duration: 5000 });
                      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
                  }
              }
          });
      } catch (e) {
          console.error("Sync failed", e);
          toast.error("Sync failed, saved locally");
      }
    }
    
    toast.success("Blueprint saved!");
  };
  
  const handleDeleteBlueprint = async (id: string) => {
     const updated = blueprints.filter(b => b.id !== id);
     setBlueprints(updated);
     saveLocalBlueprints(updated);
     if (userId && supabase && !isOffline) {
       await removeBlueprint(supabase, id);
     }
     toast.success("Blueprint deleted");
  };

  const handlePricingTier = (tier: string) => {
    if (!userEmail) {
      setAuthOpen(true);
      return;
    }
    console.log("Selected tier:", tier);
    toast.info(`Selected ${tier} tier`);
  };

  const handleImportTemplate = (templateData: any) => {
      const newBlueprint: Blueprint = {
          ...templateData,
          id: crypto.randomUUID(),
          createdAt: (templateData.createdAt ?? new Date().toISOString()),
      };
      const updated = [newBlueprint, ...blueprints];
      setBlueprints(updated);
      saveLocalBlueprints(updated);
      toast.success("Template imported!");
      navigate('/dashboard');
  };

  const handlePublishBlueprint = async (bp: Blueprint) => {
    if (!userId || !supabase) {
      setAuthOpen(true);
      return;
    }
    const description = window.prompt("Enter a description for this template:", "Analysis based on " + bp.framework);
    if (description === null) return;

    try {
      const { error } = await supabase.from('community_templates').insert({
        user_id: userId,
        framework: bp.framework,
        title: bp.title,
        description: description,
        answers: bp.answers,
        result: bp.result
      });
      if (error) throw error;
      toast.success("Template published!");
      navigate('/community');
    } catch (e) {
      console.error(e);
      toast.error("Failed to publish template");
    }
  };

  // Dynamic frameworks list with translation
  const frameworksList = frameworks.map(f => ({
    ...f,
    title: t(`fw.${f.id}.title`) || f.title,
    description: t(`fw.${f.id}.desc`) || f.description, 
  }));

  // Close mobile menu on route change
  useEffect(() => {
      setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-50 font-sans selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100 overflow-x-hidden transition-colors duration-300">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-black focus:text-white focus:rounded-lg focus:outline-none">
        Skip to main content
      </a>
      <ParticleBackground />
      <Toaster />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      
      {isOffline && (
          <div className="fixed bottom-4 left-4 z-50 bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
              <WifiOff size={16} />
              <span className="text-sm font-medium">Offline Mode</span>
          </div>
      )}

      <AnimatePresence>
        {viewingFramework && (
          <FrameworkDetail 
            framework={viewingFramework} 
            onClose={() => setViewingFramework(null)} 
            onStart={() => {
              setViewingFramework(null);
              handleStartWizard(viewingFramework.id);
            }} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <Rocket size={18} className="text-white dark:text-black" />
            </div>
            <span className="text-xl font-bold tracking-tight text-black dark:text-white">VECTOR</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => navigate('/')} className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-black dark:text-white font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`} aria-current={location.pathname === '/' ? 'page' : undefined}>{t('nav.frameworks')}</button>
            <button onClick={() => navigate('/community')} className={`text-sm font-medium transition-colors ${location.pathname === '/community' ? 'text-black dark:text-white font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`} aria-current={location.pathname === '/community' ? 'page' : undefined}>{t('nav.community')}</button>
            <button onClick={() => navigate('/dashboard')} className={`text-sm font-medium transition-colors ${location.pathname === '/dashboard' ? 'text-black dark:text-white font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`} aria-current={location.pathname === '/dashboard' ? 'page' : undefined}>{t('nav.blueprints')}</button>
            <button onClick={() => navigate('/pricing')} className={`text-sm font-medium transition-colors ${location.pathname === '/pricing' ? 'text-black dark:text-white font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`} aria-current={location.pathname === '/pricing' ? 'page' : undefined}>{t('nav.pricing')}</button>
            
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 mx-2" />
            
            <ThemeToggle />
            <LanguageToggle />

            {userEmail && (
                 <button onClick={() => navigate('/profile')} className={`text-sm font-medium transition-colors ${location.pathname === '/profile' ? 'text-black dark:text-white font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`} aria-current={location.pathname === '/profile' ? 'page' : undefined}>
                    {t('nav.profile')}
                 </button>
            )}

            <button
              onClick={() => (userEmail ? handleSignOut() : setAuthOpen(true))}
              className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
              {userEmail ? t('nav.signout') : t('nav.signin')}
            </button>
            <button
              onClick={() => handleStartWizard('first-principles')}
              className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-all"
            >
              {t('nav.getStarted')}
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-gray-900 dark:text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white dark:bg-zinc-950 pt-24 px-6 flex flex-col gap-6"
          >
            <button onClick={() => navigate('/')} className={`text-2xl font-bold border-b border-gray-100 dark:border-zinc-800 pb-4 text-left ${location.pathname === '/' ? 'text-black dark:text-white ring-2 ring-inset ring-gray-400 dark:ring-gray-500 rounded px-2' : 'text-gray-600 dark:text-gray-400'}`}>{t('nav.frameworks')}</button>
            <button onClick={() => navigate('/community')} className={`text-2xl font-bold border-b border-gray-100 dark:border-zinc-800 pb-4 text-left ${location.pathname === '/community' ? 'text-black dark:text-white ring-2 ring-inset ring-gray-400 dark:ring-gray-500 rounded px-2' : 'text-gray-600 dark:text-gray-400'}`}>{t('nav.community')}</button>
            <button onClick={() => navigate('/dashboard')} className={`text-2xl font-bold border-b border-gray-100 dark:border-zinc-800 pb-4 text-left ${location.pathname === '/dashboard' ? 'text-black dark:text-white ring-2 ring-inset ring-gray-400 dark:ring-gray-500 rounded px-2' : 'text-gray-600 dark:text-gray-400'}`}>{t('nav.blueprints')}</button>
            <button onClick={() => navigate('/pricing')} className={`text-2xl font-bold border-b border-gray-100 dark:border-zinc-800 pb-4 text-left ${location.pathname === '/pricing' ? 'text-black dark:text-white ring-2 ring-inset ring-gray-400 dark:ring-gray-500 rounded px-2' : 'text-gray-600 dark:text-gray-400'}`}>{t('nav.pricing')}</button>
            
            <div className="flex items-center gap-4 py-4">
               <ThemeToggle />
               <LanguageToggle />
            </div>

            {userEmail && (
               <button onClick={() => navigate('/profile')} className="text-2xl font-bold border-b border-gray-100 dark:border-zinc-800 pb-4 text-left text-black dark:text-white">{t('nav.profile')}</button>
            )}
            <button
              onClick={() => {
                setIsMenuOpen(false);
                userEmail ? handleSignOut() : setAuthOpen(true);
              }}
              className="text-2xl font-bold border-b border-gray-100 dark:border-zinc-800 pb-4 text-left text-black dark:text-white"
            >
              {userEmail ? t('nav.signout') : t('nav.signin')}
            </button>
            <button onClick={() => handleStartWizard('first-principles')} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-lg font-bold">{t('nav.getStarted')}</button>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="main-content" className="relative pt-20" tabIndex={-1}>
        <Suspense fallback={<LoadingFallback />}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={
                   <motion.div
                      key="landing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative z-10"
                    >
                      {/* Hero Section */}
                      <section className="px-6 pt-24 pb-32 md:pt-40 md:pb-48 text-center max-w-5xl mx-auto">
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                          <h1 className="text-6xl md:text-9xl font-bold tracking-tighter text-gray-900 mb-8 leading-[0.9]">
                            Architect Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-red-500 to-yellow-500">Ambition.</span>
                          </h1>
                          
                          <InspirationalQuote />

                          <p className="text-xl md:text-2xl text-gray-500 font-light max-w-2xl mx-auto mb-12 leading-relaxed">
                            Vector uses first-principles thinking to turn abstract goals into precise architectural blueprints.
                          </p>
                          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                            <button 
                              onClick={() => handleStartWizard('first-principles')}
                              className="group px-10 py-5 bg-black text-white rounded-full text-lg font-bold flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20"
                            >
                              Start Building Now
                              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button 
                              onClick={() => navigate('/pricing')}
                              className="px-10 py-5 bg-white border border-gray-200 text-gray-900 rounded-full text-lg font-bold hover:bg-gray-50 transition-colors"
                            >
                              View Pricing
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
                          </div>

                          <div className="grid md:grid-cols-3 gap-8">
                            {frameworksList.map((fw) => (
                              <FrameworkCard
                                key={fw.id}
                                {...fw}
                                title={t(`fw.${fw.id}.title`) || fw.title}
                                description={t(`fw.${fw.id}.desc`) || fw.description} 
                                onClick={() => handleStartWizard(fw.id)}
                                onLearnMore={() => setViewingFramework(fw)}
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
                          <h2 className="text-[12vw] md:text-[15vw] font-bold tracking-tighter leading-none text-gray-900 dark:text-white opacity-[0.03] select-none pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-20">
                            ANTIGRAVITY
                          </h2>
                          <p className="text-5xl md:text-8xl font-bold tracking-tighter text-gray-900 dark:text-white">
                            Vector
                          </p>
                        </motion.div>
                      </section>
                    </motion.div>
                } />

                <Route path="/wizard" element={
                     <motion.div
                      key="wizard"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <GoalWizard 
                        framework={selectedFramework} 
                        onBack={() => navigate('/')}
                        onSaveBlueprint={handleSaveBlueprint}
                        initialBlueprint={activeBlueprint}
                      />
                    </motion.div>
                } />

                 <Route path="/dashboard" element={
                    <motion.div
                      key="dashboard"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Dashboard
                        blueprints={blueprints}
                        loading={blueprintsLoading}
                        onOpenBlueprint={handleOpenBlueprint}
                        onDeleteBlueprint={handleDeleteBlueprint}
                        onStartWizard={() => handleStartWizard("first-principles")}
                        onPublishBlueprint={handlePublishBlueprint}
                      />
                    </motion.div>
                 } />

                 <Route path="/community" element={
                     <motion.div key="community" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        <Community userId={userId} onBack={() => navigate('/')} onImport={handleImportTemplate} />
                     </motion.div>
                 } />

                 <Route path="/pricing" element={
                    <motion.div
                      key="pricing"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <PricingSection onSelectTier={handlePricingTier} />
                    </motion.div>
                 } />

                 <Route path="/profile" element={
                    userId ? (
                         <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                           <Profile userId={userId} userEmail={userEmail} onBack={() => navigate('/')} />
                         </motion.div>
                    ) : (
                         <div className="flex items-center justify-center h-screen">Loading...</div>
                    )
                 } />

              </Routes>
            </AnimatePresence>
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-6 h-6 bg-black dark:bg-white rounded flex items-center justify-center">
              <Rocket size={12} className="text-white dark:text-black" />
            </div>
            <span className="font-bold tracking-tight text-black dark:text-white">VECTOR</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 md:gap-8 text-sm text-gray-500 dark:text-gray-400">
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">{t('footer.privacy')}</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">{t('footer.terms')}</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">{t('footer.security')}</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">{t('footer.contact')}</a>
            <span className="inline-flex items-center">
              <ShareButton />
            </span>
          </div>
          <p className="text-sm text-gray-400">{t('footer.copyright')}</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
