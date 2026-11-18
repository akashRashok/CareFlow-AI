import { notFound } from "next/navigation";
import { runClaimReadiness, updateClaimStatus } from "@/app/actions";
import { ClaimReadinessTabs } from "@/components/claim-readiness-tabs";
import { ErrorBanner } from "@/components/error-banner";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { Button, Card, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { evaluateClaimRules } from "@/lib/rules/claim-rules";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Claim } from "@/lib/types";
import type { ClaimReadinessReview } from "@/lib/ai/schemas";
import { formatDate, money } from "@/lib/utils";

export default async function ClaimDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const { data } = await getSupabaseAdmin()!.from("claims").select("*, participants(*), shift_notes(*)").eq("id", id).single();
  if (!data) notFound();
  const claim = data as Claim;
  const deterministic = evaluateClaimRules(claim);
  const review = claim.ai_review as ClaimReadinessReview | null;
  return (
    <>
      <PageHeader title="Claim Readiness Check" description="Review evidence, invoice details, and AI-assisted recommendations before any human claim decision." action={<StatusBadge value={claim.status} />} />
      <ErrorBanner error={query.error} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Source documents</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <Info label="Participant" value={claim.participants?.full_name ?? "Unknown"} />
            <Info label="Service date" value={formatDate(claim.service_date)} />
            <Info label="Service type" value={claim.service_type} />
            <Info label="Rostered hours" value={`${claim.rostered_hours}`} />
            <Info label="Invoice hours" value={`${claim.invoice_hours}`} />
            <Info label="Invoice amount" value={money(claim.invoice_amount)} />
            <Info label="Agreement summary" value={claim.service_agreement_summary ?? "Missing"} />
          </div>
          <div className="mt-5 rounded-md border border-border bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Support note</p>
            <p className="mt-2 text-sm leading-6">{claim.shift_notes?.raw_note ?? "No support note linked."}</p>
          </div>
          <form action={runClaimReadiness} className="mt-5">
            <input type="hidden" name="id" value={claim.id} />
            <PendingSubmitButton pendingText={review ? "Rerunning check..." : "Checking readiness..."}>
              {review ? "Rerun readiness check" : "Check Claim Readiness"}
            </PendingSubmitButton>
          </form>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Review result</h2>
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Demo only. This tool does not determine NDIS claim eligibility and does not replace provider compliance review.
          </p>
          {review ? (
            <div className="mt-5 space-y-5">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">Readiness</span>
                <StatusBadge value={review.readiness_status} />
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{review.summary}</p>
              <ClaimReadinessTabs deterministicIssues={deterministic} aiIssues={review.issues} recommendedActions={review.recommended_actions} />
              <div className="flex flex-wrap gap-3 border-t border-border pt-4">
                <StatusForm id={claim.id} status="ready" label="Approve as ready" />
                <StatusForm id={claim.id} status="needs_review" label="Mark needs review" />
                <StatusForm id={claim.id} status="rejected" label="Reject AI review" danger />
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <ClaimReadinessTabs deterministicIssues={deterministic} aiIssues={[]} recommendedActions={[]} />
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="font-medium">{label}</p><p className="mt-1 text-muted-foreground">{value}</p></div>;
}

function StatusForm({ id, status, label, danger }: { id: string; status: string; label: string; danger?: boolean }) {
  return <form action={updateClaimStatus}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={status} /><Button type="submit" variant={danger ? "danger" : "secondary"}>{label}</Button></form>;
}
