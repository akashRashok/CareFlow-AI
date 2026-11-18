import { Card, PageHeader } from "@/components/ui";
import { SetupWarning } from "@/components/setup-warning";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function DemoDataPage() {
  const configured = isSupabaseConfigured();
  const counts = configured
    ? await Promise.all([
        getSupabaseAdmin()!.from("participants").select("*", { count: "exact", head: true }),
        getSupabaseAdmin()!.from("workers").select("*", { count: "exact", head: true }),
        getSupabaseAdmin()!.from("shift_notes").select("*", { count: "exact", head: true }),
        getSupabaseAdmin()!.from("claims").select("*", { count: "exact", head: true }),
        getSupabaseAdmin()!.from("roster_assignments").select("*", { count: "exact", head: true })
      ])
    : [];

  return (
    <>
      <PageHeader title="Supabase Data Source" description="CareOps reads live records from the configured Supabase project. This page shows the current cloud data footprint." />
      {!configured ? <SetupWarning /> : null}
      {configured ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="text-lg font-semibold">Connected Supabase project</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The dashboard, review queues, AI workflows, and audit log are populated from Supabase tables. No local in-memory data is used.
            </p>
            <div className="mt-4 rounded-lg border border-border bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              To create or refresh sample cloud records manually, run <code className="rounded bg-white px-1.5 py-1">supabase/seed.sql</code> in the Supabase SQL Editor.
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold">Current records</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              {["Participants", "Workers", "Shift notes", "Claims", "Roster risks"].map((label, index) => (
                <div key={label} className="rounded-md border border-border p-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mt-2 text-2xl font-semibold">{counts[index]?.count ?? 0}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      ) : null}
    </>
  );
}
