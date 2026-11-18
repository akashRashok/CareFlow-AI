import type { AIClient } from "@/lib/ai/ai-client";

export const anthropicProvider: AIClient = {
  async complete() {
    throw new Error("Anthropic provider is configured in the UI but not implemented for this demo build.");
  }
};

