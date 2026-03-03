import React, { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/app/components/ui/button";
import { ParticleBackground } from "@/app/components/ParticleBackground";
import { Toaster } from "@/app/components/ui/sonner";
import { AuthModal } from "@/app/components/AuthModal";
import { WifiOff } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import {
  Blueprint,
  blueprintTitleFromAnswers,
  loadLocalBlueprints,
  saveLocalBlueprints,
  syncBlueprintMessages,
  upsertBlueprint,
  removeBlueprint,
  syncLocalBlueprintsToRemote,
  queueDeletedBlueprint,
  processDeletedQueue,
} from "@/lib/blueprints";
import { supabase } from "@/lib/supabase";
import { createCheckout, isMercadoPagoConfigured } from "@/lib/mercadoPago";
import { trackEvent } from "@/lib/analytics"; // Imported trackEvent

import { TIER_CONFIGS, TierId, DEFAULT_TIER_ID } from "@/lib/tiers";
import { checkAndAwardAchievements } from "@/lib/gamification";

import { useLanguage } from "@/app/components/language-provider";
import { ShareButton } from "@/app/components/ShareButton";
import { FrameworkDetail } from "@/app/components/FrameworkDetail";
import { OnboardingModal } from "@/app/components/OnboardingModal";
import { HelpMeChooseModal } from "@/app/components/HelpMeChooseModal";
import { FeedbackButton } from "@/app/components/FeedbackButton";
import { Logo } from "@/app/components/Logo";
import { SupportButton } from "@/app/components/SupportButton";

import { LandingPage } from "@/pages/LandingPage";
import { Header } from "@/app/components/layout/Header";
import { MobileMenu } from "@/app/components/layout/MobileMenu";

// Lazy load screens
const GoalWizard = React.lazy(() =>
  import("@/app/components/GoalWizard").then((module) => ({
    default: module.GoalWizard,
  })),
);
const PricingSection = React.lazy(() =>
  import("@/app/components/PricingSection").then((module) => ({
    default: module.PricingSection,
  })),
);
const Dashboard = React.lazy(() =>
  import("@/app/components/Dashboard").then((module) => ({
    default: module.Dashboard,
  })),
);
const Community = React.lazy(() =>
  import("@/app/components/Community").then((module) => ({
    default: module.Community,
  })),
);
const Profile = React.lazy(() =>
  import("@/app/components/Profile").then((module) => ({
    default: module.Profile,
  })),
);
const AdminDashboard = React.lazy(() =>
  import("@/app/components/AdminDashboard").then((module) => ({
    default: module.AdminDashboard,
  })),
);
const FrameworkPage = React.lazy(() =>
  import("@/pages/FrameworkPage").then((module) => ({
    default: module.FrameworkPage,
  })),
);
const AnalyticsPage = React.lazy(() =>
  import("@/pages/AnalyticsPage").then((module) => ({
    default: module.AnalyticsPage,
  })),
);
const LegalPage = React.lazy(() =>
  import("@/pages/LegalPage").then((module) => ({ default: module.LegalPage })),
);
const AboutPage = React.lazy(() =>
  import("@/pages/AboutPage").then((module) => ({ default: module.AboutPage })),
);
const TrackerPage = React.lazy(() =>
  import("@/app/components/TrackerPage").then((module) => ({
    default: module.TrackerPage,
  })),
);
const SharedPlanView = React.lazy(() =>
  import("@/app/components/tracker/SharedPlanView").then((module) => ({
    default: module.SharedPlanView,
  })),
);
const TodayPage = React.lazy(() =>
  import("@/pages/TodayPage").then((module) => ({ default: module.TodayPage })),
);

import { frameworks, Framework } from "@/lib/frameworks";

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
  </div>
);

// Helper to retry async operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
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
  const [selectedFramework, setSelectedFramework] = useState<
    Framework | undefined
  >(undefined);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [activeBlueprint, setActiveBlueprint] = useState<Blueprint | undefined>(
    undefined,
  );
  const [blueprintsLoading, setBlueprintsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [viewingFramework, setViewingFramework] = useState<
    (typeof frameworks)[0] | null
  >(null);
  const [tier, setTier] = useState<TierId>(DEFAULT_TIER_ID);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showHelpChoose, setShowHelpChoose] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const PAGE_SIZE = 12;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authReason, setAuthReason] = useState<"signup_to_try" | null>(null);

  const PROTECTED_PATHS = [
    "/wizard",
    "/dashboard",
    "/community",
    "/profile",
    "/analytics",
    "/track",
    "/today",
  ];

  useEffect(() => {
    // Check if user has returned from payment
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get("payment");
    if (paymentStatus === "success") {
      toast.success(
        t("pricing.paymentSuccess") ||
          "Payment successful! Your plan has been upgraded.",
      );
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      // Clean URL
      window.history.replaceState({}, "", "/dashboard");
      // Refresh profile (tier should be updated by webhook, but we might need to wait or poll)
      setTimeout(refreshProfile, 2000);
    } else if (paymentStatus === "failure") {
      toast.error(
        t("pricing.paymentFailed") || "Payment failed or was cancelled.",
      );
    }
  }, [location.search, t]);

  // Restore framework from session when landing on /wizard after reload (location.state is lost)
  useEffect(() => {
    if (location.pathname !== "/wizard") return;
    const fromNav =
      (location.state as { framework?: Framework })?.framework ??
      selectedFramework;
    if (fromNav) return; // Already have framework from navigation or prior selection
    try {
      const raw = localStorage.getItem("vector_wizard_session");
      if (!raw) return;
      const { framework: savedFw, timestamp } = JSON.parse(raw);
      if (!savedFw || typeof savedFw !== "string") return;
      if (Date.now() - (timestamp || 0) >= 24 * 60 * 60 * 1000) return;
      setSelectedFramework(savedFw as Framework);
    } catch (_) {}
  }, [
    location.pathname,
    (location.state as { framework?: Framework })?.framework,
    selectedFramework,
  ]);

  useEffect(() => {
    // Check for onboarding
    const onboardingDone = localStorage.getItem("vector.onboarding_done");
    if (!onboardingDone) {
      setShowOnboarding(true);
    }

    // Offline listener
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Referral Tracking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");
    if (refCode) {
      // Basic validation: must be alphanumeric/underscore/dash, max 50 chars
      if (/^[a-zA-Z0-9_-]{1,50}$/.test(refCode)) {
        localStorage.setItem("vector_ref_code", refCode);
        localStorage.setItem("vector_ref_timestamp", Date.now().toString());
      }
    }
  }, []);

  useEffect(() => {
    // Check initial session
    supabase?.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);

        // Sync local blueprints if any
        syncLocalBlueprintsToRemote(supabase, session.user.id)
          .then((count) => {
            if (count > 0) {
              toast.success(t("app.syncedBlueprints", { count }), {
                duration: 4000,
              });
              // Reload remote to include just synced
              loadRemoteBlueprints(session.user.id, 0);
            } else {
              // just load
              loadRemoteBlueprints(session.user.id, 0);
            }
          })
          .catch((err) => {
            console.error("Sync failed:", err);
            // Still try to load remote even if sync failed
            loadRemoteBlueprints(session.user.id, 0);
          });

        // Process deleted queue
        processDeletedQueue(supabase);

        // Load profile data (tier + is_admin)
        supabase
          .from("profiles")
          .select("tier, is_admin, avatar_url")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.tier) setTier(data.tier as TierId);
            if (data?.is_admin) setIsAdmin(true);
            if (data?.avatar_url) setAvatarUrl(data.avatar_url);
          });
      } else {
        setBlueprints(loadLocalBlueprints());
        setTier(DEFAULT_TIER_ID);
        setHasMore(false); // Local blueprints don't support pagination yet
      }
      setAuthReady(true);
    });

    if (!supabase) {
      setBlueprints(loadLocalBlueprints());
      setTier(DEFAULT_TIER_ID);
      setHasMore(false);
      setAuthReady(true);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
        setIsOffline(false);
        setAuthOpen(false); // Close modal if open
        setPage(0);
        setHasMore(true);
        loadRemoteBlueprints(session.user.id, 0);

        // Load profile data (tier + is_admin + avatar)
        supabase!
          .from("profiles")
          .select("tier, is_admin, avatar_url")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.tier) setTier(data.tier as TierId);
            if (data?.is_admin) setIsAdmin(true);
            if (data?.avatar_url) setAvatarUrl(data.avatar_url);
          });
      } else if (event === "SIGNED_OUT") {
        setUserId(null);
        setUserEmail(null);
        setBlueprints(loadLocalBlueprints());
        setTier(DEFAULT_TIER_ID);
        setIsAdmin(false);
        setAvatarUrl(null);
        setHasMore(false);
      }

      // Handle Referral Attribution on Auth (both Sign In and Sign Up)
      if (
        (event === "SIGNED_IN" || event === "USER_UPDATED") &&
        session?.user
      ) {
        const refCode = localStorage.getItem("vector_ref_code");
        // Check if we have a ref code and it's not expired (e.g. 30 days)
        const refTimestamp = localStorage.getItem("vector_ref_timestamp");
        const isExpired =
          refTimestamp &&
          Date.now() - parseInt(refTimestamp) > 30 * 24 * 60 * 60 * 1000;

        if (refCode && !isExpired) {
          // We optimistically try to set it. If user already has one, it might fail or be ignored depending on RLS/Backend.
          // But simpler here: check if profile already has one or just update.
          // Ideally we only set it if it's null.
          supabase!
            .from("profiles")
            .select("referrer_code")
            .eq("user_id", session.user.id)
            .single()
            .then(({ data }) => {
              if (data && !data.referrer_code) {
                supabase!
                  .from("profiles")
                  .update({ referrer_code: refCode })
                  .eq("user_id", session.user.id)
                  .then(({ error }) => {
                    if (!error) {
                      trackEvent("signup_referred", { referrer_code: refCode });
                      // Clear it so we don't re-attribute (though check above handles it)
                      localStorage.removeItem("vector_ref_code");
                      localStorage.removeItem("vector_ref_timestamp");
                    }
                  });
              } else {
                // Already has referrer or error reading, clear local storage
                localStorage.removeItem("vector_ref_code");
                localStorage.removeItem("vector_ref_timestamp");
              }
            });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Require account for protected routes: redirect to landing and ask to create account
  useEffect(() => {
    if (!authReady || userId) return;
    const path = location.pathname;
    const isProtected = PROTECTED_PATHS.some(
      (p) => path === p || path.startsWith(p + "/"),
    );
    if (isProtected) {
      navigate("/", { replace: true });
      setAuthReason("signup_to_try");
      setAuthOpen(true);
    }
  }, [authReady, userId, location.pathname, navigate]);

  const handleOnboardingComplete = () => {
    localStorage.setItem("vector.onboarding_done", "true");
    setShowOnboarding(false);
  };
  // Navigation helper
  const navTo = (path: string) => navigate(path);

  // Auth & Data effects

  const loadRemoteBlueprints = async (uid: string, pageToLoad: number = 0) => {
    if (!supabase) return;

    if (pageToLoad === 0) setBlueprintsLoading(true);
    else setIsLoadingMore(true);
    setSyncError(null);

    try {
      const from = pageToLoad * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data } = await retryOperation(async () => {
        const res = await supabase!
          .from("blueprints")
          .select("*")
          .eq("user_id", uid)
          .order("updated_at", { ascending: false })
          .range(from, to);
        if (res.error) throw res.error;
        return res;
      });

      if (data) {
        if (data.length < PAGE_SIZE) setHasMore(false);
        else setHasMore(true);

        if (pageToLoad === 0)
          setBlueprints(
            data.map((b: any) => ({
              ...b,
              createdAt: b.created_at || b.createdAt,
            })) as Blueprint[],
          );
        else
          setBlueprints((prev) => [
            ...prev,
            ...(data.map((b: any) => ({
              ...b,
              createdAt: b.created_at || b.createdAt,
            })) as Blueprint[]),
          ]);
      } else {
        if (pageToLoad === 0) setBlueprints([]);
        setHasMore(false);
      }
    } catch (e: any) {
      console.error("Failed to load blueprints", e);
      setSyncError(e.message || "Unknown error");
      toast.error(t("app.sync.error"));
    } finally {
      setBlueprintsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const refreshProfile = () => {
    if (userId && supabase) {
      supabase
        .from("profiles")
        .select("avatar_url, tier, credits, is_admin")
        .eq("user_id", userId)
        .single()
        .then(({ data }) => {
          if (data?.avatar_url) setAvatarUrl(data.avatar_url);
          if (data?.tier) setTier(data.tier as TierId);
          if (data?.is_admin) setIsAdmin(true);
        });
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (e) {
      console.error("Sign out error", e);
      // We continue client-side signout anyway
    }
    setUserEmail(null);
    setUserId(null);
    setIsAdmin(false);
    setBlueprints(loadLocalBlueprints()); // revert to local
    navTo("/");
    toast.success(t("app.auth.signedOut"));
  };

  const handleStartWizard = async (fwId?: Framework, context?: any) => {
    if (!userId) {
      setAuthReason("signup_to_try");
      toast.info(
        t("app.auth.createAccountToTry") ||
          "Create an account to try the service.",
      );
      setAuthOpen(true);
      return;
    }

    // When starting with new goal from intake form: save current session first, then clear so we start fresh
    if (context?.objective) {
      try {
        const savedSession = localStorage.getItem("vector_wizard_session");
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          const hasContent =
            (parsed.messages?.length ?? 0) > 0 || parsed.draftResult;
          if (hasContent && parsed.framework) {
            const answers = (parsed.messages ?? [])
              .filter((m: any) => m.role === "user")
              .map((m: any) => m.content);
            const fw = parsed.framework as string;
            const result =
              parsed.draftResult && typeof parsed.draftResult === "object"
                ? parsed.draftResult
                : { type: fw };
            const bp: Blueprint = {
              id: crypto.randomUUID(),
              framework: fw as Blueprint["framework"],
              title: blueprintTitleFromAnswers(answers),
              answers,
              result,
              createdAt: new Date().toISOString(),
            };
            const existingIndex = blueprints.findIndex((b) => b.id === bp.id);
            let updated = [...blueprints];
            if (existingIndex >= 0) {
              updated[existingIndex] = bp;
            } else {
              updated = [bp, ...updated];
            }
            setBlueprints(updated);
            saveLocalBlueprints(updated);
            if (userId && supabase && !isOffline) {
              await retryOperation(async () => {
                await upsertBlueprint(supabase!, bp, userId);
              });
              const persistable = (parsed.messages ?? [])
                .filter((m: any) => m.role === "user" || m.role === "ai")
                .map((m: any) => ({
                  role: m.role as "user" | "ai",
                  content: m.content,
                }));
              await syncBlueprintMessages(supabase!, bp.id, persistable);
            }
            toast.success(t("wizard.draftSavedToBlueprints"));
            localStorage.removeItem("vector_wizard_session");
          }
        }
      } catch (e) {
        console.error("Failed to save previous session", e);
        localStorage.removeItem("vector_wizard_session");
      }
    }

    setSelectedFramework(fwId);
    setActiveBlueprint(undefined);
    navigate("/wizard", { state: { framework: fwId, context } });
  };

  /** Entry point for "Help me find the best framework" flow: wizard starts with consultant (no pre-selected framework). Used by Get Started, + New Plan, Create your first plan. */
  const startHelpMeFindFrameworkFlow = () => handleStartWizard();

  const handleOpenBlueprint = (bp: Blueprint) => {
    setSelectedFramework(bp.framework as Framework);
    setActiveBlueprint(bp);
    navigate("/wizard");
  };

  const handleSaveBlueprint = async (bp: Blueprint) => {
    // 1. Update local state
    const existingIndex = blueprints.findIndex((b) => b.id === bp.id);
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
          const { data: profile } = await supabase!
            .from("profiles")
            .select("points, level")
            .eq("user_id", userId)
            .single();
          if (profile) {
            const newPoints = (profile.points || 0) + 10;
            const newLevel = Math.floor(newPoints / 100) + 1;

            await supabase!
              .from("profiles")
              .update({
                points: newPoints,
                level: newLevel,
              })
              .eq("user_id", userId);

            if (newLevel > (profile.level || 1)) {
              toast.success(`🎉 Level Up! You are now Level ${newLevel}!`, {
                duration: 5000,
              });
              confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
            }
          }

          // Analytics: Blueprint Created
          // Check if this is the first blueprint for the user
          // We can check local 'blueprints' state length BEFORE this save,
          // but since we updated state optimistically above (lines 341-348), 'blueprints' might already include it if we aren't careful?
          // Actually 'handleSaveBlueprint' updates local state first.
          // Let's use the DB count for accuracy or the 'existingIndex' check.
          // If existingIndex === -1, it's a new insert.
          if (existingIndex === -1) {
            // It's a creation
            const { count } = await supabase!
              .from("blueprints")
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId);
            // If count is 1 (the one we just inserted), then it is first.
            // Because upsert happened above.
            // Note: upsertBlueprint usually returns data, but we didn't capture it returned.
            // Simpler: fire event. 'is_first' might be slightly off if parallel saves, but fine for analytics.
            trackEvent("blueprint_created", {
              framework: bp.framework,
              is_first: count === 1,
            });
          }

          // Check achievements
          await checkAndAwardAchievements(supabase!, userId);
        });
      } catch (e) {
        console.error("Sync failed", e);
        toast.error(
          t("errors.syncFailed") ||
            "Couldn't save. Check your connection and try again.",
        );
        // Revert local optimistic update if needed?
        // For now we keep local state as "unsynced" effectively.
      }
    }

    toast.success(t("app.blueprint.saved"));
  };

  const handleLoadMore = () => {
    if (!userId) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadRemoteBlueprints(userId, nextPage);
  };

  const handleDeleteBlueprint = async (id: string) => {
    const updated = blueprints.filter((b) => b.id !== id);
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
          setBlueprints((prev) => prev.filter((b) => b.id !== id));
          return; // Avoid success toast below if we want distinctive msg
        }
        toast.error(
          t("errors.syncFailed") ||
            "Couldn't save. Check your connection and try again.",
        );
        // Revert optimistic update
        setBlueprints(loadLocalBlueprints());
        return;
      }
    }
    toast.success(t("app.blueprint.deleted"));
  };

  const handlePricingTier = async (tierName: string, tierId?: string) => {
    if (!tierId) return;

    // Enforce Auth for ALL plans
    if (!userId) {
      toast.error(
        t("app.profile.signInRequired") || "Please sign in to continue.",
      );
      setAuthOpen(true);
      return;
    }

    // 1. Handle Free Tier / Downgrade
    if (tierId === "architect") {
      if (tier === "architect") {
        toast.info(
          t("pricing.currentPlan") || "You are currently on this plan.",
        );
      } else {
        toast.info(
          t("pricing.freeTierSelected") || "You are on the free plan.",
        );
      }
      return;
    }

    // 2. Handle Enterprise
    if (tierId === "enterprise") {
      window.location.href =
        "mailto:sales@vector.com?subject=Enterprise%20Inquiry";
      return;
    }

    // 3. Handle Paid Tiers (Standard/Max)

    if (!isMercadoPagoConfigured()) {
      toast.error("Payments are not configured yet (Test Mode).");
      return;
    }

    if (isOffline) {
      toast.error(t("common.offline") || "You are offline.");
      return;
    }

    try {
      setIsCheckoutLoading(true);

      // Ensure session is valid/refreshed before checkout
      const {
        data: { session },
        error: sessionError,
      } = await supabase!.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error(
          "Authentication session missing. Please sign in again.",
        );
      }

      const config = TIER_CONFIGS[tierId as TierId];
      if (!config || config.priceUsd <= 0) {
        throw new Error("Invalid tier configuration");
      }

      await createCheckout(supabase!, {
        tier: config.id, // e.g. 'standard'
        title: `Vector - ${tierName}`, // e.g. 'Vector - Standard Plan'
        amount: config.priceUsd,
        currency: "USD", // Or configurable
        userId: userId,
      });
      // Checkout opens in new tab; clear overlay so this tab is usable
      setIsCheckoutLoading(false);
    } catch (e: any) {
      console.error("Checkout error", e);
      toast.error(e.message || "Failed to start checkout");
      setIsCheckoutLoading(false);
    }
  };

  const handleImportTemplate = (templateData: any) => {
    const newBlueprint: Blueprint = {
      ...templateData,
      id: crypto.randomUUID(),
      createdAt: templateData.createdAt ?? new Date().toISOString(),
    };
    const updated = [newBlueprint, ...blueprints];
    setBlueprints(updated);
    saveLocalBlueprints(updated);
    toast.success(t("app.template.imported"));
    navigate("/dashboard");
  };

  const handlePublishBlueprint = async (bp: Blueprint) => {
    if (!userId || !supabase) {
      setAuthOpen(true);
      return;
    }
    const description = window.prompt(
      t("app.publish.prompt"),
      t("app.publish.defaultDesc").replace("{0}", bp.framework),
    );
    if (description === null) return;

    try {
      const { error } = await supabase.from("community_templates").insert({
        user_id: userId,
        framework: bp.framework,
        title: bp.title,
        description: description,
        answers: bp.answers,
        result: bp.result,
      });
      if (error) throw error;
      toast.success(t("app.template.published"));
      navigate("/community");
    } catch (e) {
      console.error(e);
      toast.error(t("app.publish.failed"));
    }
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300 font-sans selection:bg-purple-500/30 flex flex-col">
      {/* Loading Overlay for Checkout */}
      <AnimatePresence>
        {isCheckoutLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
              <p className="font-medium text-lg animate-pulse">
                Redirecting to MercadoPago...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-black focus:text-white focus:rounded-lg focus:outline-none"
      >
        {t("app.skipToMain")}
      </a>
      <ParticleBackground />
      <Toaster />
      <AuthModal
        open={authOpen}
        onOpenChange={(open) => {
          setAuthOpen(open);
          if (!open) setAuthReason(null);
        }}
        reason={authReason}
      />

      {isOffline && (
        <div className="fixed bottom-4 left-4 z-50 bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
          <WifiOff size={16} />
          <span className="text-sm font-medium">{t("app.offline")}</span>
        </div>
      )}

      <AnimatePresence>
        {viewingFramework && (
          <FrameworkDetail
            framework={viewingFramework}
            onClose={() => setViewingFramework(null)}
            onStart={() => {
              setViewingFramework(null);
              // handleStartWizard expects fwId
              handleStartWizard(viewingFramework.id);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal onComplete={handleOnboardingComplete} />
        )}
        {showHelpChoose && (
          <HelpMeChooseModal
            onClose={() => setShowHelpChoose(false)}
            onSelect={(fw, context) => {
              setShowHelpChoose(false);
              handleStartWizard(fw, context);
            }}
          />
        )}
      </AnimatePresence>

      <Header
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        isAdmin={isAdmin}
        isMenuOpen={isMenuOpen}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        onSignOut={handleSignOut}
        onSignIn={() => setAuthOpen(true)}
        onGetStarted={startHelpMeFindFrameworkFlow}
      />

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        isAdmin={isAdmin}
        onSignOut={handleSignOut}
        onSignIn={() => setAuthOpen(true)}
        onGetStarted={startHelpMeFindFrameworkFlow}
      />

      <FeedbackButton
        pageContext={location.pathname}
        userEmail={userEmail}
        userId={userId}
      />

      <main
        id="main-content"
        className="relative pt-20 flex-grow"
        tabIndex={-1}
      >
        <ErrorBoundary
          fallback={
            <div className="flex justify-center pt-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50/90 dark:bg-amber-900/40 border border-amber-200/80 text-amber-800 dark:text-amber-100 text-sm shadow-sm">
                <span className="font-medium">
                  {t('errors.pageLoadTitle') || 'Oh sorry, something happened.'}
                </span>
                <span className="opacity-80">
                  {t('errors.pageLoadBody') || 'Could you please refresh the page?'}
                </span>
              </div>
            </div>
          }
        >
          <Suspense fallback={<LoadingFallback />}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route
                  path="/"
                  element={
                    <LandingPage
                      onStartWizard={handleStartWizard}
                      onShowHelpChoose={() => setShowHelpChoose(true)}
                      onHeroGetStarted={() => {
                        if (!userId) {
                          setAuthReason("signup_to_try");
                          toast.info(
                            t("app.auth.createAccountToTry") ||
                              "Create an account to try the service.",
                          );
                          setAuthOpen(true);
                        } else {
                          setShowHelpChoose(true);
                        }
                      }}
                      onViewFramework={setViewingFramework}
                      tier={tier}
                    />
                  }
                />

                <Route
                  path="/wizard"
                  element={
                    <motion.div
                      key="wizard"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <GoalWizard
                        framework={
                          location.state?.framework || selectedFramework
                        }
                        onBack={() => navigate("/")}
                        onSaveBlueprint={handleSaveBlueprint}
                        initialBlueprint={activeBlueprint}
                        tier={tier}
                        onSwitchFramework={(fw, isPreview) => {
                          setSelectedFramework(fw);
                          // Soft update URL/Location state so the wizard re-renders with new prop
                          navigate("/wizard", {
                            state: { framework: fw, isPreview },
                            replace: true,
                          });
                        }}
                        isPreviewMode={location.state?.isPreview}
                      />
                    </motion.div>
                  }
                />

                <Route
                  path="/today"
                  element={
                    <Suspense fallback={<LoadingFallback />}>
                      <TodayPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
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
                        onStartWizard={startHelpMeFindFrameworkFlow}
                        onPublishBlueprint={handlePublishBlueprint}
                        onLoadMore={handleLoadMore}
                        hasMore={hasMore}
                        isLoadingMore={isLoadingMore}
                        syncError={syncError}
                      />
                    </motion.div>
                  }
                />

                <Route
                  path="/community"
                  element={
                    <motion.div
                      key="community"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Community
                        userId={userId}
                        onBack={() => navigate("/")}
                        onImport={handleImportTemplate}
                        onCreate={() => handleStartWizard()}
                      />
                    </motion.div>
                  }
                />

                <Route
                  path="/pricing"
                  element={
                    <motion.div
                      key="pricing"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <PricingSection
                        onSelectTier={handlePricingTier}
                        currentTier={tier}
                        userEmail={userEmail}
                      />
                    </motion.div>
                  }
                />

                <Route
                  path="/frameworks/:id"
                  element={
                    <motion.div
                      key="framework-detail"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <FrameworkPage />
                    </motion.div>
                  }
                />

                <Route
                  path="/analytics"
                  element={
                    <motion.div
                      key="analytics"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <AnalyticsPage />
                    </motion.div>
                  }
                />

                <Route
                  path="/about"
                  element={
                    <motion.div
                      key="about"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <AboutPage />
                    </motion.div>
                  }
                />

                <Route
                  path="/legal"
                  element={
                    <motion.div
                      key="legal"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <LegalPage />
                    </motion.div>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    userId ? (
                      <motion.div
                        key="profile"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <Profile
                          userId={userId}
                          userEmail={userEmail}
                          onBack={() => navigate("/")}
                          onProfileUpdate={refreshProfile}
                        />
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                        <p className="text-gray-500 dark:text-gray-400">
                          {t("app.profile.signInRequired")}
                        </p>
                        <Button onClick={() => setAuthOpen(true)}>
                          {t("nav.signin")}
                        </Button>
                      </div>
                    )
                  }
                />

                <Route
                  path="/track/:blueprintId"
                  element={
                    userId ? (
                      <motion.div
                        key="tracker"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <TrackerPage />
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                        <p className="text-gray-500 dark:text-gray-400">
                          {t("app.profile.signInRequired")}
                        </p>
                        <Button onClick={() => setAuthOpen(true)}>
                          {t("nav.signin")}
                        </Button>
                      </div>
                    )
                  }
                />

                <Route
                  path="/share/:token"
                  element={
                    <motion.div
                      key="shared-plan"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <SharedPlanView />
                    </motion.div>
                  }
                />

                <Route
                  path="/admin"
                  element={
                    isAdmin ? (
                      <motion.div
                        key="admin"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <AdminDashboard onBack={() => navigate("/")} />
                      </motion.div>
                    ) : (
                      <div className="flex items-center justify-center h-screen text-xl font-medium">
                        {t("admin.accessDenied")}
                      </div>
                    )
                  }
                />
                <Route
                  path="*"
                  element={<div className="p-20 text-center">404</div>}
                />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </ErrorBoundary>
      </main>

      <SupportButton />

      {/* Footer */}
      {location.pathname !== "/wizard" && (
        <footer className="relative z-10 px-6 py-12 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <Logo className="w-6 h-6 rounded" />
              <span className="font-bold tracking-tight text-black dark:text-white">
                VECTOR
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-6 md:gap-8 text-sm text-gray-500 dark:text-gray-400">
              <button
                onClick={() => navigate("/legal?section=privacy")}
                className="hover:text-black dark:hover:text-white transition-colors font-medium cursor-pointer"
              >
                {t("footer.privacy")}
              </button>
              <button
                onClick={() => navigate("/legal?section=terms")}
                className="hover:text-black dark:hover:text-white transition-colors font-medium cursor-pointer"
              >
                {t("footer.terms")}
              </button>
              <button
                onClick={() => navigate("/legal?section=security")}
                className="hover:text-black dark:hover:text-white transition-colors font-medium cursor-pointer"
              >
                {t("footer.security")}
              </button>
              <a
                href="mailto:vectorgoal.contact@gmail.com"
                className="hover:text-black dark:hover:text-white transition-colors font-medium cursor-pointer"
              >
                {t("footer.contact")}
              </a>
              <span className="inline-flex items-center">
                <ShareButton />
              </span>
            </div>
            <div className="flex flex-col items-center md:items-end gap-1">
              <p className="text-sm text-gray-400">{t("footer.copyright")}</p>
              <button
                onClick={() => navigate("/about")}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
              >
                {t("footer.builtBy")}
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
