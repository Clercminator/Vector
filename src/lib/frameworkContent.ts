
export const frameworkContent: Record<string, { longDescription: string; history: string; whoItIsFor: string; steps: string[] }> = {
  "first-principles": {
    longDescription: `First Principles thinking is a mode of inquiry that relentlessly pursues the fundamental truths of a problem. Instead of reasoning by analogy ("we do it this way because it's always been done this way"), you boil things down to the most basic truths you can confirm and build up from there. This approach allows you to step outside the history of assumptions and innovative solutions.`,
    history: `The term was coined by Aristotle, but more recently popularized by Elon Musk, who used it to reimagine space travel. When told that rockets were too expensive, Musk broke down a rocket into its raw materials (aluminum, titanium, copper, carbon fiber) and found that the material cost was only 2% of the typical price. This realization led to SpaceX.`,
    whoItIsFor: "Ideal for innovators, engineers, and anyone stuck in a conventional rut who needs a breakthrough. If standard solutions are failing you, use First Principles.",
    steps: [
      "Identify your current assumptions.",
      "Break down the problem into its fundamental principles.",
      "Create new solutions from scratch.",
      "Test and refine your hypothesis."
    ]
  },
  "pareto": {
    longDescription: "The Pareto Principle, or the 80/20 rule, suggests that 80% of outcomes come from 20% of causes. In productivity, this means identifying the few critical tasks that drive the majority of your results and ruthlessly eliminating or delegating the rest.",
    history: "Named after Vilfredo Pareto, an Italian economist who observed that 80% of the land in Italy was owned by 20% of the population. He later found this distribution applied to almost everything.",
    whoItIsFor: "Perfect for busy professionals, managers, and anyone who feels overwhelmed by a long to-do list but feels like they aren't making progress.",
    steps: [
      "List all your tasks/goals.",
      "Identify the top 20% that have the highest impact.",
      "Focus your energy solely on those.",
      "Delegate, delete, or defer the rest."
    ]
  },
  "rpm": {
    longDescription: "The Rapid Planning Method (RPM) is a system designed to help you focus on the outcome you want, rather than just the to-do list. It turns your focus from 'what do I have to do' to 'what do I want to achieve'.",
    history: "Developed by Tony Robbins to manage his massive schedule and business empire.",
    whoItIsFor: "High achievers who want to ensure their daily actions align with their life's purpose.",
    steps: [
      "Result: Define exactly what you want.",
      "Purpose: Define why you want it (leverage).",
      "Massive Action Plan: List the specific steps to get there."
    ]
  },
  "eisenhower": {
    longDescription: "The Eisenhower Matrix helps you decide on and prioritize tasks by urgency and importance, sorting out less urgent and important tasks which you should either delegate or not do at all.",
    history: "Attributed to Dwight D. Eisenhower, the 34th President of the United States, known for his incredible productivity.",
    whoItIsFor: "Great for people constantly fighting fires and dealing with urgent/client demands.",
    steps: [
      "Categorize tasks into 4 quadrants.",
      "Do (Urgent & Important).",
      "Schedule (Important, Not Urgent).",
      "Delegate (Urgent, Not Important).",
      "Delete (Neither)."
    ]
  },
  "okr": {
    longDescription: "OKR (Objectives and Key Results) is a goal-setting framework for defining and tracking objectives and their outcomes.",
    history: "Intel's Andy Grove developed it, but it was popularized by John Doerr at Google.",
    whoItIsFor: "Teams and organizations that need alignment and measurable targets.",
    steps: [
      "Set an ambitious Objective.",
      "Define 3-5 Key Results (measurable).",
      "Track progress regularly."
    ]
  }
};
