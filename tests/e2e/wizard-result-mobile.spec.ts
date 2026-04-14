import { expect, test, type Page } from "@playwright/test";

const PLAN_TITLE = "Launch a consulting offer with weekly execution evidence";

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
    "I only have five hours per week and I need clear weekly milestones.",
  );
  await page.keyboard.press("Enter");

  await expect(page.getByTestId("wizard-approval-confirm")).toBeVisible();
  await page.getByTestId("wizard-approval-confirm").click();

  await expect(page.getByText("Plan Pack", { exact: true })).toBeVisible();
  await page.getByTestId("wizard-save-button").click();
  await page.waitForURL("**/");
}

test("wizard result stays usable on mobile without horizontal overflow", async ({
  page,
}) => {
  await createSavedPlan(page);

  await page.goto("/dashboard");
  await expect(page.getByText(PLAN_TITLE)).toBeVisible();
  await page.getByText(PLAN_TITLE).first().click();
  await page.waitForURL(/\/wizard/);

  await expect(page.getByTestId("wizard-header")).toBeVisible();
  await expect(page.getByText("Plan Pack", { exact: true })).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, 0));

  const layout = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    docWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));

  expect(layout.docWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
  expect(layout.bodyWidth).toBeLessThanOrEqual(layout.innerWidth + 1);

  await page.getByTestId("wizard-save-button").scrollIntoViewIfNeeded();
  const actionsBox = await page
    .getByTestId("wizard-result-actions")
    .boundingBox();

  expect(actionsBox).not.toBeNull();
  expect(actionsBox!.x).toBeGreaterThanOrEqual(0);
  expect(actionsBox!.x + actionsBox!.width).toBeLessThanOrEqual(
    layout.innerWidth + 1,
  );

  await expect(
    page.getByRole("button", { name: /^Full screen$/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^PDF$/i })).toBeVisible();
  await expect(page.getByTestId("wizard-save-button")).toBeVisible();
});
