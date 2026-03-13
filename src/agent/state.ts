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
  }),
  /** Summary of user profile (display name, bio, age, gender, country, zodiac, interests, skills, hobbies) for personalized plans. */
  userProfile: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => ""
  }),
  /** Intake form context: objective, stakes, horizon, obstacle, success look-like, explanation — so the agent uses what the user wrote. */
  formContext: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => ""
  }),
  /** Number of user-perspective refinement passes done (max 1 to avoid loops). */
  userRefinementAttempts: Annotation<number>({
    reducer: (x, y) => x + y,
    default: () => 0
  }),
  /** Feedback from user-perspective review to improve the blueprint (empty = satisfied, no refinement). */
  userReviewFeedback: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => ""
  }),
  /** True when userReview just requested refinement; router uses this to go to draft, then we clear it. */
  userReviewRequestsRefinement: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false
  }),
  /** Set by approval_gate after interrupt resume: { confirmed: boolean, userMessage?: string }. Used to route to draft or ask. */
  approvalGateResult: Annotation<{ confirmed: boolean; userMessage?: string } | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined
  })
});

export type AgentStateType = typeof AgentState.State;
