import type { BlueprintResult, FrameworkId } from "@/lib/blueprints";
import fpPrompt from "@/lib/prompts/first-principles.txt?raw";
import paretoPrompt from "@/lib/prompts/pareto.txt?raw";
import rpmPrompt from "@/lib/prompts/rpm.txt?raw";
import eisenhowerPrompt from "@/lib/prompts/eisenhower.txt?raw";
import okrPrompt from "@/lib/prompts/okr.txt?raw";
import suggestPrompt from "@/lib/prompts/suggest-framework.txt?raw";
import refinePrompt from "@/lib/prompts/refine-blueprint.txt?raw";
import gpsPrompt from "@/lib/prompts/gps.txt?raw";
import { traceable } from "langsmith/traceable";
import { Client } from "langsmith";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-v3.2";

function getApiKey(): string {
  const key = (import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined) ?? "";
  if (key && import.meta.env.PROD && !import.meta.env.VITE_OPENROUTER_PROXY_URL) {
      console.warn("Security Warning: VITE_OPENROUTER_API_KEY is exposed in the client. Use VITE_OPENROUTER_PROXY_URL for production.");
  }
  return key;
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
export const chat = traceable(async function chat(
  messages: ChatMessage[],
  options?: { model?: string; max_tokens?: number; retryCount?: number }
): Promise<string> {
  const proxyUrl = getProxyUrl().trim();
  const payload = {
    model: options?.model ?? DEFAULT_MODEL,
    messages,
    max_tokens: options?.max_tokens ?? 1024,
    temperature: 0.3,
  };

  const maxRetries = options?.retryCount ?? 0;
  let attempt = 0;
  let lastError: any;

  while (attempt <= maxRetries) {
    try {
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

    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        attempt++;
        await new Promise(r => setTimeout(r, 1000 * attempt)); // Backoff
        continue;
      }
    }
    attempt++;
  }
  throw lastError || new Error("Unknown error in chat completion");
}, {
  run_type: "llm",
  name: "chat_openrouter"
});



function buildSystemPrompt(framework: FrameworkId, userName?: string): string {
  let prompt = "";
  switch (framework) {
    case "first-principles":
      prompt = fpPrompt; break;
    case "pareto":
      prompt = paretoPrompt; break;
    case "rpm":
      prompt = rpmPrompt; break;
    case "eisenhower":
      prompt = eisenhowerPrompt; break;
    case "okr":
      prompt = okrPrompt; break;
    case "gps":
      prompt = gpsPrompt; break;
    default:
      prompt = fpPrompt;
  }
  
  if (userName) {
    // Inject user name into the persona
    prompt = prompt.replace("You are a world-class", `You are a world-class architectural strategist assisting ${userName}. You are a world-class`);
  }
  return prompt;
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
      case "gps":
        return {
          type: "gps",
          goal: String(o.goal ?? "").trim() || "—",
          plan: toStringList(o.plan),
          system: toStringList(o.system),
          anti_goals: toStringList(o.anti_goals),
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
 * With auto-retry on validation failure.
 */
export async function generateBlueprintResult(
  framework: FrameworkId,
  answers: string[],
  userName?: string
): Promise<BlueprintResult | null> {
  if (!isOpenRouterConfigured()) return null;

  const userContent = `Framework: ${framework}\n\nAnswers (in order):\n${answers.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n\nReturn the JSON object only.`;
  const systemContent = buildSystemPrompt(framework, userName);

  let attempts = 0;
  const maxAttempts = 2; // 1 initial + 1 retry
  let currentMessages: ChatMessage[] = [
    { role: "system", content: systemContent },
    { role: "user", content: userContent },
  ];

  while (attempts < maxAttempts) {
    try {
      const content = await chat(currentMessages, { max_tokens: 1024, retryCount: 1 }); // Network retry inside chat
      const obj = parseJsonBlock(content);
      const valid = validateAndSanitize(framework, obj);
      if (valid) return valid;
      
      // If valid is null, logic error in JSON schema
      throw new Error("Invalid JSON schema returned");

    } catch (e: any) {
        console.warn("Generation attempt failed", e);
        attempts++;
        if (attempts < maxAttempts) {
             // Feed error back to AI
             currentMessages.push({ role: "system", content: `Error: ${e.message}. You MUST return valid JSON matching the schema.` });
        }
    }
  }
  return null;
}

/**
 * Suggest a framework based on the user's problem description.
 */
export async function suggestFramework(
    objective: string, 
    stakes: string, 
    horizon: string, 
    userName?: string,
    language?: string
): Promise<{ id: FrameworkId; explanation: string } | null> {
    if (!isOpenRouterConfigured()) return null;

    const userContent = `
    User Context:
    - Objective: "${objective}"
    - Stakes (Risk/Importance): "${stakes}"
    - Horizon (Timeline): "${horizon}"
    ${userName ? `- User Name: ${userName}` : ''}
    
    Task: Analyze the user's goal and select the BEST strategic framework from the list below.
    
    Frameworks IDs: 
    - first-principles (for fundamental innovation/engineering)
    - pareto (for optimization/efficiency)
    - rpm (for high-energy/motivation alignment)
    - eisenhower (for time management/prioritization)
    - okr (for measurable team/business goals)
    - dsss (for skill acquisition)
    - mandalas (for holistic life balance)
    - misogi (for a single define-the-year challenge)

    Output Schema (JSON ONLY):
    {
        "framework": "one_of_the_ids_above",
        "explanation": "A concise reasoning (1-2 sentences) COMPLETELY in ${language || 'English'} explaining WHY this fits. Do not use English if the target language is ${language}."
    }
    
    IMPORTANT: Return ONLY the JSON object. Do not add markdown formatting or extra text.
    `;

    try {
        const content = await chat([
            { role: "system", content: `You are an expert strategic advisor. You output strictly valid JSON. You MUST write the explanation in ${language || 'English'}.` },
            { role: "user", content: userContent }
        ], { max_tokens: 500, retryCount: 1 });
        
        const obj = parseJsonBlock(content) as any;
        
        // Normalize framework ID just in case
        let fw = obj.framework?.toLowerCase().trim();
        
        // Mapping common hallucinations to real IDs
        if (fw === 'first principles') fw = 'first-principles';
        if (fw === '80/20' || fw === 'pareto principle') fw = 'pareto';
        
        if (fw && ["first-principles", "pareto", "rpm", "eisenhower", "okr", "dsss", "mandalas", "misogi", "gps"].includes(fw)) {
            return {
                id: fw as FrameworkId,
                explanation: obj.explanation || "Recommended based on your inputs."
            };
        }
        
        console.warn("Invalid framework ID returned:", fw);
        return null; // Fallback to null (UI asks user to pick)
    } catch (e) {
        console.error("Framework suggestion failed", e);
        return null;
    }
}

/**
 * Refine an existing blueprint result based on user chat input.
 */
export async function refineBlueprint(
    framework: FrameworkId, 
    currentResult: BlueprintResult, 
    chatHistory: { role: 'ai' | 'user', content: string }[], 
    lastUserMessage: string,
    userName?: string
): Promise<{ result: BlueprintResult, message: string } | null> {
    if (!isOpenRouterConfigured()) return null;

    let systemPrompt = `${refinePrompt}
    Current JSON: ${JSON.stringify(currentResult)}
    Framework: ${framework}`;

    if (userName) {
        systemPrompt += `\nUser Name: ${userName}`;
    }

    // Convert history format
    const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...chatHistory.map(m => ({ role: m.role === 'ai' ? 'assistant' as const : 'user' as const, content: m.content })),
        { role: "user", content: lastUserMessage }
    ];

    let attempts = 0;
    const maxAttempts = 2; // 1 initial + 1 retry

    while (attempts < maxAttempts) {
        try {
            const content = await chat(messages, { max_tokens: 1500, retryCount: 1 });
            const obj = parseJsonBlock(content) as any;
            
            // Support both old (direct) and new (wrapped) formats for robustness
            const rawBlueprint = obj.blueprint || obj;
            const message = obj.message || "Updated blueprint based on your feedback.";

            const valid = validateAndSanitize(framework, rawBlueprint);
            if (valid) {
                return { result: valid, message };
            }
             throw new Error("Invalid JSON schema returned");
        } catch (e: any) {
            console.warn("Refinement attempt failed", e);
             attempts++;
             if (attempts < maxAttempts) {
                 messages.push({ role: "system", content: `Error: ${e.message}. Please fix the JSON.` });
             }
        }
    }
    return null;
}
