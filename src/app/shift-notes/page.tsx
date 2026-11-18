import { Card, LinkButton, PageHeader } from "@/components/ui";
import { SetupWarning } from "@/components/setup-warning";
import { StatusBadge } from "@/components/status";
import { formatDateTime } from "@/lib/utils";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import type { ShiftNote } from "@/lib/types";

export default async function ShiftNotesPage() {
  if (!isSupabaseConfigured()) return <><PageHeader title="Shift Notes" /><SetupWarning /></>;
  const { data } = await getSupabaseAdmin()!.from("shift_notes").select("*, participants(full_name), workers(full_name)").order("created_at", { ascending: false });
  const notes = (data ?? []) as ShiftNote[];
  return (
    <>
      <PageHeader title="Shift Notes" description="Review raw worker notes, generate professional care notes, and keep approval decisions auditable." />
      <div className="grid gap-4">
        {notes.map((note) => (
          <Card key={note.id}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{note.participants?.full_name}</h2>
                  <StatusBadge value={note.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{note.workers?.full_name} · {note.service_type} · {formatDateTime(note.shift_start)}</p>
                <p className="mt-3 max-w-3xl text-sm">{note.raw_note}</p>
              </div>
              <LinkButton href={`/shift-notes/${note.id}`}>Open review</LinkButton>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

