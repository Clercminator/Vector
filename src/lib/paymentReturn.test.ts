import { describe, expect, it } from "vitest";

import {
  buildBillingReturnSyncToken,
  resolvePaymentReturnPaths,
  shouldReturnTierPurchaseToProfile,
} from "./paymentReturn";

describe("paymentReturn", () => {
  it("routes LemonSqueezy tier returns to the profile page", () => {
    expect(
      resolvePaymentReturnPaths({
        purchaseType: "tier",
        provider: "lemonsqueezy",
      }),
    ).toEqual({
      successPath: "/profile",
      failurePath: "/pricing",
      pendingPath: "/profile",
    });
  });

  it("keeps Mercado Pago tier returns on the dashboard", () => {
    expect(
      resolvePaymentReturnPaths({
        purchaseType: "tier",
        provider: "mercadopago",
      }),
    ).toEqual({
      successPath: "/dashboard",
      failurePath: "/pricing",
      pendingPath: "/dashboard",
    });
  });

  it("routes extra credit purchases to the profile page", () => {
    expect(
      resolvePaymentReturnPaths({
        purchaseType: "extra_credits",
        provider: "mercadopago",
      }),
    ).toEqual({
      successPath: "/profile",
      failurePath: "/profile",
      pendingPath: "/profile",
    });
  });

  it("marks only LemonSqueezy tier returns for post-payment billing sync", () => {
    expect(
      shouldReturnTierPurchaseToProfile({
        purchaseType: "tier",
        provider: "lemonsqueezy",
      }),
    ).toBe(true);
    expect(
      buildBillingReturnSyncToken({
        purchaseType: "tier",
        provider: "lemonsqueezy",
      }),
    ).toBe("lemonsqueezy:tier");
    expect(
      buildBillingReturnSyncToken({
        purchaseType: "tier",
        provider: "mercadopago",
      }),
    ).toBeNull();
  });
});
