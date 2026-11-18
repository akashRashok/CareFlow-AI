"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const shortcuts = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Shift Notes", href: "/shift-notes" },
  { label: "Claims", href: "/claims" },
  { label: "Roster Risks", href: "/roster-risks" },
  { label: "Daily Briefing", href: "/briefing" },
  { label: "Audit Log", href: "/audit-log" },
  { label: "AI Settings", href: "/settings/ai" },
  { label: "Supabase Data", href: "/demo-data" }
];

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const matches = query.trim()
    ? shortcuts.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 4)
    : shortcuts.slice(0, 4);

  return (
    <form
      action="/search"
      className="relative hidden w-full max-w-xl sm:block"
      onSubmit={(event) => {
        const trimmed = query.trim();
        if (!trimmed) {
          event.preventDefault();
          return;
        }
        const exact = shortcuts.find((item) => item.label.toLowerCase() === trimmed.toLowerCase());
        if (exact) {
          event.preventDefault();
          router.push(exact.href);
        }
      }}
    >
      <div className="flex h-11 items-center gap-3 rounded-lg bg-slate-50 px-4 text-sm text-slate-500 shadow-inner">
        <Search className="h-5 w-5" />
        <input
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search people, notes, claims, roster..."
          className="min-w-0 flex-1 bg-transparent text-slate-800 outline-none placeholder:text-slate-500"
        />
        <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-sm">Enter</span>
      </div>
      {query.trim() ? (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-lg border border-border bg-white shadow-soft">
          {matches.length ? (
            matches.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className="block w-full px-4 py-3 text-left text-sm hover:bg-slate-50"
              >
                {item.label}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground">Press Enter to search Supabase records</div>
          )}
        </div>
      ) : null}
    </form>
  );
}
