import type React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileText, ListTodo, MessageSquareText, ShieldAlert, Users } from "lucide-react";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { SetupWarning } from "@/components/setup-warning";
import { StatusBadge } from "@/components/status";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Claim, RosterAssignment, ShiftNote } from "@/lib/types";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader title="Daily Operations Dashboard" description="Connect Supabase, then review today's operational priorities from cloud records." />
        <SetupWarning />
      </>
    );
  }

  const supabase = getSupabaseAdmin()!;
  const [participants, notes, claims, roster] = await Promise.all([
    supabase.from("participants").select("*", { count: "exact", head: true }),
    supabase.from("shift_notes").select("*, participants(full_name), workers(full_name)").neq("status", "approved").limit(8),
    supabase.from("claims").select("*, participants(full_name), shift_notes(raw_note)").neq("status", "ready").limit(8),
    supabase
      .from("roster_assignments")
      .select("*, participants(full_name), workers:workers!roster_assignments_worker_id_fkey(full_name), usual_worker:workers!roster_assignments_usual_worker_id_fkey(full_name)")
      .neq("status", "approved")
      .limit(8)
  ]);

  const noteRows = (notes.data ?? []) as ShiftNote[];
  const claimRows = (claims.data ?? []) as Claim[];
  const rosterRows = (roster.data ?? []) as RosterAssignment[];
  const operations = [
    ...noteRows.map((note) => ({
      href: `/shift-notes/${note.id}`,
      title: note.raw_note,
      owner: note.participants?.full_name ?? "Documentation",
      category: "Shift note",
      status: note.status,
      icon: <MessageSquareText />
    })),
    ...claimRows.map((claim) => ({
      href: `/claims/${claim.id}`,
      title: `${claim.service_type}: ${claim.invoice_hours} invoiced / ${claim.rostered_hours} rostered`,
      owner: claim.participants?.full_name ?? "Finance",
      category: "Claim",
      status: claim.status,
      icon: <ClipboardCheck />
    })),
    ...rosterRows.map((item) => ({
      href: `/roster-risks/${item.id}`,
      title: `${item.workers?.full_name ?? "Worker"} assigned for ${item.service_type}`,
      owner: item.participants?.full_name ?? "Rostering",
      category: "Roster",
      status: item.status,
      icon: <ShieldAlert />
    }))
  ];

  return (
    <>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-lg text-muted-foreground">
            {new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
          </p>
          <h1 className="mt-3 text-5xl font-semibold tracking-tight text-slate-950">Good Evening, Coordinator,</h1>
          <div className="mt-7 inline-flex flex-wrap items-center gap-5 rounded-full border border-border bg-white px-6 py-4 shadow-soft">
            <Metric title="Participants" value={participants.count ?? 0} icon={<Users />} />
            <Divider />
            <Metric title="Notes Review" value={noteRows.length} icon={<FileText />} />
            <Divider />
            <Metric title="Claim Warnings" value={claimRows.length} icon={<ClipboardCheck />} />
            <Divider />
            <Metric title="Roster Risks" value={rosterRows.length} icon={<ShieldAlert />} />
          </div>
        </div>
        <div className="mt-2 flex gap-3">
          <LinkButton href="/briefing" variant="secondary">Generate Briefing</LinkButton>
          <LinkButton href="/shift-notes">Review Notes</LinkButton>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <ListTodo className="h-6 w-6" />
            <h2 className="text-2xl font-semibold">Operations Queue</h2>
            <span className="rounded-lg border border-border px-3 py-2 text-sm font-medium">{operations.length} open</span>
          </div>
          <Link href="/audit-log" className="rounded-full bg-slate-50 px-5 py-3 text-sm font-semibold hover:bg-slate-100">Audit Log</Link>
        </div>
        <div className="grid grid-cols-12 border-b border-border bg-slate-50/70 px-6 py-4 text-sm font-semibold text-slate-900">
          <div className="col-span-5 flex items-center gap-2"><FileText className="h-4 w-4" /> Record</div>
          <div className="col-span-3 flex items-center gap-2"><Users className="h-4 w-4" /> Owner</div>
          <div className="col-span-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Category</div>
          <div className="col-span-2">Status</div>
        </div>
        {operations.length ? (
          operations.slice(0, 10).map((operation) => <QueueRow key={`${operation.category}-${operation.href}`} {...operation} />)
        ) : (
          <QueueRow href="/dashboard" title="No open Supabase review records" owner="Operations" category="Queue" status="clear" icon={<CheckCircle2 />} />
        )}
      </Card>
    </>
  );
}

function Metric({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-900 [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
      <span className="text-2xl font-semibold">{value}</span>
      <span className="text-sm text-muted-foreground">{title}</span>
    </div>
  );
}

function Divider() {
  return <span className="hidden h-7 w-px bg-border sm:block" />;
}

function QueueRow({ href, title, owner, category, status, icon }: { href: string; title: string; owner: string; category: string; status: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="grid grid-cols-12 items-center border-b border-border px-6 py-4 text-sm last:border-b-0 hover:bg-slate-50">
      <div className="col-span-5 flex min-w-0 items-center gap-3">
        <span className="text-slate-500 [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
        <span className="truncate text-slate-700">{title}</span>
      </div>
      <div className="col-span-3 flex items-center gap-3 font-semibold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs">{owner.slice(0, 1)}</span>
        {owner}
      </div>
      <div className="col-span-2 text-slate-600">{category}</div>
      <div className="col-span-2"><StatusBadge value={status} /></div>
    </Link>
  );
}
