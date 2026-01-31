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

  const PAGE_SIZE = 12;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchTemplates = async (pageToLoad: number, isInitial: boolean = false) => {
    if (!supabase) return;
    if (isInitial) setLoading(true);
    else setIsLoadingMore(true);

    try {
      const from = pageToLoad * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: rows, error: err } = await supabase
        .from('community_templates')
        .select('id, user_id, framework, title, description, answers, result, created_at')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (err) throw err;

      if (!rows || rows.length === 0) {
        if (isInitial) setTemplates([]);
        setHasMore(false);
        return;
      }

      if (rows.length < PAGE_SIZE) {
        setHasMore(false);
      }

      const userIds = [...new Set((rows as { user_id: string }[]).map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);
      
      const nameByUserId = new Map<string, string>();
      (profiles || []).forEach((p: { user_id: string; display_name: string | null }) => {
        nameByUserId.set(p.user_id, p.display_name || t('community.author.anonymous'));
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
        author_name: nameByUserId.get(r.user_id) || t('community.author.anonymous'),
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

      if (isInitial) {
        setTemplates(list);
      } else {
        setTemplates(prev => [...prev, ...list]);
      }
      setError(null);
    } catch (e) {
      console.error(e);
      if (isInitial) {
         setError(t('community.error') || 'Failed to load templates');
      } else {
         toast.error(t('community.errorMore') || 'Failed to load more');
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTemplates(0, true);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTemplates(nextPage, false);
  };
 
  // ... existing vote logic ...
  
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

  const [sortBy, setSortBy] = useState<'recent' | 'top'>('recent');

  const sortedTemplates = [...templates].sort((a, b) => {
      if (sortBy === 'top') {
          return b.votes - a.votes;
      }
      // default recent (based on created_at string if available, or just index)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-6xl mx-auto px-6 py-12"
    >
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="dark:text-white dark:hover:bg-zinc-800">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">{t('community.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('community.subtitle')}</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg self-start">
            <button 
                onClick={() => setSortBy('recent')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${sortBy === 'recent' ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
            >
                {t('community.sort.recent')}
            </button>
            <button 
                 onClick={() => setSortBy('top')}
                 className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${sortBy === 'top' ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
            >
                {t('community.sort.top')}
            </button>
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
        <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTemplates.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-gray-50 dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800 text-gray-400">
                    <p>{t('community.empty')}</p>
                </div>
            ) : (
                sortedTemplates.map((template) => (
                    <div key={template.id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{template.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('community.by')} {template.author_name || t('community.author.anonymous')}</p>
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
                        {template.description || t('community.desc.empty')}
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

            {hasMore && sortedTemplates.length > 0 && (
                <div className="flex justify-center mt-12">
                     <Button 
                        onClick={handleLoadMore} 
                        disabled={isLoadingMore}
                        variant="ghost"
                        className="gap-2"
                     >
                        {isLoadingMore ? <Loader2 className="animate-spin" size={16} /> : null}
                        {t('community.loadMore')}
                     </Button>
                </div>
            )}
        </>
      )}
    </motion.div>
  );
}
