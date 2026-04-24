import { describe, expect, it } from "vitest";
import {
  getWizardFrameworkConfig,
  getWizardInitialMessage,
  getWizardOpeningMessage,
  getWizardReopeningMessage,
} from "./wizardFrameworkConfig";

const translations: Record<string, string> = {
  "fp.title": "Goal Planner",
  "fp.q1": "What are you trying to achieve?",
  "fpf.title": "First Principles",
  "fpf.q1": "What is the core problem?",
  "fpf.q2": "What constraints matter?",
  "fpf.q3": "What assumptions can we break?",
  "wizard.agentStart": "Let's build this.",
  "wizard.readyToBuild": "I'm ready to build.",
  "wizard.reopening": "Reopening {0}",
  "wizard.welcome": "Welcome to {0}",
};

const t = (key: string) => translations[key] ?? key;

describe("wizardFrameworkConfig", () => {
  it("uses planner copy when no framework is selected", () => {
    expect(getWizardFrameworkConfig(t)).toEqual({
      title: "Goal Planner",
      questions: ["What are you trying to achieve?"],
    });
  });

  it("falls back unknown frameworks to first principles copy", () => {
    expect(getWizardFrameworkConfig(t, "unknown-framework")).toEqual({
      title: "First Principles",
      questions: [
        "What is the core problem?",
        "What constraints matter?",
        "What assumptions can we break?",
      ],
    });
  });

  it("builds the opening and reopening messages from the translated config", () => {
    const config = getWizardFrameworkConfig(t, "first-principles");

    expect(getWizardOpeningMessage(t, config)).toBe("What is the core problem?");
    expect(getWizardReopeningMessage(t, config)).toBe(
      "Reopening First Principles",
    );
  });

  it("uses the ready-to-build copy when intake already includes an objective", () => {
    const config = getWizardFrameworkConfig(t, "first-principles");

    expect(
      getWizardInitialMessage(t, config, {
        objective: "Ship the launch",
        explanation: "We already know the goal.",
      }),
    ).toBe("We already know the goal.\n\nI'm ready to build.");
  });

  it("reuses the first framework question when explanation exists without an objective", () => {
    const config = getWizardFrameworkConfig(t, "first-principles");

    expect(
      getWizardInitialMessage(t, config, {
        explanation: "Here is the context.",
      }),
    ).toBe("Here is the context.\n\nWhat is the core problem?");
  });
});