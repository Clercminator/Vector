import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Star, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/app/components/language-provider';

interface FeedbackButtonProps {
  pageContext: string;
  userEmail: string | null;
  userId: string | null;
}

export function FeedbackButton({ pageContext, userEmail, userId }: FeedbackButtonProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      toast.error(t('feedback.messageRequired') || 'Please enter your feedback.');
      return;
    }
    if (!supabase) {
      toast.error(t('common.error') || 'Something went wrong.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: userId || null,
        message: trimmed,
        rating: rating ?? null,
        page_context: pageContext || null,
        email: userEmail ? null : (email.trim() || null),
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success(t('feedback.thankYou') || 'Thank you! Your feedback helps us improve.');
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setMessage('');
        setRating(null);
        setEmail('');
      }, 1500);
    } catch (err) {
      console.error('Feedback submit error', err);
      toast.error(t('common.error') || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-black dark:bg-white text-white dark:text-black px-4 py-3 shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
        aria-label={t('feedback.buttonLabel') || 'Send feedback'}
      >
        <MessageCircle size={20} />
        <span className="text-sm font-medium">{t('feedback.button') || 'Feedback'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('feedback.title') || 'Send feedback'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('feedback.subtitle') || 'Your input helps us improve Vector.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !submitting && setOpen(false)}
                  aria-label={t('common.close') || 'Close'}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X size={22} />
                </button>
              </div>

              {submitted ? (
                <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                  <p className="font-medium">{t('feedback.thankYou') || 'Thank you! Your feedback helps us improve.'}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                      {t('feedback.ratingLabel') || 'How would you rate your experience?'} <span className="text-gray-400">({t('feedback.optional') || 'optional'})</span>
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
                        >
                          <Star
                            size={24}
                            className={rating !== null && n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="feedback-message" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                      {t('feedback.messageLabel') || 'Your feedback'} *
                    </label>
                    <Textarea
                      id="feedback-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t('feedback.messagePlaceholder') || 'What could we do better? What do you love?'}
                      rows={4}
                      className="w-full resize-none"
                      disabled={submitting}
                    />
                  </div>

                  {!userEmail && (
                    <div>
                      <label htmlFor="feedback-email" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                        {t('feedback.emailLabel') || 'Email'} <span className="text-gray-400">({t('feedback.optional') || 'optional'})</span>
                      </label>
                      <input
                        id="feedback-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                        disabled={submitting}
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={submitting}
                      className="flex-1 cursor-pointer"
                    >
                      {t('common.close') || 'Close'}
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || !message.trim()}
                      className="flex-1 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          {t('common.loading') || 'Loading...'}
                        </>
                      ) : (
                        t('feedback.submit') || 'Send feedback'
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
