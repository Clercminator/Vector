// Supabase Edge Function: Open Router proxy
// Keeps the Open Router API key on the server; frontend calls this URL instead of Open Router directly.
// The key used for Open Router is ONLY from Supabase Secrets (the browser never sends the real key).
// Set in Supabase Dashboard → Edge Functions → Secrets:
//   OPENROUTER_API_KEY_2 = your Vector key (recommended; same value as VITE_OPENROUTER_API_KEY_2 in .env.backend)
//   OPENROUTER_API_KEY = fallback if OPENROUTER_API_KEY_2 is not set
// Use OPENROUTER_API_KEY_2 for the key you want the app to use (e.g. "Vector" in Open Router dashboard).

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-stainless-os, x-stainless-arch, x-stainless-platform, x-stainless-runtime, x-stainless-runtime-version, x-stainless-lang, x-stainless-package-version, x-stainless-retry-count",
};

function jsonResponse(data: unknown, status: number, headers: Record<string, string> = corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  try {
    // CORS preflight — required when invoking from browser (e.g. Vercel app)
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    // Prefer OPENROUTER_API_KEY_2 (e.g. Vector key); fallback to OPENROUTER_API_KEY. Do NOT use the request body/headers — key is server-only.
    const apiKey = (Deno.env.get("OPENROUTER_API_KEY_2") ?? Deno.env.get("OPENROUTER_API_KEY"))?.trim();
    if (!apiKey) {
      return jsonResponse(
        { error: "OPENROUTER_API_KEY_2 or OPENROUTER_API_KEY not configured in Supabase Secrets" },
        500
      );
    }

    const body = await req.json();
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": req.headers.get("origin") ?? "",
      },
      body: JSON.stringify(body),
    });

    const raw = await res.text();
    let data: unknown;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { error: { message: "Invalid JSON from upstream", raw: raw.slice(0, 200) } };
    }
    return jsonResponse(data, res.status);
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
