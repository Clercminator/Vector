export const BILLING_RETURN_SYNC_STORAGE_KEY = "vector.billing.return_sync";

interface PaymentReturnRouteOptions {
  purchaseType?: string | null;
  provider?: string | null;
}

export function shouldReturnTierPurchaseToProfile(
  options: PaymentReturnRouteOptions,
): boolean {
  return options.purchaseType === "tier" && options.provider === "lemonsqueezy";
}

export function resolvePaymentReturnPaths(options: PaymentReturnRouteOptions) {
  const returnTierPurchaseToProfile =
    shouldReturnTierPurchaseToProfile(options);
  const successPath =
    options.purchaseType === "extra_credits" || returnTierPurchaseToProfile
      ? "/profile"
      : "/dashboard";
  const failurePath =
    options.purchaseType === "extra_credits" ? "/profile" : "/pricing";

  return {
    successPath,
    failurePath,
    pendingPath: successPath,
  };
}

export function buildBillingReturnSyncToken(
  options: PaymentReturnRouteOptions,
): string | null {
  if (!shouldReturnTierPurchaseToProfile(options)) {
    return null;
  }

  return `${options.provider}:${options.purchaseType}`;
}
