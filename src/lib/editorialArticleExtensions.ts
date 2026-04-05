import type { Framework } from "@/lib/frameworks";
import { frameworkGuides } from "@/lib/frameworkGuides";
import type { EditorialArticle } from "@/lib/editorialArticles";

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

function extension(
  input: Omit<EditorialArticle, "theme"> & { themeFramework?: Framework },
): EditorialArticle {
  return {
    ...input,
    theme: themeFor(input.themeFramework ?? input.primaryFramework),
  };
}

export const editorialArticleExtensions: EditorialArticle[] = [
  extension({
    slug: "career-planning-system",
    category: "system",
    title: "Career Planning System: A Better Way to Architect a Career Change",
    description:
      "A career planning system should connect direction, measurable progress, and real-world execution. This page shows how to combine Ikigai, Pareto, and OKRs inside Vector.",
    intro:
      "A career plan fails when it lives as loose notes instead of a system. The stronger move is to combine [Ikigai](/frameworks/ikigai) for direction, [Pareto](/frameworks/pareto) for leverage, and [OKRs](/frameworks/okr) for measurable transition progress. Vector turns that stack into one working planning loop instead of three disconnected ideas.",
    keywords: [
      "career planning system",
      "career planning tool",
      "career strategy system",
      "career change framework",
    ],
    takeaways: [
      "Career planning works better as a system than as a one-time reflection exercise.",
      "The right sequence is usually direction first, focus second, and measurement third.",
      "Vector helps convert career insight into an execution-ready blueprint.",
    ],
    faqs: [
      {
        question: "What is a career planning system?",
        answer:
          "It is a repeatable structure for deciding direction, prioritizing moves, and measuring whether your career transition is actually progressing.",
      },
      {
        question: "Why not just use one framework?",
        answer:
          "Because career transitions usually involve several different problems at once: fit, leverage, and execution. One framework rarely covers all three cleanly.",
      },
    ],
    sections: [
      {
        title: "Start with direction before tactics",
        anchor: "start-with-direction-before-tactics",
        markdown:
          "If the direction is still blurry, start with [How to Use Ikigai for Career Clarity](/articles/how-to-use-ikigai-for-career-clarity). Career systems break when people jump directly into applications, credentials, and networking before deciding what kind of work is actually sustainable.",
      },
      {
        title: "Translate clarity into leverage",
        anchor: "translate-clarity-into-leverage",
        markdown:
          "Once the target path is clearer, use [Pareto](/frameworks/pareto) to narrow the move to the few actions that matter most: portfolio proof, high-signal conversations, and the skill gaps that actually block the next role.",
      },
      {
        title: "Measure the transition like a real project",
        anchor: "measure-the-transition-like-a-real-project",
        markdown:
          "Quarter-length transitions benefit from [OKRs](/frameworks/okr). That gives the career system a measurable spine instead of leaving the move vulnerable to vague effort and emotional drift.",
      },
    ],
    readingTime: "5 min read",
    howToSteps: [
      "Clarify the target path and role constraints.",
      "Choose the few transition moves that create the largest downstream value.",
      "Turn the quarter into measurable outputs and review them weekly.",
    ],
    relatedFrameworks: ["ikigai", "pareto", "okr"],
    relatedArticles: [
      "best-framework-for-career-change",
      "how-to-use-ikigai-for-career-clarity",
      "example-okr-for-career-change",
    ],
    primaryFramework: "ikigai",
    seoTitle:
      "Career Planning System for Career Change and Role Clarity | Vector AI",
  }),
  extension({
    slug: "personal-okr-system",
    category: "system",
    title: "Personal OKR System for Long-Term Personal Goals",
    description:
      "A personal OKR system turns life goals into measurable quarters without making them feel sterile or corporate.",
    intro:
      "A personal OKR system works when it keeps ambition alive but still makes the work inspectable. Vector helps turn a personal objective into key results, milestones, first-week actions, and review prompts so the plan behaves like a system rather than a motivational note.",
    keywords: [
      "personal okr system",
      "okr for personal goals",
      "personal planning system",
      "quarterly goal system",
    ],
    takeaways: [
      "Personal OKRs work best when limited to a small number of meaningful objectives.",
      "A usable system needs weekly review and visible evidence of progress.",
      "Vector is strongest when you want structured personal planning without spreadsheet overhead.",
    ],
    faqs: [
      {
        question: "Are OKRs useful for personal goals?",
        answer:
          "Yes, especially when you need measurable progress over a quarter rather than vague monthly intentions.",
      },
      {
        question: "What makes a personal OKR system fail?",
        answer:
          "Too many objectives, weak key results, and no review cadence are the most common failure points.",
      },
    ],
    sections: [
      {
        title: "Use one system instead of scattered trackers",
        anchor: "use-one-system-instead-of-scattered-trackers",
        markdown:
          "A personal OKR system is stronger than disconnected notes because it links the objective, the evidence of progress, and the execution rhythm. If you are still deciding between formats, compare [OKRs and SMART goals](/articles/okr-vs-smart-goals) before locking the system in.",
      },
      {
        title: "Keep the objective directional and the key results hard",
        anchor: "keep-the-objective-directional-and-the-key-results-hard",
        markdown:
          "The objective should still feel motivating. The key results should do the measuring. That is what keeps the system useful instead of decorative.",
      },
      {
        title: "Use Vector as the operating layer",
        anchor: "use-vector-as-the-operating-layer",
        markdown:
          "Vector adds the missing operational layer by turning the objective into milestones, first-week actions, resource checklists, and review triggers. That makes the personal OKR system usable in real life, not just conceptually clean.",
      },
    ],
    readingTime: "5 min read",
    howToSteps: [
      "Pick one meaningful personal objective for the quarter.",
      "Write key results that prove movement rather than activity.",
      "Run a weekly review so the system stays honest.",
    ],
    relatedFrameworks: ["okr", "gps"],
    relatedArticles: [
      "how-to-use-okrs-for-personal-goals",
      "okr-generator",
      "planning-system-for-personal-goals",
    ],
    primaryFramework: "okr",
    seoTitle: "Personal OKR System for Personal Goals | Vector AI",
  }),
  extension({
    slug: "goal-prioritization-system",
    category: "system",
    title: "Goal Prioritization System for Too Many Competing Goals",
    description:
      "A goal prioritization system should stop everything from feeling equally important. This guide combines Pareto and the Eisenhower Matrix into one execution model.",
    intro:
      "A good goal prioritization system does two jobs at once: it decides what deserves disproportionate attention, and it protects that work from daily urgency. The cleanest stack is usually [Pareto](/frameworks/pareto) for leverage plus the [Eisenhower Matrix](/frameworks/eisenhower) for weekly control.",
    keywords: [
      "goal prioritization system",
      "priority system",
      "how to prioritize goals",
      "priority matrix",
    ],
    takeaways: [
      "The right system separates long-term leverage from short-term urgency.",
      "Pareto finds the few goals that matter most.",
      "Eisenhower protects those goals from reactive work.",
    ],
    faqs: [
      {
        question: "What is a goal prioritization system?",
        answer:
          "It is a consistent rule set for deciding which goals deserve focus, which tasks support them, and what gets deferred or deleted.",
      },
      {
        question: "Why use both Pareto and Eisenhower?",
        answer:
          "Because one helps you choose what matters strategically and the other helps defend it operationally throughout the week.",
      },
    ],
    sections: [
      {
        title: "Choose the vital few first",
        anchor: "choose-the-vital-few-first",
        markdown:
          "Use [How to Prioritize Too Many Goals](/articles/how-to-prioritize-too-many-goals) when the main issue is ranking ambitions honestly. The goal prioritization system starts by admitting that not all goals deserve primary status at the same time.",
      },
      {
        title: "Then defend the week",
        anchor: "then-defend-the-week",
        markdown:
          "Once the primary goals are clearer, the Eisenhower Matrix helps you defend them in real time. This is where a strategy becomes a weekly planning system instead of a good intention.",
      },
      {
        title: "Use Vector to keep the stack visible",
        anchor: "use-vector-to-keep-the-stack-visible",
        markdown:
          "Vector can convert the prioritization system into an actual blueprint with milestones, anti-goals, and first-week actions so the plan keeps functioning when pressure rises.",
      },
    ],
    readingTime: "5 min read",
    howToSteps: [
      "Identify which goals produce the largest downstream effect.",
      "Choose one primary goal and a small number of supporting commitments.",
      "Use a weekly urgency-vs-importance filter to protect calendar space.",
    ],
    relatedFrameworks: ["pareto", "eisenhower", "gps"],
    relatedArticles: [
      "pareto-vs-eisenhower-matrix",
      "priority-matrix-guide",
      "eisenhower-matrix-tool",
    ],
    primaryFramework: "pareto",
    seoTitle: "Goal Prioritization System for Overloaded Goals | Vector AI",
  }),
  extension({
    slug: "study-planning-system",
    category: "system",
    title: "Study Planning System for Skill Acquisition and Exams",
    description:
      "A study planning system should connect high-yield focus, sequencing, and consistency. This guide shows how DSSS, Pareto, and GPS fit together.",
    intro:
      "A study planning system breaks when the learner either studies everything equally or never turns insight into repetition. The stronger setup is [DSSS](/frameworks/dsss) for skill design, [Pareto](/frameworks/pareto) for high-yield focus, and [GPS](/frameworks/gps) for sustained execution.",
    keywords: [
      "study planning system",
      "study system",
      "learning plan framework",
      "study planning tool",
    ],
    takeaways: [
      "DSSS improves the structure of what you learn.",
      "Pareto improves what gets most of your time.",
      "GPS improves whether the plan survives contact with real weeks.",
    ],
    faqs: [
      {
        question: "What makes a study planning system effective?",
        answer:
          "It should help you choose the right material, order the work intelligently, and build a repeatable rhythm instead of relying on motivation spikes.",
      },
      {
        question: "Do students need different frameworks for exams and skills?",
        answer:
          "Often yes. Exams benefit heavily from Pareto, while skill acquisition benefits more from DSSS and practice sequencing.",
      },
    ],
    sections: [
      {
        title: "Design the learning path before studying harder",
        anchor: "design-the-learning-path-before-studying-harder",
        markdown:
          "A study planning system starts by asking what competence actually requires. [Tim Ferriss DSSS](/frameworks/dsss) is valuable here because it forces deconstruction before repetition.",
      },
      {
        title: "Focus on the highest-yield material",
        anchor: "focus-on-the-highest-yield-material",
        markdown:
          "After the skill is broken down, use [How to Use Pareto for Studying](/articles/how-to-use-pareto-for-studying) to identify the concepts and drills that will move the result fastest.",
      },
      {
        title: "Turn the system into a repeatable week",
        anchor: "turn-the-system-into-a-repeatable-week",
        markdown:
          "The final layer is execution consistency. That is where GPS or a measurable quarterly system becomes useful, especially when the study arc is long.",
      },
    ],
    readingTime: "5 min read",
    howToSteps: [
      "Break the skill or curriculum into subskills and high-yield topics.",
      "Sequence the work so foundational practice makes later work easier.",
      "Build a weekly rhythm that survives interruptions and fatigue.",
    ],
    relatedFrameworks: ["dsss", "pareto", "gps"],
    relatedArticles: [
      "best-framework-for-studying",
      "how-to-use-pareto-for-studying",
      "example-study-plan-using-pareto",
    ],
    primaryFramework: "dsss",
    themeFramework: "dsss",
    seoTitle:
      "Study Planning System for Exams and Skill Acquisition | Vector AI",
  }),
  extension({
    slug: "life-planning-framework",
    category: "system",
    title: "Life Planning Framework for Long-Term Direction",
    description:
      "A life planning framework should help you connect purpose, priorities, and multi-domain growth. This page shows how Ikigai and Mandala Chart complement each other.",
    intro:
      "A life planning framework is different from a productivity hack. It needs to help you decide what matters, what kind of life direction is sustainable, and how several domains of growth connect. [Ikigai](/frameworks/ikigai) is strong for direction; the [Mandala Chart](/frameworks/mandalas) is strong for structuring the whole field of work around that direction.",
    keywords: [
      "life planning framework",
      "life planning system",
      "long term planning framework",
      "life strategy tool",
    ],
    takeaways: [
      "Ikigai is useful when direction and meaning are still weak.",
      "Mandala Chart is useful when the ambition is broad and multidimensional.",
      "Vector helps turn long-horizon reflection into a blueprint with near-term execution.",
    ],
    faqs: [
      {
        question: "What is a life planning framework?",
        answer:
          "It is a structure for clarifying long-term direction, mapping the domains that support it, and translating that direction into usable action over time.",
      },
      {
        question: "Is Ikigai enough on its own?",
        answer:
          "It is excellent for direction, but many people need an additional planning framework like Mandala Chart to structure the breadth of work that follows.",
      },
    ],
    sections: [
      {
        title: "Use Ikigai to define the direction",
        anchor: "use-ikigai-to-define-the-direction",
        markdown:
          "Start with [Ikigai](/frameworks/ikigai) when the real problem is not task management but life direction. It helps you test whether your long-term path has enough meaning, competence, value, and sustainability to be worth building around.",
      },
      {
        title: "Use Mandala Chart to organize the field",
        anchor: "use-mandala-chart-to-organize-the-field",
        markdown:
          "After the direction is clearer, the [Mandala Chart](/frameworks/mandalas) is useful because it makes the supporting domains visible all at once. That is especially valuable for goals that touch skills, relationships, health, money, and identity at the same time.",
      },
      {
        title: "Convert long-range ambition into present-tense work",
        anchor: "convert-long-range-ambition-into-present-tense-work",
        markdown:
          "Life planning only becomes usable when it improves the next decision. Vector helps close that gap by turning the framework into milestones, anti-goals, and first-week actions.",
      },
    ],
    readingTime: "5 min read",
    howToSteps: [
      "Clarify the long-term direction and constraints that matter most.",
      "Map the main life domains that support that direction.",
      "Turn the biggest domains into short execution cycles.",
    ],
    relatedFrameworks: ["ikigai", "mandalas"],
    relatedArticles: [
      "life-planning-tool",
      "ikigai-template",
      "goal-breakdown-tool",
    ],
    primaryFramework: "ikigai",
    seoTitle: "Life Planning Framework for Long-Term Direction | Vector AI",
  }),
  extension({
    slug: "okr-generator",
    category: "tool",
    title: "AI OKR Generator for Personal and Professional Goals",
    description:
      "Use Vector as an AI OKR generator to turn a vague goal into a usable objective, measurable key results, and a concrete initiative.",
    intro:
      "An OKR generator should do more than produce a nice-looking objective. It should turn a real goal into a structure you can actually execute. Vector uses the same [OKR blueprint structure](/frameworks/okr) the product applies in the wizard, then adds milestones, first-week actions, and review logic on top.",
    keywords: [
      "okr generator",
      "ai okr generator",
      "personal okr generator",
      "okr template",
    ],
    takeaways: [
      "A useful OKR generator outputs execution-ready structure, not just wording.",
      "The best results come from tying key results to real proof of progress.",
      "Vector is strongest when the user wants both generation and follow-through.",
    ],
    faqs: [
      {
        question: "What should an OKR generator produce?",
        answer:
          "At minimum it should produce a strong objective, measurable key results, and an initiative or execution plan that makes the work usable immediately.",
      },
      {
        question: "Who is an AI OKR generator best for?",
        answer:
          "People who know the direction they want but need help structuring it into a measurable quarter or milestone-based plan.",
      },
    ],
    sections: [
      {
        title: "What makes an OKR generator useful",
        anchor: "what-makes-an-okr-generator-useful",
        markdown:
          "A weak OKR generator only rewrites goals. A good one creates the full structure around the goal: the objective, the key results, the execution logic, and the next decisions you need to make.",
      },
      {
        title: "Why Vector fits tool-intent searches",
        anchor: "why-vector-fits-tool-intent-searches",
        markdown:
          "Vector is not a static OKR worksheet. It helps generate the structure and then turns it into a blueprint with milestones, review prompts, and first-week actions, which is where many template-only tools stop.",
      },
      {
        title: "When to use another framework first",
        anchor: "when-to-use-another-framework-first",
        markdown:
          "If the goal is still vague, read [How to Turn a Vague Goal Into a Plan](/articles/how-to-turn-a-vague-goal-into-a-plan) before generating OKRs. OKRs are strong when direction exists; they are weak when the user is still choosing the direction.",
      },
    ],
    readingTime: "4 min read",
    howToSteps: [
      "Describe the goal you want to structure.",
      "Generate an objective, key results, and initiative in Vector.",
      "Review the result and turn it into milestones and first-week actions.",
    ],
    planPreview: {
      title: "Example OKR generator output",
      summary:
        "This is the kind of structured output Vector can generate when a user needs a personal or professional OKR quickly.",
      blocks: [
        {
          title: "Objective",
          body: "Become interview-ready for a product marketing career change within one quarter.",
        },
        {
          title: "Key results",
          items: [
            "Publish two portfolio case studies.",
            "Complete ten targeted conversations with hiring managers.",
            "Submit fifteen tailored applications.",
          ],
        },
        {
          title: "Initiative",
          body: "Run a weekly execution cadence with one portfolio block, one outreach block, and one application review block.",
        },
      ],
    },
    relatedFrameworks: ["okr"],
    relatedArticles: [
      "personal-okr-system",
      "example-okr-for-career-change",
      "okrs-in-vector-vs-spreadsheet-tracking",
    ],
    primaryFramework: "okr",
    seoTitle: "AI OKR Generator for Personal and Team Goals | Vector AI",
  }),
  extension({
    slug: "ikigai-template",
    category: "tool",
    title: "Ikigai Template for Career Clarity and Life Direction",
    description:
      "Use this Ikigai template to organize what you love, what you are good at, what the world needs, and what can sustain you economically.",
    intro:
      "An Ikigai template is most useful when it moves beyond a blank diagram and helps people test real paths honestly. Vector can use the [Ikigai framework](/frameworks/ikigai) as a template, then turn the result into an actionable plan instead of leaving it as reflection alone.",
    keywords: [
      "ikigai template",
      "ikigai worksheet",
      "career clarity template",
      "purpose template",
    ],
    takeaways: [
      "A usable Ikigai template should force comparison, not just brainstorming.",
      "The best template outputs a purpose hypothesis and next experiments.",
      "Vector helps convert the template into a plan with actual follow-through.",
    ],
    faqs: [
      {
        question: "What should an Ikigai template include?",
        answer:
          "It should include the four circles, a way to compare paths across them, and a method for turning the overlap into next experiments.",
      },
      {
        question: "Is Ikigai better than a normal career worksheet?",
        answer:
          "It is stronger when the problem is direction and meaning, because it forces a broader view of fit and sustainability.",
      },
    ],
    sections: [
      {
        title: "Use the template to compare real paths",
        anchor: "use-the-template-to-compare-real-paths",
        markdown:
          "An Ikigai template becomes far more useful when you compare actual career paths instead of just writing free-floating ideas. That is why [How to Use Ikigai for Career Clarity](/articles/how-to-use-ikigai-for-career-clarity) works better than a blank worksheet alone.",
      },
      {
        title: "Translate reflection into evidence",
        anchor: "translate-reflection-into-evidence",
        markdown:
          "The template should not end at insight. It should produce a working hypothesis and a small number of experiments that test whether the direction is real outside the page.",
      },
    ],
    readingTime: "4 min read",
    howToSteps: [
      "Map what you love, what you do well, what people need, and what can sustain you.",
      "Compare real paths across those four circles.",
      "Turn the strongest overlap into experiments and next decisions.",
    ],
    planPreview: {
      title: "Example Ikigai template output",
      summary:
        "Vector can turn an Ikigai reflection into a more decision-ready output than a blank worksheet usually provides.",
      blocks: [
        {
          title: "Love",
          items: [
            "Teaching complex ideas simply.",
            "Building systems that help people make better decisions.",
          ],
        },
        {
          title: "Good at",
          items: [
            "Explaining strategy clearly.",
            "Designing practical planning workflows.",
          ],
        },
        {
          title: "World needs",
          items: [
            "Clearer career navigation.",
            "Better tools for turning goals into execution.",
          ],
        },
        {
          title: "Paid for",
          items: [
            "Coaching and product design.",
            "Structured planning systems.",
          ],
        },
      ],
    },
    relatedFrameworks: ["ikigai"],
    relatedArticles: [
      "life-planning-framework",
      "how-to-use-ikigai-for-career-clarity",
      "best-framework-for-career-change",
    ],
    primaryFramework: "ikigai",
    seoTitle: "Ikigai Template for Career Clarity | Vector AI",
  }),
  extension({
    slug: "eisenhower-matrix-tool",
    category: "tool",
    title: "Eisenhower Matrix Tool for Goal Prioritization",
    description:
      "Use Vector as an Eisenhower Matrix tool to sort urgent vs important work and connect each quadrant to a larger planning system.",
    intro:
      "An Eisenhower Matrix tool is useful when the problem is not ideas but triage. Vector helps sort commitments into quadrants, then connects the output to a broader [goal prioritization system](/articles/goal-prioritization-system) instead of leaving the matrix isolated from execution.",
    keywords: [
      "eisenhower matrix tool",
      "priority matrix tool",
      "urgent important matrix",
      "goal prioritization tool",
    ],
    takeaways: [
      "A good matrix tool helps users decide what to delete, not only what to do.",
      "The matrix is most useful when tied to larger priorities.",
      "Vector links quadrant decisions to blueprints and next actions.",
    ],
    faqs: [
      {
        question: "What should an Eisenhower Matrix tool do?",
        answer:
          "It should help users classify work clearly and then connect those decisions to scheduling, delegation, or deletion.",
      },
      {
        question: "When is the matrix not enough?",
        answer:
          "When the user still has too many strategic goals competing for attention, Pareto or a broader prioritization system may be needed first.",
      },
    ],
    sections: [
      {
        title: "Sort the work honestly",
        anchor: "sort-the-work-honestly",
        markdown:
          "The value of an Eisenhower Matrix tool is not aesthetic order. It is forcing honest decisions about what deserves immediate action, what deserves scheduling, and what should leave the system entirely.",
      },
      {
        title: "Connect urgency to larger priorities",
        anchor: "connect-urgency-to-larger-priorities",
        markdown:
          "The matrix works best when combined with [Pareto vs Eisenhower Matrix](/articles/pareto-vs-eisenhower-matrix) logic. One tool sorts the week; the other decides what deserves outsized energy over time.",
      },
    ],
    readingTime: "4 min read",
    howToSteps: [
      "List the open commitments competing for attention.",
      "Classify each item by urgency and importance.",
      "Use the output to decide what to do, schedule, delegate, or delete.",
    ],
    planPreview: {
      title: "Example Eisenhower Matrix output",
      summary:
        "Vector can turn a messy week into a structured matrix and then tie the result to a blueprint.",
      blocks: [
        {
          title: "Do now",
          items: [
            "Reply to the active client risk.",
            "Finish the grant submission due tonight.",
          ],
        },
        {
          title: "Schedule",
          items: [
            "Deep work block for strategic planning.",
            "Portfolio case-study writing block.",
          ],
        },
        {
          title: "Delegate",
          items: ["Routine inbox cleanup.", "Calendar coordination."],
        },
        {
          title: "Eliminate",
          items: [
            "Low-signal status meetings.",
            "Tasks that do not move the primary goal.",
          ],
        },
      ],
    },
    relatedFrameworks: ["eisenhower", "pareto"],
    relatedArticles: [
      "goal-prioritization-system",
      "priority-matrix-guide",
      "how-to-stop-feeling-overwhelmed",
    ],
    primaryFramework: "eisenhower",
    seoTitle: "Eisenhower Matrix Tool for Goal Prioritization | Vector AI",
  }),
  extension({
    slug: "pareto-analysis-template",
    category: "tool",
    title: "Pareto Analysis Template for Goals, Workloads, and Study Plans",
    description:
      "Use a Pareto analysis template to identify the few inputs that create most of the result across goals, work, and skill-building.",
    intro:
      "A Pareto analysis template is useful when everything feels important. Vector can help turn a broad list of inputs into a structured [Pareto](/frameworks/pareto) plan, then connect the high-leverage items to milestones and first-week actions.",
    keywords: [
      "pareto analysis template",
      "pareto template",
      "80 20 template",
      "priority analysis tool",
    ],
    takeaways: [
      "A Pareto template should isolate the few causes that dominate the result.",
      "The best template is tied to a real outcome, not a generic brainstorm.",
      "Vector can turn the result into a blueprint instead of stopping at analysis.",
    ],
    faqs: [
      {
        question: "What does a Pareto analysis template help with?",
        answer:
          "It helps you identify the small number of activities, tasks, or topics that produce disproportionate value.",
      },
      {
        question: "When should you not use Pareto alone?",
        answer:
          "When the problem is daily triage rather than leverage, or when the goal itself is still too vague to analyze well.",
      },
    ],
    sections: [
      {
        title: "Start with the result you care about",
        anchor: "start-with-the-result-you-care-about",
        markdown:
          "A Pareto analysis template only works when the target outcome is specific. Whether the context is studying, revenue, or a career transition, the template should be anchored to a clear result instead of a generic wish list.",
      },
      {
        title: "Use the template to cut dilution",
        anchor: "use-the-template-to-cut-dilution",
        markdown:
          "The purpose is not to admire the 80/20 concept. It is to remove dilution. If the analysis does not change how you allocate time, it is not a useful Pareto template.",
      },
    ],
    readingTime: "4 min read",
    howToSteps: [
      "Define the outcome you want to improve.",
      "List the inputs or tasks competing to influence it.",
      "Identify the few that create most of the result and build around those first.",
    ],
    planPreview: {
      title: "Example Pareto analysis output",
      summary: "Vector can turn a broad workload into a high-leverage plan.",
      blocks: [
        {
          title: "Vital few",
          items: [
            "Portfolio case studies.",
            "High-signal outreach.",
            "Practice interviews.",
          ],
        },
        {
          title: "Trivial many",
          items: [
            "Generic networking events.",
            "Low-value resume tweaks.",
            "Unfocused application volume.",
          ],
        },
      ],
    },
    relatedFrameworks: ["pareto"],
    relatedArticles: [
      "goal-prioritization-system",
      "how-to-use-pareto-for-studying",
      "example-study-plan-using-pareto",
    ],
    primaryFramework: "pareto",
    seoTitle: "Pareto Analysis Template for High-Leverage Planning | Vector AI",
  }),
  extension({
    slug: "career-change-planner",
    category: "tool",
    title: "Career Change Planner for Structured Career Transitions",
    description:
      "Use Vector as a career change planner to move from vague direction questions into a structured transition blueprint with milestones and high-leverage moves.",
    intro:
      "A career change planner should do more than organize tasks. It should help clarify direction, choose the few moves that matter, and make the transition measurable. Vector combines the logic behind [career planning systems](/articles/career-planning-system) with blueprint generation.",
    keywords: [
      "career change planner",
      "career transition planner",
      "career planning tool",
      "career change tool",
    ],
    takeaways: [
      "The best career planner combines direction, focus, and execution.",
      "Career change work is usually better as a blueprint than a checklist.",
      "Vector helps make the transition inspectable and executable.",
    ],
    faqs: [
      {
        question: "What should a career change planner include?",
        answer:
          "It should include target role clarity, skill gap priorities, outreach or proof-of-work milestones, and a weekly execution rhythm.",
      },
      {
        question: "Who benefits most from a career change planner?",
        answer:
          "People who are serious about a transition but need structure beyond scattered notes and inspiration.",
      },
    ],
    sections: [
      {
        title: "Clarify before you schedule",
        anchor: "clarify-before-you-schedule",
        markdown:
          "The best career change planner does not begin with arbitrary task lists. It starts by clarifying what role is actually worth moving toward. That is why pages like [Best Framework for Career Change](/articles/best-framework-for-career-change) matter before execution starts.",
      },
      {
        title: "Build around the few moves that count",
        anchor: "build-around-the-few-moves-that-count",
        markdown:
          "Once the direction is clearer, the planner should isolate the small number of moves that create real transition momentum. That is usually better than treating every preparation task as equally important.",
      },
    ],
    readingTime: "4 min read",
    howToSteps: [
      "Clarify the role or direction you are moving toward.",
      "Choose the few skill, proof, and outreach moves that matter most.",
      "Turn the transition into milestones and a weekly rhythm.",
    ],
    relatedFrameworks: ["ikigai", "pareto", "okr"],
    relatedArticles: [
      "career-planning-system",
      "example-okr-for-career-change",
      "best-framework-for-career-change",
    ],
    primaryFramework: "ikigai",
    seoTitle: "Career Change Planner for Career Transitions | Vector AI",
  }),
  extension({
    slug: "goal-breakdown-tool",
    category: "tool",
    title: "Goal Breakdown Tool for Turning Big Goals Into Action",
    description:
      "Use Vector as a goal breakdown tool to convert vague ambitions into milestones, first-week actions, and framework-specific execution paths.",
    intro:
      "A goal breakdown tool is useful when the ambition is emotionally clear but operationally useless. Vector helps break the goal down with the right framework, then produces milestones, anti-goals, and an execution path that can be reviewed over time.",
    keywords: [
      "goal breakdown tool",
      "break down goals",
      "goal planning tool",
      "turn goals into action",
    ],
    takeaways: [
      "Big goals become usable when the next decisions get clearer.",
      "The right breakdown depends on the framework and the shape of the goal.",
      "Vector turns breakdowns into blueprints instead of static notes.",
    ],
    faqs: [
      {
        question: "What should a goal breakdown tool output?",
        answer:
          "It should output milestones, first-week actions, likely blockers, and a framework-specific way of structuring the goal.",
      },
      {
        question: "When is a goal still too vague to break down?",
        answer:
          "When it does not yet constrain decisions. In that case you should clarify the problem before trying to sequence it.",
      },
    ],
    sections: [
      {
        title: "Use the right framework first",
        anchor: "use-the-right-framework-first",
        markdown:
          "The best goal breakdown tool does not force every ambition into the same template. Some goals need [First Principles](/frameworks/first-principles), some need [OKRs](/frameworks/okr), and some need a broader life-planning structure like [Mandala Chart](/frameworks/mandalas).",
      },
      {
        title: "Translate the framework into milestones",
        anchor: "translate-the-framework-into-milestones",
        markdown:
          "Once the right method is chosen, the breakdown should create milestones and first-week actions. That is how the plan becomes executable instead of remaining aspirational.",
      },
    ],
    readingTime: "4 min read",
    howToSteps: [
      "Describe the goal and its constraints.",
      "Choose the framework that matches the bottleneck.",
      "Convert the output into milestones and near-term execution steps.",
    ],
    relatedFrameworks: ["first-principles", "okr", "mandalas"],
    relatedArticles: [
      "how-to-turn-a-vague-goal-into-a-plan",
      "life-planning-framework",
      "example-study-plan-using-pareto",
    ],
    primaryFramework: "first-principles",
    seoTitle:
      "Goal Breakdown Tool for Turning Big Goals Into Action | Vector AI",
  }),
  extension({
    slug: "example-okr-for-career-change",
    category: "example",
    title: "Example OKR for Career Change",
    description:
      "A crawlable example of how an OKR can structure a career change inside Vector, including an objective, key results, and a main initiative.",
    intro:
      "This page shows an indexable example of how Vector can structure a career transition using [OKRs](/frameworks/okr). The goal is not to present the only correct answer, but to show what a usable planning output looks like when a career change becomes a measurable project.",
    keywords: [
      "example okr for career change",
      "career change okr example",
      "okr example",
      "career transition okr",
    ],
    takeaways: [
      "An example OKR is useful when you need to see what “good” looks like before generating your own.",
      "Career-change OKRs should measure proof, conversations, and applications rather than effort alone.",
      "Vector can turn the example into a personalized blueprint quickly.",
    ],
    faqs: [
      {
        question: "Why publish example blueprints publicly?",
        answer:
          "Because examples capture real search intent and help users understand the product output before committing to the tool.",
      },
      {
        question: "Should everyone copy this OKR exactly?",
        answer:
          "No. It is a model of structure, not a universal prescription. The real value is adapting it to your actual role, timeline, and constraints.",
      },
    ],
    sections: [
      {
        title: "What this example is solving",
        anchor: "what-this-example-is-solving",
        markdown:
          "This example assumes a person is moving into a new role and needs a quarter-level planning structure. It is especially useful after direction is already clearer through something like [How to Use Ikigai for Career Clarity](/articles/how-to-use-ikigai-for-career-clarity).",
      },
      {
        title: "What makes the example good",
        anchor: "what-makes-the-example-good",
        markdown:
          "The key results are evidence-based. They point to portfolio proof, targeted conversations, and application volume with quality. That is stronger than a vague goal like “work on my career change more.”",
      },
    ],
    readingTime: "4 min read",
    planPreview: {
      title: "Indexable example blueprint output",
      summary:
        "This sample uses the same kind of structured output Vector can generate in the wizard for a career-change OKR.",
      blocks: [
        {
          title: "Objective",
          body: "Become interview-ready for a product marketing career change within the next 90 days.",
        },
        {
          title: "Key results",
          items: [
            "Publish 2 portfolio case studies.",
            "Complete 10 targeted networking conversations.",
            "Submit 15 tailored applications with a refined positioning narrative.",
          ],
        },
        {
          title: "Initiative",
          body: "Run a weekly execution loop covering portfolio proof, outreach, and application refinement.",
        },
      ],
    },
    relatedFrameworks: ["okr", "ikigai", "pareto"],
    relatedArticles: [
      "career-change-planner",
      "career-planning-system",
      "okr-generator",
    ],
    primaryFramework: "okr",
    seoTitle: "Example OKR for Career Change | Vector AI",
  }),
  extension({
    slug: "example-study-plan-using-pareto",
    category: "example",
    title: "Example Study Plan Using Pareto",
    description:
      "A crawlable example of a study plan using the Pareto Principle to focus on high-yield topics, drills, and review loops.",
    intro:
      "This page gives a public example of how a [Pareto](/frameworks/pareto)-based study plan can look when it is structured for execution instead of generic advice. It is meant to show the kind of output Vector can create around high-yield study decisions.",
    keywords: [
      "example study plan using pareto",
      "pareto study plan",
      "study plan example",
      "80 20 study example",
    ],
    takeaways: [
      "A study-plan example is most useful when it shows weighted attention, not equal attention.",
      "Pareto-based study plans prioritize high-yield topics and drills first.",
      "Vector can personalize the structure around a user’s exact skill or exam context.",
    ],
    faqs: [
      {
        question: "What should a Pareto study plan include?",
        answer:
          "It should include high-yield topics, concrete drills, milestones, and a repeatable weekly rhythm that reflects the most valuable work first.",
      },
      {
        question: "Why make the output crawlable?",
        answer:
          "Because example outputs help users find the product through real searches like “example study plan” or “Pareto study plan.”",
      },
    ],
    sections: [
      {
        title: "Why this example matters",
        anchor: "why-this-example-matters",
        markdown:
          "Many study plans fail because they distribute attention evenly. This example shows the opposite: the plan is structured around the few topics that create most of the result, then reinforced with repetition and review.",
      },
      {
        title: "How to adapt it",
        anchor: "how-to-adapt-it",
        markdown:
          "Use [How to Use Pareto for Studying](/articles/how-to-use-pareto-for-studying) if you want the logic behind the example before you generate your own version.",
      },
    ],
    readingTime: "4 min read",
    planPreview: {
      title: "Indexable example blueprint output",
      summary:
        "This public example shows how Vector can structure a high-yield study plan around Pareto logic.",
      blocks: [
        {
          title: "Goal",
          body: "Raise exam performance by focusing on the few topics and drills that dominate the score.",
        },
        {
          title: "Vital topics",
          items: [
            "Core problem type A with daily timed drills.",
            "Recurring concept B with spaced repetition.",
            "Past-paper section C with weekly review.",
          ],
        },
        {
          title: "First-week actions",
          items: [
            "Map the highest-weight chapters.",
            "Run three timed drills on the top problem type.",
            "Review error patterns at the end of the week.",
          ],
        },
      ],
    },
    relatedFrameworks: ["pareto", "dsss"],
    relatedArticles: [
      "study-planning-system",
      "pareto-analysis-template",
      "how-to-use-pareto-for-studying",
    ],
    primaryFramework: "pareto",
    seoTitle: "Example Study Plan Using Pareto | Vector AI",
  }),
  extension({
    slug: "best-goal-setting-method",
    category: "synonym",
    title: "Best Goal-Setting Method for Ambitious Personal Goals",
    description:
      "If you are searching for the best goal-setting method, the right answer depends on whether you need clarity, prioritization, execution, or measurement.",
    intro:
      "“Goal-setting method” is often shorthand for a broader planning problem. Some people need [OKRs](/frameworks/okr). Others need [Pareto](/frameworks/pareto), [Ikigai](/frameworks/ikigai), or [First Principles](/frameworks/first-principles). The best goal-setting method depends on what is actually broken right now.",
    keywords: [
      "best goal-setting method",
      "goal setting method",
      "goal method",
      "goal planning method",
    ],
    takeaways: [
      "Method choice depends on the bottleneck, not the label.",
      "Different methods solve different stages of planning.",
      "Vector helps turn the right method into a usable plan.",
    ],
    faqs: [
      {
        question: "What is the best goal-setting method?",
        answer:
          "There is no universal winner. The best method depends on whether you need clarity, prioritization, execution, or measurable progress.",
      },
      {
        question: "How do you choose the right method?",
        answer:
          "Start by identifying the bottleneck in the goal, then match the framework to that bottleneck.",
      },
    ],
    sections: [
      {
        title: "Treat “method” as a search for fit",
        anchor: "treat-method-as-a-search-for-fit",
        markdown:
          "If someone is searching for the best goal-setting method, they are usually asking which system fits their problem. [How to Choose the Right Goal-Setting Framework](/articles/how-to-choose-the-right-goal-framework) is the direct answer to that intent.",
      },
      {
        title: "Use Vector once the method is chosen",
        anchor: "use-vector-once-the-method-is-chosen",
        markdown:
          "The value of a method increases when it immediately becomes executable. Vector helps by turning the method into milestones, first-week actions, and review structure.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["first-principles", "okr", "pareto", "ikigai"],
    relatedArticles: [
      "how-to-choose-the-right-goal-framework",
      "planning-system-for-personal-goals",
    ],
    primaryFramework: "first-principles",
    seoTitle: "Best Goal-Setting Method for Personal Goals | Vector AI",
  }),
  extension({
    slug: "planning-system-for-personal-goals",
    category: "synonym",
    title: "Planning System for Personal Goals",
    description:
      "A planning system for personal goals should combine direction, prioritization, and an execution rhythm rather than leaving the goal as an isolated objective.",
    intro:
      "A planning system for personal goals is stronger than a single tactic because it creates continuity between direction, prioritization, and weekly action. Vector uses frameworks like [OKRs](/frameworks/okr), [GPS](/frameworks/gps), and [Pareto](/frameworks/pareto) to make that system concrete.",
    keywords: [
      "planning system for personal goals",
      "personal planning system",
      "goal planning system",
      "personal goal system",
    ],
    takeaways: [
      "A personal planning system should be reviewable, not just inspirational.",
      "Framework choice depends on the problem stage.",
      "Vector helps connect the system to actual execution.",
    ],
    faqs: [
      {
        question: "What makes a planning system effective?",
        answer:
          "It should help users decide what matters, structure the work, and keep the plan visible over time.",
      },
      {
        question: "Is a planner enough?",
        answer:
          "Usually not. Most people need a system that also shapes prioritization and review behavior.",
      },
    ],
    sections: [
      {
        title: "A system is more than a planner",
        anchor: "a-system-is-more-than-a-planner",
        markdown:
          "The difference between a planner and a planning system is continuity. A system shapes what matters, what gets worked on this week, and how progress is reviewed.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["okr", "gps", "pareto"],
    relatedArticles: ["personal-okr-system", "goal-prioritization-system"],
    primaryFramework: "gps",
    seoTitle: "Planning System for Personal Goals | Vector AI",
  }),
  extension({
    slug: "decision-framework-for-complex-goals",
    category: "synonym",
    title: "Decision Framework for Complex Goals",
    description:
      "Complex goals need a decision framework that reduces ambiguity and improves what you choose to do next.",
    intro:
      "A decision framework is usually the right search when the goal feels messy, multidimensional, or full of tradeoffs. [First Principles](/frameworks/first-principles), [Pareto](/frameworks/pareto), and the [Mandala Chart](/frameworks/mandalas) each solve different parts of that complexity.",
    keywords: [
      "decision framework",
      "decision framework for goals",
      "complex goals framework",
      "planning decision framework",
    ],
    takeaways: [
      "Decision frameworks reduce ambiguity and tradeoff confusion.",
      "Different frameworks clarify different forms of complexity.",
      "Vector helps turn the chosen framework into a working plan.",
    ],
    faqs: [
      {
        question: "What is a decision framework?",
        answer:
          "It is a structured way to evaluate options, tradeoffs, and next moves when the goal is too complex for intuition alone.",
      },
      {
        question: "Which frameworks work best for complex goals?",
        answer:
          "First Principles, Pareto, and Mandala Chart are often strong options depending on whether the complexity is strategic, prioritization-based, or multidimensional.",
      },
    ],
    sections: [
      {
        title: "Use the framework that matches the kind of complexity",
        anchor: "use-the-framework-that-matches-the-kind-of-complexity",
        markdown:
          "Strategic complexity often benefits from [First Principles vs Pareto](/articles/first-principles-vs-pareto), while multidimensional life or business goals often benefit from a Mandala-style mapping system.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["first-principles", "pareto", "mandalas"],
    relatedArticles: ["goal-breakdown-tool", "life-planning-framework"],
    primaryFramework: "first-principles",
    seoTitle: "Decision Framework for Complex Goals | Vector AI",
  }),
  extension({
    slug: "life-planning-tool",
    category: "synonym",
    title: "Life Planning Tool for Long-Term Direction",
    description:
      "If you are searching for a life planning tool, the real need is usually a structure that turns purpose and long-range ambition into usable decisions.",
    intro:
      "A life planning tool should help people do more than list goals. It should help them choose direction, map the domains that matter, and move toward a long-range life design without losing the next step. Vector uses [Ikigai](/frameworks/ikigai) and [Mandala Chart](/frameworks/mandalas) to do that.",
    keywords: [
      "life planning tool",
      "life planning app",
      "long term planning tool",
      "life strategy tool",
    ],
    takeaways: [
      "Life planning requires direction plus structure.",
      "Purpose and execution have to be connected.",
      "Vector is positioned as a planning tool, not only a content site.",
    ],
    faqs: [
      {
        question: "What should a life planning tool do?",
        answer:
          "It should help clarify direction, organize supporting domains, and translate that into usable near-term plans.",
      },
      {
        question: "How is this different from a to-do list?",
        answer:
          "A life planning tool works at the direction and architecture level, not just task capture.",
      },
    ],
    sections: [
      {
        title: "Use a planning tool that can hold long horizons",
        anchor: "use-a-planning-tool-that-can-hold-long-horizons",
        markdown:
          "When the question is life direction rather than short-term productivity, the tool has to support purpose, tradeoffs, and multidomain growth. That is why [Life Planning Framework](/articles/life-planning-framework) is a better entry point than generic productivity content.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["ikigai", "mandalas"],
    relatedArticles: ["life-planning-framework", "ikigai-template"],
    primaryFramework: "ikigai",
    seoTitle: "Life Planning Tool for Long-Term Direction | Vector AI",
  }),
  extension({
    slug: "personal-strategy-framework",
    category: "synonym",
    title: "Personal Strategy Framework for Long-Range Goals",
    description:
      "A personal strategy framework should help you decide where to aim, what to emphasize, and what to ignore across a long planning horizon.",
    intro:
      "A personal strategy framework is usually the right search when someone needs more than motivation. They need a way to decide where to aim, what to emphasize, and what to deprioritize. Vector combines frameworks like [First Principles](/frameworks/first-principles), [Pareto](/frameworks/pareto), and [OKRs](/frameworks/okr) to create that structure.",
    keywords: [
      "personal strategy framework",
      "personal strategy",
      "strategy framework for goals",
      "life strategy framework",
    ],
    takeaways: [
      "Personal strategy depends on choosing tradeoffs clearly.",
      "Frameworks help avoid drifting between disconnected ambitions.",
      "Vector turns strategy into a blueprint instead of leaving it conceptual.",
    ],
    faqs: [
      {
        question: "What is a personal strategy framework?",
        answer:
          "It is a structured way to make direction, prioritization, and execution decisions across a long-range goal or life transition.",
      },
      {
        question: "Is strategy different from productivity?",
        answer:
          "Yes. Strategy chooses what matters and what will be ignored; productivity only helps execute the chosen work.",
      },
    ],
    sections: [
      {
        title: "Use strategy to decide what not to do",
        anchor: "use-strategy-to-decide-what-not-to-do",
        markdown:
          "A personal strategy framework is valuable because it helps you decide what not to pursue right now. That is what separates strategy from generic productivity.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["first-principles", "pareto", "okr"],
    relatedArticles: ["goal-prioritization-system", "best-goal-setting-method"],
    primaryFramework: "first-principles",
    seoTitle: "Personal Strategy Framework for Long-Range Goals | Vector AI",
  }),
  extension({
    slug: "priority-matrix-guide",
    category: "synonym",
    title: "Priority Matrix Guide for Goal Planning",
    description:
      "If you are searching for a priority matrix, this guide explains how the Eisenhower Matrix fits into a larger goal-planning system.",
    intro:
      "A priority matrix is useful when the week feels reactive. The question is whether you need the matrix by itself or as part of a larger prioritization system. Vector treats the [Eisenhower Matrix](/frameworks/eisenhower) as an operational layer inside a broader planning workflow.",
    keywords: [
      "priority matrix",
      "priority matrix guide",
      "urgent important matrix",
      "priority planning matrix",
    ],
    takeaways: [
      "The matrix is strongest as an operational filter.",
      "It works best when tied to larger priorities.",
      "Vector uses it as part of a broader planning stack.",
    ],
    faqs: [
      {
        question: "What is a priority matrix?",
        answer:
          "It is a way to sort work by criteria such as urgency and importance so decisions become clearer.",
      },
      {
        question: "Is a priority matrix enough for long-term planning?",
        answer:
          "Usually not by itself. It is strongest when combined with a framework for leverage or strategy.",
      },
    ],
    sections: [
      {
        title: "Use the matrix for weekly clarity",
        anchor: "use-the-matrix-for-weekly-clarity",
        markdown:
          "A priority matrix is usually about operational clarity, not life strategy. That is why it pairs well with [Goal Prioritization System](/articles/goal-prioritization-system) content rather than replacing it.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["eisenhower", "pareto"],
    relatedArticles: ["eisenhower-matrix-tool", "pareto-vs-eisenhower-matrix"],
    primaryFramework: "eisenhower",
    seoTitle: "Priority Matrix Guide for Goal Planning | Vector AI",
  }),
  extension({
    slug: "vector-vs-notion-goal-planning",
    category: "commercial",
    title: "Vector vs Notion for Goal Planning",
    description:
      "An honest comparison of Vector and Notion for goal planning, including where a flexible workspace wins and where a framework-native planning tool wins.",
    intro:
      "Vector and Notion solve adjacent problems. Notion is a flexible workspace. Vector is a framework-native goal planning tool. If you need maximum customization, Notion is strong. If you need a system that converts a goal into a blueprint quickly, Vector is usually the better fit.",
    keywords: [
      "vector vs notion for goal planning",
      "notion goal planning",
      "goal planning app comparison",
      "vector vs notion",
    ],
    takeaways: [
      "Notion is stronger as a flexible workspace.",
      "Vector is stronger when the user wants guided framework-based planning.",
      "The right choice depends on whether customization or structured planning is the bottleneck.",
    ],
    faqs: [
      {
        question: "Is Vector trying to replace Notion?",
        answer:
          "Not directly. Notion is a broad workspace; Vector is focused on framework-based goal planning and blueprint generation.",
      },
      {
        question: "Who should choose Vector over Notion?",
        answer:
          "People who want guided planning structure, framework choice, and execution-ready outputs without building the system themselves.",
      },
    ],
    sections: [
      {
        title: "Where Notion wins",
        anchor: "where-notion-wins",
        markdown:
          "Notion wins when the user wants a blank canvas, extensive databases, and deep customization. It is better as a general workspace than as a specialized planning engine.",
      },
      {
        title: "Where Vector wins",
        anchor: "where-vector-wins",
        markdown:
          "Vector wins when the user wants a direct path from goal to framework to blueprint. It reduces the work of designing the planning system from scratch.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["okr", "pareto", "ikigai"],
    relatedArticles: [
      "career-planning-system",
      "goal-breakdown-tool",
      "vector-vs-trello-personal-planning",
    ],
    primaryFramework: "okr",
    seoTitle: "Vector vs Notion for Goal Planning | Vector AI",
  }),
  extension({
    slug: "vector-vs-trello-personal-planning",
    category: "commercial",
    title: "Vector vs Trello for Personal Planning",
    description:
      "An honest comparison of Vector and Trello for personal planning, including where kanban is helpful and where framework-based planning creates more clarity.",
    intro:
      "Trello is useful when the user mainly needs visible task flow. Vector is stronger when the user still needs help deciding what the right plan should be before the tasks are even created. The distinction is not good vs bad; it is task management vs framework-based planning.",
    keywords: [
      "vector vs trello",
      "trello personal planning",
      "personal planning app comparison",
      "vector vs trello personal planning",
    ],
    takeaways: [
      "Trello is strongest for straightforward task flow.",
      "Vector is strongest when the plan needs to be architected before it can be managed.",
      "The choice depends on whether the bottleneck is execution tracking or planning design.",
    ],
    faqs: [
      {
        question: "Who should use Trello instead of Vector?",
        answer:
          "People who already have a solid plan and only need a simple kanban board to manage task flow.",
      },
      {
        question: "Who should use Vector instead?",
        answer:
          "People who are still shaping the plan itself and want framework guidance plus blueprint generation.",
      },
    ],
    sections: [
      {
        title: "Where Trello wins",
        anchor: "where-trello-wins",
        markdown:
          "Trello wins when the structure is obvious and the main problem is moving cards across a board. It is a clean execution tracker.",
      },
      {
        title: "Where Vector wins",
        anchor: "where-vector-wins",
        markdown:
          "Vector wins earlier in the planning chain. It helps decide how the goal should be structured before the tasks ever become cards.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["gps", "okr", "pareto"],
    relatedArticles: [
      "planning-system-for-personal-goals",
      "goal-breakdown-tool",
      "okrs-in-vector-vs-spreadsheet-tracking",
    ],
    primaryFramework: "gps",
    seoTitle: "Vector vs Trello for Personal Planning | Vector AI",
  }),
  extension({
    slug: "okrs-in-vector-vs-spreadsheet-tracking",
    category: "commercial",
    title: "OKRs in Vector vs Spreadsheet Tracking",
    description:
      "A comparison of running OKRs in Vector versus spreadsheets, focusing on structure, speed, review quality, and execution follow-through.",
    intro:
      "Spreadsheets can absolutely hold OKRs. The question is whether they help create and sustain them well. Vector is stronger when users want framework-native generation, cleaner review loops, and execution guidance layered on top of the OKR itself.",
    keywords: [
      "okrs in vector vs spreadsheet tracking",
      "okr spreadsheet comparison",
      "okr tracking tool",
      "vector okrs",
    ],
    takeaways: [
      "Spreadsheets are flexible but ask the user to design the system manually.",
      "Vector is stronger when the user wants guided creation plus execution structure.",
      "The tradeoff is freedom vs planning leverage.",
    ],
    faqs: [
      {
        question: "Can spreadsheets handle OKRs?",
        answer:
          "Yes, but they usually require the user to design the structure and review process manually.",
      },
      {
        question: "Why would someone choose Vector instead?",
        answer:
          "Because Vector helps generate the OKR, structure the blueprint, and connect it to milestones and next actions faster.",
      },
    ],
    sections: [
      {
        title: "Where spreadsheets win",
        anchor: "where-spreadsheets-win",
        markdown:
          "Spreadsheets win when the user wants maximum control, already knows how to structure OKRs, and is comfortable maintaining the system manually.",
      },
      {
        title: "Where Vector wins",
        anchor: "where-vector-wins",
        markdown:
          "Vector wins when the bottleneck is not table editing but planning clarity. It helps users move from goal to objective, key results, milestones, and execution rhythm without building that system from scratch.",
      },
    ],
    readingTime: "4 min read",
    relatedFrameworks: ["okr"],
    relatedArticles: [
      "okr-generator",
      "personal-okr-system",
      "okr-vs-smart-goals",
    ],
    primaryFramework: "okr",
    seoTitle: "OKRs in Vector vs Spreadsheet Tracking | Vector AI",
  }),
];
