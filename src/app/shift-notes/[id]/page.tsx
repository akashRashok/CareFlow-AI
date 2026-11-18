import { notFound } from "next/navigation";
import { approveShiftNote, rejectShiftNote, runShiftNoteReview } from "@/app/actions";
import { CopyButton } from "@/components/copy-button";
import { ErrorBanner } from "@/components/error-banner";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { Button, Card, PageHeader, inputClass } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { ShiftNote } from "@/lib/types";
import type { ShiftNoteAIReview } from "@/lib/ai/schemas";
import { formatDateTime } from "@/lib/utils";

export default async function ShiftNoteDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const { data } = await getSupabaseAdmin()!.from("shift_notes").select("*, participants(*), workers(*)").eq("id", id).single();
  if (!data) notFound();
  const note = data as ShiftNote;
  const review = note.ai_review as ShiftNoteAIReview | null;
  return (
    <>
      <PageHeader
        title="Shift Note Review"
        description="Clean up worker notes, extract risks and missing information, then approve or reject with a human decision."
        action={<StatusBadge value={note.status} />}
      />
      <ErrorBanner error={query.error} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Source context</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <Info label="Participant" value={note.participants?.full_name ?? "Unknown"} />
            <Info label="Worker" value={note.workers?.full_name ?? "Unknown"} />
            <Info label="Shift" value={`${formatDateTime(note.shift_start)} to ${formatDateTime(note.shift_end)}`} />
            <Info label="Service type" value={note.service_type} />
            <Info label="Goals" value={(note.participants?.goals ?? []).join(", ")} />
            <Info label="Known risks" value={(note.participants?.known_risks ?? []).join(", ")} />
          </dl>
          <div className="mt-5 rounded-md border border-border bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Raw worker note</p>
            <p className="mt-2 text-sm leading-6">{note.raw_note}</p>
          </div>
          <form action={runShiftNoteReview} className="mt-5">
            <input type="hidden" name="id" value={note.id} />
            <PendingSubmitButton pendingText={review ? "Rerunning AI..." : "Running AI review..."}>
              {review ? "Rerun AI Review" : "Run AI Review"}
            </PendingSubmitButton>
          </form>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">AI review</h2>
          {review ? (
            <div className="mt-4 space-y-5">
              <section>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Clean note</p>
                  <CopyButton text={review.cleaned_note} label="Copy clean note" />
                </div>
                <form action={approveShiftNote} className="mt-2 space-y-3">
                  <input type="hidden" name="id" value={note.id} />
                  <textarea name="approved_note" defaultValue={review.cleaned_note} className={`${inputClass} min-h-36`} />
                  <Button type="submit">Approve / edit and approve</Button>
                </form>
              </section>
              <ReviewBlock title="Wellbeing summary" body={review.wellbeing_summary} />
              <ListBlock title="Observed signals" items={review.observed_signals} />
              <ListBlock title="Missing information" items={review.missing_information} />
              <ListBlock title="Suggested follow-up actions" items={review.suggested_follow_up_actions} />
              <div>
                <p className="text-sm font-semibold">Risk flags</p>
                <div className="mt-2 space-y-3">
                  {review.risk_flags.map((risk, index) => (
                    <div key={`${risk.title}-${index}`} className="rounded-md border border-border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{risk.title}</p>
                        <StatusBadge value={risk.severity} />
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{risk.explanation}</p>
                      <p className="mt-2 rounded bg-slate-50 p-2 text-xs">Evidence: {risk.evidence}</p>
                    </div>
                  ))}
                </div>
              </div>
              <form action={rejectShiftNote} className="space-y-3 border-t border-border pt-4">
                <input type="hidden" name="id" value={note.id} />
                <textarea name="reason" required placeholder="Reason for rejection" className={`${inputClass} min-h-20`} />
                <Button type="submit" variant="danger">Reject AI output</Button>
              </form>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Run AI review to generate a cleaned note, risks, missing information, and follow-up actions.</p>
          )}
        </Card>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-medium">{label}</dt><dd className="mt-1 text-muted-foreground">{value || "None recorded"}</dd></div>;
}

function ReviewBlock({ title, body }: { title: string; body: string }) {
  return <section><p className="text-sm font-semibold">{title}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></section>;
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return <section><p className="text-sm font-semibold">{title}</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
}
