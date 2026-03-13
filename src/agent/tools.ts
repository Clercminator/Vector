import { tool } from "@langchain/core/tools";
import { z } from "zod";

const setFrameworkSchema = z.object({
  framework: z.enum(["first-principles", "pareto", "rpm", "eisenhower", "okr", "gps", "misogi", "dsss", "mandalas", "ikigai", "general"]).describe("The framework ID to switch to.")
});

export const setFrameworkTool = tool(async ({ framework }) => {
  return `Framework switched to ${framework}.`; 
}, {
  name: "set_framework",
  description: "Switch to the chosen framework and start building the plan. Call this when the user confirms they want to proceed (e.g. 'Yes', 'Proceed', 'Build it', 'Let's go'). Use the framework you just recommended.",
  schema: setFrameworkSchema
});

const requestConfirmationSchema = z.object({
  summary: z.string().describe("Brief summary of what you've gathered (goal, constraints, timeline, key decisions) for the user to review."),
  reason: z.string().describe("Why you consider we have enough info to generate a personalized plan.")
});

/** Agent calls this when it has gathered enough info and asked 'Ready to generate?'. Triggers approval gate—user must click button to actually generate. */
export const requestConfirmationTool = tool(async ({ summary }) => {
  return `AWAITING_USER_CONFIRMATION: ${summary}`;
}, {
  name: "request_confirmation",
  description: "Call when you have enough personalized info, have summarized what you gathered, and have asked 'Ready for me to generate your plan?' or 'Does this analysis make sense? Anything to add?'. This shows the user a button to generate—they decide when. Do NOT call if you just asked new questions or if key areas (body/constraints, habits, past experience for fitness goals) are still missing. You must WAIT for user answers first.",
  schema: requestConfirmationSchema
});

export const tools = [setFrameworkTool, requestConfirmationTool];
