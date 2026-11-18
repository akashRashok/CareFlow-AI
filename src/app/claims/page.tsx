import { Card, LinkButton, PageHeader } from "@/components/ui";
import { SetupWarning } from "@/components/setup-warning";
import { StatusBadge } from "@/components/status";
import { formatDate, money } from "@/lib/utils";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Claim } from "@/lib/types";

export default async function ClaimsPage() {
  if (!isSupabaseConfigured()) return <><PageHeader title="Claim Readiness" /><SetupWarning /></>;
  const { data } = await getSupabaseAdmin()!.from("claims").select("*, participants(full_name), shift_notes(raw_note)").order("created_at", { ascending: false });
  const claims = (data ?? []) as Claim[];
  return (
    <>
      <PageHeader title="Claim Readiness" description="Check mock claims against source notes, rostered hours, invoice details, and deterministic review rules." />
      <div className="grid gap-4">
        {claims.map((claim) => (
          <Card key={claim.id}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{claim.participants?.full_name}</h2>
                  <StatusBadge value={claim.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{formatDate(claim.service_date)} · {claim.service_type} · {money(claim.invoice_amount)}</p>
                <p className="mt-3 text-sm">Rostered {claim.rostered_hours}h · Invoiced {claim.invoice_hours}h</p>
              </div>
              <LinkButton href={`/claims/${claim.id}`}>Open check</LinkButton>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

