import type { AISettings } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function getAISettings(): Promise<AISettings> {
  const supabase = getSupabaseAdmin();
  const fallback = {
    id: "local",
    provider: (process.env.DEFAULT_AI_PROVIDER as AISettings["provider"]) ?? "ollama",
    ollama_base_url: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    ollama_model: process.env.OLLAMA_MODEL ?? "llama3.1:latest",
    api_base_url: process.env.OPENAI_BASE_URL ?? null,
    api_key: null,
    api_model: process.env.OPENAI_MODEL ?? null,
    temperature: 0.2,
    max_tokens: 1200,
    structured_output_enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (!supabase) return fallback;
  const { data, error } = await supabase.from("ai_settings").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (error) throw error;
  if (data) return data as AISettings;
  const { data: inserted, error: insertError } = await supabase.from("ai_settings").insert({}).select("*").single();
  if (insertError) throw insertError;
  return inserted as AISettings;
}

export async function writeAuditLog(input: {
  action_type: string;
  entity_type: string;
  entity_id?: string | null;
  provider?: string | null;
  model?: string | null;
  status: string;
  details?: unknown;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase.from("audit_logs").insert({
    action_type: input.action_type,
    entity_type: input.entity_type,
    entity_id: input.entity_id ?? null,
    provider: input.provider ?? null,
    model: input.model ?? null,
    status: input.status,
    details: input.details ?? null
  });
}
