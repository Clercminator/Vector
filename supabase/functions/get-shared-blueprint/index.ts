// Supabase Edge Function: Get shared blueprint by token
// Called when a visitor opens /share/:token. Returns read-only blueprint + tracker data.
// Uses service role to bypass RLS; validates token against blueprint_shares.
// Requires batch 3 migration (blueprint_shares table) to be applied.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "apikey, X-Client-Info, Content-Type, Authorization, Accept",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status: number) {
  return jsonResponse({ error: message }, status);
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    let token: string | null = null;
    if (req.method === "GET") {
      const url = new URL(req.url);
      token = url.searchParams.get("token");
    } else {
      const body = (await req.json()) as { token?: string };
      token = body?.token ?? null;
    }

    if (!token?.trim()) {
      return errorResponse("Missing token", 400);
    }

    // Validate share and get blueprint_id
    const { data: share, error: shareError } = await supabase
      .from("blueprint_shares")
      .select("blueprint_id, expires_at")
      .eq("share_token", token)
      .single();

    if (shareError || !share) {
      return errorResponse("Link expired or invalid", 404);
    }

    if (share.expires_at && new Date(share.expires_at) <= new Date()) {
      return errorResponse("Link expired or invalid", 404);
    }

    const blueprintId = share.blueprint_id;

    // Fetch blueprint
    const { data: blueprint, error: bpError } = await supabase
      .from("blueprints")
      .select("*")
      .eq("id", blueprintId)
      .single();

    if (bpError || !blueprint) {
      return errorResponse("Plan not found", 404);
    }

    // Map for frontend (created_at -> createdAt)
    const blueprintData = {
      ...blueprint,
      createdAt: blueprint.created_at ?? blueprint.createdAt,
    };

    // Fetch tracker
    const { data: tracker } = await supabase
      .from("blueprint_tracker")
      .select("*")
      .eq("blueprint_id", blueprintId)
      .single();

    // Fetch goal_logs (limit 50 for shared view)
    const { data: logs } = await supabase
      .from("goal_logs")
      .select("*")
      .eq("blueprint_id", blueprintId)
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch sub-goals
    const { data: subGoals } = await supabase
      .from("blueprint_sub_goals")
      .select("*")
      .eq("blueprint_id", blueprintId)
      .order("target_date", { ascending: true });

    // Fetch tasks
    const { data: tasks } = await supabase
      .from("blueprint_tasks")
      .select("*")
      .eq("blueprint_id", blueprintId);

    const taskIds = (tasks ?? []).map((t) => t.id);

    // Fetch task completions for these tasks
    let taskCompletions: unknown[] = [];
    if (taskIds.length > 0) {
      const { data: completions } = await supabase
        .from("blueprint_task_completions")
        .select("*")
        .in("task_id", taskIds)
        .order("completed_at", { ascending: false });
      taskCompletions = completions ?? [];
    }

    return jsonResponse({
      blueprint: blueprintData,
      tracker: tracker ?? null,
      logs: logs ?? [],
      subGoals: subGoals ?? [],
      tasks: tasks ?? [],
      taskCompletions,
    });
  } catch (err) {
    console.error("get-shared-blueprint error:", err);
    return errorResponse(String(err), 500);
  }
});
