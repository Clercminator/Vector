import { Brain, Layers, Target, Rocket, Compass } from "lucide-react";

export type Framework =
  | "first-principles"
  | "pareto"
  | "rpm"
  | "eisenhower"
  | "okr"
  | "dsss"
  | "mandalas"
  | "gps";

export const frameworks = [
  {
    id: "first-principles" as Framework,
    title: "Elon Musk First Principles",
    description:
      "Break down complex problems into basic elements and then reassemble them from the ground up.",
    icon: Brain,
    color: "#4285F4", // Blue
    author: "Elon Musk / Aristotle",
    definition:
      "A problem-solving mental model that involves breaking a problem down into its basic elements (fundamental truths) and then reassembling them from the ground up, rather than reasoning by analogy.",
    pros: [
      "Encourages innovation",
      "Removes assumptions",
      "Creates unique solutions",
    ],
    cons: ["Time-consuming", "Mentally taxing", "Requires deep understanding"],
    example:
      "SpaceX lowered rocket costs by calculating the raw material cost of a rocket instead of buying pre-assembled parts.",
  },
  {
    id: "pareto" as Framework,
    title: "Pareto Principle (80/20)",
    description:
      "Identify the 20% of efforts that lead to 80% of your results to achieve radical efficiency.",
    icon: Layers,
    color: "#34A853", // Green
    author: "Vilfredo Pareto",
    definition:
      "The concept that for many outcomes, roughly 80% of consequences come from 20% of causes.",
    pros: ["Increases efficiency", "Focuses resources", "Simple to apply"],
    cons: [
      "Oversimplifies complex systems",
      "80/20 ratio is an estimate",
      "May ignore small but crucial details",
    ],
    example:
      "A software company fixes the top 20% of reported bugs to solve 80% of user crashes.",
  },
  {
    id: "rpm" as Framework,
    title: "Tony Robbins RPM",
    description:
      "A results-focused planning system: Result, Purpose, and Massive Action Plan.",
    icon: Target,
    color: "#EA4335", // Red
    author: "Tony Robbins",
    definition:
      'Rapid Planning Method (RPM) focuses on the outcome (Result), the "why" (Purpose), and the "how" (Massive Action Plan).',
    pros: [
      "Highly motivating",
      "Aligns actions with values",
      "Reduces busy work",
    ],
    cons: [
      "Can be overwhelming initially",
      "Requires emotional buy-in",
      "Less rigid structure",
    ],
    example:
      'Instead of "Go to gym", the goal is "Vibrant Health" (Result) because "I want energy for my kids" (Purpose) by "Running 3x/week" (Map).',
  },
  {
    id: "eisenhower" as Framework,
    title: "Eisenhower Matrix",
    description:
      "Categorize tasks by urgency and importance to master prioritization.",
    icon: Layers,
    color: "#FBBC05", // Yellow
    author: "Dwight D. Eisenhower",
    definition:
      "A decision-making tool that splits tasks into four quadrants based on urgency and importance.",
    pros: [
      "Clear prioritization",
      "Reduces procrastination",
      "Delegation framework",
    ],
    cons: [
      "Subjective categorization",
      "Does not account for effort",
      "Can become a procrastination tool itself",
    ],
    example:
      'Urgent & Important: "Server crash". Important not Urgent: "Strategic planning". Urgent not Important: "Most emails".',
  },
  {
    id: "okr" as Framework,
    title: "OKR Goal System",
    description:
      "Set ambitious Objectives and define measurable Key Results to track progress.",
    icon: Rocket,
    color: "#9333EA", // Purple
    author: "John Doerr / Andy Grove",
    definition:
      "Objectives and Key Results (OKR) is a goal-setting framework for defining and tracking objectives and their outcomes.",
    pros: ["Aligns teams", "Measurable progress", "Encourages ambition"],
    cons: [
      "Can be too rigid",
      "Hard to set correct metrics",
      "Can demotivate if targets are missed",
    ],
    example:
      'Objective: "Increase brand awareness". Key Result: "Achieve 10,000 active monthly users".',
  },
  {
    id: "dsss" as Framework,
    title: "Tim Ferriss DSSS",
    description:
      "Deconstruction, Selection, Sequencing, Stakes. A meta-learning framework to master any skill.",
    icon: Target,
    color: "#F59E0B", // Amber
    author: "Tim Ferriss",
    definition:
      "A 4-step framework for rapid skill acquisition: Deconstruct the skill, Select the 20%, Sequence the order, and set Stakes.",
    pros: [
      "Rapid learning",
      "Focuses on high-impact areas",
      "Accountability built-in",
    ],
    cons: [
      "Requires discipline",
      "Stakes can be stressful",
      "Needs good analysis",
    ],
    example:
      "Learning Spanish: Deconstruct grammar/vocab, Select top 1200 words, Sequence sentence structures, Stake $100 on passing a test.",
  },
  {
    id: "mandalas" as Framework,
    title: "Mandala Chart",
    description:
      "A 9x9 grid to map out a central goal and all related sub-goals and actions. Used by Shohei Ohtani.",
    icon: Layers,
    color: "#EC4899", // Pink
    author: "Shohei Ohtani (popularized by)",
    definition:
      "A visual chart with a central core goal surrounded by 8 distinct categories, each with 8 actionable steps (64 total items).",
    pros: ["Comprehensive", "Visualizes connections", "Balances huge goals"],
    cons: [
      "Can become complex",
      "Requires 64 specific items",
      "Hard to track all at once",
    ],
    example:
      'Central Goal: "Best Player". Outer 8: Fitness, Mental, Control, Speed, Luck, Human Quality, etc.',
  },
  {
    id: "gps" as Framework,
    title: "The GPS Method",
    description:
      "Bridging the gap between knowledge and execution with Goal, Plan, System.",
    icon: Compass,
    color: "#F97316", // Orange
    author: "Productivity Framework",
    definition:
      "Success isn't just about willpower; it’s about solving the Knowledge Gap and the Execution Gap.",
    pros: ["Action-oriented", "Bridges execution gap", "Scalable"],
    cons: ["Requires initial setup", "Needs tracking discipline"],
    example:
      "Goal: Run 10k. Plan: Training app. System: Strava + accountability.",
    whoItIsFor: "Anyone struggling to turn knowledge into action.",
  },
];
