import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, ClipboardCheck, FileText, Search, ShieldAlert, UserRound, UsersRound } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { SetupWarning } from "@/components/setup-warning";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatDateTime, money } from "@/lib/utils";

type SearchResult = {
  title: string;
  type: "Participant" | "Worker" | "Shift note" | "Claim" | "Roster";
  href: string;
  detail: string;
  meta: string;
};

const typeConfig = {
  Participant: { icon: UserRound, tone: "bg-sky-50 text-sky-700 border-sky-200" },
  Worker: { icon: UsersRound, tone: "bg-violet-50 text-violet-700 border-violet-200" },
  "Shift note": { icon: FileText, tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Claim: { icon: ClipboardCheck, tone: "bg-amber-50 text-amber-700 border-amber-200" },
  Roster: { icon: ShieldAlert, tone: "bg-rose-50 text-rose-700 border-rose-200" }
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader title="Search" description="Connect Supabase to search cloud records." />
        <SetupWarning />
      </>
    );
  }

  const results = query ? await searchSupabase(query) : [];
  const grouped = groupResults(results);

  return (
    <>
      <PageHeader title="Search Records" description="Find Supabase participants, workers, notes, claims, and roster assignments." />

      <Card className="mb-5 p-0">
        <form action="/search" className="flex flex-col gap-3 p-5 md:flex-row md:items-center">
          <div className="flex min-h-12 flex-1 items-center gap-3 rounded-lg border border-border bg-slate-50 px-4">
            <Search className="h-5 w-5 text-slate-500" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search Supabase records..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
            />
          </div>
          <button className="min-h-12 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-indigo-700">Search</button>
        </form>
        <div className="border-t border-border px-5 py-3 text-sm text-muted-foreground">
          {query ? `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"` : "Enter a term to search across connected Supabase records."}
        </div>
      </Card>

      {!query ? <SearchEmptyState /> : null}
      {query && !results.length ? <NoResults query={query} /> : null}

      {Object.entries(grouped).map(([type, items]) => (
        <Card key={type} className="mb-5 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <TypeIcon type={type as SearchResult["type"]} />
              <h2 className="text-lg font-semibold">{type}</h2>
            </div>
            <span className="text-sm text-muted-foreground">{items.length}</span>
          </div>
          <div className="divide-y divide-border">
            {items.map((result) => (
              <SearchRow key={`${result.type}-${result.href}-${result.title}`} result={result} />
            ))}
          </div>
        </Card>
      ))}
    </>
  );
}

function SearchRow({ result }: { result: SearchResult }) {
  return (
    <Link href={result.href} className="grid gap-3 px-5 py-4 hover:bg-slate-50 md:grid-cols-[1fr_180px_32px] md:items-center">
      <div className="min-w-0">
        <p className="truncate font-semibold">{result.title}</p>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{result.detail}</p>
      </div>
      <div className="flex items-center gap-2 md:justify-end">
        <span className="truncate text-sm text-muted-foreground">{result.meta}</span>
      </div>
      <ArrowRight className="hidden h-4 w-4 text-slate-400 md:block" />
    </Link>
  );
}

function SearchEmptyState() {
  return (
    <Card className="p-8 text-center">
      <Search className="mx-auto h-8 w-8 text-slate-400" />
      <h2 className="mt-4 text-lg font-semibold">Search your Supabase records</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        Try a participant name, worker name, service type, or phrase from a support note.
      </p>
    </Card>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <Card className="p-8 text-center">
      <h2 className="text-lg font-semibold">No records found</h2>
      <p className="mt-2 text-sm text-muted-foreground">No Supabase records matched &quot;{query}&quot;. Try a participant, worker, or service type.</p>
    </Card>
  );
}

function TypeIcon({ type }: { type: SearchResult["type"] }) {
  const config = typeConfig[type];
  const Icon = config.icon;
  return (
    <span className={`flex h-9 w-9 items-center justify-center rounded-lg border ${config.tone}`}>
      <Icon className="h-4 w-4" />
    </span>
  );
}

function groupResults(results: SearchResult[]) {
  return results.reduce<Record<string, SearchResult[]>>((groups, result) => {
    groups[result.type] ??= [];
    groups[result.type].push(result);
    return groups;
  }, {});
}

async function searchSupabase(query: string): Promise<SearchResult[]> {
  const supabase = getSupabaseAdmin()!;
  const like = `%${query}%`;
  const [participants, workers, notes, claims, roster] = await Promise.all([
    supabase.from("participants").select("id, full_name, participant_type").ilike("full_name", like).limit(8),
    supabase.from("workers").select("id, full_name, skills").ilike("full_name", like).limit(8),
    supabase.from("shift_notes").select("id, raw_note, service_type, shift_start, participants(full_name)").or(`raw_note.ilike.${like},service_type.ilike.${like}`).limit(8),
    supabase.from("claims").select("id, service_type, invoice_amount, service_date, participants(full_name)").ilike("service_type", like).limit(8),
    supabase
      .from("roster_assignments")
      .select("id, service_type, shift_start, participants(full_name), workers:workers!roster_assignments_worker_id_fkey(full_name)")
      .ilike("service_type", like)
      .limit(8)
  ]);

  return [
    ...(participants.data ?? []).map((item) => ({
      title: item.full_name,
      type: "Participant" as const,
      href: "/dashboard",
      detail: item.participant_type.replace("_", " "),
      meta: "Participant"
    })),
    ...(workers.data ?? []).map((item) => ({
      title: item.full_name,
      type: "Worker" as const,
      href: "/roster-risks",
      detail: (item.skills ?? []).join(", ") || "No skills recorded",
      meta: "Worker"
    })),
    ...(notes.data ?? []).map((item) => ({
      title: relationName(item.participants) ?? "Shift note",
      type: "Shift note" as const,
      href: `/shift-notes/${item.id}`,
      detail: item.raw_note,
      meta: `${item.service_type} · ${formatDateTime(item.shift_start)}`
    })),
    ...(claims.data ?? []).map((item) => ({
      title: relationName(item.participants) ?? "Claim",
      type: "Claim" as const,
      href: `/claims/${item.id}`,
      detail: `${item.service_type} claim for ${money(item.invoice_amount)}`,
      meta: item.service_date
    })),
    ...(roster.data ?? []).map((item) => ({
      title: relationName(item.participants) ?? "Roster assignment",
      type: "Roster" as const,
      href: `/roster-risks/${item.id}`,
      detail: `${relationName(item.workers) ?? "Worker"} assigned for ${item.service_type}`,
      meta: formatDateTime(item.shift_start)
    }))
  ].slice(0, 24);
}

function relationName(value: { full_name?: string } | { full_name?: string }[] | null) {
  if (!value) return null;
  return Array.isArray(value) ? value[0]?.full_name ?? null : value.full_name ?? null;
}
