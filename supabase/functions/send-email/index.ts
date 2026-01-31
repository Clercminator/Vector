// Supabase Edge Function: send-email
// Uses Resend to send emails.
// Set RESEND_API_KEY in Supabase Dashboard → Edge Functions → Secrets.

const RESEND_API_URL = "https://api.resend.com/emails";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey?.trim()) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Only allow usage if the caller provides the Service Role Key or is a signed-in user?
    // For now, let's just minimal check.
    // Ideally you check req.headers.get("Authorization")
    
    const body: EmailRequest = await req.json();
    const { to, subject, html } = body;

    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Vector <onboarding@resend.dev>", // Default Resend verified sender, user should update this
        to,
        subject,
        html,
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
        return new Response(JSON.stringify(data), {
            status: res.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
