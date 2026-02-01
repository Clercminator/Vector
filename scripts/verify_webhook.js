// Script to verify the MercadoPago webhook
// Usage: node scripts/verify_webhook.js

// Node 18+ has built-in fetch, so we don't need to import it.
// If using an older node, this might fail, but checking user env showed v22.

const PROJECT_ID = process.env.VITE_SUPABASE_URL 
    ? process.env.VITE_SUPABASE_URL.replace('https://', '').split('.')[0] 
    : (process.env.PROJECT_ID || 'your-project-id'); // Set PROJECT_ID in env
const FUNCTION_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/mercado-pago-webhook`;

// Mock Payload simulating a successful payment from MercadoPago
const mockPayload = {
    type: "payment",
    data: {
        id: "1234567890" // Mock Payment ID
    },
    action: "payment.created"
};

console.log("Testing Webhook URL:", FUNCTION_URL);

// We verify payment using a mock. The Function checks MP API. 
// Since ID is fake, MP API returns 404/400, and our Function should return 502 or 500 but log the attempt.
// This proves the Function is reachable and logic flows.

async function testWebhook() {
    try {
        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(mockPayload)
        });

        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Response:", text);

        if (response.status === 200) {
            console.log("✅ Success! Webhook processed the request.");
        } else if (response.status === 502) {
             console.log("⚠️ Partial Success: The function was reached and tried to verify the payment.");
             console.log("   (It returned 502 because '1234567890' is a mock ID and not found in MercadoPago).");
             console.log("   This confirms the Webhook is CONNECTED and RUNNING.");
        } else {
            console.log("❌ Unexpected status. Check Supabase logs.");
        }

    } catch (e) {
        console.error("Error calling webhook:", e);
    }
}

testWebhook();
