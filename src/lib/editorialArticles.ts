import type { Framework } from "@/lib/frameworks";
import {
  frameworkGuides,
  type FrameworkGuideFaq,
  type FrameworkGuideSection,
  type FrameworkGuideTheme,
} from "@/lib/frameworkGuides";
import { editorialArticleExtensions } from "@/lib/editorialArticleExtensions";

export type EditorialArticleCategory =
  | "selection"
  | "use-case"
  | "comparison"
  | "application"
  | "problem"
  | "system"
  | "tool"
  | "example"
  | "synonym"
  | "commercial";

export interface ArticlePlanPreviewBlock {
  title: string;
  body?: string;
  items?: string[];
}

export interface ArticlePlanPreview {
  title: string;
  summary: string;
  blocks: ArticlePlanPreviewBlock[];
}

export interface EditorialArticle {
  slug: string;
  category: EditorialArticleCategory;
  title: string;
  description: string;
  intro: string;
  keywords: string[];
  takeaways: string[];
  faqs: FrameworkGuideFaq[];
  sections: FrameworkGuideSection[];
  readingTime: string;
  theme: FrameworkGuideTheme;
  relatedFrameworks: Framework[];
  relatedArticles: string[];
  primaryFramework: Framework;
  seoTitle: string;
  authorName?: string;
  authorRole?: string;
  reviewedAt?: string;
  trustStatement?: string;
  editorialStandards?: string[];
  howToSteps?: string[];
  planPreview?: ArticlePlanPreview;
}

export const editorialCategoryLabels: Record<EditorialArticleCategory, string> =
  {
    selection: "Framework selection",
    "use-case": "Use cases",
    comparison: "Comparisons",
    application: "Framework applications",
    problem: "Problem-led guides",
    system: "Outcome systems",
    tool: "Tools and templates",
    example: "Blueprint examples",
    synonym: "Adjacent intent",
    commercial: "Product comparisons",
  };

const DEFAULT_REVIEWED_AT = "2026-04-04";
const DEFAULT_AUTHOR_NAME = "David Clerc";
const DEFAULT_AUTHOR_ROLE = "Founder, Vector";
const DEFAULT_TRUST_STATEMENT =
  "This page is based on the planning frameworks, blueprint structures, and execution patterns used inside Vector to turn abstract goals into structured plans.";
const DEFAULT_EDITORIAL_STANDARDS = [
  "Grounded in the framework definitions and blueprint structures used inside the product.",
  "Reviewed for practical fit, tradeoffs, and execution guidance rather than generic productivity advice.",
  "Updated when the public planning library, framework mappings, or product workflows change.",
];

const fallbackTheme = frameworkGuides[0]?.theme ?? {
  hero: "from-sky-600 via-blue-600 to-cyan-400",
  heroGlow: "bg-sky-400/25",
  surface: "bg-sky-50/80 dark:bg-sky-950/35",
  surfaceStrong: "bg-sky-100/90 dark:bg-sky-950/55",
  border: "border-sky-200/70 dark:border-sky-900/70",
  chip: "bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-200",
  accentText: "text-sky-700 dark:text-sky-300",
  button: "bg-sky-600 hover:bg-sky-700 text-white",
};

function themeFor(framework: Framework) {
  return (
    frameworkGuides.find((guide) => guide.id === framework)?.theme ??
    fallbackTheme
  );
}

function article(
  input: Omit<EditorialArticle, "theme"> & { themeFramework?: Framework },
): EditorialArticle {
  return {
    ...input,
    theme: themeFor(input.themeFramework ?? input.primaryFramework),
    authorName: input.authorName ?? DEFAULT_AUTHOR_NAME,
    authorRole: input.authorRole ?? DEFAULT_AUTHOR_ROLE,
    reviewedAt: input.reviewedAt ?? DEFAULT_REVIEWED_AT,
    trustStatement: input.trustStatement ?? DEFAULT_TRUST_STATEMENT,
    editorialStandards: input.editorialStandards ?? DEFAULT_EDITORIAL_STANDARDS,
  };
}

function applyArticleDefaults(
  articleEntry: EditorialArticle,
): EditorialArticle {
  return {
    ...articleEntry,
    authorName: articleEntry.authorName ?? DEFAULT_AUTHOR_NAME,
    authorRole: articleEntry.authorRole ?? DEFAULT_AUTHOR_ROLE,
    reviewedAt: articleEntry.reviewedAt ?? DEFAULT_REVIEWED_AT,
    trustStatement: articleEntry.trustStatement ?? DEFAULT_TRUST_STATEMENT,
    editorialStandards:
      articleEntry.editorialStandards ?? DEFAULT_EDITORIAL_STANDARDS,
  };
}

export const editorialArticles: EditorialArticle[] = [
  article({
    slug: "how-to-choose-the-right-goal-framework",
    category: "selection",
    title: "How to Choose the Right Goal-Setting Framework",
    description:
      "A practical decision guide for choosing between First Principles, Pareto, OKRs, Eisenhower, RPM, Ikigai, and other planning frameworks.",
    intro:
      "Most people do not fail because they lack ambition. They fail because they choose a planning method that does not match the shape of the problem. The right framework depends on whether you need clarity, prioritization, execution, alignment, reinvention, or identity-level direction.",
    keywords: [
      "best goal-setting framework",
      "how to choose a framework",
      "planning framework",
      "productivity method",
    ],
    takeaways: [
      "Choose frameworks based on the bottleneck in your goal, not on popularity.",
      "Use one primary framework first, then layer support frameworks only when needed.",
      "Framework choice should change as the problem moves from clarity to execution or measurement.",
    ],
    faqs: [
      {
        question: "What is the best goal-setting framework overall?",
        answer:
          "There is no universal winner. The best framework is the one that matches your current bottleneck: prioritization, strategy, measurement, meaning, or execution consistency.",
      },
      {
        question: "Should you combine multiple frameworks?",
        answer:
          "Yes, but only after one primary framework gives structure to the problem. Combining too early usually creates complexity instead of clarity.",
      },
    ],
    sections: [
      {
        title: "Start with the problem, not the framework",
        anchor: "start-with-the-problem-not-the-framework",
        markdown:
          "Ask what is actually broken right now. If the goal is vague, choose a framework for clarity. If you know the goal but keep drowning in tasks, choose prioritization. If the plan exists but momentum dies, choose execution structure. If multiple people must move together, choose visibility and measurement.",
      },
      {
        title: "Match the bottleneck to the right method",
        anchor: "match-the-bottleneck-to-the-right-method",
        markdown:
          "- **First Principles**: when inherited assumptions are the real obstacle.\n- **Pareto**: when too many tasks compete for attention.\n- **Eisenhower Matrix**: when urgency is eating the week.\n- **OKRs**: when progress must be measurable and shared.\n- **RPM**: when emotional buy-in matters more than sterile task management.\n- **GPS**: when you know what to do but cannot sustain execution.\n- **Ikigai**: when the problem is life direction or career meaning.\n- **Misogi**: when you need a defining challenge, not a daily planning system.\n- **DSSS**: when the goal is rapid skill acquisition.\n- **Mandala Chart**: when the ambition is broad and multidimensional.",
      },
      {
        title: "A simple rule that works in real life",
        anchor: "a-simple-rule-that-works-in-real-life",
        markdown:
          "Pick the framework that makes your next ten decisions easier. If the method cannot immediately improve prioritization, sequencing, measurement, or commitment, it is probably not the right one for the current stage of the goal.",
      },
    ],
    readingTime: "5 min read",
    relatedFrameworks: [
      "first-principles",
      "pareto",
      "okr",
      "eisenhower",
      "ikigai",
    ],
    relatedArticles: [
      "pareto-vs-eisenhower-matrix",
      "okr-vs-smart-goals",
      "best-framework-for-career-change",
    ],
    primaryFramework: "first-principles",
    seoTitle:
      "How to Choose the Right Goal-Setting Framework in 2026 | Vector AI",
  }),
  article({
    slug: "best-framework-for-career-change",
    category: "use-case",
    title: "Best Framework for Career Change",
    description:
      "Choose the best framework for a career change by deciding whether your biggest issue is direction, prioritization, execution, or measurable transition milestones.",
    intro:
      "Career changes fail for different reasons. Some people have no idea what direction fits. Others know the target but cannot convert it into a transition plan. The right framework depends on whether you need meaning, decision criteria, prioritization, or a quarter-by-quarter system.",
    keywords: [
      "best framework for career change",
      "career change planning",
      "career transition strategy",
      "ikigai career change",
    ],
    takeaways: [
      "Ikigai is strongest when the real problem is direction and meaning.",
      "Pareto and First Principles help when the transition needs focus and strategic reframing.",
      "OKRs become useful once the target role is clear and execution needs measurement.",
    ],
    faqs: [
      {
        question:
          "What framework is best if I do not know what career to pursue?",
        answer:
          "Start with Ikigai. It is better suited to meaning, overlap, and direction than execution-first systems like OKRs or Pareto.",
      },
      {
        question: "What framework is best once I know the target role?",
        answer:
          "OKRs or GPS usually become more useful after clarity exists, because the challenge shifts from discovery to execution.",
      },
    ],
    sections: [
      {
        title: "Use Ikigai when the problem is direction",
        anchor: "use-ikigai-when-the-problem-is-direction",
        markdown:
          "If you are unsure which path is worth pursuing, Ikigai is often the best starting point. Career changes are not only about income; they are also about fit, meaning, sustainability, and personal energy. Ikigai helps surface whether the move is rooted in genuine alignment or just temporary frustration.",
      },
      {
        title: "Use First Principles and Pareto when the move feels messy",
        anchor: "use-first-principles-and-pareto-when-the-move-feels-messy",
        markdown:
          "Use First Principles if your assumptions about the transition are weak or inherited from other people. Use Pareto if the move is already clear but your time is being wasted on low-leverage preparation instead of the few steps that matter, such as portfolio proof, targeted outreach, and skill gaps.",
      },
      {
        title: "Use OKRs once the target is defined",
        anchor: "use-okrs-once-the-target-is-defined",
        markdown:
          "Once you know the role, OKRs help convert the transition into measurable progress. A strong example is an objective like becoming interview-ready for a specific field, with key results tied to portfolio pieces, conversations, applications, and interview practice.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["ikigai", "okr", "pareto", "first-principles"],
    relatedArticles: [
      "how-to-choose-the-right-goal-framework",
      "how-to-use-ikigai-for-career-clarity",
    ],
    primaryFramework: "ikigai",
    seoTitle: "Best Framework for Career Change Planning | Vector AI",
  }),
  article({
    slug: "best-framework-for-startup-planning",
    category: "use-case",
    title: "Best Framework for Startup Planning",
    description:
      "The best startup planning framework depends on whether you need strategic clarity, ruthless focus, execution cadence, or measurable company goals.",
    intro:
      "Startup planning is usually overcomplicated because founders mix idea validation, prioritization, and company execution into one messy blob. Different stages of startup work need different frameworks.",
    keywords: [
      "best framework for startup planning",
      "startup planning framework",
      "founder planning method",
      "okr for startups",
    ],
    takeaways: [
      "First Principles is strongest when the startup thesis itself is unclear.",
      "Pareto is critical once founder attention gets diluted across too many moving parts.",
      "OKRs work best when a team needs visible targets and quarter-level alignment.",
    ],
    faqs: [
      {
        question: "What framework is best for an early-stage founder?",
        answer:
          "First Principles is often the best first layer because it helps pressure-test assumptions about users, value, and constraints before execution accelerates.",
      },
      {
        question: "When should startups use OKRs?",
        answer:
          "OKRs become more useful once the company has a defined direction, active priorities, and enough team coordination that visibility matters.",
      },
    ],
    sections: [
      {
        title: "Start with First Principles when the thesis is weak",
        anchor: "start-with-first-principles-when-the-thesis-is-weak",
        markdown:
          "If the startup is still mostly an idea, First Principles helps you challenge assumptions about users, pricing, alternatives, and the actual job to be done. It is better than jumping directly into execution theater around launches and roadmaps.",
      },
      {
        title: "Use Pareto when founder time is spread too thin",
        anchor: "use-pareto-when-founder-time-is-spread-too-thin",
        markdown:
          "Pareto becomes essential as soon as the founder is juggling product, sales, hiring, and operations. It helps isolate the few actions that actually increase learning, traction, or revenue instead of feeding the illusion of busyness.",
      },
      {
        title: "Use OKRs to run the company, not invent the company",
        anchor: "use-okrs-to-run-the-company-not-invent-the-company",
        markdown:
          "Once the core direction exists, OKRs help operationalize progress. They are strong for growth, product, and team coordination, but weak when the problem is still basic strategic uncertainty. Use them after the company has a thesis worth executing.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["first-principles", "pareto", "okr", "gps"],
    relatedArticles: [
      "how-to-choose-the-right-goal-framework",
      "first-principles-vs-pareto",
    ],
    primaryFramework: "first-principles",
    seoTitle:
      "Best Framework for Startup Planning and Founder Execution | Vector AI",
  }),
  article({
    slug: "best-framework-for-studying",
    category: "use-case",
    title: "Best Framework for Studying",
    description:
      "Choose the best framework for studying by deciding whether you need prioritization, rapid skill acquisition, measurable milestones, or execution consistency.",
    intro:
      "Studying is not one problem. Sometimes the issue is information overload. Sometimes it is weak sequencing. Sometimes it is lack of consistency. The best framework for studying depends on where the breakdown happens.",
    keywords: [
      "best framework for studying",
      "study planning framework",
      "pareto for studying",
      "dsss studying",
    ],
    takeaways: [
      "DSSS is strongest when you need to acquire a practical skill quickly.",
      "Pareto is best when the curriculum is too broad and you need leverage.",
      "OKRs and GPS help when consistency and measurable progress matter more than theory.",
    ],
    faqs: [
      {
        question: "What framework is best for exam preparation?",
        answer:
          "Pareto is usually the best starting point because exams often reward the highest-yield topics disproportionately.",
      },
      {
        question: "What framework is best for learning a new skill?",
        answer:
          "DSSS is the strongest option when the goal is rapid practical competence rather than broad academic familiarity.",
      },
    ],
    sections: [
      {
        title: "Use DSSS for skill acquisition",
        anchor: "use-dsss-for-skill-acquisition",
        markdown:
          "If the goal is to become functional in a new skill, DSSS gives the best structure. Deconstruct the skill, select the high-yield subskills, sequence practice, and use stakes to force consistency. This is much stronger than passively consuming material in order.",
      },
      {
        title: "Use Pareto for high-yield focus",
        anchor: "use-pareto-for-high-yield-focus",
        markdown:
          "Pareto helps when the curriculum is too wide. Instead of treating every chapter equally, you identify the concepts, problem types, or exercises that create most of the exam or skill payoff. This is one of the highest-value study corrections for overwhelmed learners.",
      },
      {
        title: "Use GPS or OKRs when consistency is the real battle",
        anchor: "use-gps-or-okrs-when-consistency-is-the-real-battle",
        markdown:
          "If you already know what to study but cannot sustain the rhythm, GPS is often better because it forces you to build a repeatable study system. If the challenge is a longer arc with milestones, OKRs can help make the outcome measurable.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["dsss", "pareto", "okr", "gps"],
    relatedArticles: [
      "how-to-use-pareto-for-studying",
      "how-to-choose-the-right-goal-framework",
    ],
    primaryFramework: "dsss",
    themeFramework: "dsss",
    seoTitle: "Best Framework for Studying and Skill Acquisition | Vector AI",
  }),
  article({
    slug: "best-framework-for-fitness-goals",
    category: "use-case",
    title: "Best Framework for Fitness Goals",
    description:
      "Fitness planning works better when the framework matches the challenge: prioritization, consistency, identity change, or a defining annual push.",
    intro:
      "Fitness goals can fail because the plan is unrealistic, because the system is inconsistent, or because the challenge is not emotionally meaningful enough to survive fatigue. The best framework depends on which one of those is true.",
    keywords: [
      "best framework for fitness goals",
      "fitness planning framework",
      "gps for fitness",
      "misogi fitness",
    ],
    takeaways: [
      "GPS is often the best framework for sustainable fitness execution.",
      "Pareto helps remove low-value complexity from training and nutrition plans.",
      "Misogi is useful when the goal is a defining physical challenge rather than habit maintenance.",
    ],
    faqs: [
      {
        question: "What framework is best for staying consistent in fitness?",
        answer:
          "GPS is usually strongest because it links the goal to a plan and a repeatable system, which is the real challenge in fitness execution.",
      },
      {
        question: "When should Misogi be used for fitness?",
        answer:
          "Use Misogi when the goal is a defining physical challenge that changes your psychological baseline, not when you just need ordinary weekly consistency.",
      },
    ],
    sections: [
      {
        title: "Use GPS when the issue is consistency",
        anchor: "use-gps-when-the-issue-is-consistency",
        markdown:
          "Most fitness goals fail in execution, not in knowledge. GPS is strong because it closes the gap between intention and repeated action. The system matters as much as the plan, because motivation is unstable.",
      },
      {
        title: "Use Pareto to simplify the plan",
        anchor: "use-pareto-to-simplify-the-plan",
        markdown:
          "Fitness content often creates false complexity. Pareto helps cut through that by focusing on the exercises, nutrition behaviors, and recovery habits that drive most of the result. This is especially useful when the current plan feels bloated and unsustainable.",
      },
      {
        title: "Use Misogi for identity-level challenges",
        anchor: "use-misogi-for-identity-level-challenges",
        markdown:
          "Misogi becomes valuable when the goal is not simply work out more, but something like a race, long hike, or defining physical feat that changes how you see yourself. It is a challenge framework, not a maintenance framework.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["gps", "pareto", "misogi"],
    relatedArticles: [
      "how-to-stop-feeling-overwhelmed",
      "how-to-choose-the-right-goal-framework",
    ],
    primaryFramework: "gps",
    seoTitle: "Best Framework for Fitness Goals and Consistency | Vector AI",
  }),
  article({
    slug: "ikigai-vs-okr",
    category: "comparison",
    title: "Ikigai vs OKR: Purpose or Measurable Progress?",
    description:
      "Compare Ikigai and OKRs to decide whether your situation needs direction and meaning or measurable execution and alignment.",
    intro:
      "Ikigai and OKRs are often confused because both deal with goals. But Ikigai is about direction and coherence, while OKRs are about measurable progress toward a defined objective. Choosing between them depends on whether you are still finding the path or already managing execution.",
    keywords: [
      "ikigai vs okr",
      "purpose vs goals",
      "career clarity vs okrs",
      "okr or ikigai",
    ],
    takeaways: [
      "Ikigai answers why and where; OKRs answer how much and by when.",
      "Use Ikigai for identity and direction problems.",
      "Use OKRs for visible progress once direction exists.",
    ],
    faqs: [
      {
        question: "Can Ikigai and OKRs work together?",
        answer:
          "Yes. Ikigai can define the direction, and OKRs can operationalize that direction into measurable progress once the path is clearer.",
      },
      {
        question: "Which is better for career planning?",
        answer:
          "Ikigai is usually better at the start of career planning because the first challenge is often direction and fit rather than quarterly measurement.",
      },
    ],
    sections: [
      {
        title: "Ikigai is for coherence",
        anchor: "ikigai-is-for-coherence",
        markdown:
          "Ikigai is strongest when the question is existential or directional. It helps evaluate whether your ambitions, skills, value to others, and economic reality overlap enough to build a sustainable path.",
      },
      {
        title: "OKRs are for execution visibility",
        anchor: "okrs-are-for-execution-visibility",
        markdown:
          "OKRs are strongest when the direction already exists and the next problem is turning it into measurable progress. They create tension, clarity, and review cadence, especially in team or quarter-based planning.",
      },
      {
        title: "A useful sequence",
        anchor: "a-useful-sequence",
        markdown:
          "Use Ikigai first if the goal itself still feels uncertain. Once the direction hardens into a real objective, switch into OKRs so the work can be tracked and reviewed without drifting back into abstraction.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["ikigai", "okr"],
    relatedArticles: ["best-framework-for-career-change", "okr-vs-smart-goals"],
    primaryFramework: "ikigai",
    seoTitle:
      "Ikigai vs OKR: Which Works Better for Purpose and Progress? | Vector AI",
  }),
  article({
    slug: "first-principles-vs-pareto",
    category: "comparison",
    title: "First Principles vs Pareto: Strategy or Leverage?",
    description:
      "Compare First Principles and Pareto to decide whether your goal needs deep strategic reframing or ruthless focus on the few inputs that matter most.",
    intro:
      "First Principles and Pareto both improve decisions, but they do it differently. First Principles helps you rethink assumptions. Pareto helps you cut dilution. One is better for invention and strategic redesign. The other is better for leverage and simplification.",
    keywords: [
      "first principles vs pareto",
      "strategy vs leverage",
      "pareto or first principles",
      "decision frameworks",
    ],
    takeaways: [
      "First Principles is for redesigning the logic of the problem.",
      "Pareto is for reallocating attention inside an existing problem space.",
      "Use them together when both assumptions and overload are blocking progress.",
    ],
    faqs: [
      {
        question: "Which is better for startup strategy?",
        answer:
          "First Principles is stronger when the startup thesis needs pressure-testing. Pareto becomes more useful once the work is clear but founder attention is diluted.",
      },
      {
        question: "Can you combine First Principles and Pareto?",
        answer:
          "Yes. Use First Principles to rethink the problem, then Pareto to focus execution on the few actions that drive most of the result.",
      },
    ],
    sections: [
      {
        title: "What First Principles does better",
        anchor: "what-first-principles-does-better",
        markdown:
          "First Principles is best when conventional wisdom is the trap. It gives you permission to rebuild the logic of the goal from basic truths rather than inherited assumptions, which is valuable in strategy, invention, and major life pivots.",
      },
      {
        title: "What Pareto does better",
        anchor: "what-pareto-does-better",
        markdown:
          "Pareto is best when the structure already exists but the workload is badly allocated. It is a compression framework. It forces you to identify the few causes that dominate the outcome and stop giving equal weight to everything else.",
      },
      {
        title: "When to sequence them together",
        anchor: "when-to-sequence-them-together",
        markdown:
          "A strong sequence is to use First Principles first when the framing is weak, then use Pareto once the problem is defined and the next challenge is execution focus. This is especially useful in product, business, and personal change work.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["first-principles", "pareto"],
    relatedArticles: [
      "best-framework-for-startup-planning",
      "how-to-choose-the-right-goal-framework",
    ],
    primaryFramework: "first-principles",
    seoTitle: "First Principles vs Pareto: Strategy vs Focus | Vector AI",
  }),
  article({
    slug: "rpm-vs-okr",
    category: "comparison",
    title: "RPM vs OKR: Motivation or Measurement?",
    description:
      "Compare Tony Robbins RPM and OKRs to decide whether your goal needs emotional commitment or measurable execution structure.",
    intro:
      "RPM and OKRs both create movement, but they do not optimize for the same thing. RPM is strongest when motivation, purpose, and emotional intensity are missing. OKRs are strongest when progress must be measured clearly over time.",
    keywords: [
      "rpm vs okr",
      "tony robbins rpm vs okr",
      "motivation vs measurement",
      "goal systems comparison",
    ],
    takeaways: [
      "RPM is emotionally catalytic; OKRs are operationally measurable.",
      "Use RPM when the problem is commitment and energy.",
      "Use OKRs when the problem is visibility and progress tracking.",
    ],
    faqs: [
      {
        question: "Which is better for personal goals?",
        answer:
          "RPM is often better for personal goals when emotional buy-in is the limiting factor. OKRs are better when you already care deeply but need measurable progress.",
      },
      {
        question: "Can RPM and OKRs be combined?",
        answer:
          "Yes. RPM can anchor the emotional reason behind the work, while OKRs can structure measurable progress once the commitment is clear.",
      },
    ],
    sections: [
      {
        title: "RPM is stronger when energy is low",
        anchor: "rpm-is-stronger-when-energy-is-low",
        markdown:
          "RPM helps reconnect the outcome to a purpose you care about. That emotional architecture matters when people know what to do but cannot maintain the intensity to keep doing it.",
      },
      {
        title: "OKRs are stronger when progress must be visible",
        anchor: "okrs-are-stronger-when-progress-must-be-visible",
        markdown:
          "If the issue is not caring, but rather staying accountable to milestones and metrics, OKRs are the better system. They make outcomes inspectable, which is important for teams, quarters, and structured improvement.",
      },
      {
        title: "When to move from RPM into OKRs",
        anchor: "when-to-move-from-rpm-into-okrs",
        markdown:
          "A useful pattern is to start with RPM if the goal feels emotionally flat, then convert it into OKRs once the result and purpose are strong enough to support disciplined measurement.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["rpm", "okr"],
    relatedArticles: [
      "okr-vs-smart-goals",
      "how-to-choose-the-right-goal-framework",
    ],
    primaryFramework: "rpm",
    seoTitle: "RPM vs OKR: Which Goal System Should You Use? | Vector AI",
  }),
  article({
    slug: "smart-goals-vs-eisenhower",
    category: "comparison",
    title: "SMART Goals vs Eisenhower Matrix: Specificity or Prioritization?",
    description:
      "Compare SMART goals and the Eisenhower Matrix to decide whether your main problem is defining the right goal or protecting the right work.",
    intro:
      "SMART goals and the Eisenhower Matrix often sit in the same productivity conversations, but they solve different planning problems. SMART is about defining a commitment precisely. Eisenhower is about deciding what deserves attention right now.",
    keywords: [
      "smart goals vs eisenhower",
      "prioritization vs goal setting",
      "eisenhower matrix comparison",
      "smart goals matrix",
    ],
    takeaways: [
      "SMART helps define a target clearly.",
      "Eisenhower helps defend important work from urgent noise.",
      "Use SMART for commitment design and Eisenhower for weekly triage.",
    ],
    faqs: [
      {
        question: "Which is better for overwhelmed people?",
        answer:
          "Eisenhower is usually better first, because the issue is often triage rather than poorly written goals.",
      },
      {
        question: "Should SMART and Eisenhower be used together?",
        answer:
          "Yes. SMART helps define the commitment, and Eisenhower helps protect time for the important work that supports it.",
      },
    ],
    sections: [
      {
        title: "SMART goals define a commitment",
        anchor: "smart-goals-define-a-commitment",
        markdown:
          "SMART goals are strong when the biggest problem is vagueness. They force specificity, measurability, realism, and timing, which is useful when the commitment itself is still blurry.",
      },
      {
        title: "Eisenhower protects important work",
        anchor: "eisenhower-protects-important-work",
        markdown:
          "The Eisenhower Matrix is stronger when the goal already exists but reactive work keeps hijacking attention. It makes urgency visible and creates a rule for doing, scheduling, delegating, or deleting.",
      },
      {
        title: "The best practical combination",
        anchor: "the-best-practical-combination",
        markdown:
          "Use SMART at the goal-definition layer and Eisenhower at the weekly execution layer. One clarifies what the commitment is, and the other helps ensure you actually protect time for it.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["eisenhower", "okr"],
    relatedArticles: ["okr-vs-smart-goals", "how-to-stop-feeling-overwhelmed"],
    primaryFramework: "eisenhower",
    seoTitle:
      "SMART Goals vs Eisenhower Matrix: Which Should You Use? | Vector AI",
  }),
  article({
    slug: "pareto-vs-eisenhower-matrix",
    category: "comparison",
    title:
      "Pareto vs Eisenhower Matrix: Which Prioritization Method Fits Better?",
    description:
      "A clear comparison of the Pareto Principle and the Eisenhower Matrix, including when to use each and when to combine them.",
    intro:
      "Pareto and the Eisenhower Matrix both promise focus, but they solve different prioritization failures. Pareto helps you find the few inputs that create most of the output. Eisenhower helps you classify work by urgency and importance so reactivity does not consume your calendar.",
    keywords: [
      "pareto vs eisenhower",
      "prioritization methods",
      "80/20 vs eisenhower matrix",
      "task prioritization",
    ],
    takeaways: [
      "Pareto is leverage-first; Eisenhower is triage-first.",
      "Use Pareto to decide what deserves disproportionate energy.",
      "Use Eisenhower to defend important work from urgency noise.",
    ],
    faqs: [
      {
        question: "Which is better for overwhelmed professionals?",
        answer:
          "Eisenhower usually helps first when the problem is daily chaos. Pareto becomes more powerful once the urgent noise is under control and you are optimizing for leverage.",
      },
      {
        question: "Can Pareto and Eisenhower be used together?",
        answer:
          "Yes. Use Eisenhower to separate urgent from important, then apply Pareto inside the important work to identify the highest-leverage tasks.",
      },
    ],
    sections: [
      {
        title: "What Pareto does better",
        anchor: "what-pareto-does-better",
        markdown:
          "Pareto is strongest when the challenge is resource allocation. It helps identify the small number of customers, tasks, habits, or bets that create most of the outcome.",
      },
      {
        title: "What Eisenhower does better",
        anchor: "what-eisenhower-does-better",
        markdown:
          "The Eisenhower Matrix is strongest when the challenge is decision hygiene under pressure. It helps sort incoming work into doing, scheduling, delegating, or deleting.",
      },
      {
        title: "A practical hybrid workflow",
        anchor: "a-practical-hybrid-workflow",
        markdown:
          "Use Eisenhower first to clear reactive noise, then apply Pareto inside the important work that remains. That gives you both short-term control and long-term leverage.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["pareto", "eisenhower"],
    relatedArticles: [
      "first-principles-vs-pareto",
      "how-to-prioritize-too-many-goals",
    ],
    primaryFramework: "pareto",
    seoTitle: "Pareto vs Eisenhower Matrix for Prioritization | Vector AI",
  }),
  article({
    slug: "okr-vs-smart-goals",
    category: "comparison",
    title: "OKR vs SMART Goals: What Should You Use for Real Progress?",
    description:
      "Compare OKRs and SMART goals by ambition, measurement, scope, and review cadence to choose the better system for your work.",
    intro:
      "OKRs and SMART goals are both used for planning, but they encourage different behavior. SMART goals are narrower and cleaner for individual commitments. OKRs are better when you need directional ambition plus measurable outcomes.",
    keywords: [
      "okr vs smart goals",
      "goal setting systems",
      "okr comparison",
      "smart goals vs okrs",
    ],
    takeaways: [
      "SMART goals are tighter and simpler for bounded personal commitments.",
      "OKRs are stronger when teams or quarters need shared visibility.",
      "Use SMART inside an OKR ecosystem when a key result needs a concrete execution plan.",
    ],
    faqs: [
      {
        question: "Are OKRs better than SMART goals?",
        answer:
          "Not automatically. OKRs are better for directional ambition and alignment; SMART goals are better when the task needs a specific, bounded commitment.",
      },
      {
        question: "Can personal goals use OKRs?",
        answer:
          "Yes. They work well for quarterly personal planning, especially when progress needs measurable feedback instead of vague intention.",
      },
    ],
    sections: [
      {
        title: "Where SMART goals win",
        anchor: "where-smart-goals-win",
        markdown:
          "SMART goals are useful when the outcome is already well-defined and the main issue is ambiguity. They are strong for bounded deliverables, habits, and clear short-range commitments.",
      },
      {
        title: "Where OKRs win",
        anchor: "where-okrs-win",
        markdown:
          "OKRs are better when the work is exploratory, ambition-sensitive, or cross-functional. They create measurable progress without requiring the objective itself to become small or uninspiring.",
      },
      {
        title:
          "Use them together when the work needs both ambition and clarity",
        anchor:
          "use-them-together-when-the-work-needs-both-ambition-and-clarity",
        markdown:
          "A strong pattern is to use OKRs at the objective layer, then write SMART initiatives under the key results. That preserves ambition while still clarifying the actual work to be done.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["okr", "gps"],
    relatedArticles: ["smart-goals-vs-eisenhower", "rpm-vs-okr"],
    primaryFramework: "okr",
    seoTitle: "OKR vs SMART Goals: Which Goal System Works Better? | Vector AI",
  }),
  article({
    slug: "how-to-use-pareto-for-studying",
    category: "application",
    title: "How to Use Pareto for Studying",
    description:
      "Use the Pareto Principle to study the highest-yield topics first, reduce overwhelm, and focus your time on the material that creates most of the result.",
    intro:
      "Students often assume serious studying means treating every topic equally. That usually creates exhaustion instead of progress. Pareto is useful because most of the academic payoff usually comes from a smaller number of concepts, problem types, and review loops.",
    keywords: [
      "how to use pareto for studying",
      "80 20 studying",
      "pareto study method",
      "study prioritization",
    ],
    takeaways: [
      "Not every chapter or task deserves equal study time.",
      "High-yield concepts and problem types usually create most of the score improvement.",
      "Pareto works best when paired with a repeatable review system.",
    ],
    faqs: [
      {
        question: "Does using Pareto for studying mean skipping material?",
        answer:
          "Not exactly. It means weighting study time toward the topics and exercises that produce the greatest payoff before spreading attention evenly.",
      },
      {
        question: "What subjects benefit most from Pareto?",
        answer:
          "Any subject with high-yield patterns, repeated concepts, or predictable exam weighting benefits from it.",
      },
    ],
    sections: [
      {
        title: "Identify the high-yield material first",
        anchor: "identify-the-high-yield-material-first",
        markdown:
          "Look for recurring concepts, common error types, past-paper patterns, and topics with outsized weight. The goal is not to guess randomly, but to identify the limited set of material that creates most of the grade movement.",
      },
      {
        title: "Apply Pareto to practice, not just reading",
        anchor: "apply-pareto-to-practice-not-just-reading",
        markdown:
          "Many students overinvest in passive review. Pareto works better when applied to practice loops: the few problem types, question formats, or drills that repeatedly expose the core skill gap.",
      },
      {
        title: "Do not confuse focus with neglect",
        anchor: "do-not-confuse-focus-with-neglect",
        markdown:
          "Pareto is about weighted attention, not reckless skipping. After the high-yield topics are stable, use the remaining time to cover lower-leverage material more lightly.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["pareto", "dsss", "gps"],
    relatedArticles: [
      "best-framework-for-studying",
      "how-to-prioritize-too-many-goals",
    ],
    primaryFramework: "pareto",
    seoTitle: "How to Use the Pareto Principle for Studying | Vector AI",
  }),
  article({
    slug: "how-to-use-okrs-for-personal-goals",
    category: "application",
    title: "How to Use OKRs for Personal Goals",
    description:
      "A practical guide to using OKRs for personal goals so ambitions become measurable, reviewable, and harder to abandon halfway through.",
    intro:
      "OKRs are often treated as a team-only framework, but they can be powerful for personal goals when the real problem is vague progress. They work best for quarterly efforts that need measurable evidence rather than good intentions.",
    keywords: [
      "how to use okrs for personal goals",
      "personal okr guide",
      "okr personal planning",
      "okr for life goals",
    ],
    takeaways: [
      "Personal OKRs are best for quarter-length goals that need measurable proof of progress.",
      "Objectives should stay directional and motivating.",
      "Key results should prove movement, not just activity.",
    ],
    faqs: [
      {
        question: "Are OKRs too corporate for personal use?",
        answer:
          "Only if written badly. When kept simple, they are one of the cleanest ways to turn a personal ambition into something visible and reviewable.",
      },
      {
        question: "How many personal OKRs should you run at once?",
        answer:
          "Usually one to three. Too many personal OKRs dilute attention and make review less honest.",
      },
    ],
    sections: [
      {
        title: "Write objectives that create direction",
        anchor: "write-objectives-that-create-direction",
        markdown:
          "The objective should be concrete enough to feel real and broad enough to inspire effort. It should sound like a direction worth moving toward, not a spreadsheet entry.",
      },
      {
        title: "Write key results that prove change",
        anchor: "write-key-results-that-prove-change",
        markdown:
          "A good personal key result measures real movement, such as output, milestone completion, behavior frequency, or capability growth. It should be difficult to fake with busy work.",
      },
      {
        title: "Review weekly, adjust monthly",
        anchor: "review-weekly-adjust-monthly",
        markdown:
          "Personal OKRs work because they create a cadence. Review them weekly for honesty, and make monthly adjustments when the original key results are no longer measuring the right thing.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["okr", "gps"],
    relatedArticles: [
      "okr-vs-smart-goals",
      "how-to-turn-a-vague-goal-into-a-plan",
    ],
    primaryFramework: "okr",
    seoTitle:
      "How to Use OKRs for Personal Goals and Quarterly Planning | Vector AI",
  }),
  article({
    slug: "how-to-use-ikigai-for-career-clarity",
    category: "application",
    title: "How to Use Ikigai for Career Clarity",
    description:
      "Use Ikigai to bring structure to career confusion by testing fit across meaning, skill, value, and sustainability.",
    intro:
      "Career confusion usually persists because people evaluate opportunities through only one lens at a time. Ikigai is useful because it forces a broader test: joy, competence, value to others, and economic viability.",
    keywords: [
      "how to use ikigai for career clarity",
      "ikigai career guide",
      "career clarity framework",
      "ikigai for work",
    ],
    takeaways: [
      "Ikigai surfaces where career ideas are emotionally attractive but structurally weak.",
      "Career clarity improves when you compare paths across all four circles, not just one.",
      "Ikigai should lead into experiments, not endless reflection.",
    ],
    faqs: [
      {
        question: "Can Ikigai actually help with career decisions?",
        answer:
          "Yes, especially when the problem is confusion about fit rather than lack of discipline. It clarifies where a path is strong and where it is structurally weak.",
      },
      {
        question: "What comes after using Ikigai?",
        answer:
          "After clarity improves, you usually need an execution framework like Pareto, GPS, or OKRs to turn insight into a real transition plan.",
      },
    ],
    sections: [
      {
        title: "Map the four circles honestly",
        anchor: "map-the-four-circles-honestly",
        markdown:
          "Do not use Ikigai as a mood board. Use it as a truth test. List what you love, what you are good at, what people need, and what can sustain you economically. The gaps matter as much as the overlaps.",
      },
      {
        title: "Compare paths, not fantasies",
        anchor: "compare-paths-not-fantasies",
        markdown:
          "Ikigai becomes more useful when you compare actual career directions side by side. It is easier to evaluate a path when you ask where it is strong and where it breaks across all four dimensions.",
      },
      {
        title: "Turn insight into small experiments",
        anchor: "turn-insight-into-small-experiments",
        markdown:
          "Once a direction looks promising, test it in the real world through projects, conversations, or small commitments. Career clarity rarely arrives through reflection alone.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["ikigai", "pareto", "okr"],
    relatedArticles: ["best-framework-for-career-change", "ikigai-vs-okr"],
    primaryFramework: "ikigai",
    seoTitle: "How to Use Ikigai for Career Clarity | Vector AI",
  }),
  article({
    slug: "how-to-stop-feeling-overwhelmed",
    category: "problem",
    title: "How to Stop Feeling Overwhelmed",
    description:
      "Feeling overwhelmed usually means your commitments are not being filtered correctly. Here is how to choose the right framework to restore control.",
    intro:
      "Overwhelm is rarely caused by effort alone. It usually comes from too many open loops, weak prioritization, and the absence of a rule for what deserves attention now. The solution depends on whether the chaos comes from urgency, overload, or lack of structure.",
    keywords: [
      "how to stop feeling overwhelmed",
      "overwhelmed productivity help",
      "too many tasks",
      "prioritization framework",
    ],
    takeaways: [
      "Overwhelm usually comes from decision overload, not laziness.",
      "Eisenhower helps when urgency is the dominant problem.",
      "Pareto helps when too many tasks are being treated as equally important.",
    ],
    faqs: [
      {
        question: "What framework helps most with overwhelm?",
        answer:
          "Eisenhower is usually the fastest first intervention when daily urgency is taking over. Pareto becomes more useful once the work is visible and needs leverage-based pruning.",
      },
      {
        question: "Can overwhelm come from vague goals too?",
        answer:
          "Yes. When goals are blurry, everything feels equally important. In that case, a framework for clarity or structure may be needed before prioritization can work.",
      },
    ],
    sections: [
      {
        title: "Use Eisenhower to stop reacting blindly",
        anchor: "use-eisenhower-to-stop-reacting-blindly",
        markdown:
          "If the day feels driven by interruptions, the Eisenhower Matrix is often the best first correction. It forces you to separate urgency from importance and creates a rule for what gets done, scheduled, delegated, or deleted.",
      },
      {
        title: "Use Pareto to reduce cognitive load",
        anchor: "use-pareto-to-reduce-cognitive-load",
        markdown:
          "When overwhelm comes from too many parallel tasks, Pareto is the better tool. It helps reveal the small number of commitments that drive most of the actual result, which reduces the need to emotionally carry everything at once.",
      },
      {
        title: "Turn the result into a system",
        anchor: "turn-the-result-into-a-system",
        markdown:
          "Once the priority picture is cleaner, use a system framework like GPS to keep the new behavior stable. Without a repeatable structure, overwhelm tends to return as soon as pressure rises again.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["eisenhower", "pareto", "gps"],
    relatedArticles: [
      "how-to-prioritize-too-many-goals",
      "pareto-vs-eisenhower-matrix",
    ],
    primaryFramework: "eisenhower",
    seoTitle:
      "How to Stop Feeling Overwhelmed With the Right Framework | Vector AI",
  }),
  article({
    slug: "how-to-prioritize-too-many-goals",
    category: "problem",
    title: "How to Prioritize Too Many Goals",
    description:
      "If everything feels important, the real problem is usually missing prioritization rules. This guide shows which frameworks help reduce goal overload.",
    intro:
      "Too many goals create a false sense of ambition and a real sense of paralysis. The fix is not to become less ambitious, but to create a clear rule for what gets attention first and why.",
    keywords: [
      "how to prioritize too many goals",
      "too many goals",
      "goal prioritization",
      "pareto prioritization",
    ],
    takeaways: [
      "Goal overload is usually a prioritization design problem, not a motivation problem.",
      "Pareto is powerful when a small number of goals dominate long-term outcome.",
      "Eisenhower is useful when the weekly task flow is obscuring strategic priorities.",
    ],
    faqs: [
      {
        question: "How many goals should you focus on at once?",
        answer:
          "Usually very few. Most people need one primary goal and a small number of supporting commitments instead of trying to advance everything simultaneously.",
      },
      {
        question: "What framework helps most when all goals feel urgent?",
        answer:
          "Eisenhower helps classify urgency honestly, while Pareto helps identify which goals deserve outsized attention because of leverage.",
      },
    ],
    sections: [
      {
        title: "Use Pareto to identify the few that matter most",
        anchor: "use-pareto-to-identify-the-few-that-matter-most",
        markdown:
          "Pareto is one of the best filters when you have too many meaningful ambitions. It forces you to ask which goals create the largest downstream value if advanced right now.",
      },
      {
        title: "Use Eisenhower to protect those goals in the week",
        anchor: "use-eisenhower-to-protect-those-goals-in-the-week",
        markdown:
          "A strategic priority still fails if urgent noise keeps winning the calendar. Eisenhower helps protect time for the important goals once the hierarchy is clear.",
      },
      {
        title: "Accept sequencing instead of simultaneous perfection",
        anchor: "accept-sequencing-instead-of-simultaneous-perfection",
        markdown:
          "The real move is often sequencing, not elimination. Some goals are not abandoned; they are simply not primary this quarter. That distinction prevents guilt from interfering with prioritization.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["pareto", "eisenhower", "okr"],
    relatedArticles: [
      "how-to-stop-feeling-overwhelmed",
      "how-to-turn-a-vague-goal-into-a-plan",
    ],
    primaryFramework: "pareto",
    seoTitle:
      "How to Prioritize Too Many Goals Without Losing Momentum | Vector AI",
  }),
  article({
    slug: "how-to-turn-a-vague-goal-into-a-plan",
    category: "problem",
    title: "How to Turn a Vague Goal Into a Plan",
    description:
      "If your goal sounds inspiring but still feels unusable, this guide shows which frameworks convert abstraction into a real execution plan.",
    intro:
      "A vague goal creates emotional energy but not useful decisions. To turn it into a plan, you need a framework that can move the goal from abstraction into sequence, milestones, tradeoffs, and next actions.",
    keywords: [
      "how to turn a vague goal into a plan",
      "goal planning framework",
      "vague goal help",
      "turn ideas into plan",
    ],
    takeaways: [
      "Vague goals fail because they do not constrain decisions.",
      "First Principles helps when the goal itself needs sharper logic.",
      "OKRs and GPS help once the direction is clear enough to structure execution.",
    ],
    faqs: [
      {
        question: "What framework is best for vague goals?",
        answer:
          "First Principles is often the best start when the goal is fuzzy because it helps clarify the real problem before you start measuring progress.",
      },
      {
        question: "When should a vague goal become an OKR?",
        answer:
          "Only after the goal is concrete enough that measurable progress makes sense. Otherwise the key results become decorative instead of useful.",
      },
    ],
    sections: [
      {
        title: "Clarify the real problem first",
        anchor: "clarify-the-real-problem-first",
        markdown:
          "Use First Principles when the goal sounds emotionally appealing but structurally weak. The point is to define what the goal actually means, what constraints matter, and what outcome would prove progress is real.",
      },
      {
        title: "Convert clarity into milestones",
        anchor: "convert-clarity-into-milestones",
        markdown:
          "Once the goal stops being foggy, OKRs become valuable because they force measurable outcomes. If the challenge is consistency rather than measurement, GPS may be even better because it turns the plan into a repeatable operating system.",
      },
      {
        title: "Bias toward the next executable step",
        anchor: "bias-toward-the-next-executable-step",
        markdown:
          "The plan becomes real when it improves the next decision. If your framework does not produce a sharper next step, the goal is still too abstract or the method is still too loose.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["first-principles", "okr", "gps"],
    relatedArticles: [
      "how-to-choose-the-right-goal-framework",
      "how-to-use-okrs-for-personal-goals",
    ],
    primaryFramework: "first-principles",
    seoTitle: "How to Turn a Vague Goal Into a Real Plan | Vector AI",
  }),
  ...editorialArticleExtensions.map(applyArticleDefaults),
];

export function getEditorialArticle(slug: string) {
  return editorialArticles.find((article) => article.slug === slug);
}
