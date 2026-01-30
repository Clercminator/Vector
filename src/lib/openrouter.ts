import type { BlueprintResult, FrameworkId } from "@/lib/blueprints";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";

function getApiKey(): string {
  return (import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined) ?? "";
}

/** Proxy URL from your backend (e.g. Supabase Edge Function). When set, the app calls this instead of Open Router directly so the API key stays server-side. */
function getProxyUrl(): string {
  return (import.meta.env.VITE_OPENROUTER_PROXY_URL as string | undefined) ?? "";
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(getProxyUrl().trim() || getApiKey().trim());
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Call Open Router chat completions. Returns the assistant message content or throws.
 * If VITE_OPENROUTER_PROXY_URL is set, calls your backend proxy (no API key in browser).
 */
export async function chat(
  messages: ChatMessage[],
  options?: { model?: string; max_tokens?: number }
): Promise<string> {
  const proxyUrl = getProxyUrl().trim();
  const payload = {
    model: options?.model ?? DEFAULT_MODEL,
    messages,
    max_tokens: options?.max_tokens ?? 1024,
    temperature: 0.3,
  };

  if (proxyUrl) {
    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Proxy API error (${res.status}): ${text || res.statusText}`);
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };
    if (data.error?.message) throw new Error(data.error.message);
    const content = data.choices?.[0]?.message?.content;
    if (content == null) throw new Error("Proxy returned no content.");
    return content.trim();
  }

  const key = getApiKey();
  if (!key) throw new Error("VITE_OPENROUTER_API_KEY or VITE_OPENROUTER_PROXY_URL is not set.");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Open Router API error (${res.status}): ${text || res.statusText}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
    error?: { message?: string };
  };

  if (data.error?.message) throw new Error(data.error.message);
  const content = data.choices?.[0]?.message?.content;
  if (content == null) throw new Error("Open Router returned no content.");
  return content.trim();
}

function buildSystemPrompt(framework: FrameworkId): string {
  const base = `You are a goal-architect assistant. The user has answered a short questionnaire for the "${framework}" framework. Your task is to return a single JSON object that structures their answers. Return ONLY valid JSON, no markdown code fence, no explanation.`;
  switch (framework) {
    case "first-principles":
      return `${base}
Schema: { "type": "first-principles", "truths": string[], "newApproach": string }
- truths: array of non-empty strings (fundamental facts the user gave)
- newApproach: one string (their new way to build from the ground up)`;
    case "pareto":
      return `${base}
Schema: { "type": "pareto", "vital": string[], "trivial": string[] }
- vital: the 20% activities that move the needle (from their answer)
- trivial: the remaining activities`;
    case "rpm":
      return `${base}
Schema: { "type": "rpm", "result": string, "purpose": string, "plan": string[] }
- result: their stated result/goal
- purpose: their "why"
- plan: array of action items (strings) from their Massive Action Plan`;
    case "eisenhower":
      return `${base}
Schema: { "type": "eisenhower", "q1": string[], "q2": string[], "q3": string[], "q4": string[] }
- q1: Urgent & Important (Do first)
- q2: Important, not urgent (Schedule)
- q3: Urgent, not important (Delegate) — can be empty
- q4: Neither (Eliminate) — can be empty
Split the user's listed tasks into these four arrays based on their answers.`;
    case "okr":
      return `${base}
Schema: { "type": "okr", "objective": string, "keyResults": string[], "initiative": string }
- objective: their 90-day objective
- keyResults: 3 measurable key results (strings)
- initiative: first major initiative they'll launch`;
    default:
      return base;
  }
}

function parseJsonBlock(raw: string): unknown {
  const trimmed = raw.trim();
  const codeFence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```/);
  const toParse = codeFence ? codeFence[1].trim() : trimmed;
  return JSON.parse(toParse) as unknown;
}

function toStringList(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => String(x ?? "").trim()).filter(Boolean);
}

function validateAndSanitize(framework: FrameworkId, obj: unknown): BlueprintResult | null {
  if (!obj || typeof obj !== "object" || !("type" in obj)) return null;
  const t = (obj as { type?: string }).type;
  if (t !== framework) return null;
  const o = obj as Record<string, unknown>;
  try {
    switch (framework) {
      case "first-principles":
        return {
          type: "first-principles",
          truths: toStringList(o.truths),
          newApproach: String(o.newApproach ?? "").trim() || "See answers above.",
        };
      case "pareto":
        return {
          type: "pareto",
          vital: toStringList(o.vital),
          trivial: toStringList(o.trivial),
        };
      case "rpm":
        return {
          type: "rpm",
          result: String(o.result ?? "").trim() || "—",
          purpose: String(o.purpose ?? "").trim() || "—",
          plan: toStringList(o.plan),
        };
      case "eisenhower":
        return {
          type: "eisenhower",
          q1: toStringList(o.q1),
          q2: toStringList(o.q2),
          q3: toStringList(o.q3),
          q4: toStringList(o.q4),
        };
      case "okr":
        return {
          type: "okr",
          objective: String(o.objective ?? "").trim() || "—",
          keyResults: toStringList(o.keyResults),
          initiative: String(o.initiative ?? "").trim() || "—",
        };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Use Open Router to turn the user's answers into a structured BlueprintResult.
 * Returns null if the API is not configured, the request fails, or the response is invalid.
 */
export async function generateBlueprintResult(
  framework: FrameworkId,
  answers: string[]
): Promise<BlueprintResult | null> {
  if (!isOpenRouterConfigured()) return null;

  const userContent = `Framework: ${framework}\n\nAnswers (in order):\n${answers.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n\nReturn the JSON object only.`;

  try {
    const content = await chat(
      [
        { role: "system", content: buildSystemPrompt(framework) },
        { role: "user", content: userContent },
      ],
      { max_tokens: 1024 }
    );
    const obj = parseJsonBlock(content);
    return validateAndSanitize(framework, obj);
  } catch {
    return null;
  }
}
