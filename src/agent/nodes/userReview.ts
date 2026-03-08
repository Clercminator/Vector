import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { AgentStateType } from "../state";
import { prompts } from "../prompts";
import { invokeWithFallback } from "../utils";
import { MAX_USER_REFINEMENTS } from "../constants";
import { agentLogger, promptCharsFromString } from "../logger";

export const userReviewNode = async (state: AgentStateType) => {
  const { blueprint, goal, userProfile = "", formContext = "", userRefinementAttempts = 0 } = state;

  if (!blueprint) return {};

  // Already refined once—skip further refinement to avoid loops
  if (userRefinementAttempts >= MAX_USER_REFINEMENTS) {
    return { userReviewRequestsRefinement: false };
  }

  const prompt = prompts.userReview
    .replace("{{userProfile}}", userProfile || "(none)")
    .replace("{{goal}}", goal || "")
    .replace("{{formContext}}", formContext || "(none)")
    .replace("{{blueprint}}", JSON.stringify(blueprint));

  const start = performance.now();
  try {
    const response = await invokeWithFallback([new SystemMessage(prompt)], { temperature: 0.3, bindTools: false });
    const output = response.content.toString().trim().toUpperCase();
    agentLogger.logNode({ node: "user_review", promptChars: promptCharsFromString(prompt), latencyMs: Math.round(performance.now() - start), success: true });

    if (output.startsWith("SATISFIED")) {
      return { userReviewRequestsRefinement: false };
    }

    if (output.startsWith("IMPROVE:")) {
      const feedback = output.slice(8).trim();
      if (!feedback) return { userReviewRequestsRefinement: false };

      const refinementMessage = `User-perspective review requested improvements. Incorporate these into the blueprint:\n\n${feedback}`;
      return {
        userReviewFeedback: feedback,
        userRefinementAttempts: 1,
        userReviewRequestsRefinement: true,
        messages: [new HumanMessage(refinementMessage)]
      };
    }

    // Ambiguous output—treat as satisfied to avoid infinite loops
    return { userReviewRequestsRefinement: false };
  } catch (e) {
    agentLogger.logNode({ node: "user_review", promptChars: promptCharsFromString(prompt), latencyMs: Math.round(performance.now() - start), success: false, error: e instanceof Error ? e.message : String(e) });
    throw e;
  }
};
