import type { Metadata } from "next";
import Link from "next/link";
import type React from "react";
import {
  Bell,
  ClipboardCheck,
  Database,
  FileText,
  Gauge,
  History,
  Settings,
  ShieldAlert,
  Sparkles,
  UserRound
} from "lucide-react";
import { GlobalSearch } from "@/components/global-search";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareOps AI",
  description: "AI-assisted care operations demo"
};

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/shift-notes", label: "Shift Notes", icon: FileText },
  { href: "/claims", label: "Claims", icon: ClipboardCheck },
  { href: "/roster-risks", label: "Roster Risks", icon: ShieldAlert },
  { href: "/briefing", label: "Briefing", icon: Sparkles },
  { href: "/audit-log", label: "Audit Log", icon: History }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="p-4">
          <div className="app-frame">
            <aside className="fixed bottom-4 left-4 top-4 hidden w-64 border-r border-border bg-white lg:block">
              <Link href="/dashboard" className="flex h-20 items-center px-8">
                <span className="font-serif text-3xl font-semibold tracking-tight text-slate-950">CareOps</span>
              </Link>

              <nav className="px-4 py-6">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="mb-1 flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  >
                    <item.icon size={18} strokeWidth={1.8} />
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="absolute bottom-0 left-0 right-0 px-8 py-7">
                <Link href="/settings/ai" className="mb-5 flex items-center gap-4 text-[15px] font-medium text-slate-600">
                  <Settings size={20} />
                  Settings
                </Link>
                <Link href="/demo-data" className="flex items-center justify-between text-[15px] font-medium text-slate-600">
                  <span className="flex items-center gap-4">
                    <Database size={20} />
                    Data Source
                  </span>
                  <span className="rounded-lg bg-emerald-200 px-2 py-0.5 text-sm text-emerald-900">Live</span>
                </Link>
              </div>
            </aside>

            <div className="lg:pl-64">
              <header className="sticky top-4 z-10 border-b border-border bg-white px-4 py-3 lg:px-7">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Link href="/dashboard" className="font-serif text-2xl font-semibold lg:hidden">
                      CareOps
                    </Link>
                    <GlobalSearch />
                  </div>

                  <div className="flex items-center gap-4">
                    <Link
                      href="/demo-data"
                      className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      <Database className="h-4 w-4" />
                      Supabase Data
                    </Link>
                   
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                      <UserRound className="h-5 w-5" />
                    </span>
                  </div>
                </div>

                <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                  {nav.slice(0, 6).map((item) => (
                    <Link key={item.href} href={item.href} className="whitespace-nowrap rounded border border-border px-3 py-1.5 text-xs">
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </header>

              <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-7">{children}</main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
