import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { Blueprint, BlueprintTracker, GoalLog } from '@/lib/blueprints';
import { useLanguage } from '@/app/components/language-provider';
import { Button } from '@/app/components/ui/button';
import { Header } from '@/app/components/layout/Header';
import { Plus, CheckCircle2, Clock, CalendarHeart, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export function TodayPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [dueItems, setDueItems] = useState<{ blueprint: Blueprint; tracker: BlueprintTracker; completedToday: boolean; streakOrLast: string }[]>([]);

  useEffect(() => {
    loadTodayData();
  }, []);

  const loadTodayData = async () => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }
      setUserId(user.id);

      const { data: bps } = await supabase.from('blueprints').select('*').eq('user_id', user.id);
      const { data: trackers } = await supabase.from('blueprint_tracker').select('*').eq('user_id', user.id).eq('status', 'active');
      
      if (!bps || !trackers) {
        setLoading(false);
        return;
      }

      // Check completions for today
      const todayDate = new Date();
      todayDate.setHours(0,0,0,0);
      
      const { data: logs } = await supabase.from('goal_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', todayDate.toISOString());

      const todayStr = todayDate.toDateString();
      const logsByBp = (logs || []).reduce((acc: any, log: any) => {
        if (!acc[log.blueprint_id]) acc[log.blueprint_id] = [];
        acc[log.blueprint_id].push(log);
        return acc;
      }, {});

      const dayMap: Record<number, string> = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };
      const currentDayStr = dayMap[new Date().getDay()];

      const items = trackers.map((tracker: BlueprintTracker) => {
        const blueprint = bps.find(b => b.id === tracker.blueprint_id);
        if (!blueprint) return null;

        // Is it due today?
        let isDue = false;
        if (!tracker.frequency || tracker.frequency === 'daily' || tracker.frequency === 'custom') {
            const rd = tracker.reminder_days || [];
            if (rd.length === 0 || rd.includes('*') || rd.includes(currentDayStr)) {
                isDue = true;
            }
        }

        // Check if done today
        const bpLogs = logsByBp[blueprint.id] || [];
        const completedToday = bpLogs.some((l: any) => 
            (l.kind === 'check_in' && l.payload?.done) || l.kind === 'step_done'
        );

        let streakOrLast = '0 days';
        if (tracker.last_activity_at) {
             const lastD = new Date(tracker.last_activity_at);
             const diff = Math.floor((new Date().getTime() - lastD.getTime()) / (1000 * 3600 * 24));
             if (diff <= 1) streakOrLast = 'Active';
             else streakOrLast = `Last: ${diff} days ago`;
        } else {
             streakOrLast = 'Not started';
        }

        if (isDue) {
            return { blueprint, tracker, completedToday, streakOrLast };
        }
        return null;
      }).filter(Boolean);

      setDueItems(items as any);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleQuickLog = async (blueprintId: string) => {
    if (!supabase || !userId) return;
    try {
        const newLog = {
            blueprint_id: blueprintId,
            user_id: userId,
            kind: 'check_in',
            payload: { done: true }
        };

        const { error } = await supabase.from('goal_logs').insert(newLog);
        if (error) throw error;
        
        // Update local state instantly
        setDueItems(prev => prev.map(item => 
            item.blueprint.id === blueprintId ? { ...item, completedToday: true, streakOrLast: 'Active' } : item
        ));
        
        toast.success(t('tracker.loggedSummary') || "Activity logged!");
    } catch (e) {
        toast.error(t('common.error'));
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight text-black dark:text-white uppercase flex flex-col items-center gap-2">
            <CalendarHeart size={48} className="text-blue-500 mb-2" />
            {t('tracker.todayTitle') || "Due today"}
        </h1>
        <p className="text-gray-500 text-lg">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {loading ? (
          <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />)}
          </div>
      ) : dueItems.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-zinc-800">
             <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 className="text-gray-400" size={32} />
             </div>
             <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                 {t('tracker.todayEmpty') || "Nothing due today"}
             </h3>
             <Button onClick={() => navigate('/dashboard')} className="mt-6 rounded-full px-8">{t('tracker.backToPlans') || "Dashboard"}</Button>
          </div>
      ) : (
          <div className="space-y-4">
              <AnimatePresence>
                  {dueItems.map(({ blueprint, tracker, completedToday, streakOrLast }) => (
                      <motion.div 
                          key={blueprint.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer ${completedToday ? 'bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-800' : 'bg-white dark:bg-zinc-900 border-blue-200 dark:border-blue-900 hover:border-blue-300 shadow-sm'}`}
                          onClick={() => navigate(`/track/${blueprint.id}`)}
                      >
                          <div className="flex-1 pr-4">
                              <h3 className={`text-lg md:text-xl font-bold mb-1 ${completedToday ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                  {blueprint.title}
                              </h3>
                              <p className="text-sm font-bold text-gray-500 flex items-center gap-2">
                                  <Clock size={14} className={completedToday ? 'text-gray-400' : 'text-blue-500'} /> 
                                  {streakOrLast}
                              </p>
                          </div>
                          
                          <div className="shrink-0">
                              {completedToday ? (
                                  <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                                      <CheckCircle2 size={28} className="text-green-600 dark:text-green-400" />
                                  </div>
                              ) : (
                                  <button 
                                      onClick={(e) => { e.stopPropagation(); handleQuickLog(blueprint.id); }}
                                      className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-white shadow-lg cursor-pointer flex-shrink-0"
                                  >
                                      <Plus size={32} />
                                  </button>
                              )}
                          </div>
                      </motion.div>
                  ))}
              </AnimatePresence>
          </div>
      )}
    </div>
  );
}
