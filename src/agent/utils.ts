import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { tools } from "./tools";

// Build LLM config. When using Supabase openrouter-proxy, we must add the apikey header
// or the Supabase gateway rejects with "No API key found in request".
const proxyUrl = import.meta.env.VITE_OPENROUTER_PROXY_URL as string | undefined;
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;
const baseURL = proxyUrl || "https://openrouter.ai/api/v1";
const llmConfig: { baseURL: string; defaultHeaders?: Record<string, string> } = { baseURL };
if (proxyUrl && supabaseKey) {
  llmConfig.defaultHeaders = { apikey: supabaseKey };
}

/** API key for Open Router. Prefer KEY_2 (e.g. from .env.backend) for deploy. */
export function getOpenRouterApiKey(): string {
  const key2 = (import.meta.env.VITE_OPENROUTER_API_KEY_2 as string | undefined)?.trim();
  const key1 = (import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined)?.trim();
  return key2 || key1 || "dummy";
}

// Model priority (Open Router): primary first, then fallbacks in order
export const PRIMARY_MODEL = "deepseek/deepseek-v3.2";
export const FALLBACK_MODELS: string[] = [
  "google/gemini-3-flash-preview",
  "moonshotai/kimi-k2.5",
  "google/gemini-2.0-flash-001",
  "openai/gpt-4o",
];

export const ALL_MODELS = [PRIMARY_MODEL, ...FALLBACK_MODELS];

/** Max time to wait for a single model before trying the next (ms). */
export const PER_MODEL_TIMEOUT_MS = 65_000;

/** Invoke Open Router with retry: try primary model, then each fallback until one succeeds. Uses getOpenRouterApiKey(). Each model attempt is limited to PER_MODEL_TIMEOUT_MS; if it exceeds, the next model is tried. */
export async function invokeWithFallback(
  messages: BaseMessage[],
  options: { temperature?: number; bindTools?: boolean } = {}
): Promise<AIMessage> {
  const { temperature = 0, bindTools = true } = options;
  const apiKey = getOpenRouterApiKey();
  let lastError: unknown;
  for (const modelId of ALL_MODELS) {
    try {
      const llm = new ChatOpenAI({
        model: modelId,
        temperature,
        apiKey,
        configuration: llmConfig,
      });
      const runnable = bindTools ? llm.bindTools(tools) : llm;
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Model ${modelId} timed out after ${PER_MODEL_TIMEOUT_MS / 1000}s`)), PER_MODEL_TIMEOUT_MS)
      );
      const response = await Promise.race([
        runnable.invoke(messages),
        timeoutPromise,
      ]);
      return response as AIMessage;
    } catch (e) {
      lastError = e;
      continue;
    }
  }
  throw lastError;
}
