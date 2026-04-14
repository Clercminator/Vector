import { expect, test, type Page } from "@playwright/test";

const PLAN_TITLE = "Share a consulting plan that still reads cleanly on mobile";

test.use({
  viewport: { width: 390, height: 844 },
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("vector.e2e.initialized") === "true") return;
    localStorage.clear();
    localStorage.setItem("vector.onboarding_done", "true");
    sessionStorage.setItem("vector.e2e.initialized", "true");
  });
});

async function createSharedPlan(page: Page) {
  await page.goto("/wizard?framework=rpm");

  const chatInput = page.locator("#wizard-chat-input");
  await chatInput.fill(PLAN_TITLE);
  await page.keyboard.press("Enter");

  await expect(
    page.getByText("Give me one real constraint or current obstacle"),
  ).toBeVisible();

  await chatInput.fill(
    "The share view has to stay legible on a phone because I review it while traveling.",
  );
  await page.keyboard.press("Enter");

  await expect(page.getByTestId("wizard-approval-confirm")).toBeVisible();
  await page.getByTestId("wizard-approval-confirm").click();

  await expect(page.getByText("Plan Pack", { exact: true })).toBeVisible();
  await page.getByTestId("wizard-save-button").click();
  await page.waitForURL("**/");

  const blueprintId = await page.evaluate(() => {
    const raw = localStorage.getItem("vector.blueprints.v1");
    const blueprints = raw ? JSON.parse(raw) : [];
    return blueprints[0]?.id ?? null;
  });

  expect(blueprintId).toBeTruthy();

  await page.goto(`/track/${blueprintId}`);
  await page.waitForURL(/\/track\//);
  await page.getByTestId("tracker-share-button").click();

  const shareUrl = await page.evaluate(() =>
    localStorage.getItem("vector.e2e.lastShareUrl"),
  );

  expect(shareUrl).toBeTruthy();
  return shareUrl as string;
}

test("shared plan view stays readable on mobile without horizontal overflow", async ({
  page,
}) => {
  const shareUrl = await createSharedPlan(page);

  await page.goto(shareUrl);

  await expect(page.getByTestId("shared-plan-header")).toBeVisible();
  await expect(page.getByText("Shared plan (read-only)")).toBeVisible();
  await expect(page.getByText("Executive Summary")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Activity" })).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, 0));

  const layout = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    docWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));

  expect(layout.docWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
  expect(layout.bodyWidth).toBeLessThanOrEqual(layout.innerWidth + 1);

  const headerBox = await page.getByTestId("shared-plan-header").boundingBox();
  expect(headerBox).not.toBeNull();
  expect(headerBox!.x).toBeGreaterThanOrEqual(0);
  expect(headerBox!.x + headerBox!.width).toBeLessThanOrEqual(
    layout.innerWidth + 1,
  );
});
