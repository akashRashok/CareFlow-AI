"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { aiErrorMessage, completeAI, extractJson } from "@/lib/ai/ai-client";
import { buildClaimReadinessPrompt } from "@/lib/ai/prompts/claim-readiness";
import { buildDailyBriefingPrompt } from "@/lib/ai/prompts/daily-briefing";
import { buildRosterRiskPrompt } from "@/lib/ai/prompts/roster-risk";
import { buildShiftNoteReviewPrompt } from "@/lib/ai/prompts/shift-note-review";
import {
  ClaimReadinessReviewSchema,
  DailyOpsBriefingSchema,
  RosterRiskReviewSchema,
  ShiftNoteAIReviewSchema
} from "@/lib/ai/schemas";
import { getAISettings, writeAuditLog } from "@/lib/data";
import { evaluateClaimRules } from "@/lib/rules/claim-rules";
import { evaluateRosterRules } from "@/lib/rules/roster-rules";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Claim, RosterAssignment, ShiftNote, Worker } from "@/lib/types";

function requireDb() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function completeAndValidate<T>(
  schema: z.ZodSchema<T>,
  messages: Parameters<typeof completeAI>[0],
  normalize?: (value: unknown) => unknown
) {
  const settings = await getAISettings();
  const provider = settings.provider;
  const model = provider === "ollama" ? settings.ollama_model : settings.api_model || settings.ollama_model;
  const baseUrl = provider === "ollama" ? settings.ollama_base_url : settings.api_base_url ?? undefined;
  const result = await completeAI(messages, {
    provider,
    model,
    baseUrl,
    apiKey: settings.api_key ?? undefined,
    temperature: Number(settings.temperature),
    maxTokens: Number(settings.max_tokens),
    responseFormat: settings.structured_output_enabled ? "json" : "text"
  });

  try {
    return { parsed: schema.parse(normalize ? normalize(extractJson(result.text)) : extractJson(result.text)), result };
  } catch (firstError) {
    const repair = await completeAI(
      [
        ...messages,
        { role: "assistant", content: result.text },
        {
          role: "user",
          content: `The previous response failed validation: ${firstError instanceof Error ? firstError.message : String(firstError)}. Return repaired JSON only.`
        }
      ],
      {
        provider,
        model,
        baseUrl,
        apiKey: settings.api_key ?? undefined,
        temperature: 0,
        maxTokens: Number(settings.max_tokens),
        responseFormat: "json"
      }
    );
    return { parsed: schema.parse(normalize ? normalize(extractJson(repair.text)) : extractJson(repair.text)), result: repair };
  }
}

function normalizeRosterRiskReview(value: unknown) {
  if (!value || typeof value !== "object") return value;
  const candidate = value as { alternative_recommendations?: unknown };
  if (!Array.isArray(candidate.alternative_recommendations)) return value;

  return {
    ...candidate,
    alternative_recommendations: candidate.alternative_recommendations.map((item) => {
      if (!item || typeof item !== "object") return item;
      const recommendation = item as Record<string, unknown>;
      return {
        ...recommendation,
        worker_name: typeof recommendation.worker_name === "string" ? recommendation.worker_name : "Unnamed worker",
        reason: typeof recommendation.reason === "string" ? recommendation.reason : "No reason provided by AI.",
        tradeoffs: typeof recommendation.tradeoffs === "string" ? recommendation.tradeoffs : "No tradeoff provided by AI."
      };
    })
  };
}

export async function seedDemoData() {
  const supabase = requireDb();
  await resetDemoData(false);

  const { data: participants, error: participantError } = await supabase
    .from("participants")
    .insert([
      {
        full_name: "Mary Thompson",
        participant_type: "aged_care",
        goals: ["community access", "medication routine", "light mobility"],
        known_risks: ["fatigue", "missed medication", "falls risk"],
        preferences: ["prefers Sarah Lee for medication prompt shifts"]
      },
      {
        full_name: "James Walker",
        participant_type: "ndis",
        goals: ["independent living", "transport support"],
        known_risks: ["anxiety", "missed appointments"],
        preferences: ["prefers calm communication"]
      },
      {
        full_name: "Aisha Khan",
        participant_type: "aged_care",
        goals: ["meal preparation", "personal care", "social connection"],
        known_risks: ["dehydration", "mobility issues"],
        preferences: ["prefers weekday morning support"]
      }
    ])
    .select("*");
  if (participantError) throw participantError;

  const { data: workers, error: workerError } = await supabase
    .from("workers")
    .insert([
      { full_name: "Sarah Lee", skills: ["personal care", "medication prompt", "community access"], availability: ["weekdays"], hourly_cost: 58 },
      { full_name: "Ben Carter", skills: ["transport", "community access"], availability: ["weekends"], hourly_cost: 52 },
      { full_name: "Emily Nguyen", skills: ["personal care", "dementia support", "meal preparation"], availability: ["weekdays"], hourly_cost: 64 }
    ])
    .select("*");
  if (workerError) throw workerError;

  const mary = participants?.find((item) => item.full_name === "Mary Thompson");
  const james = participants?.find((item) => item.full_name === "James Walker");
  const aisha = participants?.find((item) => item.full_name === "Aisha Khan");
  const sarah = workers?.find((item) => item.full_name === "Sarah Lee");
  const ben = workers?.find((item) => item.full_name === "Ben Carter");
  const emily = workers?.find((item) => item.full_name === "Emily Nguyen");
  const today = new Date();
  const shiftStart = new Date(today);
  shiftStart.setHours(9, 0, 0, 0);
  const shiftEnd = new Date(today);
  shiftEnd.setHours(11, 0, 0, 0);

  const { data: notes, error: noteError } = await supabase
    .from("shift_notes")
    .insert([
      {
        participant_id: mary?.id,
        worker_id: sarah?.id,
        shift_start: shiftStart.toISOString(),
        shift_end: shiftEnd.toISOString(),
        service_type: "community access",
        raw_note: "took mary shops today she was tired didnt want to walk much had lunch daughter called not sure if meds taken she seemed ok but slower than usual"
      },
      {
        participant_id: james?.id,
        worker_id: ben?.id,
        shift_start: shiftStart.toISOString(),
        shift_end: shiftEnd.toISOString(),
        service_type: "transport",
        raw_note: "Drove James to appointment. He was anxious at pickup but settled after we confirmed the route and arrival time. Appointment attended."
      },
      {
        participant_id: aisha?.id,
        worker_id: emily?.id,
        shift_start: shiftStart.toISOString(),
        shift_end: shiftEnd.toISOString(),
        service_type: "meal preparation",
        raw_note: "Prepared lunch and checked fluids. Aisha ate most of the meal and asked for a short walk in the garden."
      }
    ])
    .select("*");
  if (noteError) throw noteError;

  await supabase.from("claims").insert([
    {
      participant_id: mary?.id,
      shift_note_id: notes?.[0]?.id,
      service_date: today.toISOString().slice(0, 10),
      service_type: "community access",
      rostered_hours: 2,
      invoice_hours: 3,
      invoice_amount: 174,
      service_agreement_summary: "Community access and support with routines.",
      claim_category: "mock community access"
    },
    {
      participant_id: james?.id,
      shift_note_id: notes?.[1]?.id,
      service_date: today.toISOString().slice(0, 10),
      service_type: "transport",
      rostered_hours: 1.5,
      invoice_hours: 1.5,
      invoice_amount: 78,
      service_agreement_summary: "Transport support for appointments.",
      claim_category: "mock transport"
    }
  ]);

  await supabase.from("roster_assignments").insert([
    {
      participant_id: mary?.id,
      worker_id: ben?.id,
      shift_start: shiftStart.toISOString(),
      shift_end: shiftEnd.toISOString(),
      required_skills: ["medication prompt", "community access"],
      service_type: "community access",
      travel_time_minutes: null,
      estimated_cost: 156,
      usual_worker_id: sarah?.id
    },
    {
      participant_id: aisha?.id,
      worker_id: emily?.id,
      shift_start: shiftStart.toISOString(),
      shift_end: shiftEnd.toISOString(),
      required_skills: ["meal preparation"],
      service_type: "meal preparation",
      travel_time_minutes: 20,
      estimated_cost: 128,
      usual_worker_id: emily?.id
    }
  ]);

  await writeAuditLog({
    action_type: "demo_data_seeded",
    entity_type: "demo_data",
    status: "success",
    details: { participants: participants?.length ?? 0, workers: workers?.length ?? 0 }
  });
  revalidatePath("/");
  redirect("/dashboard");
}

export async function resetDemoData(shouldRedirect = true) {
  const supabase = requireDb();
  await supabase.from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("daily_briefings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("roster_assignments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("claims").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("shift_notes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("workers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("participants").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await writeAuditLog({ action_type: "demo_data_reset", entity_type: "demo_data", status: "success" });
  revalidatePath("/");
  if (shouldRedirect) redirect("/demo-data");
}

export async function resetDemoDataAction() {
  await resetDemoData(true);
}

export async function runShiftNoteReview(formData: FormData) {
  const id = String(formData.get("id"));
  const path = `/shift-notes/${id}`;
  const supabase = requireDb();
  const { data, error } = await supabase.from("shift_notes").select("*, participants(*), workers(*)").eq("id", id).single();
  if (error) fail(path, error.message);
  const note = data as ShiftNote;
  const settings = await getAISettings();
  try {
    const { parsed, result } = await completeAndValidate(ShiftNoteAIReviewSchema, buildShiftNoteReviewPrompt(note));
    await supabase.from("shift_notes").update({ ai_review: parsed, status: "reviewed", updated_at: new Date().toISOString() }).eq("id", id);
    await writeAuditLog({ action_type: "ai_review_generated", entity_type: "shift_note", entity_id: id, provider: result.provider, model: result.model, status: "success", details: parsed });
  } catch (error) {
    await writeAuditLog({ action_type: "ai_review_failed", entity_type: "shift_note", entity_id: id, provider: settings.provider, model: settings.ollama_model, status: "failed", details: { error: String(error) } });
    fail(path, aiErrorMessage(error));
  }
  revalidatePath(path);
  redirect(path);
}

export async function approveShiftNote(formData: FormData) {
  const id = String(formData.get("id"));
  const approved_note = String(formData.get("approved_note") ?? "");
  const supabase = requireDb();
  await supabase.from("shift_notes").update({ approved_note, status: "approved", updated_at: new Date().toISOString() }).eq("id", id);
  await writeAuditLog({ action_type: "user_approved", entity_type: "shift_note", entity_id: id, status: "success", details: { edited: true } });
  revalidatePath(`/shift-notes/${id}`);
  redirect(`/shift-notes/${id}`);
}

export async function rejectShiftNote(formData: FormData) {
  const id = String(formData.get("id"));
  const reason = String(formData.get("reason") ?? "");
  const supabase = requireDb();
  await supabase.from("shift_notes").update({ rejection_reason: reason, status: "rejected", updated_at: new Date().toISOString() }).eq("id", id);
  await writeAuditLog({ action_type: "user_rejected", entity_type: "shift_note", entity_id: id, status: "success", details: { reason } });
  revalidatePath(`/shift-notes/${id}`);
  redirect(`/shift-notes/${id}`);
}

export async function runClaimReadiness(formData: FormData) {
  const id = String(formData.get("id"));
  const path = `/claims/${id}`;
  const supabase = requireDb();
  const { data, error } = await supabase.from("claims").select("*, participants(*), shift_notes(*)").eq("id", id).single();
  if (error) fail(path, error.message);
  const claim = data as Claim;
  const deterministic = evaluateClaimRules(claim);
  const settings = await getAISettings();
  try {
    const { parsed, result } = await completeAndValidate(ClaimReadinessReviewSchema, buildClaimReadinessPrompt(claim, deterministic));
    const merged = ClaimReadinessReviewSchema.parse({
      ...parsed,
      issues: [...deterministic, ...parsed.issues],
      readiness_status: deterministic.some((issue) => issue.severity === "high") ? "not_ready" : parsed.readiness_status,
      human_review_required: deterministic.length > 0 || parsed.human_review_required
    });
    await supabase.from("claims").update({ ai_review: merged, status: merged.readiness_status, updated_at: new Date().toISOString() }).eq("id", id);
    await writeAuditLog({ action_type: "ai_review_generated", entity_type: "claim", entity_id: id, provider: result.provider, model: result.model, status: "success", details: merged });
  } catch (error) {
    await writeAuditLog({ action_type: "ai_review_failed", entity_type: "claim", entity_id: id, provider: settings.provider, model: settings.ollama_model, status: "failed", details: { error: String(error), deterministic } });
    fail(path, aiErrorMessage(error));
  }
  revalidatePath(path);
  redirect(path);
}

export async function updateClaimStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const supabase = requireDb();
  await supabase.from("claims").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  await writeAuditLog({ action_type: status === "rejected" ? "user_rejected" : "user_approved", entity_type: "claim", entity_id: id, status: "success", details: { status } });
  revalidatePath(`/claims/${id}`);
  redirect(`/claims/${id}`);
}

export async function runRosterRiskReview(formData: FormData) {
  const id = String(formData.get("id"));
  const path = `/roster-risks/${id}`;
  const supabase = requireDb();
  const { data, error } = await supabase
    .from("roster_assignments")
    .select("*, participants(*), workers:workers!roster_assignments_worker_id_fkey(*), usual_worker:workers!roster_assignments_usual_worker_id_fkey(*)")
    .eq("id", id)
    .single();
  if (error) fail(path, error.message);
  const assignment = data as RosterAssignment;
  const { data: workerRows } = await supabase.from("workers").select("*").order("full_name");
  const workers = (workerRows ?? []) as Worker[];
  const deterministic = evaluateRosterRules(assignment, workers);
  const settings = await getAISettings();
  try {
    const { parsed, result } = await completeAndValidate(RosterRiskReviewSchema, buildRosterRiskPrompt(assignment, deterministic, workers), normalizeRosterRiskReview);
    const deterministicKeys = new Set(deterministic.map((risk) => `${risk.risk_type}:${risk.evidence}`));
    const aiOnlyRisks = parsed.risks.filter((risk) => !deterministicKeys.has(`${risk.risk_type}:${risk.evidence}`));
    const merged = RosterRiskReviewSchema.parse({
      ...parsed,
      risks: aiOnlyRisks,
      overall_risk: deterministic.some((risk) => risk.severity === "high") ? "high" : parsed.overall_risk,
      human_review_required: deterministic.length > 0 || parsed.human_review_required
    });
    await supabase.from("roster_assignments").update({ ai_review: merged, status: "reviewed", updated_at: new Date().toISOString() }).eq("id", id);
    await writeAuditLog({ action_type: "ai_review_generated", entity_type: "roster_assignment", entity_id: id, provider: result.provider, model: result.model, status: "success", details: merged });
  } catch (error) {
    await writeAuditLog({ action_type: "ai_review_failed", entity_type: "roster_assignment", entity_id: id, provider: settings.provider, model: settings.ollama_model, status: "failed", details: { error: String(error), deterministic } });
    fail(path, aiErrorMessage(error));
  }
  revalidatePath(path);
  redirect(path);
}

export async function updateRosterStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const supabase = requireDb();
  await supabase.from("roster_assignments").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  await writeAuditLog({ action_type: status === "dismissed" ? "user_dismissed" : "user_approved", entity_type: "roster_assignment", entity_id: id, status: "success", details: { status } });
  revalidatePath(`/roster-risks/${id}`);
  redirect(`/roster-risks/${id}`);
}

export async function generateDailyBriefing() {
  const supabase = requireDb();
  const path = "/briefing";
  const [notes, claims, roster] = await Promise.all([
    supabase.from("shift_notes").select("id, status, raw_note, participants(full_name)").neq("status", "approved"),
    supabase.from("claims").select("id, status, service_type, invoice_hours, rostered_hours, participants(full_name)").neq("status", "ready"),
    supabase
      .from("roster_assignments")
      .select("id, status, service_type, required_skills, participants(full_name), workers:workers!roster_assignments_worker_id_fkey(full_name), usual_worker:workers!roster_assignments_usual_worker_id_fkey(full_name)")
      .neq("status", "approved")
  ]);
  const settings = await getAISettings();
  try {
    const { parsed, result } = await completeAndValidate(
      DailyOpsBriefingSchema,
      buildDailyBriefingPrompt({ shift_notes: notes.data ?? [], claims: claims.data ?? [], roster_risks: roster.data ?? [] })
    );
    await supabase.from("daily_briefings").insert({ ai_output: parsed, provider: result.provider, model: result.model });
    await writeAuditLog({ action_type: "ai_review_generated", entity_type: "daily_briefing", provider: result.provider, model: result.model, status: "success", details: parsed });
  } catch (error) {
    await writeAuditLog({ action_type: "ai_review_failed", entity_type: "daily_briefing", provider: settings.provider, model: settings.ollama_model, status: "failed", details: { error: String(error) } });
    fail(path, aiErrorMessage(error));
  }
  revalidatePath(path);
  redirect(path);
}

export async function saveAISettings(formData: FormData) {
  const supabase = requireDb();
  const current = await getAISettings();
  const payload = {
    provider: String(formData.get("provider")),
    ollama_base_url: String(formData.get("ollama_base_url")),
    ollama_model: String(formData.get("ollama_model")),
    api_base_url: String(formData.get("api_base_url") || ""),
    api_key: String(formData.get("api_key") || ""),
    api_model: String(formData.get("api_model") || ""),
    temperature: Number(formData.get("temperature") || 0.2),
    max_tokens: Number(formData.get("max_tokens") || 1200),
    structured_output_enabled: formData.get("structured_output_enabled") === "on",
    updated_at: new Date().toISOString()
  };
  if (current.id === "local") {
    await supabase.from("ai_settings").insert(payload);
  } else {
    await supabase.from("ai_settings").update(payload).eq("id", current.id);
  }
  await writeAuditLog({ action_type: "provider_setting_changed", entity_type: "ai_settings", entity_id: current.id === "local" ? null : current.id, provider: payload.provider, model: payload.ollama_model || payload.api_model, status: "success" });
  revalidatePath("/settings/ai");
  redirect("/settings/ai?saved=1");
}

export async function testAIProvider() {
  const path = "/settings/ai";
  let provider = "";
  let model = "";
  try {
    const { result } = await completeAndValidate(
      z.object({ ok: z.boolean(), message: z.string() }),
      [
        { role: "system", content: "Return only valid JSON." },
        { role: "user", content: `Return {"ok":true,"message":"Provider connection succeeded."}` }
      ]
    );
    provider = result.provider;
    model = result.model;
  } catch (error) {
    await writeAuditLog({ action_type: "provider_test_failed", entity_type: "ai_settings", status: "failed", details: { error: String(error) } });
    fail(path, aiErrorMessage(error));
  }
  await writeAuditLog({ action_type: "provider_tested", entity_type: "ai_settings", provider, model, status: "success" });
  redirect(`${path}?tested=1`);
}

export async function demoLogin() {
  redirect("/dashboard");
}
