import { expect, test } from "@playwright/test";

const initialProfileState = {
  profile: {
    display_name: "E2E User",
    bio: "",
    avatar_url: "",
    level: 1,
    credits: 1,
    extra_credits: 0,
    credits_expires_at: "",
    points: 0,
    streak_count: 0,
    branding_logo_url: "",
    branding_color: "#000000",
    tier: "architect",
    metadata: {},
  },
  subscriptions: [],
};

const upgradedProfileState = {
  profile: {
    ...initialProfileState.profile,
    tier: "builder",
    credits: 5,
  },
  subscriptions: [
    {
      provider: "lemonsqueezy",
      provider_subscription_id: "ls-test-subscription",
      tier: "builder",
      status: "active",
      status_formatted: "Active",
      billing_interval: "month",
      renews_at: "2026-05-14T00:00:00.000Z",
      ends_at: null,
      cancel_requested: false,
      paused: false,
    },
  ],
};

const toppedUpProfileState = {
  profile: {
    ...initialProfileState.profile,
    extra_credits: 5,
  },
  subscriptions: [],
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ seededProfileState, nextProfileState, updateSearchToken }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("vector.onboarding_done", "true");
      localStorage.setItem(
        "vector.e2e.profileState",
        JSON.stringify(seededProfileState),
      );

      const applyHostedReturnUpdate = () => {
        if (!window.location.search.includes(updateSearchToken)) {
          return;
        }

        window.setTimeout(() => {
          localStorage.setItem(
            "vector.e2e.profileState",
            JSON.stringify(nextProfileState),
          );
        }, 1800);
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyHostedReturnUpdate, {
          once: true,
        });
      } else {
        applyHostedReturnUpdate();
      }
    },
    {
      seededProfileState: initialProfileState,
      nextProfileState: upgradedProfileState,
      updateSearchToken: "provider=lemonsqueezy",
    },
  );
});

test("profile updates after a hosted LemonSqueezy return is processed", async ({
  page,
}) => {
  await page.goto(
    "/profile?payment=success&purchase=tier&provider=lemonsqueezy&tier=builder",
  );

  await expect(
    page.getByText(
      "Payment received. We are verifying your account update now.",
    ),
  ).toHaveCount(0);
  await expect(page.getByText("Payment confirmed")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("heading", { name: /^Builder$/i })).toBeVisible({
    timeout: 8000,
  });
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByText("Active")).toBeVisible();
  await expect(page.getByText("Lemon Squeezy")).toBeVisible();
  await expect(page.getByText("$5.99/mo")).toBeVisible();
});

test("profile shows extra credits after a MercadoPago credit-pack return", async ({
  page,
}) => {
  await page.addInitScript(
    ({ seededProfileState, nextProfileState, updateSearchToken }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("vector.onboarding_done", "true");
      localStorage.setItem(
        "vector.e2e.profileState",
        JSON.stringify(seededProfileState),
      );

      const applyHostedReturnUpdate = () => {
        if (!window.location.search.includes(updateSearchToken)) {
          return;
        }

        window.setTimeout(() => {
          localStorage.setItem(
            "vector.e2e.profileState",
            JSON.stringify(nextProfileState),
          );
        }, 1800);
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyHostedReturnUpdate, {
          once: true,
        });
      } else {
        applyHostedReturnUpdate();
      }
    },
    {
      seededProfileState: initialProfileState,
      nextProfileState: toppedUpProfileState,
      updateSearchToken: "purchase=extra_credits&provider=mercadopago",
    },
  );

  await page.goto(
    "/profile?payment=success&purchase=extra_credits&provider=mercadopago",
  );

  await expect(
    page.getByText(
      "Payment received. We are verifying your account update now.",
    ),
  ).toHaveCount(0);
  await expect(page.getByText("Verifying your payment")).toBeVisible();
  await expect(page.getByText("Payment confirmed")).toBeVisible({
    timeout: 8000,
  });
  await expect(page).toHaveURL(/\/profile$/);
  await expect(
    page.locator("div").filter({ hasText: "Bonus plans" }).first(),
  ).toContainText("5");
});
