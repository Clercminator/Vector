import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * IMPORTANT SECURITY NOTE
 * - Only use the PUBLIC "anon" key in the browser.
 * - Never ship service role keys, DB passwords, or secret keys to the client.
 */

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  (import.meta.env.VITE_supabase_url as string | undefined) ??
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ??
  "";
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  (import.meta.env.VITE_ANON_PUBLIC_KEY as string | undefined) ??
  (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ??
  (import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase is not configured. Missing variables:");
  if (!supabaseUrl) console.warn("- VITE_SUPABASE_URL (or VITE_supabase_url, NEXT_PUBLIC_SUPABASE_URL)");
  if (!supabaseAnonKey) console.warn("- VITE_SUPABASE_ANON_KEY (or VITE_ANON_PUBLIC_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY)");
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

