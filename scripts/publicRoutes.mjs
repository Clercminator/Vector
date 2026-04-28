export const publicStaticRoutes = ["/", "/about", "/pricing", "/guides"];

export const localizedLanguages = ["es", "pt", "fr", "de"];

export const frameworkIds = [
  "first-principles",
  "pareto",
  "rpm",
  "eisenhower",
  "okr",
  "dsss",
  "mandalas",
  "gps",
  "misogi",
  "ikigai",
];

export const articleSlugs = [
  "how-to-choose-the-right-goal-framework",
  "best-framework-for-career-change",
  "best-framework-for-startup-planning",
  "best-framework-for-studying",
  "best-framework-for-fitness-goals",
  "career-planning-system",
  "personal-okr-system",
  "goal-prioritization-system",
  "study-planning-system",
  "life-planning-framework",
  "okr-generator",
  "ikigai-template",
  "eisenhower-matrix-tool",
  "pareto-analysis-template",
  "career-change-planner",
  "goal-breakdown-tool",
  "example-okr-for-career-change",
  "example-study-plan-using-pareto",
  "best-goal-setting-method",
  "planning-system-for-personal-goals",
  "decision-framework-for-complex-goals",
  "life-planning-tool",
  "personal-strategy-framework",
  "priority-matrix-guide",
  "ikigai-vs-okr",
  "first-principles-vs-pareto",
  "rpm-vs-okr",
  "smart-goals-vs-eisenhower",
  "pareto-vs-eisenhower-matrix",
  "okr-vs-smart-goals",
  "vector-vs-notion-goal-planning",
  "vector-vs-trello-personal-planning",
  "okrs-in-vector-vs-spreadsheet-tracking",
  "how-to-use-pareto-for-studying",
  "how-to-use-okrs-for-personal-goals",
  "how-to-use-ikigai-for-career-clarity",
  "how-to-stop-feeling-overwhelmed",
  "how-to-prioritize-too-many-goals",
  "how-to-turn-a-vague-goal-into-a-plan",
];

export function buildPublicRoutes() {
  const baseRoutes = [
    ...publicStaticRoutes,
    ...frameworkIds.map((id) => `/frameworks/${id}`),
    ...articleSlugs.map((slug) => `/articles/${slug}`),
  ];

  return [
    ...baseRoutes,
    ...localizedLanguages.flatMap((language) => [
      `/${language}`,
      `/${language}/about`,
      `/${language}/pricing`,
      `/${language}/guides`,
      ...frameworkIds.map((id) => `/${language}/frameworks/${id}`),
      ...articleSlugs.map((slug) => `/${language}/articles/${slug}`),
    ]),
  ];
}