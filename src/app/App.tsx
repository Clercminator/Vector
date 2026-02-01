import React, { useEffect, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { ParticleBackground } from '@/app/components/ParticleBackground';
import { FrameworkCard } from '@/app/components/FrameworkCard';
import { Toaster } from '@/app/components/ui/sonner';
import { AuthModal } from '@/app/components/AuthModal';
import { Rocket, Brain, Layers, Target, ChevronRight, Menu, X, ArrowRight, WifiOff, Sparkles, BarChart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { Blueprint, loadLocalBlueprints, saveLocalBlueprints, upsertBlueprint, removeBlueprint, syncLocalBlueprintsToRemote, queueDeletedBlueprint, processDeletedQueue } from '@/lib/blueprints';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { createCheckout, isMercadoPagoConfigured } from '@/lib/mercadoPago';

import { TIER_CONFIGS, TierId, DEFAULT_TIER_ID, canUseFramework } from '@/lib/tiers';
import { checkAndAwardAchievements } from '@/lib/gamification';

import { useLanguage } from '@/app/components/language-provider';
import { ShareButton } from '@/app/components/ShareButton';
import { LanguageToggle } from '@/app/components/language-toggle';
import { ThemeToggle } from '@/app/components/theme-toggle';
import { InspirationalQuote } from '@/app/components/InspirationalQuote';
import { FrameworkDetail } from '@/app/components/FrameworkDetail';
import { OnboardingModal } from '@/app/components/OnboardingModal';
import { HelpMeChooseModal } from '@/app/components/HelpMeChooseModal';


// Lazy load screens
const GoalWizard = React.lazy(() => import('@/app/components/GoalWizard').then(module => ({ default: module.GoalWizard })));
const PricingSection = React.lazy(() => import('@/app/components/PricingSection').then(module => ({ default: module.PricingSection })));
const Dashboard = React.lazy(() => import('@/app/components/Dashboard').then(module => ({ default: module.Dashboard })));
const Community = React.lazy(() => import('@/app/components/Community').then(module => ({ default: module.Community })));
const Profile = React.lazy(() => import('@/app/components/Profile').then(module => ({ default: module.Profile })));
const AdminDashboard = React.lazy(() => import('@/app/components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const FrameworkPage = React.lazy(() => import('@/pages/FrameworkPage').then(module => ({ default: module.FrameworkPage })));
const AnalyticsPage = React.lazy(() => import('@/pages/AnalyticsPage').then(module => ({ default: module.AnalyticsPage })));
const LegalPage = React.lazy(() => import('@/pages/LegalPage').then(module => ({ default: module.LegalPage })));
import { trackEvent } from '@/lib/analytics';

import { frameworks, Framework } from '@/lib/frameworks';

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
  const [searchParams] = useState(new URLSearchParams(window.location.search));
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
  const [tier, setTier] = useState<TierId>(DEFAULT_TIER_ID);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showHelpChoose, setShowHelpChoose] = useState(false);
  
  const PAGE_SIZE = 12;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    // Check for onboarding
    const onboardingDone = localStorage.getItem('vector.onboarding_done');
    if (!onboardingDone) {
      setShowOnboarding(true);
    }
    
    // Offline listener
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Payment Status Handler
  useEffect(() => {
      const paymentStatus = new URLSearchParams(window.location.search).get('payment');
      if (paymentStatus === 'success') {
          toast.success(t('app.payment.success'), { duration: 5000 });
          // Force profile refresh if user logic is already loaded
          if (userId && supabase) {
              supabase.from('profiles').select('tier, credits, is_admin').eq('user_id', userId).single()
              .then(({ data }) => {
                  if (data) {
                      setTier(data.tier as TierId);
                      if (data.is_admin) setIsAdmin(true);
                      // Force credits refresh in components by refetching or context (simplified here by just updating tier)
                  }
              });
          }
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
      } else if (paymentStatus === 'failure') {
          toast.error(t('app.payment.failure'), { duration: 5000 });
          window.history.replaceState({}, document.title, window.location.pathname);
      }
  }, [userId, t]);

  useEffect(() => {
    // Check initial session
    supabase?.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
          
          // Sync local blueprints if any
          syncLocalBlueprintsToRemote(supabase, session.user.id).then(count => {
              if (count > 0) {
                  toast.success(t('app.syncedBlueprints', { count }), { duration: 4000 });
                  // Reload remote to include just synced
                  loadRemoteBlueprints(session.user.id, 0);
              } else {
                  // just load
                  loadRemoteBlueprints(session.user.id, 0);
              }
          });
          
          // Process deleted queue
          processDeletedQueue(supabase);
          
        // Load profile data (tier + is_admin)
        supabase.from('profiles').select('tier, is_admin').eq('user_id', session.user.id).single()
        .then(({ data }) => {
            if (data?.tier) setTier(data.tier as TierId);
            if (data?.is_admin) setIsAdmin(true);
        });
      } else {
        setBlueprints(loadLocalBlueprints());
        setTier(DEFAULT_TIER_ID);
        setHasMore(false); // Local blueprints don't support pagination yet
      }
    });
    
    if (!supabase) {
        setBlueprints(loadLocalBlueprints());
        setTier(DEFAULT_TIER_ID);
        setHasMore(false);
        return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
         setUserId(session.user.id);
         setUserEmail(session.user.email || null);
         setIsOffline(false);
         setAuthOpen(false); // Close modal if open
         setPage(0);
         setHasMore(true);
         loadRemoteBlueprints(session.user.id, 0);

         // Load profile data (tier + is_admin)
         supabase!.from('profiles').select('tier, is_admin').eq('user_id', session.user.id).single()
          .then(({ data }) => {
              if (data?.tier) setTier(data.tier as TierId);
              if (data?.is_admin) setIsAdmin(true);
          });
      } else if (event === 'SIGNED_OUT') {
         setUserId(null);
         setUserEmail(null);
         setBlueprints(loadLocalBlueprints());
         setTier(DEFAULT_TIER_ID);
         setIsAdmin(false);
         setHasMore(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('vector.onboarding_done', 'true');
    setShowOnboarding(false);
  };
  // Navigation helper
  const navTo = (path: string) => navigate(path);

  // Auth & Data effects
  

  const loadRemoteBlueprints = async (uid: string, pageToLoad: number = 0) => {
    if (!supabase) return;
    
    if (pageToLoad === 0) setBlueprintsLoading(true);
    else setIsLoadingMore(true);

    try {
        const from = pageToLoad * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data } = await retryOperation(async () => {
            const res = await supabase!.from('blueprints')
                .select('*')
                .eq('user_id', uid)
                .order('updated_at', { ascending: false })
                .range(from, to);
            if (res.error) throw res.error;
            return res;
        });
        
        if (data) {
           if (data.length < PAGE_SIZE) setHasMore(false);
           else setHasMore(true);

           if (pageToLoad === 0) setBlueprints(data.map((b: any) => ({ ...b, createdAt: b.created_at || b.createdAt })) as Blueprint[]);
           else setBlueprints(prev => [...prev, ...data.map((b: any) => ({ ...b, createdAt: b.created_at || b.createdAt })) as Blueprint[]]);
        } else {
           if (pageToLoad === 0) setBlueprints([]);
           setHasMore(false);
        }
    } catch (e) {
        console.error("Failed to load blueprints", e);
        toast.error(t('app.sync.error'));
    } finally {
        setBlueprintsLoading(false);
        setIsLoadingMore(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserEmail(null);
    setUserId(null);
    setIsAdmin(false);
    setBlueprints(loadLocalBlueprints()); // revert to local
    navTo('/');
    toast.success(t('app.auth.signedOut'));
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

              // Check achievements
              await checkAndAwardAchievements(supabase!, userId);
          });
      } catch (e) {
          console.error("Sync failed", e);
          toast.error(t('app.sync.failed'));
      }
    }
    
    toast.success(t('app.blueprint.saved'));
  };

  const handleLoadMore = () => {
      if (!userId) return;
      const nextPage = page + 1;
      setPage(nextPage);
      loadRemoteBlueprints(userId, nextPage);
  };
  
  const handleDeleteBlueprint = async (id: string) => {
     const updated = blueprints.filter(b => b.id !== id);
     setBlueprints(updated);
     saveLocalBlueprints(updated);
      if (userId && supabase) {
        try {
            await removeBlueprint(supabase, id);
        } catch (e) {
            console.error("Delete failed, queuing", e);
            if (!navigator.onLine) {
                 queueDeletedBlueprint(id);
                 toast.info("Offline: Blueprint deletion queued.");
                 // Optimistically remove from UI
                 setBlueprints(prev => prev.filter(b => b.id !== id));
                 return; // Avoid success toast below if we want distinctive msg
            }
            throw e;
        }
      }
    toast.success(t('app.blueprint.deleted'));
  };

  const handlePricingTier = async (tierName: string, tierId?: string) => {
    if (!userEmail) {
      setAuthOpen(true);
      return;
    }
    if ((tierId === 'standard' || tierId === 'max') && isMercadoPagoConfigured()) {
      const config = TIER_CONFIGS[tierId as 'standard' | 'max'];
      if (config.priceUsd <= 0) return;
      try {
        await createCheckout({ tier: tierName, amount: config.priceUsd, currency: 'USD' });
      } catch (e) {
        console.error(e);
        toast.error(e instanceof Error ? e.message : t('common.error'));
      }
      return;
    }
    if (tierId === 'enterprise') {
      toast.info(t('app.pricing.enterprise'));
      return;
    }
    toast.info(t('app.tier.selected').replace('{0}', tierName));
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
      toast.success(t('app.template.imported'));
      navigate('/dashboard');
  };

  const handlePublishBlueprint = async (bp: Blueprint) => {
    if (!userId || !supabase) {
      setAuthOpen(true);
      return;
    }
    const description = window.prompt(t('app.publish.prompt'), t('app.publish.defaultDesc').replace('{0}', bp.framework));
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
      toast.success(t('app.template.published'));
      navigate('/community');
    } catch (e) {
      console.error(e);
      toast.error(t('app.publish.failed'));
    }
  };

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

  // Close mobile menu on route change
  useEffect(() => {
      setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-50 font-sans selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100 overflow-x-hidden transition-colors duration-300">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-black focus:text-white focus:rounded-lg focus:outline-none">
        {t('app.skipToMain')}
      </a>
      <ParticleBackground />
      <Toaster />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      
      {isOffline && (
          <div className="fixed bottom-4 left-4 z-50 bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
              <WifiOff size={16} />
              <span className="text-sm font-medium">{t('app.offline')}</span>
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
        {showHelpChoose && (
            <HelpMeChooseModal 
                onClose={() => setShowHelpChoose(false)} 
                onSelect={(fw) => {
                    setShowHelpChoose(false);
                    handleStartWizard(fw);
                }}
            />
        )}
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
            <button onClick={() => navigate('/')} className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-black dark:text-white font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'}`} aria-current={location.pathname === '/' ? 'page' : undefined}>{t('nav.frameworks')}</button>
            <button onClick={() => navigate('/community')} className={`text-sm font-medium transition-colors ${location.pathname === '/community' ? 'text-black dark:text-white font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'}`} aria-current={location.pathname === '/community' ? 'page' : undefined}>{t('nav.community')}</button>
            {userEmail && (
                <button onClick={() => navigate('/dashboard')} className={`text-sm font-medium transition-colors ${location.pathname === '/dashboard' ? 'text-black dark:text-white font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'}`} aria-current={location.pathname === '/dashboard' ? 'page' : undefined}>{t('nav.blueprints')}</button>
            )}
            <button onClick={() => navigate('/pricing')} className={`text-sm font-medium transition-colors ${location.pathname === '/pricing' ? 'text-black dark:text-white font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'}`} aria-current={location.pathname === '/pricing' ? 'page' : undefined}>{t('nav.pricing')}</button>
            
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 mx-2" />
            
            <ThemeToggle />
            <LanguageToggle />

            {userEmail && (
                 <button onClick={() => navigate('/profile')} className={`text-sm font-medium transition-colors ${location.pathname === '/profile' ? 'text-black dark:text-white font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`} aria-current={location.pathname === '/profile' ? 'page' : undefined}>
                    {t('nav.profile')}
                 </button>
            )}

            {isAdmin && (
                 <button onClick={() => navigate('/admin')} className={`text-sm font-medium transition-colors ${location.pathname === '/admin' ? 'text-black dark:text-white font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`} aria-current={location.pathname === '/admin' ? 'page' : undefined}>
                    {t('nav.admin')}
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
            {isAdmin && (
               <button onClick={() => navigate('/admin')} className="text-2xl font-bold border-b border-gray-100 dark:border-zinc-800 pb-4 text-left text-black dark:text-white">{t('nav.admin')}</button>
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

      <main id="main-content" className="relative pt-20 flex-grow" tabIndex={-1}>
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
                            {t('landing.hero.architectYour')} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-red-500 to-yellow-500">{t('landing.hero.ambition')}</span>
                          </h1>
                          
                          <InspirationalQuote />

                          <p className="text-xl md:text-2xl text-gray-500 font-light max-w-2xl mx-auto mb-12 leading-relaxed">
                            {t('landing.hero.subtitle')}
                          </p>
                          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                            <button 
                              onClick={() => handleStartWizard('first-principles')}
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
                                onClick={() => setShowHelpChoose(true)}
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
                                  handleStartWizard(fw.id);
                                }}
                                onLearnMore={() => setViewingFramework(fw)}
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
                } />

                <Route path="/wizard" element={
                     <motion.div
                      key="wizard"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <GoalWizard 
                        framework={location.state?.framework || selectedFramework} 
                        onBack={() => navigate('/')}
                        onSaveBlueprint={handleSaveBlueprint}
                        initialBlueprint={activeBlueprint}
                        tier={tier}
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
                        onStartWizard={() => navigate('/')}
                        onPublishBlueprint={handlePublishBlueprint}
                        onLoadMore={handleLoadMore}
                        hasMore={hasMore}
                        isLoadingMore={isLoadingMore}
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

                 <Route path="/frameworks/:id" element={
                     <motion.div
                       key="framework-detail"
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -20 }}
                     >
                       <FrameworkPage />
                     </motion.div>
                 } />

                 <Route path="/analytics" element={
                     <motion.div
                       key="analytics"
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -20 }}
                     >
                        <AnalyticsPage />
                     </motion.div>
                 } />

                <Route path="/legal" element={
                     <motion.div
                       key="legal"
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -20 }}
                     >
                        <LegalPage />
                     </motion.div>
                 } />

                 <Route path="/profile" element={
                    userId ? (
                         <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                           <Profile userId={userId} userEmail={userEmail} onBack={() => navigate('/')} />
                         </motion.div>
                    ) : (
                         <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                            <p className="text-gray-500 dark:text-gray-400">{t('app.profile.signInRequired')}</p>
                            <Button onClick={() => setAuthOpen(true)}>{t('nav.signin')}</Button>
                         </div>
                    )
                 } />

                 <Route path="/admin" element={
                    isAdmin ? (
                         <motion.div key="admin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                           <AdminDashboard onBack={() => navigate('/')} />
                         </motion.div>
                    ) : (
                         <div className="flex items-center justify-center h-screen text-xl font-medium">{t('admin.accessDenied')}</div>
                    )
                 } />

              </Routes>
            </AnimatePresence>
        </Suspense>
      </main>

      {/* Footer */}
      {location.pathname !== '/wizard' && (
      <footer className="relative z-10 px-6 py-12 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-6 h-6 bg-black dark:bg-white rounded flex items-center justify-center">
              <Rocket size={12} className="text-white dark:text-black" />
            </div>
            <span className="font-bold tracking-tight text-black dark:text-white">VECTOR</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 md:gap-8 text-sm text-gray-500 dark:text-gray-400">
            <button onClick={() => navigate('/legal?section=privacy')} className="hover:text-black dark:hover:text-white transition-colors font-medium">{t('footer.privacy')}</button>
            <button onClick={() => navigate('/legal?section=terms')} className="hover:text-black dark:hover:text-white transition-colors font-medium">{t('footer.terms')}</button>
            <button onClick={() => navigate('/legal?section=security')} className="hover:text-black dark:hover:text-white transition-colors font-medium">{t('footer.security')}</button>
            <a href="mailto:vectorgoal.contact@gmail.com" className="hover:text-black dark:hover:text-white transition-colors font-medium">{t('footer.contact')}</a>
            <span className="inline-flex items-center">
              <ShareButton />
            </span>
          </div>
          <p className="text-sm text-gray-400">{t('footer.copyright')}</p>
        </div>
      </footer>
      )}
    </div>
  );
}

export default App;
