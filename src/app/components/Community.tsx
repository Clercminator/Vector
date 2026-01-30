import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Upload, Gift, Download, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CommunityProps {
  userId: string | null;
  onBack: () => void;
  onImport: (blueprint: any) => void;
}

interface Template {
  id: string;
  title: string;
  description: string;
  author_id: string;
  author_name: string;
  votes: number;
  data: any;
  created_at: string;
}

import { useLanguage } from '@/app/components/language-provider';

export function Community({ userId, onBack, onImport }: CommunityProps) {
  const { t } = useLanguage();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data: rows, error: err } = await supabase
          .from('community_templates')
          .select('id, user_id, framework, title, description, answers, result, created_at')
          .order('created_at', { ascending: false });
        if (err) throw err;
        if (cancelled) return;
        if (!rows || rows.length === 0) {
          setTemplates([]);
          setLoading(false);
          return;
        }
        const userIds = [...new Set((rows as { user_id: string }[]).map((r) => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);
        const nameByUserId = new Map<string, string>();
        (profiles || []).forEach((p: { user_id: string; display_name: string | null }) => {
          nameByUserId.set(p.user_id, p.display_name || 'Anonymous');
        });
        const templateIds = (rows as { id: string }[]).map((r) => r.id);
        const { data: votesRows } = await supabase
          .from('template_votes')
          .select('template_id')
          .in('template_id', templateIds);
        const voteCountByTemplateId = new Map<string, number>();
        (votesRows || []).forEach((v: { template_id: string }) => {
          voteCountByTemplateId.set(v.template_id, (voteCountByTemplateId.get(v.template_id) || 0) + 1);
        });
        const list: Template[] = (rows as any[]).map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description || '',
          author_id: r.user_id,
          author_name: nameByUserId.get(r.user_id) || 'Anonymous',
          votes: voteCountByTemplateId.get(r.id) || 0,
          data: {
            framework: r.framework,
            title: r.title,
            answers: r.answers || [],
            result: r.result || {},
            id: r.id,
            createdAt: r.created_at,
          },
          created_at: r.created_at,
        }));
        setTemplates(list);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setError(t('community.error') || 'Failed to load templates');
          setTemplates([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleVote = async (templateId: string) => {
    if (!userId) {
      toast.error(t('community.voteLogin'));
      return;
    }
    if (!supabase) return;
    setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, votes: t.votes + 1 } : t));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: existing } = await supabase.from('template_votes').select('template_id').eq('template_id', templateId).eq('user_id', user.id).maybeSingle();
      if (existing) {
        toast.info(t('community.alreadyVoted') || 'You already voted');
        return;
      }
      const { error: voteErr } = await supabase.from('template_votes').insert({ template_id: templateId, user_id: user.id });
      if (voteErr) throw voteErr;
      toast.success(t('community.voted'));
    } catch (e) {
      console.error(e);
      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, votes: t.votes - 1 } : t));
      toast.error(t('community.voteError') || 'Vote failed');
    }
  };
  
  const handleImport = (template: Template) => {
    onImport(template.data);
    toast.success(t('community.imported'));
  };

  const handleGift = async (authorId: string) => {
      if (!userId) {
          toast.error(t('community.giftLogin'));
          return;
      }
      toast.success(t('community.gifted'));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-6xl mx-auto px-6 py-12"
    >
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="dark:text-white dark:hover:bg-zinc-800">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">{t('community.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('community.subtitle')}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-gray-300 dark:text-gray-600" size={40} />
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.length === 0 ? (
             <div className="col-span-full text-center py-20 bg-gray-50 dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800 text-gray-400">
                <p>{t('community.empty')}</p>
             </div>
          ) : (
            templates.map((template) => (
                <div key={template.id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{template.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('community.by')} {template.author_name || 'Anonymous'}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleVote(template.id); }}
                            className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 p-2 rounded-xl transition-colors flex flex-col items-center min-w-[50px]"
                        >
                            <Heart size={20} className={template.votes > 0 ? "fill-current" : ""} />
                            <span className="text-xs font-bold">{template.votes}</span>
                        </button>
                    </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 line-clamp-3 flex-grow">
                    {template.description || "No description provided."}
                </p>

                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <Button 
                        onClick={() => handleImport(template)} 
                        className="flex-1 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-800"
                        variant="outline"
                    >
                        <Download size={16} className="mr-2" />
                        {t('community.useTemplate')}
                    </Button>
                    <Button 
                        onClick={(e) => { e.stopPropagation(); handleGift(template.author_id); }}
                        variant="ghost" 
                        size="icon"
                        title={t('community.gift')}
                    >
                        <Gift size={20} className="text-yellow-500" />
                    </Button>
                </div>
                </div>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
}
