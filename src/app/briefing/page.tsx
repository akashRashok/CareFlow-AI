import { generateDailyBriefing } from "@/app/actions";
import { CopyButton } from "@/components/copy-button";
import { ErrorBanner } from "@/components/error-banner";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { Card, PageHeader } from "@/components/ui";
import { SetupWarning } from "@/components/setup-warning";
import { StatusBadge } from "@/components/status";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import type { DailyOpsBriefing } from "@/lib/ai/schemas";
import { formatDateTime } from "@/lib/utils";

export default async function BriefingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  if (!isSupabaseConfigured()) return <><PageHeader title="Daily Ops Briefing" /><SetupWarning /></>;
  const { data } = await getSupabaseAdmin()!.from("daily_briefings").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
  const briefing = data?.ai_output as DailyOpsBriefing | undefined;
  const markdown = briefing ? toMarkdown(briefing) : "";
  return (
    <>
      <PageHeader
        title="Daily Ops Briefing"
        description="Generate a source-grounded summary of unresolved care operations priorities."
        action={
          <form action={generateDailyBriefing}>
            <PendingSubmitButton pendingText="Generating briefing...">Generate Daily Briefing</PendingSubmitButton>
          </form>
        }
      />
      <ErrorBanner error={query.error} />
      {briefing ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Executive summary</h2>
              <CopyButton text={markdown} label="Export markdown" />
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{briefing.executive_summary}</p>
            <section className="mt-6">
              <h3 className="font-semibold">Top priorities</h3>
              <div className="mt-3 space-y-3">
                {briefing.top_priorities.map((item) => (
                  <div key={`${item.related_record_type}-${item.related_record_id}`} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{item.title}</p>
                      <StatusBadge value={item.priority} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.reason}</p>
                    <p className="mt-2 text-sm">Action: {item.recommended_action}</p>
                  </div>
                ))}
              </div>
            </section>
          </Card>
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold">Suggested today plan</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">{briefing.suggested_today_plan.map((item) => <li key={item}>{item}</li>)}</ol>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold">Risks by category</h2>
              <div className="mt-3 space-y-3">
                {briefing.risks_by_category.map((item) => <div key={item.category}><p className="font-medium">{item.category} ({item.count})</p><p className="text-sm text-muted-foreground">{item.summary}</p></div>)}
              </div>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold">Saved briefing</h2>
              <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(data?.created_at)} · {data?.provider}/{data?.model}</p>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <p className="text-sm text-muted-foreground">No briefing has been generated yet. Seed demo data, then generate a daily briefing.</p>
        </Card>
      )}
    </>
  );
}

function toMarkdown(briefing: DailyOpsBriefing) {
  return `# Daily Ops Briefing

${briefing.executive_summary}

## Top priorities
${briefing.top_priorities.map((item) => `- [${item.priority}] ${item.title}: ${item.recommended_action}`).join("\n")}

## Suggested today plan
${briefing.suggested_today_plan.map((item, index) => `${index + 1}. ${item}`).join("\n")}

${briefing.disclaimer}`;
}
