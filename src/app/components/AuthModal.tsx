import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

// Removed duplicate Mode definition

import { useLanguage } from '@/app/components/language-provider';

import { Rocket } from 'lucide-react';
import { Logo } from '@/app/components/Logo';

import HCaptcha from '@hcaptcha/react-hcaptcha';

type Mode = "signin" | "signup" | "ready";

export function AuthModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<Mode>("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = React.useRef<HCaptcha>(null);
  
  const canSubmit = useMemo(() => email.trim().includes("@"), [email]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
        setMode("signin");
        setEmail("");
        setCaptchaToken(null);
        captchaRef.current?.resetCaptcha();
    }
    onOpenChange(next);
  };

  const handleAuth = async () => {
    if (!isSupabaseConfigured || !supabase) {
      toast.error(t('auth.noSupabase'));
      return;
    }

    const trimmed = email.trim();
    if (!trimmed) return;

    // Supabase often requires Captcha for Magic Link (Sign In) too
    if (!captchaToken) {
        toast.error("Please complete the captcha.");
        return;
    }

    setIsLoading(true);
    const emailRedirectTo = window.location.origin;

    console.log("Supabase Auth Debug:", {
        url: import.meta.env.VITE_SUPABASE_URL,
        keyStart: import.meta.env.VITE_SUPABASE_ANON_KEY ? import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 10) + "..." : "MISSING",
        redirect: emailRedirectTo,
        hasCaptcha: !!captchaToken
    });

    const p = supabase.auth.signInWithOtp({
      email: trimmed,
      options: { 
          emailRedirectTo,
          captchaToken,
      },
    });

    toast.promise(p, {
      loading: mode === "signin" ? t('auth.signingIn') || "Signing in..." : t('auth.creatingAccount') || "Creating your account...",
      success: t('auth.success') || "Magic link sent! Check your inbox.",
      error: (e: any) => {
          captchaRef.current?.resetCaptcha();
          setCaptchaToken(null);
          return e instanceof Error ? e.message : "Authentication failed.";
      },
    });

    try {
        const { error } = await p;
        if (!error) {
            setMode("ready");
        }
    } catch (err) {
        console.error("Auth error details:", err);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md dark:bg-zinc-950 border-none shadow-2xl p-0 overflow-hidden rounded-3xl">
        <div className="relative p-8 pt-10">
            {/* Background Decorative Gradient */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent -z-10" />

            <DialogHeader className="mb-8">
              <Logo className="w-12 h-12 rounded-2xl mb-6 shadow-xl transform -rotate-6" />
              <DialogTitle className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {mode === "ready" ? t('auth.checkEmail') || "Check your email" : 
                 mode === "signin" ? t('auth.welcomeBack') || "Welcome back" : 
                 t('auth.createAccount') || "Start your journey"}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 dark:text-zinc-400 text-lg">
                {mode === "ready" ? t('auth.sentDesc') || "We've sent a magic link to your inbox." : 
                 mode === "signin" ? t('auth.signinDesc') || "Sign in to continue your goal architecture." :
                 t('auth.signupDesc') || "Join Vector to build deconstructed goal blueprints."}
              </DialogDescription>
            </DialogHeader>

            {!isSupabaseConfigured && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/10 dark:border-red-900/50 dark:text-red-400 flex items-center gap-3">
                <span className="shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {t('auth.noSupabase')}
              </div>
            )}

            {mode !== "ready" ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1" htmlFor="email">
                    {t('auth.emailAddress') || "Email Address"}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                    className="h-14 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 text-lg focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                  />
                </div>
                
                {/* hCaptcha (Required for both Sign In and Sign Up if Supabase protection is enabled) */}
                <div className="flex justify-center my-4">
                    <HCaptcha
                        ref={captchaRef}
                        sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY || "10000000-ffff-ffff-ffff-000000000001"}
                        onVerify={(token) => setCaptchaToken(token)}
                        onExpire={() => setCaptchaToken(null)}
                    />
                </div>
                
                <Button 
                    className="h-14 w-full bg-black dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-[0.98] rounded-2xl text-lg font-bold shadow-xl shadow-black/10 transition-all disabled:opacity-50" 
                    onClick={handleAuth} 
                    disabled={!canSubmit || isLoading || !captchaToken}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                         <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                         {t('auth.loading') || "Processing..."}
                    </div>
                  ) : (
                    mode === "signin" ? t('auth.continueSignIn') || "Sign In with Magic Link" : t('auth.continueSignUp') || "Create Account"
                  )}
                </Button>

                <div className="text-center">
                    <button 
                        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                        className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white text-sm font-medium transition-colors cursor-pointer"
                    >
                        {mode === "signin" ? t('auth.needAccount') || "Don't have an account? Sign up" : t('auth.haveAccount') || "Already have an account? Sign in"}
                    </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 p-6 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-center">
                  <div className="mb-4 text-zinc-900 dark:text-white font-semibold">
                       {t('auth.sentTo') || "Link sent to"}: <span className="text-blue-600 dark:text-blue-400 break-all">{email.trim()}</span>
                  </div>
                  <p className="text-sm">
                      {t('auth.checkSpam') || "If you don't see it, check your spam folder."}
                  </p>
                </div>
                <Button 
                    className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 h-14 rounded-2xl font-bold transition-all" 
                    variant="ghost" 
                    onClick={() => setMode("signin")}
                >
                  {t('auth.tryDifferentEmail') || "Try a different email"}
                </Button>
              </div>
            )}
            
            <p className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-500 px-4">
                {t('auth.terms') || "By continuing, you agree to Vector's Terms of Service and Privacy Policy."}
            </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

