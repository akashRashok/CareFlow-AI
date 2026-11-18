import type { AIClient } from "@/lib/ai/ai-client";

export const geminiProvider: AIClient = {
  async complete() {
    throw new Error("Gemini provider is configured in the UI but not implemented for this demo build.");
  }
};

