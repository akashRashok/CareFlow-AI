import { Card, LinkButton, PageHeader } from "@/components/ui";
import { SetupWarning } from "@/components/setup-warning";
import { StatusBadge } from "@/components/status";
import { formatDateTime, money } from "@/lib/utils";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import type { RosterAssignment } from "@/lib/types";

export default async function RosterRisksPage() {
  if (!isSupabaseConfigured()) return <><PageHeader title="Roster Risk Review" /><SetupWarning /></>;
  const { data } = await getSupabaseAdmin()!
    .from("roster_assignments")
    .select("*, participants(full_name), workers:workers!roster_assignments_worker_id_fkey(full_name), usual_worker:workers!roster_assignments_usual_worker_id_fkey(full_name)")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as RosterAssignment[];
  return (
    <>
      <PageHeader title="Roster Risk Review" description="Review roster assignments for availability, skill match, continuity, travel time, overtime, and cost risk." />
      <div className="grid gap-4">
        {rows.map((row) => (
          <Card key={row.id}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{row.participants?.full_name}</h2>
                  <StatusBadge value={row.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{row.workers?.full_name} · {row.service_type} · {formatDateTime(row.shift_start)}</p>
                <p className="mt-3 text-sm">Required: {row.required_skills.join(", ")} · Cost {money(row.estimated_cost)}</p>
              </div>
              <LinkButton href={`/roster-risks/${row.id}`}>Open risk</LinkButton>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
