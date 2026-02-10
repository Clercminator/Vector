import { tool } from "@langchain/core/tools";
import { z } from "zod";

const setFrameworkSchema = z.object({
  framework: z.enum(["first-principles", "pareto", "rpm", "eisenhower", "okr", "gps", "misogi"]).describe("The framework ID to switch to.")
});

export const setFrameworkTool = tool(async ({ framework }) => {
  return `Framework switched to ${framework}.`; 
}, {
  name: "set_framework",
  description: "Switch to the chosen framework and start building the plan. Call this when the user confirms they want to proceed (e.g. 'Yes', 'Proceed', 'Build it', 'Let's go'). Use the framework you just recommended.",
  schema: setFrameworkSchema
});

const generateBlueprintSchema = z.object({
  reason: z.string().describe("Must cite the user's explicit confirmation, e.g. 'User said: Ready to generate' or 'User confirmed: Yes, proceed'.")
});

export const generateBlueprintTool = tool(async () => {
  return "READY_TO_GENERATE";
}, {
  name: "generate_blueprint",
  description: "ONLY call when the user has EXPLICITLY confirmed they are ready (e.g. 'yes', 'ready', 'listo', 'proceed', 'generate it'). NEVER call after YOU have asked questions—you must WAIT for the user to answer those questions and then confirm readiness. Do not assume or infer answers the user never gave.",
  schema: generateBlueprintSchema
});

export const tools = [setFrameworkTool, generateBlueprintTool];
