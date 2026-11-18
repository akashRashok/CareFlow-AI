create extension if not exists "pgcrypto";

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  participant_type text not null check (participant_type in ('aged_care', 'ndis')),
  goals text[] default '{}',
  known_risks text[] default '{}',
  preferences text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists workers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  skills text[] default '{}',
  availability text[] default '{}',
  hourly_cost numeric,
  created_at timestamptz default now()
);

create table if not exists shift_notes (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) on delete cascade,
  worker_id uuid references workers(id) on delete set null,
  shift_start timestamptz not null,
  shift_end timestamptz not null,
  service_type text not null,
  raw_note text not null,
  ai_review jsonb,
  approved_note text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) on delete cascade,
  shift_note_id uuid references shift_notes(id) on delete set null,
  service_date date not null,
  service_type text not null,
  rostered_hours numeric not null,
  invoice_hours numeric not null,
  invoice_amount numeric not null,
  service_agreement_summary text,
  claim_category text,
  ai_review jsonb,
  status text not null default 'pending' check (status in ('pending', 'ready', 'needs_review', 'not_ready', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists roster_assignments (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) on delete cascade,
  worker_id uuid references workers(id) on delete set null,
  shift_start timestamptz not null,
  shift_end timestamptz not null,
  required_skills text[] default '{}',
  service_type text not null,
  travel_time_minutes integer,
  estimated_cost numeric,
  usual_worker_id uuid references workers(id) on delete set null,
  ai_review jsonb,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'approved', 'dismissed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists daily_briefings (
  id uuid primary key default gen_random_uuid(),
  briefing_date date not null default current_date,
  ai_output jsonb not null,
  provider text,
  model text,
  created_at timestamptz default now()
);

create table if not exists ai_settings (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'ollama',
  ollama_base_url text not null default 'http://localhost:11434',
  ollama_model text not null default 'llama3.1:latest',
  api_base_url text,
  api_key text,
  api_model text,
  temperature numeric not null default 0.2,
  max_tokens integer not null default 1200,
  structured_output_enabled boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  action_type text not null,
  entity_type text not null,
  entity_id uuid,
  provider text,
  model text,
  status text not null,
  details jsonb,
  created_at timestamptz default now()
);

create index if not exists shift_notes_status_idx on shift_notes(status);
create index if not exists claims_status_idx on claims(status);
create index if not exists roster_assignments_status_idx on roster_assignments(status);
create index if not exists audit_logs_created_at_idx on audit_logs(created_at desc);
