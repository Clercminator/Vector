import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Blueprint } from '@/lib/blueprints';
import { Button } from '@/app/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutTemplate, X, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/app/components/language-provider';

interface GoalTemplate {
  id: string;
  framework: string;
  title: string;
  description: string;
}

interface TrackerGoalTemplatesProps {
  blueprint: Blueprint;
  color?: string;
  onApplied: () => void;
}

export function TrackerGoalTemplates({ blueprint, color, onApplied }: TrackerGoalTemplatesProps) {
  const { t } = useLanguage();
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    // Fetch available templates for this framework
    supabase
      .from('goal_templates')
      .select('*')
      .eq('framework', blueprint.framework)
      .eq('enabled', true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTemplates(data);
        }
      });
  }, [blueprint.framework]);

  if (templates.length === 0) return null;

  const handleApplyTemplate = async (templateId: string) => {
    if (!supabase) return;
    setApplyingId(templateId);
    
    try {
      const { data: items, error: itemsError } = await supabase
        .from('goal_template_items')
        .select('*')
        .eq('template_id', templateId)
        .order('sequence_order', { ascending: true });

      if (itemsError) throw itemsError;
      if (!items || items.length === 0) {
        toast.info(t('errors.templateNoItems') || "This template has no items.");
        setApplyingId(null);
        return;
      }

      // Separate into sub-goals and tasks
      const subGoals = items.filter(i => i.type === 'subgoal');
      const tasks = items.filter(i => i.type === 'task');

      const user_id = (await supabase.auth.getUser()).data.user?.id;
      if (!user_id) throw new Error("Unauthorized");

      // Insert subgoals
      if (subGoals.length > 0) {
        const subGoalInserts = subGoals.map(sg => ({
          blueprint_id: blueprint.id,
          user_id,
          title: sg.title,
          description: sg.description,
          status: 'pending'
        }));
        await supabase.from('blueprint_sub_goals').insert(subGoalInserts);
      }

      // Insert tasks
      if (tasks.length > 0) {
        const taskInserts = tasks.map(t => ({
          blueprint_id: blueprint.id,
          user_id,
          title: t.title,
          description: t.description,
          status: 'pending',
          priority: 'medium'
        }));
        await supabase.from('blueprint_tasks').insert(taskInserts);
      }

      toast.success("Template applied successfully!");
      setIsOpen(false);
      onApplied();
      
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to apply template");
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button 
          onClick={() => setIsOpen(true)} 
          variant="outline" 
          className="gap-2 text-sm font-bold border-dashed border-gray-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all rounded-xl"
        >
          <LayoutTemplate size={16} />
          Use a Template
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:max-w-xl bg-white dark:bg-zinc-900 md:rounded-3xl shadow-2xl z-50 flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <LayoutTemplate size={20} />
                  </div>
                  <h2 className="text-xl font-bold dark:text-white">Goal Templates</h2>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 dark:bg-zinc-900/50">
                <p className="text-gray-500 text-sm font-medium mb-2">Select a template to automatically populate tasks and sub-goals tailored for your {blueprint.framework.toUpperCase()} plan.</p>
                {templates.map(template => (
                  <div key={template.id} className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-5 rounded-2xl hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{template.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{template.description}</p>
                      </div>
                      <Button 
                        onClick={() => handleApplyTemplate(template.id)}
                        disabled={applyingId === template.id}
                        className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 shadow-sm"
                      >
                        {applyingId === template.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>Apply <ChevronRight size={16} /></>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
