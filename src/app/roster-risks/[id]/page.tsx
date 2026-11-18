import { notFound } from "next/navigation";
import { runRosterRiskReview, updateRosterStatus } from "@/app/actions";
import { ErrorBanner } from "@/components/error-banner";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { RosterRiskTabs } from "@/components/roster-risk-tabs";
import { Button, Card, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { evaluateRosterRules } from "@/lib/rules/roster-rules";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { RosterAssignment, Worker } from "@/lib/types";
import type { RosterRiskReview } from "@/lib/ai/schemas";
import { formatDateTime, money } from "@/lib/utils";

export default async function RosterRiskDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = getSupabaseAdmin()!;
  const { data } = await supabase
    .from("roster_assignments")
    .select("*, participants(*), workers:workers!roster_assignments_worker_id_fkey(*), usual_worker:workers!roster_assignments_usual_worker_id_fkey(*)")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const assignment = data as RosterAssignment;
  const { data: workerRows } = await supabase.from("workers").select("*").order("full_name");
  const workers = (workerRows ?? []) as Worker[];
  const deterministic = evaluateRosterRules(assignment, workers);
  const review = assignment.ai_review as RosterRiskReview | null;
  const aiRisks = review ? removeDuplicateRuleRisks(review.risks, deterministic) : [];
  const primaryRisk = review?.overall_risk ?? highestSeverity(deterministic);

  return (
    <>
      <PageHeader
        title="Roster Risk Review"
        description="Review the assignment, confirm the highest-risk findings, and record a human decision."
        action={<StatusBadge value={assignment.status} />}
      />
      <ErrorBanner error={query.error} />

      <Card className="mb-5 p-0">
        <div className="grid gap-0 md:grid-cols-4">
          <SummaryTile label="Participant" value={assignment.participants?.full_name ?? "Unknown"} />
          <SummaryTile label="Assigned worker" value={assignment.workers?.full_name ?? "Unknown"} />
          <SummaryTile label="Shift" value={formatDateTime(assignment.shift_start)} />
          <SummaryTile label="Risk level" value={<StatusBadge value={primaryRisk} />} />
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Assignment Snapshot</h2>
                <p className="mt-1 text-sm text-muted-foreground">Key source fields from Supabase.</p>
              </div>
              <form action={runRosterRiskReview}>
                <input type="hidden" name="id" value={assignment.id} />
                <PendingSubmitButton pendingText={review ? "Rerunning AI..." : "Running AI..."}>
                  {review ? "Rerun AI" : "Run AI"}
                </PendingSubmitButton>
              </form>
            </div>

            <div className="mt-5 divide-y divide-border rounded-lg border border-border">
              <CompactInfo label="Service" value={assignment.service_type} />
              <CompactInfo label="Required skills" value={assignment.required_skills.join(", ") || "None recorded"} />
              <CompactInfo label="Worker skills" value={(assignment.workers?.skills ?? []).join(", ") || "None recorded"} />
              <CompactInfo label="Availability" value={(assignment.workers?.availability ?? []).join(", ") || "None recorded"} />
              <CompactInfo label="Usual worker" value={assignment.usual_worker?.full_name ?? "None"} />
              <CompactInfo label="Travel time" value={assignment.travel_time_minutes ? `${assignment.travel_time_minutes} minutes` : "Missing"} />
              <CompactInfo label="Estimated cost" value={money(assignment.estimated_cost)} />
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">Decision</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              AI suggestions are assistive. Approving or dismissing records the coordinator decision in the audit log.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <StatusForm id={assignment.id} status="approved" label="Approve recommendation" />
              <StatusForm id={assignment.id} status="dismissed" label="Dismiss risk" danger />
            </div>
          </Card>
        </div>

        <Card className="p-0">
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Risk Findings</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Deterministic checks are always shown. AI explanation appears after review generation.
                </p>
              </div>
              <StatusBadge value={`${deterministic.length + (review?.risks.length ?? 0)} findings`} />
            </div>
          </div>

          <div className="p-5">
            {review ? (
              <div className="space-y-6">
                <section className="rounded-lg border border-border bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">AI summary</h3>
                    <StatusBadge value={review.overall_risk} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{review.summary}</p>
                </section>
                <RosterRiskTabs ruleRisks={deterministic} aiRisks={aiRisks} alternatives={review.alternative_recommendations} />
              </div>
            ) : (
              <RosterRiskTabs ruleRisks={deterministic} aiRisks={[]} alternatives={[]} />
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

function SummaryTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-border p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2 text-base font-semibold">{value}</div>
    </div>
  );
}

function CompactInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 p-3 text-sm sm:grid-cols-[140px_1fr]">
      <p className="font-medium text-slate-600">{label}</p>
      <p className="text-muted-foreground">{value}</p>
    </div>
  );
}

function highestSeverity(risks: { severity: string }[]) {
  if (risks.some((risk) => risk.severity === "high")) return "high";
  if (risks.some((risk) => risk.severity === "medium")) return "medium";
  if (risks.some((risk) => risk.severity === "low")) return "low";
  return "clear";
}

function removeDuplicateRuleRisks(
  aiRisks: { severity: string; risk_type?: string; explanation: string; evidence: string; suggested_action: string }[],
  ruleRisks: { severity: string; risk_type?: string; explanation: string; evidence: string; suggested_action: string }[]
) {
  const ruleKeys = new Set(ruleRisks.map((risk) => `${risk.risk_type}:${risk.evidence}`));
  return aiRisks.filter((risk) => !ruleKeys.has(`${risk.risk_type}:${risk.evidence}`));
}

function StatusForm({ id, status, label, danger }: { id: string; status: string; label: string; danger?: boolean }) {
  return (
    <form action={updateRosterStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" variant={danger ? "danger" : "secondary"}>{label}</Button>
    </form>
  );
}
