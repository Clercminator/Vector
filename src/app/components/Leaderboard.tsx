import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Award, User, Loader2, Heart, FileText, Frown } from 'lucide-react';
import { fetchLeaderboard, LeaderboardEntry } from '@/lib/leaderboard';
import { useLanguage } from '@/app/components/language-provider';

export function Leaderboard() {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchLeaderboard(10);
        setEntries(data);
      } catch (err) {
        console.error(err);
        setError(t('leaderboard.error') || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [t]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-gray-300 dark:text-gray-600" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
        <Frown className="mx-auto mb-4" size={48} />
        <p>{error}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800 text-gray-400">
        <p>{t('leaderboard.empty')}</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 max-w-2xl mx-auto"
    >
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 inline-flex items-center gap-2">
          <Trophy className="text-yellow-500" />
          {t('leaderboard.topContributors')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">{t('leaderboard.subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
        {entries.map((entry, index) => {
          const rank = index + 1;
          let RankIcon = <span className="text-lg font-bold w-6 text-center text-gray-400">#{rank}</span>;
          if (rank === 1) RankIcon = <Trophy className="text-yellow-500 w-6 h-6" />;
          if (rank === 2) RankIcon = <Medal className="text-gray-400 w-6 h-6" />;
          if (rank === 3) RankIcon = <Award className="text-amber-600 w-6 h-6" />;

          return (
            <div 
              key={entry.user_id}
              className={`flex items-center p-4 gap-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors ${
                index !== entries.length - 1 ? 'border-b border-gray-100 dark:border-zinc-800' : ''
              }`}
            >
              <div className="flex-shrink-0 w-10 flex justify-center">
                {RankIcon}
              </div>
              
              <div className="flex-shrink-0">
                {entry.avatar_url ? (
                  <img src={entry.avatar_url} alt={entry.display_name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <User size={20} className="text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-grow min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {entry.display_name || t('community.author.anonymous')}
                </h3>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5" title={t('leaderboard.totalVotes')}>
                  <Heart size={16} className="text-red-500" />
                  <span className="font-medium">{entry.total_votes}</span>
                </div>
                <div className="flex items-center gap-1.5" title={t('leaderboard.templates')}>
                  <FileText size={16} className="text-blue-500" />
                  <span className="font-medium">{entry.template_count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
