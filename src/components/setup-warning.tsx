import { EmptyState } from "@/components/ui";
import { isSupabaseConfigured, missingSupabaseMessage } from "@/lib/supabase/server";

export function SetupWarning() {
  if (isSupabaseConfigured()) return null;
  return <EmptyState title="Connect Supabase to run the demo" body={missingSupabaseMessage()} href="/demo-data" action="Open demo setup" />;
}

