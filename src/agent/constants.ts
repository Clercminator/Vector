/** Max refinement steps before forcing draft generation. */
export const MAX_STEPS_BEFORE_DRAFT = 10;

/** Max messages to keep in context when invoking the LLM (ask and consultant nodes). */
export const MESSAGE_WINDOW_SIZE = 20;

/** Max validation attempts for rough-draft JSON before giving up and stripping the block. */
export const MAX_VALIDATION_ATTEMPTS = 2;

/** After one failed critique, we allow one retry (draft → critique → draft). */
export const MAX_CRITIQUE_RETRIES = 1;

/** Max character length of conversation history passed to the draft prompt (avoids context overflow). */
export const DRAFT_HISTORY_MAX_CHARS = 12_000;

/** Short reply when the user sends an empty message (no LLM call). Keys match state.language. */
export const EMPTY_MESSAGE_REPLY: Record<string, string> = {
  en: "Please type your goal or a few words so I can help you build a plan.",
  es: "Escribe tu objetivo o unas palabras para poder ayudarte a construir un plan.",
  fr: "Écrivez votre objectif ou quelques mots pour que je puisse vous aider à construire un plan.",
  de: "Bitte schreiben Sie Ihr Ziel oder ein paar Wörter, damit ich Ihnen bei der Planerstellung helfen kann.",
  pt: "Digite seu objetivo ou algumas palavras para que eu possa ajudá-lo a construir um plano.",
};
export function getEmptyMessageReply(lang: string): string {
  return EMPTY_MESSAGE_REPLY[lang] ?? EMPTY_MESSAGE_REPLY.en;
}

/** Max character length for a single user message; beyond this we ask to shorten (no LLM call). */
export const MAX_USER_MESSAGE_CHARS = 8_000;

/** Reply when the user message is too long. Keys match state.language. */
export const LONG_MESSAGE_REPLY: Record<string, string> = {
  en: "Your message is quite long. Please summarize your goal in a few sentences so I can help you best.",
  es: "Tu mensaje es bastante largo. Resumamos tu objetivo en unas frases para poder ayudarte mejor.",
  fr: "Votre message est assez long. Résumez votre objectif en quelques phrases pour que je puisse vous aider au mieux.",
  de: "Ihre Nachricht ist recht lang. Bitte fassen Sie Ihr Ziel in ein paar Sätzen zusammen.",
  pt: "Sua mensagem é longa. Resuma seu objetivo em algumas frases para que eu possa ajudá-lo melhor.",
};
export function getLongMessageReply(lang: string): string {
  return LONG_MESSAGE_REPLY[lang] ?? LONG_MESSAGE_REPLY.en;
}
