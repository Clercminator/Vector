export interface WizardFrameworkConfig {
  title: string;
  questions: string[];
}

export interface WizardInitialContext {
  objective?: string;
  explanation?: string;
}

type WizardTranslate = (key: string) => string;

interface WizardFrameworkCopyKeys {
  title: string;
  questions: string[];
}

const DEFAULT_FRAMEWORK_COPY: WizardFrameworkCopyKeys = {
  title: "fp.title",
  questions: ["fp.q1"],
};

const FRAMEWORK_COPY_KEYS: Record<string, WizardFrameworkCopyKeys> = {
  "first-principles": {
    title: "fpf.title",
    questions: ["fpf.q1", "fpf.q2", "fpf.q3"],
  },
  pareto: {
    title: "pareto.title",
    questions: ["pareto.q1", "pareto.q2", "pareto.q3"],
  },
  rpm: {
    title: "rpm.title",
    questions: ["rpm.q1", "rpm.q2", "rpm.q3"],
  },
  eisenhower: {
    title: "eisenhower.title",
    questions: ["eisenhower.q1", "eisenhower.q2", "eisenhower.q3"],
  },
  okr: {
    title: "okr.title",
    questions: ["okr.q1", "okr.q2", "okr.q3"],
  },
  media: {
    title: "misogi.title",
    questions: ["misogi.q1", "misogi.q2", "misogi.q3"],
  },
  misogi: {
    title: "misogi.title",
    questions: ["misogi.q1", "misogi.q2", "misogi.q3"],
  },
  ikigai: {
    title: "ikigai.title",
    questions: ["ikigai.q1", "ikigai.q2", "ikigai.q3", "ikigai.q4"],
  },
  dsss: {
    title: "fw.dsss.title",
    questions: ["wizard.dsss.firstQuestion"],
  },
  gps: {
    title: "gps.title",
    questions: ["gps.q1", "gps.q2", "gps.q3"],
  },
  general: DEFAULT_FRAMEWORK_COPY,
};

function translateFrameworkConfig(
  t: WizardTranslate,
  config: WizardFrameworkCopyKeys,
): WizardFrameworkConfig {
  return {
    title: t(config.title),
    questions: config.questions.map((key) => t(key)),
  };
}

export function getWizardFrameworkConfig(
  t: WizardTranslate,
  framework?: string,
): WizardFrameworkConfig {
  if (!framework) {
    return translateFrameworkConfig(t, DEFAULT_FRAMEWORK_COPY);
  }

  return translateFrameworkConfig(
    t,
    FRAMEWORK_COPY_KEYS[framework] ?? FRAMEWORK_COPY_KEYS["first-principles"],
  );
}

export function getWizardOpeningMessage(
  t: WizardTranslate,
  config: WizardFrameworkConfig,
): string {
  return (
    config.questions[0] ||
    `${t("wizard.welcome").replace("{0}", config.title)} ${t("wizard.agentStart")}`
  );
}

export function getWizardReopeningMessage(
  t: WizardTranslate,
  config: WizardFrameworkConfig,
): string {
  return t("wizard.reopening").replace("{0}", config.title);
}

export function getWizardInitialMessage(
  t: WizardTranslate,
  config: WizardFrameworkConfig,
  initialContext?: WizardInitialContext | null,
): string {
  if (initialContext?.explanation) {
    return initialContext.objective
      ? `${initialContext.explanation}\n\n${t("wizard.readyToBuild")}`
      : `${initialContext.explanation}\n\n${config.questions[0] || t("wizard.agentStart")}`;
  }

  return getWizardOpeningMessage(t, config);
}