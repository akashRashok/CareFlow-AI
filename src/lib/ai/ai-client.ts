import { anthropicProvider } from "@/lib/ai/providers/anthropic-provider";
import { geminiProvider } from "@/lib/ai/providers/gemini-provider";
import { ollamaProvider } from "@/lib/ai/providers/ollama-provider";
import { openAIProvider } from "@/lib/ai/providers/openai-provider";

export type AIProvider = "ollama" | "openai" | "gemini" | "anthropic";

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AICompletionOptions = {
  provider: AIProvider;
  model: string;
  baseUrl?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json" | "text";
};

export type AICompletionResult = {
  text: string;
  raw?: unknown;
  provider: AIProvider;
  model: string;
};

export interface AIClient {
  complete(messages: AIMessage[], options: AICompletionOptions): Promise<AICompletionResult>;
}

const providers: Record<AIProvider, AIClient> = {
  ollama: ollamaProvider,
  openai: openAIProvider,
  gemini: geminiProvider,
  anthropic: anthropicProvider
};

export async function completeAI(messages: AIMessage[], options: AICompletionOptions) {
  return providers[options.provider].complete(messages, options);
}

export function extractJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) return JSON.parse(fenced[1]);
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first >= 0 && last > first) return JSON.parse(text.slice(first, last + 1));
    throw new Error("AI response did not contain valid JSON.");
  }
}

export function aiErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|terminated|timeout/i.test(message)) {
    return "Ollama is not reachable. Start Ollama locally and confirm the base URL.";
  }
  if (/model.*not.*found|not found/i.test(message)) {
    return "Model not found or not runnable. Run: ollama pull llama3.1, wait for it to finish, then confirm with: ollama run llama3.1";
  }
  if (/valid JSON|validation/i.test(message)) {
    return "AI response could not be validated. Try again or switch model.";
  }
  return message;
}
