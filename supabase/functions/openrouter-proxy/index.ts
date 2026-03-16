// Supabase Edge Function: Open Router proxy
// Keeps the Open Router API key on the server; frontend calls this URL instead of Open Router directly.
// The key used for Open Router is ONLY from Supabase Secrets (the browser never sends the real key).
// Set in Supabase Dashboard → Edge Functions → Secrets:
//   OPENROUTER_API_KEY_2 = your Vector key (recommended; same value as VITE_OPENROUTER_API_KEY_2 in .env.backend)
//   OPENROUTER_API_KEY = fallback if OPENROUTER_API_KEY_2 is not set
// Use OPENROUTER_API_KEY_2 for the key you want the app to use (e.g. "Vector" in Open Router dashboard).
// Logs: view in Supabase Dashboard → Edge Functions → openrouter-proxy → Logs.
//
// Redeploy after changes (from project root):
//   npx supabase functions deploy openrouter-proxy
// Or with Supabase CLI installed: supabase functions deploy openrouter-proxy

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-stainless-os, x-stainless-arch, x-stainless-platform, x-stainless-runtime, x-stainless-runtime-version, x-stainless-lang, x-stainless-package-version, x-stainless-retry-count",
};

function withCors(headers: Record<string, string> = {}): Record<string, string> {
  return { ...corsHeaders, ...headers };
}

function jsonResponse(data: unknown, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: withCors({ ...extraHeaders, "Content-Type": "application/json" }),
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin") ?? "(none)";
  const method = req.method;
  const url = req.url;

  try {
    console.log("[openrouter-proxy] Request", { method, origin, url: url.replace(/\?.*/, "") });

    if (method === "OPTIONS") {
      console.log("[openrouter-proxy] OPTIONS preflight → 204");
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (method !== "POST") {
      console.warn("[openrouter-proxy] Method not allowed:", method);
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const apiKey = (Deno.env.get("OPENROUTER_API_KEY_2") ?? Deno.env.get("OPENROUTER_API_KEY"))?.trim();
    if (!apiKey) {
      console.error("[openrouter-proxy] Missing API key: OPENROUTER_API_KEY_2 and OPENROUTER_API_KEY not set in Supabase Secrets");
      return jsonResponse(
        { error: "OPENROUTER_API_KEY_2 or OPENROUTER_API_KEY not configured in Supabase Secrets" },
        500
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch (parseErr) {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      console.error("[openrouter-proxy] Invalid request body (JSON parse failed):", msg);
      return jsonResponse({ error: "Invalid JSON body", detail: msg }, 400);
    }

    const model = body && typeof body === "object" && body !== null && "model" in body
      ? String((body as { model?: string }).model)
      : "(unknown)";
    const start = Date.now();

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": origin !== "(none)" ? origin : "",
      },
      body: JSON.stringify(body),
    });

    const elapsed = Date.now() - start;
    const raw = await res.text();

    if (!res.ok) {
      console.error("[openrouter-proxy] Upstream error", {
        status: res.status,
        statusText: res.statusText,
        model,
        elapsedMs: elapsed,
        bodyPreview: raw.slice(0, 300),
      });
    } else {
      console.log("[openrouter-proxy] Upstream OK", { status: res.status, model, elapsedMs: elapsed });
    }

    let data: unknown;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      console.error("[openrouter-proxy] Upstream response was not valid JSON, length:", raw?.length ?? 0);
      data = { error: { message: "Invalid JSON from upstream", raw: raw.slice(0, 200) } };
    }

    return jsonResponse(data, res.status);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("[openrouter-proxy] Unhandled error:", msg, stack ?? "");
    return jsonResponse(
      { error: "openrouter-proxy error", message: msg },
      500
    );
  }
});
