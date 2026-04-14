import { expect, test } from "@playwright/test";

const CREATED_AT = new Date("2026-01-01T09:00:00.000Z").toISOString();

const FRAMEWORK_CASES = [
  {
    framework: "first-principles",
    title: "First Principles Framework Smoke",
    marker: "Truth: protect two build blocks every week at 09:00.",
    result: {
      type: "first-principles",
      truths: [
        "Truth: protect two build blocks every week at 09:00.",
        "Truth: ship one proof artifact every Friday at 16:00.",
        "Truth: review the scorecard every Sunday at 18:00 before adding scope.",
      ],
      newApproach:
        "Build the week around protected execution first, then let everything else fit around it.",
    },
  },
  {
    framework: "pareto",
    title: "Pareto Framework Smoke",
    marker: "High-impact call block every Wednesday at 14:00.",
    result: {
      type: "pareto",
      vital: [
        "High-impact call block every Wednesday at 14:00.",
        "Proof artifact shipped every Friday at 16:00.",
      ],
      trivial: [
        "Inbox cleanup only after the Thursday 09:00 build block ends.",
        "Do not let inbox cleanup replace the Friday 16:00 proof shipment.",
      ],
    },
  },
  {
    framework: "rpm",
    title: "RPM Framework Smoke",
    marker: "Protected Tuesday build block at 09:00.",
    result: {
      type: "rpm",
      result: "Create weekly proof momentum",
      purpose: "Turn planning into visible progress each week.",
      plan: [
        "Protected Tuesday build block at 09:00.",
        "Friday proof shipment at 16:00.",
        "Sunday review at 18:00.",
      ],
    },
  },
  {
    framework: "eisenhower",
    title: "Eisenhower Framework Smoke",
    marker: "Urgent offer draft finished by Tuesday 17:00.",
    result: {
      type: "eisenhower",
      q1: ["Urgent offer draft finished by Tuesday 17:00."],
      q2: ["Deep work block every Thursday at 09:00."],
      q3: ["Delegate inbox triage by 12:00 each weekday."],
      q4: ["Remove social scrolling during the Thursday 09:00 focus block."],
    },
  },
  {
    framework: "okr",
    title: "OKR Framework Smoke",
    marker: "Run the Monday planning block before checking messages.",
    result: {
      type: "okr",
      objective: "Build a reliable consulting pipeline",
      keyResults: [
        "Book 3 discovery calls by Friday 17:00.",
        "Ship 1 proof artifact every Friday at 16:00.",
        "Complete 2 protected build blocks every week by Thursday 17:00.",
      ],
      initiative: "Run the Monday planning block before checking messages.",
    },
  },
  {
    framework: "dsss",
    title: "DSSS Framework Smoke",
    marker: "Send the Friday proof artifact by 17:00 each week.",
    result: {
      type: "dsss",
      deconstruct: [
        "Define one weekly milestone and one Friday proof artifact.",
      ],
      selection: ["Choose the top action every Monday at 09:00."],
      sequence: ["Run the protected build block every Tuesday at 09:00."],
      stakes: "Send the Friday proof artifact by 17:00 each week.",
    },
  },
  {
    framework: "mandalas",
    title: "Mandala Framework Smoke",
    marker: "Audience",
    result: {
      type: "mandalas",
      centralGoal: "Grow the consulting offer through weekly proof",
      categories: [
        {
          name: "Audience",
          steps: ["Interview one user every Wednesday at 14:00."],
        },
        {
          name: "Proof",
          steps: ["Ship one proof artifact every Friday at 16:00."],
        },
        { name: "Offer", steps: ["Refine the promise every Monday at 09:00."] },
        { name: "Review", steps: ["Review the plan every Sunday at 18:00."] },
      ],
    },
  },
  {
    framework: "gps",
    title: "GPS Framework Smoke",
    marker: "No reactive admin before the Tuesday 09:00 build block.",
    result: {
      type: "gps",
      goal: "Create weekly execution proof",
      plan: ["Run the Tuesday build block at 09:00."],
      system: ["Review progress every Sunday at 18:00."],
      anti_goals: [
        "No reactive admin before the Tuesday 09:00 build block.",
        "No context switching during the Friday 16:00 proof shipment.",
      ],
    },
  },
  {
    framework: "misogi",
    title: "Misogi Framework Smoke",
    marker: "Bold launch attempt after 12 protected build blocks.",
    result: {
      type: "misogi",
      challenge: "Bold launch attempt after 12 protected build blocks.",
      gap: "Current system ships zero public proof artifacts by Friday 16:00.",
      purification:
        "Protect Tuesday and Thursday 09:00 blocks before doing any reactive work.",
    },
  },
  {
    framework: "ikigai",
    title: "Ikigai Framework Smoke",
    marker: "Write one evidence-driven breakdown every Wednesday by 12:00.",
    result: {
      type: "ikigai",
      love: "Coach real people during a Tuesday 09:00 block.",
      goodAt: "Write one evidence-driven breakdown every Wednesday by 12:00.",
      worldNeeds: "One practical proof artifact every Friday at 16:00.",
      paidFor: "Test one paid offer every Thursday at 15:00.",
      purpose: "Keep the Sunday 18:00 review tied to visible service.",
    },
  },
  {
    framework: "general",
    title: "General Framework Smoke",
    marker: "Run the weekly review every Sunday at 18:00.",
    result: {
      type: "general",
      steps: [
        "Run the weekly review every Sunday at 18:00.",
        "Protect the Tuesday build block at 09:00.",
        "Ship one proof artifact every Friday at 16:00.",
      ],
    },
  },
] as const;

const FRAMEWORK_BLUEPRINTS = FRAMEWORK_CASES.map((item, index) => ({
  id: `framework-${index + 1}`,
  framework: item.framework,
  title: item.title,
  answers: [item.title],
  result: item.result,
  createdAt: CREATED_AT,
}));

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ blueprints }) => {
      localStorage.clear();
      localStorage.setItem("vector.onboarding_done", "true");
      localStorage.setItem("vector.blueprints.v1", JSON.stringify(blueprints));
      sessionStorage.setItem("vector.e2e.initialized", "true");
    },
    { blueprints: FRAMEWORK_BLUEPRINTS },
  );
});

test("dashboard opens every framework result branch after the recent result changes", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page.getByText(FRAMEWORK_CASES[0].title)).toBeVisible();

  for (const frameworkCase of FRAMEWORK_CASES) {
    await test.step(frameworkCase.framework, async () => {
      await page.getByText(frameworkCase.title).first().click();
      await page.waitForURL(/\/wizard/);
      await expect(page.getByText("Plan Pack", { exact: true })).toBeVisible();
      await expect(page.getByText(frameworkCase.marker).first()).toBeVisible();
      await page.goto("/dashboard");
    });
  }
});
