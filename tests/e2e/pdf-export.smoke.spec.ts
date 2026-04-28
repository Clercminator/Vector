import { expect, test } from "@playwright/test";

const CREATED_AT = new Date("2026-01-01T09:00:00.000Z").toISOString();

const PDF_EXPORT_BLUEPRINT = {
  id: "pdf-export-smoke-1",
  framework: "general",
  title: "PDF Export Smoke",
  answers: ["PDF Export Smoke"],
  result: {
    type: "general",
    steps: [
      "Run the weekly review every Sunday at 18:00.",
      "Protect the Tuesday build block at 09:00.",
      "Ship one proof artifact every Friday at 16:00.",
    ],
  },
  createdAt: CREATED_AT,
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ blueprint }) => {
      localStorage.clear();
      localStorage.setItem("vector.onboarding_done", "true");
      localStorage.setItem("vector.blueprints.v1", JSON.stringify([blueprint]));
      sessionStorage.setItem("vector.e2e.initialized", "true");
    },
    { blueprint: PDF_EXPORT_BLUEPRINT },
  );
});

test("dashboard can reopen a saved plan and export it as PDF", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "My Plans", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: PDF_EXPORT_BLUEPRINT.title,
      exact: true,
    }),
  ).toBeVisible({ timeout: 15_000 });

  await page
    .getByRole("heading", {
      name: PDF_EXPORT_BLUEPRINT.title,
      exact: true,
    })
    .click();
  await page.waitForURL(/\/wizard/);

  await expect(page.getByText("Plan Pack", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Run the weekly review every Sunday at 18:00.").first(),
  ).toBeVisible();

  const pdfButton = page.getByRole("button", { name: "PDF" });
  await expect(pdfButton).toBeEnabled();

  const downloadPromise = page.waitForEvent("download");
  await pdfButton.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(
    /^vector-\d{4}-\d{2}-\d{2}-pdf-export-smoke\.pdf$/,
  );
});