import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Clock, Calendar as CalendarIcon, Palette, HelpCircle, PiggyBank, Tag, Plus, Trash2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/app/components/language-provider';
import { Blueprint, BlueprintTracker, BlueprintReminder } from '@/lib/blueprints';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface TrackerEditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  blueprint: Blueprint;
  tracker: BlueprintTracker;
  onSave: (updatedBlueprint: Partial<Blueprint>, updatedTracker: Partial<BlueprintTracker>) => Promise<void>;
}

export function TrackerEditPanel({ isOpen, onClose, blueprint, tracker, onSave }: TrackerEditPanelProps) {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState(blueprint.title);
  const [trackingQuestion, setTrackingQuestion] = useState(tracker.trackingQuestion || '');
  const [color, setColor] = useState(tracker.color || '');
  const [frequency, setFrequency] = useState<'daily'|'weekly'|'custom'>(tracker.frequency || 'daily');
  const [reminders, setReminders] = useState<{ id?: string, time: string, days: string[] }[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [savingsEnabled, setSavingsEnabled] = useState(tracker.savings_enabled || false);
  const [savingsBaseline, setSavingsBaseline] = useState(tracker.savings_baseline || 0);
  const [savingsUnit, setSavingsUnit] = useState(tracker.savings_unit || '$');
  const [tagsText, setTagsText] = useState(tracker.tags ? tracker.tags.join(', ') : '');

  useEffect(() => {
    if (isOpen) {
      setTitle(blueprint.title);
      setTrackingQuestion(tracker.tracking_question || '');
      setColor(tracker.color || '');
      setFrequency(tracker.frequency || 'daily');
      setSavingsEnabled(tracker.savings_enabled || false);
      setSavingsBaseline(tracker.savings_baseline || 0);
      setSavingsUnit(tracker.savings_unit || '$');
      setTagsText(tracker.tags ? tracker.tags.join(', ') : '');

      if (supabase) {
        setLoadingReminders(true);
        supabase.from('blueprint_reminders').select('*').eq('blueprint_id', blueprint.id)
          .then(({ data }) => {
            if (data && data.length > 0) {
              setReminders(data);
            } else if (tracker.reminder_enabled) {
              // Migrate legacy
              setReminders([{ time: tracker.reminder_time || '09:00', days: tracker.reminder_days || ['*'] }]);
            } else {
              setReminders([]);
            }
            setLoadingReminders(false);
          });
      }
    }
  }, [isOpen, blueprint, tracker]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (supabase) {
        await supabase.from('blueprint_reminders').delete().eq('blueprint_id', blueprint.id);
        if (reminders.length > 0) {
            const userRes = await supabase.auth.getUser();
            const user_id = userRes.data.user?.id;
            if (user_id) {
                const inserts = reminders.map(r => ({
                    blueprint_id: blueprint.id,
                    user_id: user_id,
                    time: r.time,
                    days: r.days.length === 0 ? ['*'] : r.days
                }));
                await supabase.from('blueprint_reminders').insert(inserts);
            }
        }
      }

      await onSave(
        { title },
        {
          tracking_question: trackingQuestion || null,
          color: color || null,
          frequency,
          reminder_enabled: false, // legacy reset
          reminder_time: null,
          reminder_days: null,
          savings_enabled: savingsEnabled,
          savings_baseline: savingsBaseline,
          savings_unit: savingsUnit,
          tags: tagsText.split(',').map(s => s.trim()).filter(Boolean)
        }
      );
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to save settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDay = (idx: number, day: string) => {
    const updated = [...reminders];
    const currentDays = updated[idx].days;
    
    if (currentDays.includes('*')) {
      updated[idx].days = [day];
    } else {
      if (currentDays.includes(day)) {
        const next = currentDays.filter(d => d !== day);
        updated[idx].days = next.length === 0 ? ['*'] : next;
      } else {
        updated[idx].days = [...currentDays, day];
      }
    }
    setReminders(updated);
  };

  const dayOptions = [
    { value: 'mon', label: 'M' },
    { value: 'tue', label: 'T' },
    { value: 'wed', label: 'W' },
    { value: 'thu', label: 'T' },
    { value: 'fri', label: 'F' },
    { value: 'sat', label: 'S' },
    { value: 'sun', label: 'S' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 p-6 overflow-y-auto z-50 flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold dark:text-white">{t('tracker.editPlan')}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-6">
              {/* Plan Name */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Plan Name</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                />
              </div>

              {/* Tracking Question */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <HelpCircle size={16} /> {t('tracker.trackingQuestion')}
                </label>
                <input
                  type="text"
                  placeholder={t('tracker.trackingQuestionPlaceholder')}
                  value={trackingQuestion}
                  onChange={e => setTrackingQuestion(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Tag size={16} /> {t('tracker.tags') || "Tags (comma separated)"}
                </label>
                <input
                  type="text"
                  placeholder={t('tracker.tagsPlaceholder') || "e.g. health, project, daily"}
                  value={tagsText}
                  onChange={e => setTagsText(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                />
              </div>

              {/* Color */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Palette size={16} /> {t('tracker.color')}
                </label>
                <input
                  type="color"
                  value={color || '#3b82f6'}
                  onChange={e => setColor(e.target.value)}
                  className="w-16 h-12 rounded-xl cursor-pointer bg-transparent border-0"
                  style={{ padding: 0 }}
                />
              </div>

              {/* Frequency */}
              {tracker.plan_kind === 'infinite' && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <CalendarIcon size={16} /> {t('tracker.frequency')}
                  </label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as any)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all cursor-pointer appearance-none"
                  >
                    <option value="daily">{t('tracker.frequency.daily')}</option>
                    <option value="weekly">{t('tracker.frequency.weekly')}</option>
                    <option value="custom">{t('tracker.frequency.custom')}</option>
                  </select>
                </div>
              )}

              <div className="space-y-4 pt-6 mt-6 border-t border-gray-200 dark:border-zinc-800">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={savingsEnabled}
                    onChange={e => setSavingsEnabled(e.target.checked)}
                    className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500 bg-gray-100 dark:bg-zinc-800 border-transparent dark:border-zinc-700"
                  />
                  <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <PiggyBank size={16} /> {t('tracker.savings') || "Track Savings"}
                  </span>
                </label>

                {savingsEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pl-8"
                  >
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase text-left block">Amount per entry</label>
                        <input
                          type="number"
                          value={savingsBaseline}
                          onChange={e => setSavingsBaseline(parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                      </div>
                      <div className="w-24 space-y-2">
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase text-left block">Unit</label>
                        <input
                          type="text"
                          value={savingsUnit}
                          onChange={e => setSavingsUnit(e.target.value)}
                          placeholder="$"
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Reminder Settings */}
              <div className="space-y-4 pt-6 mt-6 border-t border-gray-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock size={16} /> {t('tracker.reminders.title') || 'Reminders'}
                  </span>
                  {!loadingReminders && reminders.length < 3 && (
                    <button
                      onClick={() => setReminders([...reminders, { time: '09:00', days: ['*'] }])}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                    >
                      <Plus size={14} /> {t('tracker.reminders.add')}
                    </button>
                  )}
                  {!loadingReminders && reminders.length >= 3 && (
                    <span className="text-xs text-orange-500 font-medium">
                      {t('tracker.reminders.max')}
                    </span>
                  )}
                </div>

                {loadingReminders ? (
                   <div className="flex justify-center p-4">
                     <Loader2 className="animate-spin text-gray-400" size={20} />
                   </div>
                ) : (
                   <div className="space-y-6">
                     {reminders.map((reminder, idx) => (
                       <motion.div
                         key={idx}
                         initial={{ opacity: 0, y: 5 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 space-y-4"
                       >
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                             <input
                               type="time"
                               value={reminder.time}
                               onChange={e => {
                                 const updated = [...reminders];
                                 updated[idx].time = e.target.value;
                                 setReminders(updated);
                               }}
                               className="px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                             />
                           </div>
                           <button
                             onClick={() => setReminders(reminders.filter((_, i) => i !== idx))}
                             className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors cursor-pointer"
                           >
                             <Trash2 size={16} />
                           </button>
                         </div>

                         <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                             {t('tracker.reminders.days')}
                           </label>
                           <div className="flex flex-wrap gap-2">
                             {dayOptions.map(day => {
                               const isSelected = reminder.days.includes('*') || reminder.days.includes(day.value);
                               return (
                                 <button
                                   key={day.value}
                                   onClick={() => toggleDay(idx, day.value)}
                                   className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex justify-center items-center text-sm font-bold transition-colors cursor-pointer ${
                                     isSelected ? 'bg-blue-500 text-white' : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-zinc-700'
                                   }`}
                                 >
                                   {day.label}
                                 </button>
                               );
                             })}
                           </div>
                         </div>
                       </motion.div>
                     ))}
                   </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-zinc-800">
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-black dark:bg-white dark:text-black text-white rounded-xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
