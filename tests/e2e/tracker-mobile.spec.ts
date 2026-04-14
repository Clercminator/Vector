import { expect, test, type Page } from "@playwright/test";

const PLAN_TITLE = "Keep a consulting offer moving with visible weekly proof";

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

async function createSavedPlan(page: Page) {
  await page.goto("/wizard?framework=rpm");

  const chatInput = page.locator("#wizard-chat-input");
  await chatInput.fill(PLAN_TITLE);
  await page.keyboard.press("Enter");

  await expect(
    page.getByText("Give me one real constraint or current obstacle"),
  ).toBeVisible();

  await chatInput.fill(
    "I need a compact system that still produces one visible proof artifact every week.",
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
  return blueprintId as string;
}

test("tracker view stays usable on mobile without horizontal overflow", async ({
  page,
}) => {
  const blueprintId = await createSavedPlan(page);

  await page.goto(`/track/${blueprintId}`);
  await page.waitForURL(/\/track\//);

  await expect(page.getByText("Execution Signals")).toBeVisible();
  await expect(page.getByTestId("tracker-share-button")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Activity" })).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, 0));

  const layout = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    docWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));

  expect(layout.docWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
  expect(layout.bodyWidth).toBeLessThanOrEqual(layout.innerWidth + 1);

  const actionsBox = await page
    .getByTestId("tracker-header-actions")
    .boundingBox();

  expect(actionsBox).not.toBeNull();
  expect(actionsBox!.x).toBeGreaterThanOrEqual(0);
  expect(actionsBox!.x + actionsBox!.width).toBeLessThanOrEqual(
    layout.innerWidth + 1,
  );

  await page.getByTestId("tracker-share-button").click();
  const shareUrl = await page.evaluate(() =>
    localStorage.getItem("vector.e2e.lastShareUrl"),
  );

  expect(shareUrl).toBeTruthy();
});
