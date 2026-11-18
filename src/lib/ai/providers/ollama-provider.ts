import type { AIClient } from "@/lib/ai/ai-client";

export const ollamaProvider: AIClient = {
  async complete(messages, options) {
    const baseUrl = (options.baseUrl ?? "http://localhost:11434").replace(/\/$/, "");
    const model = options.model.includes(":") ? options.model : `${options.model}:latest`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          format: options.responseFormat === "json" ? "json" : undefined,
          options: {
            temperature: options.temperature ?? 0.2,
            num_predict: options.maxTokens ?? 1200
          }
        }),
        signal: controller.signal
      });

      const raw = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(raw?.error ?? `Ollama request failed with ${response.status}`);
      }

      return {
        text: raw?.message?.content ?? "",
        raw,
        provider: "ollama",
        model
      };
    } finally {
      clearTimeout(timeout);
    }
  }
};
