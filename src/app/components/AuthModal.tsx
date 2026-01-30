import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

type Mode = "signin" | "ready";

import { useLanguage } from '@/app/components/language-provider';

// ... types

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
  const canSubmit = useMemo(() => email.trim().includes("@"), [email]);

  const handleOpenChange = (next: boolean) => {
    if (!next) setMode("signin");
    onOpenChange(next);
  };

  const handleSendLink = async () => {
    if (!isSupabaseConfigured || !supabase) {
      toast.error(t('auth.noSupabase'));
      return;
    }

    const trimmed = email.trim();
    if (!trimmed) return;

    const emailRedirectTo = window.location.origin;

    const p = supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo },
    });

    toast.promise(p, {
      loading: "Sending magic link…",
      success: t('auth.success') || "Link sent!", // added a fallback just in case
      error: (e) => (e instanceof Error ? e.message : "Failed to send sign-in link."),
    });

    const res = await p;
    if (!res.error) setMode("ready");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md dark:bg-zinc-900 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">{t('auth.title')}</DialogTitle>
          <DialogDescription className="dark:text-zinc-400">
            {t('auth.desc')}
          </DialogDescription>
        </DialogHeader>

        {!isSupabaseConfigured && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/10 dark:border-red-900/50 dark:text-red-400">
            {t('auth.noSupabase')}
          </div>
        )}

        {mode === "signin" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300" htmlFor="email">
                {t('auth.email')}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:placeholder-zinc-500"
              />
            </div>
            <Button className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90" onClick={handleSendLink} disabled={!canSubmit}>
              {t('auth.submit')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
              {t('auth.sent')} <span className="font-medium text-black dark:text-white">{email.trim()}</span>.
            </div>
            <Button className="w-full dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700" variant="secondary" onClick={() => setMode("signin")}>
              {t('auth.diffEmail')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

