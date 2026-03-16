import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

import { useLanguage } from '@/app/components/language-provider';

import { Rocket, Mail, Lock, ArrowLeft, Chrome, Github } from 'lucide-react';
import { Logo } from '@/app/components/Logo';

import HCaptcha from '@hcaptcha/react-hcaptcha';

type Mode = "signin" | "signup" | "forgot_password" | "magic_link";

// Simple Google Icon Component since lucide-react doesn't have brand icons usually
const GoogleIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.21l.81-.63z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);


export function AuthModal({
  open,
  onOpenChange,
  reason = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: 'signup_to_try' | null;
}) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("signin");

  // When we need account to try the service, default to signup and show that message
  React.useEffect(() => {
    if (open && reason === 'signup_to_try') {
      setMode('signup');
    }
  }, [open, reason]);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSentState, setEmailSentState] = useState<{ email: string; type: 'signup' | 'magic_link' | 'forgot_password' } | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = React.useRef<HCaptcha>(null);
  
  const passwordValid = useMemo(() => {
    if (mode !== 'signup') return password.length >= 6;
    return password.length >= 6 && /\d/.test(password) && /[a-zA-Z]/.test(password);
  }, [password, mode]);

  const canSubmit = useMemo(() => {
      if (mode === 'magic_link' || mode === 'forgot_password') {
          return email.trim().includes("@");
      }
      return email.trim().includes("@") && passwordValid;
  }, [email, password, passwordValid, mode]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
        setMode("signin");
        setEmail("");
        setPassword("");
        setEmailSentState(null);
        setCaptchaToken(null);
        captchaRef.current?.resetCaptcha();
    }
    onOpenChange(next);
  };

  const handleSocialAuth = async (provider: 'google' | 'github') => {
      if (!isSupabaseConfigured || !supabase) {
          toast.error(t('auth.noSupabase'));
          return;
      }
      setIsLoading(true);
      try {
          const { error } = await supabase.auth.signInWithOAuth({
              provider,
              options: {
                  redirectTo: window.location.origin,
              },
          });
          if (error) throw error;
      } catch (e: any) {
          console.error("Social auth error:", e);
          toast.error(e.message || "Failed to sign in with " + provider);
          setIsLoading(false);
      }
  };

  const handleAuth = async () => {
    if (!isSupabaseConfigured || !supabase) {
      toast.error(t('auth.noSupabase'));
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    if (!captchaToken && (mode === 'signup' || mode === 'magic_link')) {
        toast.error(t('auth.completeCaptcha'));
        return;
    }

    setIsLoading(true);
    const emailRedirectTo = window.location.origin;

    try {
        let error;
        let data;

        if (mode === 'signin') {
             const res = await supabase.auth.signInWithPassword({
                 email: trimmedEmail,
                 password,
             });
             error = res.error;
             data = res.data;
             if (!error) {
                 toast.success(t('auth.welcomeBack'));
                 onOpenChange(false);
             }
        } else if (mode === 'signup') {
            const res = await supabase.auth.signUp({
                email: trimmedEmail,
                password,
                options: {
                    emailRedirectTo,
                    captchaToken: captchaToken || undefined,
                },
            });
            error = res.error;
            data = res.data;
            if (!error) {
                 if (data.user && !data.session) {
                     setEmailSentState({ email: trimmedEmail, type: 'signup' });
                     toast.success(t('auth.checkEmailConfirm') || "Please check your email to confirm your account.", { duration: 15000 });
                 } else {
                     toast.success(t('auth.accountCreated') || "Account created successfully!", { duration: 15000 });
                     onOpenChange(false);
                 }
            }
        } else if (mode === 'magic_link') {
             const res = await supabase.auth.signInWithOtp({
                 email: trimmedEmail,
                 options: { 
                     emailRedirectTo,
                     captchaToken: captchaToken || undefined,
                 },
             });
             error = res.error;
            if (!error) {
                setEmailSentState({ email: trimmedEmail, type: 'magic_link' });
                toast.success(t('auth.success') || "Magic link sent! Check your inbox.", { duration: 15000 });
            }
        } else if (mode === 'forgot_password') {
            const res = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
                redirectTo: `${window.location.origin}/reset-password`,
                captchaToken: captchaToken || undefined,
            });
            error = res.error;
            if (!error) {
                setEmailSentState({ email: trimmedEmail, type: 'forgot_password' });
                toast.success(t('auth.resetLinkSent') || "Password reset link sent to your email.", { duration: 15000 });
            }
        }

        if (error) throw error;

    } catch (e: any) {
        console.error("Auth error:", e);
        toast.error(e.message || t('auth.authenticationFailed') || "Authentication failed", { duration: 15000 });
        captchaRef.current?.resetCaptcha();
        setCaptchaToken(null);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md dark:bg-zinc-950 border-none shadow-2xl p-0 overflow-hidden rounded-3xl max-h-[90vh] flex flex-col">
        <div className="relative p-6 pt-8 overflow-y-auto flex-1 min-h-0">
            {/* Background Decorative Gradient */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent -z-10" />

            <DialogHeader className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                  <Logo className="w-10 h-10 rounded-xl shadow-lg" />
                  <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white">Vector</span>
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {reason === 'signup_to_try' ? t('auth.createAccount') :
                 mode === "signin" ? t('auth.welcomeBack') : 
                 mode === "signup" ? t('auth.createAccount') :
                 mode === "forgot_password" ? t('auth.resetPassword') :
                 t('auth.continueSignIn')}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                {reason === 'signup_to_try' ? (t('app.auth.createAccountToTry') || 'Create an account to try the service.') :
                 mode === "signin" ? t('auth.credentialsDesc') :
                 mode === "signup" ? t('auth.signupDesc2') :
                 mode === "forgot_password" ? t('auth.resetDesc') :
                 t('auth.magicLinkDesc')}
              </DialogDescription>
            </DialogHeader>

            {!isSupabaseConfigured && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/10 dark:border-red-900/50 dark:text-red-400 flex items-center gap-3">
                <span className="shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {t('auth.noSupabase')}
              </div>
            )}

            {emailSentState ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800/50 p-6 space-y-3">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Mail className="w-5 h-5 shrink-0" />
                  <span className="font-semibold">{t('auth.checkEmail')}</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-300">
                  {emailSentState.type === 'signup' && (t('auth.checkEmailConfirmDesc') || "We've sent a confirmation link to your email. Click it to activate your account.")}
                  {emailSentState.type === 'magic_link' && (t('auth.magicLinkSentDesc') || "We've sent a sign-in link to your email. Click it to sign in.")}
                  {emailSentState.type === 'forgot_password' && (t('auth.resetLinkSentDesc') || "We've sent a password reset link. Check your inbox and follow the instructions.")}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t('auth.checkSpam')}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 break-all">
                  {emailSentState.email}
                </p>
                <button
                  onClick={() => { setEmailSentState(null); setMode("signin"); }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t('auth.tryDifferentEmail')}
                </button>
              </div>
            ) : (
            <div className="space-y-4">
                {/* Social Auth Buttons */}
                {(mode === 'signin' || mode === 'signup') && (
                    <div className="grid grid-cols-2 gap-3">
                        <Button 
                            variant="outline" 
                            className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:text-white flex items-center gap-2"
                            onClick={() => handleSocialAuth('google')}
                            disabled={isLoading}
                        >
                            <GoogleIcon className="w-5 h-5" />
                            Google
                        </Button>
                        <Button 
                            variant="outline" 
                            className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:text-white flex items-center gap-2"
                            onClick={() => handleSocialAuth('github')}
                            disabled={isLoading}
                        >
                            <Github className="w-5 h-5" />
                            GitHub
                        </Button>
                    </div>
                )}

                {(mode === 'signin' || mode === 'signup') && (
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-500">{t('auth.orContinueWith')}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1" htmlFor="email">
                      {t('auth.emailAddress')}
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('auth.placeholder')}
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl px-4 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                    />
                  </div>
                  
                  {(mode === 'signin' || mode === 'signup') && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1" htmlFor="password">
                            {t('auth.password')}
                            </label>
                            {mode === 'signin' && (
                                <button 
                                    onClick={() => setMode('forgot_password')}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {t('auth.forgotPassword')}
                                </button>
                            )}
                        </div>
                        <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl px-4 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                        />
                        {mode === 'signup' && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-500 ml-1">
                            {t('auth.passwordRequirements') || "At least 6 characters, with letters and numbers."}
                          </p>
                        )}
                      </div>
                  )}
                  
                  {/* Captcha for Sign Up, Magic Link, Forgot Password */}
                  {(mode === 'signup' || mode === 'magic_link' || mode === 'forgot_password') && (
                    <div className="flex justify-center my-2 scale-90 origin-center">
                        <HCaptcha
                            ref={captchaRef}
                            sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY || "10000000-ffff-ffff-ffff-000000000001"}
                            onVerify={(token) => setCaptchaToken(token)}
                            onExpire={() => setCaptchaToken(null)}
                        />
                    </div>
                  )}

                  <Button 
                      className="h-12 w-full bg-black dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-[0.98] rounded-xl font-bold shadow-xl shadow-black/10 transition-all disabled:opacity-50" 
                      onClick={handleAuth} 
                      disabled={!canSubmit || isLoading || ((mode === 'signup' || mode === 'magic_link') && !captchaToken)}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                           <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                           {t('auth.loading')}
                      </div>
                    ) : (
                      mode === "signin" ? t('auth.signIn') : 
                      mode === "signup" ? t('auth.continueSignUp') :
                      mode === "forgot_password" ? t('auth.sendResetLink') :
                      t('auth.sendMagicLink')
                    )}
                  </Button>
                </div>

                <div className="flex flex-col gap-2 text-center mt-4">
                    {mode === 'signin' ? (
                        <>
                            <button 
                                onClick={() => setMode("signup")}
                                className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white text-sm transition-colors cursor-pointer"
                            >
                                {t('auth.needAccount')}
                            </button>
                            <button 
                                onClick={() => setMode("magic_link")}
                                className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                                <Mail className="w-3 h-3" /> {t('auth.signInWithMagicLink')}
                            </button>
                        </>
                    ) : mode === 'signup' ? (
                        <button 
                            onClick={() => setMode("signin")}
                            className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white text-sm transition-colors cursor-pointer"
                        >
                            {t('auth.haveAccount')}
                        </button>
                    ) : (
                        <button 
                            onClick={() => setMode("signin")}
                            className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> {t('auth.backToSignIn')}
                        </button>
                    )}
                </div>
            </div>
            )}
            
            {!emailSentState && (
              <p className="mt-4 text-center text-[10px] text-zinc-400 dark:text-zinc-600 px-2">
                {t('auth.terms')}
              </p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


