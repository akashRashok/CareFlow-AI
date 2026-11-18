"use client";

import { useState } from "react";
import type { saveAISettings, testAIProvider } from "@/app/actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { Badge, Card, Field, inputClass } from "@/components/ui";
import type { AISettings } from "@/lib/types";

type Provider = AISettings["provider"];

const providerCopy: Record<Provider, { title: string; description: string; badge: string }> = {
  ollama: {
    title: "Local Ollama",
    description: "Runs AI reviews locally through Ollama. Recommended for this demo.",
    badge: "Recommended"
  },
  openai: {
    title: "OpenAI API",
    description: "Uses an external OpenAI-compatible API endpoint. Placeholder provider in this demo.",
    badge: "API"
  },
  gemini: {
    title: "Gemini API",
    description: "Uses a Gemini API model. Placeholder provider in this demo.",
    badge: "API"
  },
  anthropic: {
    title: "Anthropic API",
    description: "Uses an Anthropic API model. Placeholder provider in this demo.",
    badge: "API"
  }
};

export function AISettingsForm({
  settings,
  saveAction,
  testAction
}: {
  settings: AISettings;
  saveAction: typeof saveAISettings;
  testAction: typeof testAIProvider;
}) {
  const [provider, setProvider] = useState<Provider>(settings.provider);
  const copy = providerCopy[provider];
  const isOllama = provider === "ollama";

  return (
    <>
      <form action={saveAction} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-6">
          <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{copy.title}</h2>
                <Badge tone={isOllama ? "good" : "warn"}>{copy.badge}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.description}</p>
            </div>
            <Badge tone={isOllama ? "good" : "neutral"}>{provider}</Badge>
          </div>

          <Field label="Provider mode">
            <select name="provider" value={provider} onChange={(event) => setProvider(event.target.value as Provider)} className={inputClass}>
              <option value="ollama">Local Ollama</option>
              <option value="openai">OpenAI API</option>
              <option value="gemini">Gemini API</option>
              <option value="anthropic">Anthropic API</option>
            </select>
          </Field>

          {isOllama ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Ollama URL">
                  <input name="ollama_base_url" defaultValue={settings.ollama_base_url} placeholder="http://localhost:11434" className={inputClass} />
                </Field>
                <Field label="Ollama model">
                  <input name="ollama_model" defaultValue={settings.ollama_model} placeholder="llama3.1:latest" className={inputClass} />
                </Field>
              </div>

              <input type="hidden" name="api_base_url" value={settings.api_base_url ?? ""} />
              <input type="hidden" name="api_key" value={settings.api_key ?? ""} />
              <input type="hidden" name="api_model" value={settings.api_model ?? ""} />

              <div className="rounded-lg border border-border bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                <p className="font-semibold">Local setup checklist</p>
                <p className="mt-1">1. Start Ollama. 2. Pull the model. 3. Click Test provider.</p>
                <code className="mt-3 block rounded bg-white px-3 py-2 text-xs">ollama pull llama3.1</code>
                <code className="mt-2 block rounded bg-white px-3 py-2 text-xs">ollama run llama3.1</code>
              </div>
            </>
          ) : (
            <>
              <input type="hidden" name="ollama_base_url" value={settings.ollama_base_url} />
              <input type="hidden" name="ollama_model" value={settings.ollama_model} />
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                External API providers are selectable and saved, but their provider implementations are placeholders in this demo build.
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="API base URL">
                  <input name="api_base_url" defaultValue={settings.api_base_url ?? ""} placeholder="https://api.openai.com/v1" className={inputClass} />
                </Field>
                <Field label="API model">
                  <input name="api_model" defaultValue={settings.api_model ?? ""} placeholder="gpt-4o-mini" className={inputClass} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="API key">
                    <input name="api_key" type="password" defaultValue={settings.api_key ?? ""} placeholder="Stored server-side only" className={inputClass} />
                  </Field>
                </div>
              </div>
            </>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold">Output controls</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Conservative defaults keep demo responses structured, short, and easier to review.</p>
            <div className="mt-5 space-y-4">
              <Field label="Temperature">
                <input name="temperature" type="number" step="0.1" min="0" max="2" defaultValue={settings.temperature} className={inputClass} />
              </Field>
              <Field label="Maximum tokens">
                <input name="max_tokens" type="number" min="128" max="8000" defaultValue={settings.max_tokens} className={inputClass} />
              </Field>
              <label className="flex items-start gap-3 rounded-lg border border-border bg-white p-3 text-sm">
                <input type="checkbox" name="structured_output_enabled" defaultChecked={settings.structured_output_enabled} className="mt-1" />
                <span>
                  <span className="block font-medium">Structured JSON output</span>
                  <span className="mt-1 block text-muted-foreground">Required for validating AI reviews before saving them.</span>
                </span>
              </label>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold">Save and test</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Save changes first, then test the active provider connection.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <PendingSubmitButton pendingText="Saving settings...">Save settings</PendingSubmitButton>
            </div>
          </Card>
        </div>
      </form>

      <form action={testAction} className="mt-4">
        <PendingSubmitButton variant="secondary" pendingText="Testing provider...">Test provider connection</PendingSubmitButton>
      </form>
    </>
  );
}
