import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Star, Loader2, Send } from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useLanguage } from "@/app/components/language-provider";

interface FeedbackButtonProps {
  pageContext: string;
  userEmail: string | null;
  userId: string | null;
}

export function FeedbackButton({
  pageContext,
  userEmail,
  userId,
}: FeedbackButtonProps) {
  const { t } = useLanguage();
  const isLandingPage = pageContext === "/";
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      toast.error(t("feedback.messageRequired"));
      return;
    }
    if (!supabase) {
      toast.error(t("common.error"));
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("feedback").insert({
        user_id: userId || null,
        message: trimmed,
        rating: rating ?? null,
        page_context: pageContext || null,
        email: userEmail ? null : email.trim() || null,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success(t("feedback.thankYou"));
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setMessage("");
        setRating(null);
        setEmail("");
      }, 1500);
    } catch (err) {
      console.error("Feedback submit error", err);
      toast.error(t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 left-6 z-40 flex items-center gap-2.5 rounded-full px-5 py-3 shadow-xl border border-gray-200/50 dark:border-white/20 bg-white/95 dark:bg-zinc-900/95 text-gray-900 dark:text-white backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 dark:focus-visible:ring-white/50",
          isLandingPage &&
            "bottom-4 left-auto right-4 h-12 w-12 justify-center gap-0 px-0 py-0 sm:bottom-6 sm:left-6 sm:right-auto sm:h-auto sm:w-auto sm:justify-start sm:gap-2.5 sm:px-5 sm:py-3",
          pageContext.startsWith("/wizard") && "hidden md:flex",
        )}
        aria-label={t("feedback.button")}
      >
        <MessageCircle
          size={20}
          className="text-gray-600 dark:text-gray-300 shrink-0"
        />
        <span
          className={cn(
            "text-sm font-semibold tracking-tight",
            isLandingPage && "hidden sm:inline",
          )}
        >
          {t("feedback.button")}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden"
            >
              <div className="p-6 pb-5 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-start gap-4">
                <div className="flex gap-4 items-start min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg">
                    <MessageCircle size={24} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                      {t("feedback.button")}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {t("feedback.subtitle")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !submitting && setOpen(false)}
                  aria-label={t("common.close")}
                  className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {submitted ? (
                <div className="p-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <Send size={28} className="text-emerald-500" />
                  </div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">
                    {t("feedback.thankYou")}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                      {t("feedback.ratingLabel")}{" "}
                      <span className="text-gray-400 font-normal">
                        ({t("feedback.optional")})
                      </span>
                    </label>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
                          aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
                        >
                          <Star
                            size={26}
                            className={`transition-colors ${rating !== null && n <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-zinc-600 hover:text-amber-400/60"}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="feedback-message"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2"
                    >
                      {t("feedback.messageLabel")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="feedback-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t("feedback.messagePlaceholder")}
                      rows={4}
                      className="w-full resize-none rounded-xl border-gray-200 dark:border-zinc-700 focus-visible:ring-2 focus-visible:ring-violet-500/30"
                      disabled={submitting}
                    />
                  </div>

                  {!userEmail && (
                    <div>
                      <label
                        htmlFor="feedback-email"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2"
                      >
                        {t("feedback.emailLabel")}{" "}
                        <span className="text-gray-400 font-normal">
                          ({t("feedback.optional")})
                        </span>
                      </label>
                      <input
                        id="feedback-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:focus:ring-violet-400/30"
                        disabled={submitting}
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={submitting}
                      className="flex-1 rounded-xl cursor-pointer"
                    >
                      {t("common.close")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || !message.trim()}
                      className="flex-1 rounded-xl cursor-pointer bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-violet-500/25"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          {t("common.loading")}
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          {t("feedback.button")}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
