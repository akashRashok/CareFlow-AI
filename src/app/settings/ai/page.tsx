import { saveAISettings, testAIProvider } from "@/app/actions";
import { AISettingsForm } from "@/components/ai-settings-form";
import { ErrorBanner } from "@/components/error-banner";
import { PageHeader } from "@/components/ui";
import { SetupWarning } from "@/components/setup-warning";
import { getAISettings } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AISettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; tested?: string }> }) {
  const query = await searchParams;
  if (!isSupabaseConfigured()) return <><PageHeader title="AI Provider Settings" /><SetupWarning /></>;
  const settings = await getAISettings();
  return (
    <>
      <PageHeader
        title="AI Settings"
        description="Choose how CareOps AI generates reviews. Local Ollama is recommended for this demo because data stays on this machine."
      />
      <ErrorBanner error={query.error} />
      {query.saved ? <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Settings saved.</div> : null}
      {query.tested ? <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Provider test succeeded.</div> : null}
      <AISettingsForm settings={settings} saveAction={saveAISettings} testAction={testAIProvider} />
    </>
  );
}
