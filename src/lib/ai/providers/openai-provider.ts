import type { AIClient } from "@/lib/ai/ai-client";

export const openAIProvider: AIClient = {
  async complete() {
    throw new Error("OpenAI provider is configured in the UI but not implemented for this demo build.");
  }
};

