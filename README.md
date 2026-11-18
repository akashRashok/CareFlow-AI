# CareOps AI Demo

CareOps AI is a polished demo web app showing how AI can assist care coordinators and operations managers with care documentation, claim readiness, roster risk review, invoice mismatch detection, daily priorities, and human-in-the-loop audit trails.

This is a demo product only. It does not make care, medical, legal, payroll, NDIS eligibility, or compliance decisions.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase/PostgreSQL
- Ollama local AI provider by default
- Zod structured output validation
- Recharts dashboard charts

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Start Supabase locally and reset the database:

```bash
supabase start
supabase db reset
```

4. Put the local Supabase values into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>
SUPABASE_SERVICE_ROLE_KEY=<supabase service role key>
```

5. Install and start Ollama:

```bash
ollama pull llama3.1
ollama serve
```

6. Start the app:

```bash
npm run dev
```

7. Seed demo data:

Open [http://localhost:3000/demo-data](http://localhost:3000/demo-data) and click `Seed demo data`.

For hosted Supabase, you can also run the SQL seed directly in the Supabase SQL Editor:

```sql
-- file: supabase/seed.sql
```

8. Open the dashboard:

[http://localhost:3000/dashboard](http://localhost:3000/dashboard)

## Demo Flow

1. Open the dashboard and show the daily operations overview.
2. Open Shift Notes, run AI review on Mary Thompson's messy note, then approve the cleaned note.
3. Open Claim Readiness, run the check, and show deterministic invoice-hours mismatch handling.
4. Open Roster Risks, run the review, and show skill mismatch, missing travel time, and continuity warning.
5. Open Daily Briefing and generate the daily priorities.
6. Open Audit Log to show AI actions and human decisions are tracked.
7. Open AI Settings to show Ollama defaults and provider switching architecture.

## AI Provider Notes

Ollama is the only fully implemented provider for this demo. OpenAI, Gemini, and Anthropic are represented in the provider abstraction and settings UI as future extension points.

Default Ollama settings:

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:latest
```

If the app cannot reach Ollama, start Ollama locally and confirm the base URL. If the model is missing, run:

```bash
ollama pull llama3.1
ollama run llama3.1
```

If `ollama list` shows the model but `/api/chat` still returns `model not found`, the pull likely did not finish verification. Run `ollama pull llama3.1` again and wait for the final success message.
