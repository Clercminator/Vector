import type { BaseMessage } from "@langchain/core/messages";

/** Simple agent analytics logger. Logs to console in dev; can be extended for backend/analytics. */

export type AgentNodeName = "consultant" | "ask" | "validator" | "framework_setter" | "tools" | "draft" | "critique" | "user_review";

export interface NodeLogEntry {
  node: AgentNodeName;
  promptChars: number;
  latencyMs: number;
  success: boolean;
  error?: string;
}

const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;

/** Estimate prompt size in chars from messages array. */
export function promptChars(messages: BaseMessage[]): number {
  return messages.reduce((sum, m) => {
    const c = m.content;
    if (typeof c === "string") return sum + c.length;
    if (Array.isArray(c)) return sum + c.map((x: unknown) => String(x)).join("").length;
    return sum + String(c ?? "").length;
  }, 0);
}

/** Log a single prompt string size. */
export function promptCharsFromString(prompt: string): number {
  return prompt.length;
}

export const agentLogger = {
  logNode(entry: NodeLogEntry) {
    if (isDev) {
      const prefix = `[Agent:${entry.node}]`;
      const msg = entry.success
        ? `${prefix} ok | ${entry.promptChars} chars | ${entry.latencyMs}ms`
        : `${prefix} FAIL | ${entry.promptChars} chars | ${entry.latencyMs}ms | ${entry.error}`;
      console.log(msg);
    }
  },

  logEvent(label: string, data?: Record<string, unknown>) {
    if (isDev) {
      console.log(`[Agent] ${label}`, data ?? "");
    }
  },
};
