import {
  frameworks,
  type Framework,
  type FrameworkDefinition,
} from "@/lib/frameworks";
import firstPrinciplesMd from "@/content/frameworks/first-principles.md?raw";
import paretoMd from "@/content/frameworks/pareto.md?raw";
import rpmMd from "@/content/frameworks/rpm.md?raw";
import eisenhowerMd from "@/content/frameworks/eisenhower.md?raw";
import okrMd from "@/content/frameworks/okr.md?raw";
import dsssMd from "@/content/frameworks/dsss.md?raw";
import mandalasMd from "@/content/frameworks/mandalas.md?raw";
import gpsMd from "@/content/frameworks/gps.md?raw";
import misogiMd from "@/content/frameworks/misogi.md?raw";
import ikigaiMd from "@/content/frameworks/ikigai.md?raw";

export interface FrameworkGuideSection {
  title: string;
  anchor: string;
  markdown: string;
}

export interface FrameworkGuideFaq {
  question: string;
  answer: string;
}

export interface FrameworkGuideTheme {
  hero: string;
  heroGlow: string;
  surface: string;
  surfaceStrong: string;
  border: string;
  chip: string;
  accentText: string;
  button: string;
}

export interface FrameworkGuide {
  id: Framework;
  framework: FrameworkDefinition;
  intro: string;
  audience: string;
  keywords: string[];
  takeaways: string[];
  faqs: FrameworkGuideFaq[];
  sections: FrameworkGuideSection[];
  readingTime: string;
  theme: FrameworkGuideTheme;
}

const markdownMap: Partial<Record<Framework, string>> = {
  "first-principles": firstPrinciplesMd,
  pareto: paretoMd,
  rpm: rpmMd,
  eisenhower: eisenhowerMd,
  okr: okrMd,
  dsss: dsssMd,
  mandalas: mandalasMd,
  gps: gpsMd,
  misogi: misogiMd,
  ikigai: ikigaiMd,
};

const themeMap: Record<Framework, FrameworkGuideTheme> = {
  "first-principles": {
    hero: "from-sky-600 via-blue-600 to-cyan-400",
    heroGlow: "bg-sky-400/25",
    surface: "bg-sky-50/80 dark:bg-sky-950/35",
    surfaceStrong: "bg-sky-100/90 dark:bg-sky-950/55",
    border: "border-sky-200/70 dark:border-sky-900/70",
    chip: "bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-200",
    accentText: "text-sky-700 dark:text-sky-300",
    button: "bg-sky-600 hover:bg-sky-700 text-white",
  },
  pareto: {
    hero: "from-emerald-600 via-green-600 to-lime-400",
    heroGlow: "bg-emerald-400/25",
    surface: "bg-emerald-50/80 dark:bg-emerald-950/35",
    surfaceStrong: "bg-emerald-100/90 dark:bg-emerald-950/55",
    border: "border-emerald-200/70 dark:border-emerald-900/70",
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200",
    accentText: "text-emerald-700 dark:text-emerald-300",
    button: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  rpm: {
    hero: "from-rose-600 via-red-600 to-orange-400",
    heroGlow: "bg-rose-400/25",
    surface: "bg-rose-50/80 dark:bg-rose-950/35",
    surfaceStrong: "bg-rose-100/90 dark:bg-rose-950/55",
    border: "border-rose-200/70 dark:border-rose-900/70",
    chip: "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200",
    accentText: "text-rose-700 dark:text-rose-300",
    button: "bg-rose-600 hover:bg-rose-700 text-white",
  },
  eisenhower: {
    hero: "from-amber-500 via-yellow-500 to-orange-300",
    heroGlow: "bg-amber-400/25",
    surface: "bg-amber-50/80 dark:bg-amber-950/35",
    surfaceStrong: "bg-amber-100/90 dark:bg-amber-950/55",
    border: "border-amber-200/70 dark:border-amber-900/70",
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200",
    accentText: "text-amber-700 dark:text-amber-300",
    button: "bg-amber-500 hover:bg-amber-600 text-black",
  },
  okr: {
    hero: "from-violet-600 via-purple-600 to-fuchsia-400",
    heroGlow: "bg-violet-400/25",
    surface: "bg-violet-50/80 dark:bg-violet-950/35",
    surfaceStrong: "bg-violet-100/90 dark:bg-violet-950/55",
    border: "border-violet-200/70 dark:border-violet-900/70",
    chip: "bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-200",
    accentText: "text-violet-700 dark:text-violet-300",
    button: "bg-violet-600 hover:bg-violet-700 text-white",
  },
  dsss: {
    hero: "from-amber-500 via-orange-500 to-red-400",
    heroGlow: "bg-orange-400/25",
    surface: "bg-orange-50/80 dark:bg-orange-950/35",
    surfaceStrong: "bg-orange-100/90 dark:bg-orange-950/55",
    border: "border-orange-200/70 dark:border-orange-900/70",
    chip: "bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-200",
    accentText: "text-orange-700 dark:text-orange-300",
    button: "bg-orange-500 hover:bg-orange-600 text-black",
  },
  mandalas: {
    hero: "from-pink-600 via-rose-600 to-fuchsia-400",
    heroGlow: "bg-pink-400/25",
    surface: "bg-pink-50/80 dark:bg-pink-950/35",
    surfaceStrong: "bg-pink-100/90 dark:bg-pink-950/55",
    border: "border-pink-200/70 dark:border-pink-900/70",
    chip: "bg-pink-100 text-pink-800 dark:bg-pink-950/70 dark:text-pink-200",
    accentText: "text-pink-700 dark:text-pink-300",
    button: "bg-pink-600 hover:bg-pink-700 text-white",
  },
  gps: {
    hero: "from-orange-600 via-orange-500 to-amber-300",
    heroGlow: "bg-orange-400/25",
    surface: "bg-orange-50/80 dark:bg-orange-950/35",
    surfaceStrong: "bg-orange-100/90 dark:bg-orange-950/55",
    border: "border-orange-200/70 dark:border-orange-900/70",
    chip: "bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-200",
    accentText: "text-orange-700 dark:text-orange-300",
    button: "bg-orange-600 hover:bg-orange-700 text-white",
  },
  misogi: {
    hero: "from-rose-700 via-pink-600 to-orange-400",
    heroGlow: "bg-rose-400/25",
    surface: "bg-rose-50/80 dark:bg-rose-950/35",
    surfaceStrong: "bg-rose-100/90 dark:bg-rose-950/55",
    border: "border-rose-200/70 dark:border-rose-900/70",
    chip: "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200",
    accentText: "text-rose-700 dark:text-rose-300",
    button: "bg-rose-600 hover:bg-rose-700 text-white",
  },
  ikigai: {
    hero: "from-fuchsia-600 via-pink-600 to-rose-400",
    heroGlow: "bg-fuchsia-400/25",
    surface: "bg-fuchsia-50/80 dark:bg-fuchsia-950/35",
    surfaceStrong: "bg-fuchsia-100/90 dark:bg-fuchsia-950/55",
    border: "border-fuchsia-200/70 dark:border-fuchsia-900/70",
    chip: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/70 dark:text-fuchsia-200",
    accentText: "text-fuchsia-700 dark:text-fuchsia-300",
    button: "bg-fuchsia-600 hover:bg-fuchsia-700 text-white",
  },
};

const guideMetaMap: Record<
  Framework,
  {
    keywords: string[];
    takeaways: string[];
    audience?: string;
    faqs: FrameworkGuideFaq[];
  }
> = {
  "first-principles": {
    keywords: ["problem solving", "innovation", "mental model", "strategy"],
    takeaways: [
      "Break inherited assumptions before choosing tactics.",
      "Use bedrock truths to design original solutions.",
      "Test new ideas fast instead of debating old analogies.",
    ],
    faqs: [
      {
        question: "When should you use First Principles thinking?",
        answer:
          "Use it when standard advice keeps producing mediocre results, or when the problem is constrained by assumptions you suspect are wrong.",
      },
      {
        question: "What is the main risk of First Principles?",
        answer:
          "It is cognitively expensive. Without a clear scope, you can spend too much time deconstructing instead of shipping experiments.",
      },
    ],
  },
  pareto: {
    keywords: ["80/20 rule", "prioritization", "efficiency", "focus"],
    takeaways: [
      "Look for the few activities that create most of the outcome.",
      "Protect high-leverage work before optimizing low-value tasks.",
      "Use Pareto regularly because the vital few change over time.",
    ],
    faqs: [
      {
        question: "Is the Pareto ratio always exactly 80/20?",
        answer:
          "No. The point is asymmetry, not mathematical precision. You are looking for the few causes that dominate the result.",
      },
      {
        question: "Can Pareto make you ignore important maintenance work?",
        answer:
          "Yes, if you apply it carelessly. Keep a small baseline for maintenance so focus does not create preventable problems later.",
      },
    ],
  },
  rpm: {
    keywords: ["results planning", "purpose", "massive action", "motivation"],
    takeaways: [
      "Anchor goals in emotion, not only outputs.",
      "Define the result, the reason, and the action path together.",
      "RPM works best when motivation is fading and you need renewed intensity.",
    ],
    faqs: [
      {
        question: "How is RPM different from a normal task list?",
        answer:
          "RPM starts with the result and the emotional reason behind it, so your task list is built around momentum rather than administrative sorting.",
      },
      {
        question: "Who benefits most from RPM?",
        answer:
          "People who already know what to do but struggle to stay emotionally committed to the process.",
      },
    ],
  },
  eisenhower: {
    keywords: [
      "urgent vs important",
      "task management",
      "prioritization matrix",
      "focus",
    ],
    takeaways: [
      "Separate urgency from importance before making commitments.",
      "Schedule strategic work before reactive work consumes the week.",
      "Delegation and deletion are part of prioritization, not afterthoughts.",
    ],
    faqs: [
      {
        question: "What is the biggest mistake with the Eisenhower Matrix?",
        answer:
          "Treating every incoming request as urgent. The framework only works if you classify tasks honestly instead of reactively.",
      },
      {
        question: "Is the Eisenhower Matrix useful for teams?",
        answer:
          "Yes. It gives teams a shared language for deciding what gets immediate attention, what gets scheduled, and what should not stay on the board at all.",
      },
    ],
  },
  okr: {
    keywords: [
      "objectives and key results",
      "goal tracking",
      "team alignment",
      "metrics",
    ],
    takeaways: [
      "Keep objectives directional and key results measurable.",
      "Use OKRs when alignment matters as much as ambition.",
      "Review cadence is part of the system, not an optional extra.",
    ],
    faqs: [
      {
        question: "What makes a good key result?",
        answer:
          "A good key result is measurable, time-bound, and specific enough that a team can tell whether progress is real without interpretation games.",
      },
      {
        question: "Should OKRs be used for personal goals?",
        answer:
          "Yes, especially for quarterly planning, but they work best when the goal can be translated into observable progress rather than vague intention.",
      },
    ],
  },
  dsss: {
    keywords: [
      "rapid learning",
      "meta-learning",
      "skill acquisition",
      "tim ferriss",
    ],
    takeaways: [
      "Learn by deconstructing a skill before practicing it blindly.",
      "Select the smallest set of subskills that create real competence.",
      "Use sequencing and stakes to stop drifting in your learning plan.",
    ],
    audience:
      "Builders, generalists, and fast learners who want to compress the time it takes to become functional at a new skill.",
    faqs: [
      {
        question: "What does DSSS stand for?",
        answer:
          "Deconstruction, Selection, Sequencing, and Stakes. It is a meta-learning system for rapidly acquiring practical skill.",
      },
      {
        question: "Why are stakes important in DSSS?",
        answer:
          "Because accountability converts intention into follow-through. Without stakes, many learning projects stay theoretical.",
      },
    ],
  },
  mandalas: {
    keywords: [
      "mandala chart",
      "goal mapping",
      "visual planning",
      "shohei ohtani",
    ],
    takeaways: [
      "Use the central goal to force clarity before filling the grid.",
      "The outer cells expose missing capabilities and dependencies.",
      "Mandala planning is best for ambitious goals that need balanced progress.",
    ],
    audience:
      "People tackling a large identity-level goal that requires parallel growth across multiple areas.",
    faqs: [
      {
        question: "What is the Mandala Chart used for?",
        answer:
          "It is used to break a central ambition into eight domains and then into concrete actions, making a large goal visible and actionable at the same time.",
      },
      {
        question: "When does the Mandala Chart work best?",
        answer:
          "It works best when the goal is multidimensional, such as building a company, becoming elite in a discipline, or changing your lifestyle holistically.",
      },
    ],
  },
  gps: {
    keywords: ["goal plan system", "execution system", "consistency", "habits"],
    takeaways: [
      "Goals fail when planning and systems are disconnected.",
      "Your system should reduce friction at the moment of execution.",
      "GPS is useful when you know the destination but keep missing consistency.",
    ],
    faqs: [
      {
        question: "What does GPS stand for here?",
        answer:
          "Goal, Plan, System. The framework closes the gap between intention and repeated execution.",
      },
      {
        question: "How do systems differ from plans?",
        answer:
          "A plan explains what should happen. A system defines how the behavior will keep happening under real-world constraints.",
      },
    ],
  },
  misogi: {
    keywords: [
      "misogi challenge",
      "annual challenge",
      "resilience",
      "voluntary hardship",
    ],
    takeaways: [
      "A Misogi should reset your sense of what is possible.",
      "The challenge needs enough risk of failure to matter psychologically.",
      "Use it sparingly; this is a yearly recalibration, not a daily productivity tool.",
    ],
    faqs: [
      {
        question: "What qualifies as a Misogi challenge?",
        answer:
          "A challenge that feels meaningfully outside your current identity, has a real chance of failure, and can be pursued without reckless harm.",
      },
      {
        question: "Why do people use Misogi?",
        answer:
          "Because a defining annual challenge can rebuild confidence, widen perceived limits, and make normal difficulties feel lighter afterward.",
      },
    ],
  },
  ikigai: {
    keywords: [
      "purpose",
      "career clarity",
      "meaningful work",
      "self-discovery",
    ],
    takeaways: [
      "Ikigai helps you test purpose through overlap, not fantasy.",
      "Purpose emerges where value, skill, joy, and sustainability intersect.",
      "Use it to evaluate life direction, not only career branding.",
    ],
    faqs: [
      {
        question: "Is Ikigai only about careers?",
        answer:
          "No. Career is one expression of Ikigai, but the framework is really about building a life that feels useful, energizing, and coherent.",
      },
      {
        question: "What if the four circles do not overlap yet?",
        answer:
          "That is normal. The framework is still useful because it shows which dimension needs more development, experimentation, or honesty.",
      },
    ],
  },
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function stripFrontmatter(markdown: string) {
  return markdown.replace(/^---[\s\S]*?---\s*/, "").trim();
}

function buildFallbackMarkdown(framework: FrameworkDefinition) {
  return [
    `# ${framework.title}`,
    "",
    framework.definition,
    "",
    "## Who is this for?",
    "",
    framework.whoItIsFor ??
      `People who want to use ${framework.title} to move a complex goal into a clearer execution plan.`,
    "",
    "## How to Apply It",
    "",
    `1. Define the outcome you want ${framework.title} to help you reach.`,
    `2. Use the framework to break that outcome into the right structure for decision-making.`,
    "3. Convert the resulting insight into concrete milestones, constraints, and next actions.",
    "4. Review the plan weekly and refine the weakest assumption first.",
    "",
    "## Pros & Cons",
    "",
    "### Pros",
    ...framework.pros.map((item) => `- ${item}`),
    "",
    "### Cons",
    ...framework.cons.map((item) => `- ${item}`),
    "",
    "## Example",
    "",
    framework.example,
  ].join("\n");
}

function parseSections(markdown: string, framework: FrameworkDefinition) {
  const stripped = stripFrontmatter(
    markdown || buildFallbackMarkdown(framework),
  );
  const lines = stripped.split("\n");
  const introLines: string[] = [];
  const sections: FrameworkGuideSection[] = [];
  let currentTitle: string | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    if (!currentTitle) {
      return;
    }

    const markdownBody = currentLines.join("\n").trim();
    if (!markdownBody) {
      return;
    }

    sections.push({
      title: currentTitle,
      anchor: slugify(currentTitle),
      markdown: markdownBody,
    });
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!currentTitle && line.startsWith("# ")) {
      continue;
    }

    if (line.startsWith("## ")) {
      flush();
      currentTitle = line.replace(/^##\s+/, "").trim();
      currentLines = [];
      continue;
    }

    if (currentTitle) {
      currentLines.push(rawLine);
    } else {
      introLines.push(rawLine);
    }
  }

  flush();

  return {
    intro: introLines.join("\n").trim() || framework.definition,
    sections,
  };
}

function estimateReadingTime(content: string) {
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(3, Math.ceil(wordCount / 220));
  return `${minutes} min read`;
}

function buildGuide(framework: FrameworkDefinition): FrameworkGuide {
  const articleMarkdown =
    markdownMap[framework.id] ?? buildFallbackMarkdown(framework);
  const { intro, sections } = parseSections(articleMarkdown, framework);
  const meta = guideMetaMap[framework.id];
  const audience =
    meta.audience ??
    framework.whoItIsFor ??
    `People who want a practical way to apply ${framework.title} without keeping the framework abstract.`;
  const readingTime = estimateReadingTime(
    `${intro}\n${sections.map((section) => section.markdown).join("\n")}`,
  );

  return {
    id: framework.id,
    framework,
    intro,
    audience,
    keywords: meta.keywords,
    takeaways: meta.takeaways,
    faqs: meta.faqs,
    sections,
    readingTime,
    theme: themeMap[framework.id],
  };
}

export const frameworkGuides = frameworks.map((framework) =>
  buildGuide(framework),
);

export function getFrameworkGuide(id: Framework) {
  return frameworkGuides.find((guide) => guide.id === id);
}
