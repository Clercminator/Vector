import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Achievement, UserAchievement } from '@/lib/gamification';
import { Loader2, Footprints, Ruler, Telescope, Flame, Zap, Share2, Star, Trophy, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '@/app/components/language-provider';

// Map icon strings to components
const iconMap: Record<string, React.ElementType> = {
  'Footprints': Footprints,
  'Ruler': Ruler,
  'Telescope': Telescope,
  'Flame': Flame,
  'Zap': Zap,
  'Share2': Share2,
  'default': Star
};

interface AchievementsListProps {
  userId: string;
}

export function AchievementsList({ userId }: AchievementsListProps) {
  const { t } = useLanguage();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!supabase) return;

      try {
        // Fetch all available achievements
        const { data: allAchievements, error: listError } = await supabase
          .from('achievements')
          .select('*')
          .order('condition_value', { ascending: true });

        if (listError) throw listError;
        if (allAchievements) setAchievements(allAchievements);

        // Fetch user's earned achievements
        const { data: earned, error: earnedError } = await supabase
          .from('user_achievements')
          .select('achievement_id')
          .eq('user_id', userId);

        if (earnedError) throw earnedError;
        
        if (earned) {
          setUserAchievements(new Set(earned.map(ua => ua.achievement_id)));
        }

      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userId]);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold flex items-center gap-2 text-black dark:text-white">
        <Trophy size={20} className="text-yellow-500" />
        {t('profile.achievements') || 'Achievements'}
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {achievements.map((achievement) => {
           const isUnlocked = userAchievements.has(achievement.id);
           const Icon = iconMap[achievement.icon] || iconMap.default;

           return (
             <motion.div
               key={achievement.id}
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className={`p-4 rounded-xl border relative overflow-hidden group transition-all ${
                 isUnlocked 
                  ? 'bg-white dark:bg-zinc-900 border-yellow-200 dark:border-yellow-900/30' 
                  : 'bg-gray-50 dark:bg-zinc-900/50 border-gray-100 dark:border-zinc-800 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
               }`}
             >
               <div className="flex flex-col items-center text-center gap-3">
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${
                   isUnlocked 
                    ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white shadow-lg' 
                    : 'bg-gray-200 dark:bg-zinc-800 text-gray-400'
                 }`}>
                   <Icon size={isUnlocked ? 24 : 20} />
                 </div>
                 
                 <div>
                   <h4 className={`font-bold text-sm ${isUnlocked ? 'text-black dark:text-white' : 'text-gray-500'}`}>
                     {achievement.title}
                   </h4>
                   <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-snug">
                     {achievement.description}
                   </p>
                 </div>

                 {!isUnlocked && (
                   <div className="absolute top-2 right-2 text-gray-300 dark:text-zinc-700">
                     <Lock size={14} />
                   </div>
                 )}
               </div>
             </motion.div>
           );
        })}
      </div>
    </div>
  );
}
