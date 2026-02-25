import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/app/components/language-provider';
import { Plus, Target, CheckCircle2, Circle, XCircle, Trash2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';

interface SubGoal {
  id: string;
  title: string;
  target_date: string;
  status: 'active' | 'completed' | 'missed';
}

export function TrackerSubGoals({ blueprintId, userId, color }: { blueprintId: string; userId: string; color?: string }) {
  const { t } = useLanguage();
  const [goals, setGoals] = useState<SubGoal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  useEffect(() => {
    if (!blueprintId || !supabase) return;
    
    const fetchGoals = async () => {
      const { data, error } = await supabase
        .from('blueprint_sub_goals')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .order('target_date', { ascending: true });
        
      if (!error && data) {
        // Auto-mark missed
        const todayStr = new Date().toISOString().split('T')[0];
        let changed = false;
        const updated = data.map((g: any) => {
           if (g.status === 'active' && g.target_date < todayStr) {
               changed = true;
               return { ...g, status: 'missed' };
           }
           return g;
        });
        setGoals(updated);
        
        if (changed) {
            // Update db quietly
            updated.filter(g => g.status === 'missed').forEach(g => {
                supabase.from('blueprint_sub_goals').update({ status: 'missed' }).eq('id', g.id).then();
            });
        }
      }
      setLoading(false);
    };
    
    fetchGoals();
  }, [blueprintId]);

  const handleAddGoal = async () => {
    if (!newTitle.trim() || !newDate || !supabase) return;
    
    const newGoal = {
      blueprint_id: blueprintId,
      user_id: userId,
      title: newTitle.trim(),
      target_date: newDate,
      status: 'active' as const
    };
    
    const { data, error } = await supabase.from('blueprint_sub_goals').insert(newGoal).select().single();
    if (error) {
      toast.error(t('common.error'));
      return;
    }
    
    setGoals([...goals, data].sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime()));
    setNewTitle('');
    setNewDate('');
    setIsAdding(false);
    toast.success("Sub-goal added");
  };

  const handleToggleStatus = async (goal: SubGoal) => {
    let nextStatus: 'active' | 'completed' | 'missed' = 'completed';
    if (goal.status === 'completed') nextStatus = 'active';
    else if (goal.status === 'missed') nextStatus = 'active';
    else nextStatus = 'completed';

    const oldGoals = [...goals];
    setGoals(goals.map(g => g.id === goal.id ? { ...g, status: nextStatus } : g));
    
    if (supabase) {
        const { error } = await supabase.from('blueprint_sub_goals').update({ status: nextStatus }).eq('id', goal.id);
        if (error) {
            setGoals(oldGoals);
            toast.error(t('common.error'));
        }
    }
  };

  const handleDelete = async (id: string) => {
    const oldGoals = [...goals];
    setGoals(goals.filter(g => g.id !== id));
    
    if (supabase) {
        const { error } = await supabase.from('blueprint_sub_goals').delete().eq('id', id);
        if (error) {
            setGoals(oldGoals);
            toast.error(t('common.error'));
        }
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
            <Target size={20} className="text-indigo-500" /> {t('tracker.subGoals') || "Sub-goals"}
        </h2>
        <Button onClick={() => setIsAdding(true)} variant="outline" size="sm" className="gap-1 rounded-xl">
            <Plus size={16} /> {t('tracker.addSubGoal') || "Add"}
        </Button>
      </div>

      {isAdding && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-700">
             <div className="flex flex-col md:flex-row gap-3">
                 <input 
                    type="text" 
                    placeholder={t('tracker.subGoalTitle') || "Goal title"}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                 />
                 <input 
                    type="date" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full md:w-auto px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                 />
                 <div className="flex gap-2">
                     <Button onClick={handleAddGoal} disabled={!newTitle.trim() || !newDate} className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 md:flex-none">Save</Button>
                     <Button onClick={() => setIsAdding(false)} variant="outline" className="flex-1 md:flex-none">Cancel</Button>
                 </div>
             </div>
          </div>
      )}

      {goals.length === 0 && !isAdding ? (
          <p className="text-gray-500 text-center py-4 font-medium">{t('tracker.noSubGoals') || "No sub-goals set. Add one to create a target!"}</p>
      ) : (
          <div className="space-y-3">
              {goals.map(goal => (
                  <div key={goal.id} className={`flex items-start md:items-center justify-between gap-4 p-4 rounded-xl border-2 transition-all ${goal.status === 'completed' ? 'bg-gray-50 dark:bg-zinc-800/30 border-gray-200 dark:border-zinc-800 opacity-70' : goal.status === 'missed' ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 shadow-sm'}`}>
                      <div className="flex items-start md:items-center gap-3 flex-1 min-w-0">
                          <button onClick={() => handleToggleStatus(goal)} className="mt-1 md:mt-0 shrink-0 cursor-pointer">
                              {goal.status === 'completed' ? (
                                  <CheckCircle2 size={24} color={color || '#3b82f6'} fill={color ? `${color}20` : '#3b82f620'} />
                              ) : goal.status === 'missed' ? (
                                  <XCircle size={24} className="text-red-400" />
                              ) : (
                                  <Circle size={24} className="text-gray-300 dark:text-zinc-600 hover:text-indigo-400 transition-colors" />
                              )}
                          </button>
                          <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-1 md:gap-4 truncate">
                              <span className={`font-bold truncate ${goal.status === 'completed' ? 'text-gray-500 line-through' : goal.status === 'missed' ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                  {goal.title}
                              </span>
                              <span className={`text-xs font-bold px-2 py-1 rounded-md shrink-0 ${goal.status === 'missed' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400'}`}>
                                  {new Date(goal.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                          </div>
                      </div>
                      <button onClick={() => handleDelete(goal.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2 shrink-0 cursor-pointer">
                          <Trash2 size={16} />
                      </button>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
}
