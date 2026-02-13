import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

// Define the State
export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  goal: Annotation<string>({
      reducer: (x, y) => (x && String(x).trim() ? x : (y && String(y).trim() ? y : x || y)),
      default: () => "",
  }),
  framework: Annotation<string | null>({
      reducer: (x, y) => y ?? x,
      default: () => null,
  }), 
  tier: Annotation<string>({
      reducer: (x, y) => y ?? x,
      default: () => "architect",
  }),
  validFrameworks: Annotation<string[]>({
      reducer: (x, y) => y ?? x,
      default: () => ["first-principles", "pareto", "rpm"], // Default to free tier list
  }),
  blueprint: Annotation<any>,
  steps: Annotation<number>({
    reducer: (x, y) => x + y,
    default: () => 0,
  }),
  critiqueAttempts: Annotation<number>({
     reducer: (x, y) => x + y,
     default: () => 0,
  }),
  validationAttempts: Annotation<number>({
     reducer: (x, y) => y, // Replace, don't sum
     default: () => 0,
  }),
  hardMode: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false
  }),
  language: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "en"
  })
});

export type AgentStateType = typeof AgentState.State;
