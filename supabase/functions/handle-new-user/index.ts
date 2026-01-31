// Supabase Edge Function: handle-new-user
// Triggered by Database Webhook (INSERT on auth.users)
// Sends a welcome email via Resend.

const RESEND_API_URL = "https://api.resend.com/emails";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: {
    id: string;
    email?: string;
    raw_user_meta_data?: any;
    [key: string]: any;
  };
  old_record: null | any;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
     return new Response(JSON.stringify({ error: "RESEND_API_KEY missing" }), { status: 500, headers: corsHeaders });
  }

  try {
    const body: WebhookPayload = await req.json();
    console.log("New user webhook:", body);

    if (body.type === 'INSERT' && body.table === 'users') {
        const email = body.record.email;
        if (email) {
            console.log(`Sending welcome email to ${email}`);
            
            const res = await fetch(RESEND_API_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${resendKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: "Vector <welcome@resend.dev>",
                    to: email,
                    subject: "Welcome to Vector - Architect Your Ambition",
                    html: `
                      <h1>Welcome to Vector!</h1>
                      <p>We're thrilled to have you on board.</p>
                      <p>Vector is designed to help you deconstruct your goals using first-principles thinking and build actionable blueprints.</p>
                      <p><strong>Getting Started:</strong></p>
                      <ul>
                        <li><a href="https://your-app-url.com">Create your first Blueprint</a></li>
                        <li>Explore the <a href="https://your-app-url.com/community">Community Templates</a></li>
                      </ul>
                      <p>Go build something great.</p>
                      <p>- The Vector Team</p>
                    `,
                }),
            });

            if (!res.ok) {
                console.error("Resend error:", await res.text());
            } else {
                console.log("Welcome email sent.");
            }
        } else {
            console.log("No email found in record.");
        }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Error handling new user:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
