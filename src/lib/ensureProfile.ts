import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ensures public.profiles has a row for the signed-in user (auth.users id).
 * Safe to call on every session: no-op if the row already exists.
 * Covers trigger failures, OAuth edge cases, and legacy orphans.
 */
export async function ensureMyProfile(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.rpc("ensure_my_profile");
  if (error) {
    console.warn("ensure_my_profile:", error.message);
  }
}
