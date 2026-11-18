"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/status";

type RiskItem = {
  severity: string;
  risk_type?: string;
  explanation: string;
  evidence: string;
  suggested_action: string;
};

type AlternativeWorker = {
  worker_name: string;
  reason: string;
  tradeoffs: string;
};

export function RosterRiskTabs({
  ruleRisks,
  aiRisks,
  alternatives
}: {
  ruleRisks: RiskItem[];
  aiRisks: RiskItem[];
  alternatives: AlternativeWorker[];
}) {
  const [active, setActive] = useState<"rules" | "ai" | "alternatives">("rules");
  const tabs = [
    { id: "rules" as const, label: "Risk findings", count: ruleRisks.length },
    { id: "ai" as const, label: "AI findings", count: aiRisks.length },
    { id: "alternatives" as const, label: "Alternative workers", count: alternatives.length }
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-slate-50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              active === tab.id ? "bg-white text-slate-950 shadow-soft" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab.label}
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        {active === "rules" ? <RiskTable risks={ruleRisks} empty="No rule-based risks detected." /> : null}
        {active === "ai" ? <RiskTable risks={aiRisks} empty="Run AI to generate AI findings." /> : null}
        {active === "alternatives" ? <AlternativeWorkers alternatives={alternatives} /> : null}
      </div>
    </div>
  );
}

function RiskTable({ risks, empty }: { risks: RiskItem[]; empty: string }) {
  if (!risks.length) return <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">{empty}</p>;

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="hidden grid-cols-[140px_96px_1fr_1fr] gap-4 border-b border-border bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
        <span>Type</span>
        <span>Severity</span>
        <span>Evidence</span>
        <span>Action</span>
      </div>
      <div className="divide-y divide-border">
        {risks.map((risk, index) => (
          <div key={`${risk.risk_type}-${index}`} className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[140px_96px_1fr_1fr] lg:items-start lg:gap-4">
            <div>
              <p className="font-semibold capitalize">{risk.risk_type?.replace(/_/g, " ") ?? "Risk"}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground lg:hidden">{risk.explanation}</p>
            </div>
            <div>
              <StatusBadge value={risk.severity} />
            </div>
            <div>
              <p className="line-clamp-2 text-muted-foreground">{risk.evidence}</p>
              <p className="mt-1 hidden text-xs leading-5 text-slate-500 lg:block">{risk.explanation}</p>
            </div>
            <p className="line-clamp-3 text-muted-foreground">{risk.suggested_action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlternativeWorkers({ alternatives }: { alternatives: AlternativeWorker[] }) {
  if (!alternatives.length) return <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">No alternative workers suggested.</p>;

  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
      {alternatives.map((item) => (
        <div key={item.worker_name} className="grid gap-3 p-4 text-sm md:grid-cols-[180px_1fr_1fr]">
          <p className="font-semibold">{item.worker_name}</p>
          <p className="text-muted-foreground">{item.reason}</p>
          <p className="text-slate-500">Tradeoff: {item.tradeoffs}</p>
        </div>
      ))}
    </div>
  );
}
