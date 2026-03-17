-- Ensure one payment record per provider + provider_payment_id (idempotency at DB level).
-- Webhooks (MercadoPago, Lemon Squeezy) can resend; this prevents duplicate credits/tier updates.
-- Only apply where provider_payment_id is set (legacy rows may have NULL).
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_payment_id
  ON payments (provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL AND provider_payment_id != '';
