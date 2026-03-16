# Payment integrations

Vector supports multiple payment providers. Code and docs are organized here.

| Provider        | Status  | Region   | Where the code lives |
|-----------------|--------|----------|----------------------|
| **MercadoPago** | Active | LATAM    | [mercado-pago/](./mercado-pago/) |
| **Lemon Squeezy** | Active | Global (US/EU) | [lemonsqueezy/](./lemonsqueezy/) |
| **Stripe**      | Pending | Future  | [pending/stripe/](./pending/stripe/) |

- **Active** = used in production; backend in `supabase/functions/`, client in `src/lib/`.
- **Pending** = documented for future implementation only.

See the main [README](../README.md) for payment flow, Edge Functions, and env vars.
