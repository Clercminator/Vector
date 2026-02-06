import { tool } from "@langchain/core/tools";
import { z } from "zod";

const setFrameworkSchema = z.object({
  framework: z.enum(["first-principles", "pareto", "rpm", "eisenhower", "okr", "gps", "misogi"]).describe("The framework ID to switch to.")
});

export const setFrameworkTool = tool(async ({ framework }) => {
  return `Framework switched to ${framework}.`; 
}, {
  name: "set_framework",
  description: "Switch the strategic framework (e.g., from 'first-principles' to 'okr'). Use this if the user explicitly asks to change methods.",
  schema: setFrameworkSchema
});

const generateBlueprintSchema = z.object({
  reason: z.string().describe("The reason for generating the blueprint now (e.g. 'User confirmed readiness', 'Sufficient information gathered').")
});

export const generateBlueprintTool = tool(async () => {
  return "READY_TO_GENERATE";
}, {
  name: "generate_blueprint",
  description: "Signal that you have gathered enough information and are ready to generate the final strategic blueprint. Call this when the user says 'ready', 'yes', 'listo', or when you have all necessary details.",
  schema: generateBlueprintSchema
});

export const tools = [setFrameworkTool, generateBlueprintTool];
