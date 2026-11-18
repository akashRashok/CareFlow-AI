"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/status";

type ClaimIssue = {
  severity: string;
  issue_type?: string;
  explanation: string;
  evidence: string;
  suggested_action: string;
};

export function ClaimReadinessTabs({
  deterministicIssues,
  aiIssues,
  recommendedActions
}: {
  deterministicIssues: ClaimIssue[];
  aiIssues: ClaimIssue[];
  recommendedActions: string[];
}) {
  const [active, setActive] = useState<"rules" | "ai" | "actions">("rules");
  const tabs = [
    { id: "rules" as const, label: "Risk findings", count: deterministicIssues.length },
    { id: "ai" as const, label: "AI findings", count: aiIssues.length },
    { id: "actions" as const, label: "Recommended actions", count: recommendedActions.length }
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
        {active === "rules" ? <IssueTable issues={deterministicIssues} empty="No rule-based issues detected." /> : null}
        {active === "ai" ? <IssueTable issues={aiIssues} empty="Run the readiness check to generate AI findings." /> : null}
        {active === "actions" ? <RecommendedActions actions={recommendedActions} /> : null}
      </div>
    </div>
  );
}

function IssueTable({ issues, empty }: { issues: ClaimIssue[]; empty: string }) {
  if (!issues.length) return <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">{empty}</p>;

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="hidden grid-cols-[150px_96px_1fr_1fr] gap-4 border-b border-border bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
        <span>Issue</span>
        <span>Severity</span>
        <span>Evidence</span>
        <span>Action</span>
      </div>
      <div className="divide-y divide-border">
        {issues.map((issue, index) => (
          <div key={`${issue.issue_type}-${index}`} className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[150px_96px_1fr_1fr] lg:items-start lg:gap-4">
            <div>
              <p className="font-semibold capitalize">{issue.issue_type?.replace(/_/g, " ") ?? "Issue"}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground lg:hidden">{issue.explanation}</p>
            </div>
            <div>
              <StatusBadge value={issue.severity} />
            </div>
            <div>
              <p className="line-clamp-2 text-muted-foreground">{issue.evidence}</p>
              <p className="mt-1 hidden text-xs leading-5 text-slate-500 lg:block">{issue.explanation}</p>
            </div>
            <p className="line-clamp-3 text-muted-foreground">{issue.suggested_action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendedActions({ actions }: { actions: string[] }) {
  if (!actions.length) return <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">No recommended actions yet.</p>;

  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
      {actions.map((action, index) => (
        <div key={action} className="grid gap-3 p-4 text-sm md:grid-cols-[48px_1fr] md:items-start">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{index + 1}</span>
          <p className="leading-6 text-muted-foreground">{action}</p>
        </div>
      ))}
    </div>
  );
}
