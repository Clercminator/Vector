// Internal Admin Edge Function - Hidden admin operations
// Credentials: Set in Supabase Dashboard → Edge Functions → internal-admin → Secrets
//   INTERNAL_ADMIN_USERNAME, INTERNAL_ADMIN_PASSWORD
// If unset, fallback to values below. Uses service_role to bypass RLS for profile updates.

import { createClient } from "jsr:@supabase/supabase-js@2";

const INTERNAL_ADMIN_USERNAME = (Deno.env.get("INTERNAL_ADMIN_USERNAME") ?? "Clercminator").trim();
const INTERNAL_ADMIN_PASSWORD = (Deno.env.get("INTERNAL_ADMIN_PASSWORD") ?? "VectorMoneyMachine$$$777!").trim();

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function verifyCredentials(username: string, password: string): boolean {
  const u = typeof username === "string" ? username.trim() : "";
  const p = typeof password === "string" ? password.trim() : "";
  return u.length > 0 && p.length > 0 && u === INTERNAL_ADMIN_USERNAME && p === INTERNAL_ADMIN_PASSWORD;
}

interface InternalAdminRequest {
  username: string;
  password: string;
  action: "login" | "list_users" | "update_user";
  payload?: {
    search?: string;
    page?: number;
    pageSize?: number;
    userId?: string;
    updates?: Record<string, unknown>;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = (await req.json()) as InternalAdminRequest;
    const { username, password, action, payload = {} } = body;

    if (!username || !password || !verifyCredentials(username, password)) {
      return jsonResponse({ error: "Invalid credentials" }, 401);
    }

    if (action === "login") {
      return jsonResponse({ ok: true });
    }

    if (action === "list_users") {
      const { search = "", page = 0, pageSize = 20 } = payload;
      let query = supabase
        .from("profiles")
        .select("user_id, display_name, credits, extra_credits, credits_expires_at, tier, is_admin, created_at")
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (search && typeof search === "string") {
        query = query.ilike("display_name", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      return jsonResponse({ users: data || [], total: count || 0 });
    }

    if (action === "update_user") {
      const { userId, updates } = payload;
      if (!userId || !updates || typeof updates !== "object") {
        return jsonResponse({ error: "userId and updates required" }, 400);
      }

      const allowedKeys = [
        "credits",
        "extra_credits",
        "credits_expires_at",
        "tier",
        "is_admin",
      ];
      const filtered: Record<string, unknown> = {};
      for (const k of allowedKeys) {
        if (k in updates) {
          const v = (updates as Record<string, unknown>)[k];
          if (k === "credits_expires_at") {
            filtered[k] = v === "" || v == null ? null : v;
          } else if (k === "credits" || k === "extra_credits") {
            filtered[k] = typeof v === "number" ? v : parseInt(String(v), 10) || 0;
          } else if (k === "is_admin") {
            filtered[k] = Boolean(v);
          } else {
            filtered[k] = v;
          }
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update(filtered)
        .eq("user_id", userId);

      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("internal-admin error:", e);
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Server error" },
      500
    );
  }
});
