import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { tools } from "./tools";

type InvocationOptions = {
  temperature?: number;
  bindTools?: boolean;
  models?: string[];
  maxTokens?: number;
  modelKwargs?: Record<string, unknown>;
  timeoutMs?: number;
};

// Build LLM config. When using Supabase openrouter-proxy, we must add the apikey (and optionally
// Authorization) header or the Supabase gateway can reject with "No API key found" / CORS.
const proxyUrl = import.meta.env.VITE_OPENROUTER_PROXY_URL as
  | string
  | undefined;
// Vercel typically sets VITE_SUPABASE_PUBLISHABLE_KEY; fallback to anon key
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;
const baseURL = proxyUrl || "https://openrouter.ai/api/v1";
const llmConfig: { baseURL: string; defaultHeaders?: Record<string, string> } =
  { baseURL };
if (proxyUrl && supabaseKey) {
  llmConfig.defaultHeaders = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };
}

const LOG_PREFIX = "[Vector:LLM]";
function logLLM(message: string, data?: Record<string, unknown>): void {
  if (data) console.log(LOG_PREFIX, message, data);
  else console.log(LOG_PREFIX, message);
}
function logLLMError(message: string, err: unknown): void {
  const detail =
    err instanceof Error ? { message: err.message, name: err.name } : { err };
  console.error(LOG_PREFIX, message, detail);
  if (err instanceof Error && err.message?.toLowerCase().includes("cors")) {
    console.error(
      LOG_PREFIX,
      "CORS hint: ensure openrouter-proxy is deployed and returns Access-Control-Allow-Origin. Redeploy: npx supabase functions deploy openrouter-proxy",
    );
  }
}

/** API key for Open Router. Prefer KEY_2 (e.g. from .env.backend) for deploy. */
export function getOpenRouterApiKey(): string {
  const key2 = (
    import.meta.env.VITE_OPENROUTER_API_KEY_2 as string | undefined
  )?.trim();
  const key1 = (
    import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined
  )?.trim();
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

export const FINAL_PLAN_MODEL = "z-ai/glm-5";
export const FINAL_PLAN_REASONING = {
  enabled: true,
  exclude: true,
  effort: "high",
} as const;

const dedupeModels = (models: string[]) =>
  Array.from(new Set(models.filter(Boolean)));

export const FINAL_PLAN_MODELS = dedupeModels([
  FINAL_PLAN_MODEL,
  PRIMARY_MODEL,
  ...FALLBACK_MODELS,
]);

export const ALL_MODELS = [PRIMARY_MODEL, ...FALLBACK_MODELS];

/** Max time to wait for a single model before trying the next (ms). */
export const PER_MODEL_TIMEOUT_MS = 65_000;

/** Invoke Open Router with retry: try primary model, then each fallback until one succeeds. Uses getOpenRouterApiKey(). Each model attempt is limited to PER_MODEL_TIMEOUT_MS; if it exceeds, the next model is tried. */
export async function invokeWithFallback(
  messages: BaseMessage[],
  options: InvocationOptions = {},
): Promise<AIMessage> {
  const {
    temperature = 0,
    bindTools = true,
    models = ALL_MODELS,
    maxTokens,
    modelKwargs,
    timeoutMs = PER_MODEL_TIMEOUT_MS,
  } = options;
  const apiKey = getOpenRouterApiKey();
  const usingProxy = !!proxyUrl;
  logLLM(usingProxy ? "Using proxy" : "Using Open Router directly", {
    baseURL: baseURL.replace(/\/v1$/, ""),
    modelCount: models.length,
  });

  let lastError: unknown;
  for (const modelId of dedupeModels(models)) {
    try {
      const llm = new ChatOpenAI({
        model: modelId,
        temperature,
        apiKey,
        maxTokens,
        modelKwargs,
        configuration: llmConfig,
      });
      const runnable = bindTools ? llm.bindTools(tools) : llm;
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `Model ${modelId} timed out after ${timeoutMs / 1000}s`,
              ),
            ),
          timeoutMs,
        ),
      );
      const response = await Promise.race([
        runnable.invoke(messages),
        timeoutPromise,
      ]);
      logLLM("Success", { model: modelId });
      return response as AIMessage;
    } catch (e) {
      lastError = e;
      logLLMError(`Model ${modelId} failed`, e);
      continue;
    }
  }

  logLLMError("All models failed; rethrowing last error", lastError);
  throw lastError;
}
