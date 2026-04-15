import { describe, expect, it } from "vitest";

import {
  createPendingPaymentSyncRecord,
  buildBillingReturnSyncToken,
  isPendingPaymentSyncResolved,
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

  it("routes Mercado Pago tier returns to the profile page", () => {
    expect(
      resolvePaymentReturnPaths({
        purchaseType: "tier",
        provider: "mercadopago",
      }),
    ).toEqual({
      successPath: "/profile",
      failurePath: "/pricing",
      pendingPath: "/profile",
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

  it("marks tier returns for post-payment billing sync", () => {
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
        tier: "builder",
      }),
    ).toBe("mercadopago:tier:builder");
  });

  it("confirms tier purchases only after plan state updates", () => {
    const pendingPayment = createPendingPaymentSyncRecord({
      provider: "lemonsqueezy",
      purchaseType: "tier",
      tier: "builder",
      currentTier: "architect",
      startedAt: Date.now(),
      paymentStatus: "returned",
    });

    expect(pendingPayment).not.toBeNull();
    expect(
      isPendingPaymentSyncResolved(pendingPayment!, {
        profile: {
          tier: "builder",
          credits: 5,
          extraCredits: 0,
        },
        subscription: {
          provider: "lemonsqueezy",
          tier: "builder",
          status: "active",
        },
        payments: [],
      }),
    ).toBe(true);

    expect(
      isPendingPaymentSyncResolved(pendingPayment!, {
        profile: {
          tier: "architect",
          credits: 5,
          extraCredits: 0,
        },
        subscription: {
          provider: "lemonsqueezy",
          tier: "builder",
          status: "active",
        },
        payments: [],
      }),
    ).toBe(false);
  });

  it("confirms extra credit purchases when bonus credits increase", () => {
    const pendingPayment = createPendingPaymentSyncRecord({
      provider: "mercadopago",
      purchaseType: "extra_credits",
      creditPackId: "credits_5",
      creditsAmount: 5,
      currentExtraCredits: 2,
      startedAt: Date.now(),
      paymentStatus: "returned",
    });

    expect(pendingPayment).not.toBeNull();
    expect(
      isPendingPaymentSyncResolved(pendingPayment!, {
        profile: {
          tier: "architect",
          credits: 1,
          extraCredits: 7,
        },
        subscription: null,
        payments: [],
      }),
    ).toBe(true);
  });
});
