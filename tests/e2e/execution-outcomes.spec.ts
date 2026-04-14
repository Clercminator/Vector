import { expect, test, type Page } from "@playwright/test";

const PLAN_TITLE = "Launch a consulting offer with weekly execution evidence";

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

  await expect(page.getByText("Goal MRI")).toBeVisible();
  await expect(
    page.getByText(
      "Why this plan will fit before the full blueprint is generated",
    ),
  ).toBeVisible();
  await expect(page.getByTestId("wizard-approval-confirm")).toBeVisible();
  await page.getByTestId("wizard-approval-confirm").click();

  await expect(page.getByText("Plan Pack", { exact: true })).toBeVisible();
  await expect(
    page.locator("#blueprint-operating-system").getByText("Operating System", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("Framework Lens", { exact: true })).toBeVisible();
  await page.getByTestId("wizard-save-button").click();
  await page.waitForURL("**/");

  await page.goto("/dashboard");
  await expect(page.getByText(PLAN_TITLE)).toBeVisible();

  const blueprintId = await page.evaluate(() => {
    const raw = localStorage.getItem("vector.blueprints.v1");
    const blueprints = raw ? JSON.parse(raw) : [];
    return blueprints[0]?.id ?? null;
  });

  expect(blueprintId).toBeTruthy();
  return blueprintId as string;
}

test("wizard to tracker export and public share flow works in the browser", async ({
  page,
}) => {
  const blueprintId = await createSavedPlan(page);

  await page.getByText(PLAN_TITLE).first().click();
  await page.waitForURL(/\/wizard/);
  await expect(page.getByText("Plan Pack", { exact: true })).toBeVisible();

  await page.goto(`/track/${blueprintId}`);
  await page.waitForURL(/\/track\//);

  await expect(page.getByText("Execution Signals")).toBeVisible();
  await page.getByTestId("tracker-export-button").click();
  await expect(page.getByTestId("calendar-export-dialog")).toBeVisible();
  await expect(page.getByText("Export Preview")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("calendar-export-confirm-button").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain(".ics");

  await page.getByTestId("tracker-share-button").click();
  const shareUrl = await page.evaluate(() =>
    localStorage.getItem("vector.e2e.lastShareUrl"),
  );
  expect(shareUrl).toBeTruthy();

  await page.goto(shareUrl!);
  await expect(page.getByText("Executive Summary")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Launch a consulting offer/i }),
  ).toBeVisible();
  await expect(page.getByText("Proof Checklist")).toBeVisible();
});

test("wizard can tighten diagnosis, proof, and recovery independently", async ({
  page,
}) => {
  await createSavedPlan(page);

  await page.getByText(PLAN_TITLE).first().click();
  await page.waitForURL(/\/wizard/);
  await expect(page.getByText("Plan Pack", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Tighten Diagnosis" }).click();
  await page
    .getByRole("dialog")
    .getByRole("textbox")
    .fill("I need the diagnosis to account for low weekly bandwidth.");
  await page.getByRole("button", { name: "Apply AI Update" }).click();
  await expect(page.locator("#blueprint-diagnosis")).toContainText(
    "Address this new constraint directly: I need the diagnosis to account for low weekly bandwidth.",
  );

  await page.getByRole("button", { name: "Tighten Proof" }).click();
  await page
    .getByRole("dialog")
    .getByRole("textbox")
    .fill("Require one visible artifact each Friday.");
  await page.getByRole("button", { name: "Apply AI Update" }).click();
  await expect(page.locator("#blueprint-proof")).toContainText(
    "Capture one proof artifact that directly addresses this issue: Require one visible artifact each Friday.",
  );

  await page.getByRole("button", { name: "Tighten Recovery" }).click();
  await page
    .getByRole("dialog")
    .getByRole("textbox")
    .fill("Missed blocks should trigger a smaller fallback inside 24 hours.");
  await page.getByRole("button", { name: "Apply AI Update" }).click();
  await expect(page.locator("#blueprint-recovery")).toContainText(
    "Missed blocks should trigger a smaller fallback inside 24 hours.",
  );

  await page.getByTestId("wizard-save-button").click();
  await page.waitForURL("**/");

  const updatedPlan = await page.evaluate(() => {
    const raw = localStorage.getItem("vector.blueprints.v1");
    const blueprints = raw ? JSON.parse(raw) : [];
    return blueprints[0]?.result ?? null;
  });

  expect(updatedPlan?.currentReality).toContain(
    "I need the diagnosis to account for low weekly bandwidth.",
  );
  expect(updatedPlan?.proofChecklist?.join(" ")).toContain(
    "Require one visible artifact each Friday.",
  );
  expect(updatedPlan?.recoveryProtocol).toContain(
    "Missed blocks should trigger a smaller fallback inside 24 hours.",
  );
});

test("dashboard publish shows proof history in the community feed", async ({
  page,
}) => {
  await createSavedPlan(page);

  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("prompt");
    await dialog.accept(
      "Execution-first consulting plan with verified proof history.",
    );
  });

  await page.getByTestId("dashboard-publish-button").first().click();
  await page.waitForURL("**/community");

  await expect(
    page.getByTestId("community-template-card").first(),
  ).toContainText(PLAN_TITLE);
  await expect(
    page.getByTestId("community-proof-history").first(),
  ).toContainText("Verified Outcome History");
  await expect(
    page.getByTestId("community-proof-history").first(),
  ).toContainText(
    /Structured plan published|Progress verified|Consistency evidence/,
  );
});

test("stalled tracker execution can trigger and apply a guided revision", async ({
  page,
}) => {
  const blueprintId = await createSavedPlan(page);

  await page.goto(`/track/${blueprintId}`);
  await page.waitForURL(/\/track\//);
  await expect(page.getByText("Execution Signals")).toBeVisible();

  await page.evaluate((id) => {
    const key = `vector.e2e.execution.${id}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const state = JSON.parse(raw);
    const staleIso = new Date(
      Date.now() - 5 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const setbackIso = new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000,
    ).toISOString();
    if (state.tracker) {
      state.tracker.last_activity_at = staleIso;
      state.tracker.updated_at = staleIso;
      state.tracker.progress_pct = 0;
      state.tracker.completed_step_ids = [];
    }
    state.taskCompletions = [];
    state.logs = [
      {
        id: "e2e-setback-1",
        blueprint_id: id,
        user_id: "e2e-user",
        kind: "setback",
        content: "Missed the protected block.",
        created_at: staleIso,
      },
      {
        id: "e2e-setback-2",
        blueprint_id: id,
        user_id: "e2e-user",
        kind: "setback",
        content: "No proof was shipped this week.",
        created_at: setbackIso,
      },
    ];
    localStorage.setItem(key, JSON.stringify(state));
  }, blueprintId);

  await page.reload();

  await expect(page.getByText("Rescue Mode", { exact: true })).toBeVisible();
  await expect(page.getByTestId("tracker-revise-button")).toContainText(
    "Tighten this week",
  );
  await page.getByTestId("tracker-revise-button").click();
  await expect(page.getByTestId("adaptive-revision-dialog")).toBeVisible();

  await page
    .locator('[data-testid="adaptive-revision-dialog"] textarea')
    .fill(
      "I need the plan to rely on only one protected block per week and a visible Friday artifact.",
    );
  await page.getByTestId("adaptive-revision-generate-button").click();
  await expect(page.getByTestId("adaptive-revision-result")).toBeVisible();
  await page.getByTestId("adaptive-revision-apply-button").click();

  await expect(page.getByText("Adaptive revision applied.")).toBeVisible();

  const updatedPlan = await page.evaluate(() => {
    const raw = localStorage.getItem("vector.blueprints.v1");
    const blueprints = raw ? JSON.parse(raw) : [];
    return blueprints[0]?.result ?? null;
  });

  expect(updatedPlan?.recoveryProtocol).toContain("missed week");
  expect(updatedPlan?.proofChecklist?.[0]).toBeTruthy();
});
