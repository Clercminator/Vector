import { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
}

export interface UserAchievement {
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export interface ProfileExtended {
  level: number;
  credits: number;
  points: number;
  streak_count: number;
  last_active_date: string;
}

export async function checkAndAwardAchievements(supabase: SupabaseClient, userId: string) {
  try {
    // 1. Get current stats (blueprints count)
    const { count: blueprintCount, error: countError } = await supabase
      .from('blueprints')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw countError;

    // 2. Get existing achievements to avoid redundant checks if possible, 
    // but insert ignore works too.
    const { data: earnedData } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);
    
    const earnedIds = new Set(earnedData?.map(x => x.achievement_id) || []);

    const newAchievements: string[] = [];

    // Check Blueprint Milestones
    const milestones = [
      { id: 'first_steps', count: 1, title: 'First Steps' },
      { id: 'architect', count: 5, title: 'Architect' },
      { id: 'visionary', count: 20, title: 'Visionary' }
    ];

    for (const m of milestones) {
      if ((blueprintCount || 0) >= m.count && !earnedIds.has(m.id)) {
        const { error } = await supabase.from('user_achievements').insert({
          user_id: userId,
          achievement_id: m.id
        });
        if (!error) {
          newAchievements.push(m.title);
          earnedIds.add(m.id);
        }
      }
    }

    // 3. Update Streak
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_count, last_active_date')
      .eq('user_id', userId)
      .single();

    if (profile) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const lastActive = profile.last_active_date;
      
      let newStreak = profile.streak_count || 0;
      let shouldUpdate = false;

      if (lastActive !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastActive === yesterdayStr) {
          // Consecutive day
          newStreak += 1;
        } else {
          // Broken streak (or first time)
          newStreak = 1;
        }
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        await supabase.from('profiles').update({
          streak_count: newStreak,
          last_active_date: today
        }).eq('user_id', userId);
        
        // Notify streak
        if (newStreak > 1) {
             toast.success(`🔥 ${newStreak} Day Streak!`);
        }
      }

      // Check Streak Achievements
      const streaks = [
        { id: 'dedicated', days: 3, title: 'Dedicated' },
        { id: 'unstoppable', days: 7, title: 'Unstoppable' }
      ];

      for (const s of streaks) {
        if (newStreak >= s.days && !earnedIds.has(s.id)) {
          const { error } = await supabase.from('user_achievements').insert({
            user_id: userId,
            achievement_id: s.id
          });
          if (!error) {
            newAchievements.push(s.title);
          }
        }
      }
    }

    // Notify user
    if (newAchievements.length > 0) {
      newAchievements.forEach(title => {
        toast.success(`🏆 Achievement Unlocked: ${title}!`);
      });
    }

  } catch (error) {
    console.error("Error checking achievements:", error);
  }
}
