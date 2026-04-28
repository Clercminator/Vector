import { resolvePaymentReturnPaths } from "./paymentReturn";

export type PaymentPurchaseType = "tier" | "extra_credits";
export type PaymentProvider = "mercadopago" | "lemonsqueezy";

export interface PaymentReturnUrlOptions {
  purchaseType?: PaymentPurchaseType;
  provider?: PaymentProvider;
  tier?: string;
  origin?: string;
  successPath?: string;
  failurePath?: string;
  pendingPath?: string;
}

export function buildPaymentReturnUrls(
  options: PaymentReturnUrlOptions = {},
) {
  const purchaseType = options.purchaseType ?? "tier";
  const origin =
    options.origin ??
    (typeof window !== "undefined" ? window.location.origin : "");
  const provider = options.provider;
  const tier = options.tier?.trim();
  const resolvedPaths = resolvePaymentReturnPaths({
    purchaseType,
    provider,
  });
  const successPath = options.successPath ?? resolvedPaths.successPath;
  const failurePath = options.failurePath ?? resolvedPaths.failurePath;
  const pendingPath = options.pendingPath ?? resolvedPaths.pendingPath;

  const buildUrl = (
    path: string,
    status: "success" | "failure" | "pending",
  ) => {
    const url = new URL(path, origin || "http://localhost");
    url.searchParams.set("payment", status);
    url.searchParams.set("purchase", purchaseType);
    if (provider) {
      url.searchParams.set("provider", provider);
    }
    if (tier) {
      url.searchParams.set("tier", tier);
    }
    return origin ? url.toString() : `${url.pathname}${url.search}`;
  };

  return {
    success: buildUrl(successPath, "success"),
    failure: buildUrl(failurePath, "failure"),
    pending: buildUrl(pendingPath, "pending"),
  };
}