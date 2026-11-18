export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Participant = {
  id: string;
  full_name: string;
  participant_type: "aged_care" | "ndis";
  goals: string[];
  known_risks: string[];
  preferences: string[];
  created_at: string;
};

export type Worker = {
  id: string;
  full_name: string;
  skills: string[];
  availability: string[];
  hourly_cost: number;
  created_at: string;
};

export type ShiftNote = {
  id: string;
  participant_id: string;
  worker_id: string | null;
  shift_start: string;
  shift_end: string;
  service_type: string;
  raw_note: string;
  ai_review: Json | null;
  approved_note: string | null;
  status: "pending" | "reviewed" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  participants?: Participant | null;
  workers?: Worker | null;
};

export type Claim = {
  id: string;
  participant_id: string;
  shift_note_id: string | null;
  service_date: string;
  service_type: string;
  rostered_hours: number;
  invoice_hours: number;
  invoice_amount: number;
  service_agreement_summary: string | null;
  claim_category: string | null;
  ai_review: Json | null;
  status: "pending" | "ready" | "needs_review" | "not_ready" | "rejected";
  created_at: string;
  updated_at: string;
  participants?: Participant | null;
  shift_notes?: ShiftNote | null;
};

export type RosterAssignment = {
  id: string;
  participant_id: string;
  worker_id: string | null;
  shift_start: string;
  shift_end: string;
  required_skills: string[];
  service_type: string;
  travel_time_minutes: number | null;
  estimated_cost: number | null;
  usual_worker_id: string | null;
  ai_review: Json | null;
  status: "pending" | "reviewed" | "approved" | "dismissed";
  created_at: string;
  updated_at: string;
  participants?: Participant | null;
  workers?: Worker | null;
  usual_worker?: Worker | null;
};

export type AISettings = {
  id: string;
  provider: "ollama" | "openai" | "gemini" | "anthropic";
  ollama_base_url: string;
  ollama_model: string;
  api_base_url: string | null;
  api_key: string | null;
  api_model: string | null;
  temperature: number;
  max_tokens: number;
  structured_output_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type AuditLog = {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  provider: string | null;
  model: string | null;
  status: string;
  details: Json | null;
  created_at: string;
};

