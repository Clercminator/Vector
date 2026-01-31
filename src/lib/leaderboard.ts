import { supabase } from './supabase';

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_votes: number;
  template_count: number;
}

export async function fetchLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];

  const { data, error } = await supabase.rpc('get_leaderboard', { limit_count: limit });

  if (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }

  return data as LeaderboardEntry[];
}
