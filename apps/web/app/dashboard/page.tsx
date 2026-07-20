"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardData {
  totalAnalyses: number;
  pendingReviews: number;
  confirmedDefects: number;
  generatedReports: number;
  totalFindings: number;
  severityDistribution: Record<string, number>;
  activity: Array<{ date: string; count: number }>;
  recentProjects: Array<{
    id: string;
    name: string;
    siteId: string | null;
    objectType: string | null;
    status: string;
    _count: { assets: number };
    updatedAt: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="material-symbols-outlined text-primary text-[48px] animate-spin">progress_activity</span>
      </div>
    );
  }

  const kpis = [
    { label: "TOTAL ANALYSES", value: data?.totalAnalyses ?? 0, trend: "+12%", color: "primary", barWidth: "75%" },
    { label: "PENDING REVIEWS", value: data?.pendingReviews ?? 0, trend: "HIGH ATTENTION", color: "error", barWidth: "33%", highlight: true },
    { label: "CONFIRMED DEFECTS", value: data?.confirmedDefects ?? 0, trend: "STABLE", color: "secondary", barWidth: "50%" },
    { label: "GENERATED REPORTS", value: data?.generatedReports ?? 0, trend: "SYNCED", color: "primary", barWidth: "100%" },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-end mb-xl">
        <div>
          <p className="font-label-caps text-label-caps text-secondary mb-xs">ENGINEERING CONSOLE</p>
          <h2 className="font-display-lg text-display-lg">Welcome back, Site Engineer.</h2>
          <p className="font-body-md text-on-surface-variant mt-xs">
            Summary of active inspections and structural integrity reports.
          </p>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-xl">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`bg-surface-container-lowest border p-lg transition-colors ${
              kpi.highlight ? "border-2 border-primary relative overflow-hidden" : "border-outline-variant hover:border-primary"
            }`}
          >
            {kpi.highlight && (
              <div className="absolute top-0 right-0 p-xs bg-primary text-on-primary font-label-caps text-[10px]">
                HIGH ATTENTION
              </div>
            )}
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-md">{kpi.label}</p>
            <div className="flex justify-between items-baseline">
              <h3 className="text-[32px] font-bold text-on-surface">{kpi.value.toLocaleString()}</h3>
              <span className={`text-${kpi.color} font-mono-data text-[12px]`}>{kpi.trend}</span>
            </div>
            <div className="w-full bg-surface-container h-1 mt-md">
              <div className={`bg-${kpi.color} h-full`} style={{ width: kpi.barWidth }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-xl">
        {/* Severity Distribution */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant p-lg">
          <div className="flex justify-between items-center mb-xl">
            <h4 className="font-title-sm text-title-sm">Severity Distribution</h4>
            <span className="material-symbols-outlined text-on-surface-variant">info</span>
          </div>
          <div className="relative flex items-center justify-center py-lg">
            {(() => {
              const dist = data?.severityDistribution ?? { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
              const total = Math.max(1, Object.values(dist).reduce((a, b) => a + b, 0));
              let start = 0;
              const colors: Record<string, string> = { CRITICAL: "#ba1a1a", HIGH: "#f97316", MEDIUM: "#0f5c63", LOW: "#3c637b" };
              const segs = Object.entries(dist).map(([sev, count]) => {
                const pct = count / total;
                const seg = `${colors[sev]} ${start * 360}deg ${(start + pct) * 360}deg`;
                start += pct;
                return seg;
              }).filter(Boolean);
              const gradient = segs.length > 0 ? `conic-gradient(${segs.join(", ")})` : "conic-gradient(#d9e5e4 0deg 360deg)";
              return (
                <>
                  <div className="w-48 h-48 rounded-full" style={{ background: gradient }} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display-lg text-[24px]">{data?.totalFindings ?? 0}</span>
                    <span className="font-label-caps text-[10px] text-on-surface-variant">TOTAL ISSUES</span>
                  </div>
                </>
              );
            })()}
          </div>
          <div className="mt-xl space-y-sm">
            {(() => {
              const dist = data?.severityDistribution ?? { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
              const total = Math.max(1, Object.values(dist).reduce((a, b) => a + b, 0));
              const labels: Record<string, string> = { CRITICAL: "Critical", HIGH: "High", MEDIUM: "Moderate", LOW: "Low" };
              const colors: Record<string, string> = { CRITICAL: "bg-error", HIGH: "bg-orange-500", MEDIUM: "bg-primary-container", LOW: "bg-secondary" };
              return Object.entries(dist).map(([sev, count]) => {
                const pct = total > 0 ? ((count / total) * 100).toFixed(0) : "0";
                return (
                  <div key={sev} className="flex justify-between items-center text-[12px]">
                    <div className="flex items-center gap-xs">
                      <span className={`w-3 h-3 ${colors[sev]}`} />
                      {labels[sev]}
                    </div>
                    <span className="font-mono-data">{count} ({pct}%)</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant p-lg">
          <div className="flex justify-between items-center mb-xl">
            <h4 className="font-title-sm text-title-sm">Analysis Activity Timeline</h4>
            <span className="font-label-caps text-[10px] text-on-surface-variant">LAST 7 DAYS</span>
          </div>
          <div className="h-64 relative border-l border-b border-outline-variant flex items-end justify-between px-md pb-md">
            <div className="group relative w-full h-full flex items-end justify-between gap-sm">
              {(() => {
                const activity = data?.activity ?? [];
                const max = Math.max(1, ...activity.map((a) => a.count));
                const labels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
                return activity.map((a, i) => (
                  <div
                    key={i}
                    className={`flex-1 ${a.count === max ? "bg-primary" : "bg-primary/20"} hover:bg-primary transition-all cursor-help`}
                    style={{ height: `${(a.count / max) * 100}%` }}
                    title={`${new Date(a.date).toLocaleDateString()}: ${a.count} analyses`}
                  />
                ));
              })()}
            </div>
            <div className="absolute -bottom-6 left-0 right-0 flex justify-between font-label-caps text-[10px] text-on-surface-variant">
              {data?.activity?.map((a) => new Date(a.date).toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()) ?? ["MON","TUE","WED","THU","FRI","SAT","SUN"]}
            </div>
          </div>
          <div className="mt-lg pt-lg border-t border-outline-variant flex gap-xl">
            <div>
              <p className="text-[10px] font-label-caps text-on-surface-variant">TOTAL ANALYSES</p>
              <p className="text-[18px] font-bold">{data?.totalAnalyses ?? 0}</p>
            </div>
            <div>
              <p className="text-[10px] font-label-caps text-on-surface-variant">PENDING REVIEWS</p>
              <p className="text-[18px] font-bold">{data?.pendingReviews ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <section className="bg-surface-container-lowest border border-outline-variant mb-xl">
        <div className="p-lg border-b border-outline-variant flex justify-between items-center">
          <h4 className="font-title-sm text-title-sm">Recent Projects</h4>
          <Link href="/dashboard/projects" className="flex items-center gap-xs font-label-caps text-[11px] text-primary hover:underline">
            VIEW ARCHIVE <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider">
                <th className="px-lg py-md font-bold">Project Name</th>
                <th className="px-lg py-md font-bold">Object Type</th>
                <th className="px-lg py-md font-bold">Photos</th>
                <th className="px-lg py-md font-bold">Last Activity</th>
                <th className="px-lg py-md font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-body-sm">
              {(data?.recentProjects ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-lg py-xl text-center text-on-surface-variant">
                    No projects yet.{" "}
                    <Link href="/dashboard/projects" className="text-primary font-bold hover:underline">
                      Create your first project
                    </Link>
                  </td>
                </tr>
              ) : (
                data?.recentProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-lg py-lg">
                      <Link href={`/dashboard/projects/${p.id}`} className="block">
                        <p className="font-bold">{p.name}</p>
                        <p className="text-[11px] text-on-surface-variant font-mono-data">ID: {p.siteId ?? "—"}</p>
                      </Link>
                    </td>
                    <td className="px-lg py-lg">{p.objectType ?? "—"}</td>
                    <td className="px-lg py-lg font-mono-data">{p._count.assets}</td>
                    <td className="px-lg py-lg text-on-surface-variant">
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-lg py-lg">
                      <span className={`px-sm py-xs font-label-caps text-[10px] ${
                        p.status === "CRITICAL" ? "bg-error/10 text-error" :
                        p.status === "ACTIVE" ? "bg-primary/10 text-primary" :
                        p.status === "COMPLETED" ? "bg-secondary/10 text-secondary" :
                        "bg-outline-variant/30 text-outline"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Floating Action */}
      <Link
        href="/dashboard/upload"
        className="fixed bottom-10 right-10 flex items-center gap-md bg-primary-container text-on-primary-container px-lg py-md shadow-lg border border-primary hover:-translate-y-0.5 transition-transform z-50"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_box</span>
        <span className="font-label-caps text-label-caps">NEW ANALYSIS</span>
      </Link>
    </div>
  );
}
