import { Card, PageHeader } from "@/components/ui";
import { SetupWarning } from "@/components/setup-warning";
import { StatusBadge } from "@/components/status";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import type { AuditLog } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export default async function AuditLogPage() {
  if (!isSupabaseConfigured()) return <><PageHeader title="Audit Log" /><SetupWarning /></>;
  const { data } = await getSupabaseAdmin()!.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
  const logs = (data ?? []) as AuditLog[];
  return (
    <>
      <PageHeader title="Audit Log" description="Trace AI generations, failures, provider changes, demo data actions, and human approvals or rejections." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-3 pr-4">Time</th>
                <th className="py-3 pr-4">Action</th>
                <th className="py-3 pr-4">Entity</th>
                <th className="py-3 pr-4">Provider</th>
                <th className="py-3 pr-4">Model</th>
                <th className="py-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="py-3 pr-4">{formatDateTime(log.created_at)}</td>
                  <td className="py-3 pr-4 font-medium">{log.action_type.replace(/_/g, " ")}</td>
                  <td className="py-3 pr-4">{log.entity_type}{log.entity_id ? ` / ${log.entity_id.slice(0, 8)}` : ""}</td>
                  <td className="py-3 pr-4">{log.provider ?? "-"}</td>
                  <td className="py-3 pr-4">{log.model ?? "-"}</td>
                  <td className="py-3 pr-4"><StatusBadge value={log.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!logs.length ? <p className="mt-4 text-sm text-muted-foreground">No audit events yet.</p> : null}
      </Card>
    </>
  );
}

