-- CareOps AI demo seed data for Supabase SQL Editor.
-- Run after applying supabase/migrations/202606140001_careops_schema.sql.

begin;

delete from audit_logs;
delete from daily_briefings;
delete from roster_assignments;
delete from claims;
delete from shift_notes;
delete from workers;
delete from participants;
delete from ai_settings;

with
inserted_participants as (
  insert into participants (full_name, participant_type, goals, known_risks, preferences)
  values
    ('Mary Thompson', 'aged_care', array['community access', 'medication routine', 'light mobility'], array['fatigue', 'missed medication', 'falls risk'], array['prefers Sarah Lee for medication prompt shifts']),
    ('James Walker', 'ndis', array['independent living', 'transport support'], array['anxiety', 'missed appointments'], array['prefers calm communication']),
    ('Aisha Khan', 'aged_care', array['meal preparation', 'personal care', 'social connection'], array['dehydration', 'mobility issues'], array['prefers weekday morning support'])
  returning id, full_name
),
inserted_workers as (
  insert into workers (full_name, skills, availability, hourly_cost)
  values
    ('Sarah Lee', array['personal care', 'medication prompt', 'community access'], array['weekdays'], 58),
    ('Ben Carter', array['transport', 'community access'], array['weekends'], 52),
    ('Emily Nguyen', array['personal care', 'dementia support', 'meal preparation'], array['weekdays'], 64)
  returning id, full_name
),
inserted_shift_notes as (
  insert into shift_notes (participant_id, worker_id, shift_start, shift_end, service_type, raw_note)
  values
    (
      (select id from inserted_participants where full_name = 'Mary Thompson'),
      (select id from inserted_workers where full_name = 'Sarah Lee'),
      date_trunc('day', now()) + interval '9 hours',
      date_trunc('day', now()) + interval '11 hours',
      'community access',
      'took mary shops today she was tired didnt want to walk much had lunch daughter called not sure if meds taken she seemed ok but slower than usual'
    ),
    (
      (select id from inserted_participants where full_name = 'James Walker'),
      (select id from inserted_workers where full_name = 'Ben Carter'),
      date_trunc('day', now()) + interval '10 hours',
      date_trunc('day', now()) + interval '11 hours 30 minutes',
      'transport',
      'Drove James to appointment. He was anxious at pickup but settled after we confirmed the route and arrival time. Appointment attended.'
    ),
    (
      (select id from inserted_participants where full_name = 'Aisha Khan'),
      (select id from inserted_workers where full_name = 'Emily Nguyen'),
      date_trunc('day', now()) + interval '12 hours',
      date_trunc('day', now()) + interval '14 hours',
      'meal preparation',
      'Prepared lunch and checked fluids. Aisha ate most of the meal and asked for a short walk in the garden.'
    )
  returning id, participant_id, service_type
),
inserted_claims as (
  insert into claims (
    participant_id,
    shift_note_id,
    service_date,
    service_type,
    rostered_hours,
    invoice_hours,
    invoice_amount,
    service_agreement_summary,
    claim_category
  )
  values
    (
      (select id from inserted_participants where full_name = 'Mary Thompson'),
      (select id from inserted_shift_notes where service_type = 'community access'),
      current_date,
      'community access',
      2,
      3,
      174,
      'Community access and support with routines.',
      'mock community access'
    ),
    (
      (select id from inserted_participants where full_name = 'James Walker'),
      (select id from inserted_shift_notes where service_type = 'transport'),
      current_date,
      'transport',
      1.5,
      1.5,
      78,
      'Transport support for appointments.',
      'mock transport'
    )
  returning id
),
inserted_roster as (
  insert into roster_assignments (
    participant_id,
    worker_id,
    shift_start,
    shift_end,
    required_skills,
    service_type,
    travel_time_minutes,
    estimated_cost,
    usual_worker_id
  )
  values
    (
      (select id from inserted_participants where full_name = 'Mary Thompson'),
      (select id from inserted_workers where full_name = 'Ben Carter'),
      date_trunc('day', now()) + interval '9 hours',
      date_trunc('day', now()) + interval '11 hours',
      array['medication prompt', 'community access'],
      'community access',
      null,
      156,
      (select id from inserted_workers where full_name = 'Sarah Lee')
    ),
    (
      (select id from inserted_participants where full_name = 'Aisha Khan'),
      (select id from inserted_workers where full_name = 'Emily Nguyen'),
      date_trunc('day', now()) + interval '12 hours',
      date_trunc('day', now()) + interval '14 hours',
      array['meal preparation'],
      'meal preparation',
      20,
      128,
      (select id from inserted_workers where full_name = 'Emily Nguyen')
    )
  returning id
),
inserted_settings as (
  insert into ai_settings (
    provider,
    ollama_base_url,
    ollama_model,
    temperature,
    max_tokens,
    structured_output_enabled
  )
  values ('ollama', 'http://localhost:11434', 'llama3.1:latest', 0.2, 1200, true)
  returning id
)
insert into audit_logs (action_type, entity_type, status, details)
values (
  'demo_data_seeded',
  'demo_data',
  'success',
  jsonb_build_object(
    'participants', (select count(*) from inserted_participants),
    'workers', (select count(*) from inserted_workers),
    'shift_notes', (select count(*) from inserted_shift_notes),
    'claims', (select count(*) from inserted_claims),
    'roster_assignments', (select count(*) from inserted_roster),
    'ai_settings', (select count(*) from inserted_settings)
  )
);

commit;
