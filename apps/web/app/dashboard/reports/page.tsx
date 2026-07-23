"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Report {
  id: string;
  title: string;
  reportUrl: string | null;
  summary: string | null;
  createdAt: string;
  project: { id: string; name: string };
}

interface Project {
  id: string;
  name: string;
  _count: { assets: number; reports: number };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/reports").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ]).then(([reportsData, projectsData]) => {
      setReports(reportsData.reports ?? []);
      setProjects(projectsData.projects ?? []);
    }).finally(() => setLoading(false));
  }, []);

  async function generateReport(projectId: string) {
    setGenerating(projectId);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Failed to generate report");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `InspectAI-Report-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const refreshed = await fetch("/api/reports").then((r) => r.json());
      setReports(refreshed.reports ?? []);
      setShowGenerate(false);
    } catch (e) {
      alert("Error generating PDF: " + (e as Error).message);
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="animate-fade-in">
      <header className="flex justify-between items-center mb-xl">
        <div>
          <p className="font-label-caps text-label-caps text-secondary mb-xs">FINAL REPORTS</p>
          <h2 className="font-display-lg text-display-lg">Engineering Reports</h2>
          <p className="font-body-md text-on-surface-variant mt-xs">Generated PDF reports with defect analysis and recommendations.</p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-xs bg-primary text-on-primary px-lg py-md font-label-caps text-label-caps rounded-lg hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
          GENERATE REPORT
        </button>
      </header>

      {showGenerate && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-8 animate-fade-in" onClick={() => setShowGenerate(false)}>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-headline-md text-headline-md mb-lg">Generate PDF Report</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-lg">
              Select a project to generate a comprehensive engineering inspection report with photos, findings, and recommendations.
            </p>
            <div className="space-y-sm max-h-80 overflow-y-auto">
              {projects.length === 0 ? (
                <p className="text-center text-on-surface-variant py-lg">No projects available.</p>
              ) : (
                projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-md border border-outline-variant rounded-lg hover:border-primary transition-colors"
                  >
                    <div>
                      <p className="font-title-sm text-title-sm">{p.name}</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {p._count.assets} photos · {p._count.reports} existing reports
                      </p>
                    </div>
                    <button
                      onClick={() => generateReport(p.id)}
                      disabled={generating === p.id}
                      className="flex items-center gap-xs px-md py-sm bg-primary text-on-primary font-label-caps text-label-caps rounded-lg hover:bg-primary-container transition-colors disabled:opacity-50"
                    >
                      {generating === p.id ? (
                        <>
                          <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                          GENERATING...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">download</span>
                          GENERATE
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end mt-lg">
              <button onClick={() => setShowGenerate(false)} className="px-lg py-md border border-outline-variant font-label-caps text-label-caps rounded-lg hover:bg-surface-container transition-colors">
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined text-primary text-[48px] animate-spin">progress_activity</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-[64px] text-outline-variant">description</span>
          <h3 className="font-headline-md text-headline-md mt-md">No reports generated</h3>
          <p className="font-body-sm text-on-surface-variant mt-xs mb-lg">Click "Generate Report" to create a PDF from your project data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {reports.map((r) => (
            <div key={r.id} className="bg-surface-container-lowest border border-outline-variant p-lg hover:border-primary transition-colors flex flex-col">
              <div className="flex items-start justify-between mb-md">
                <span className="material-symbols-outlined text-primary text-[32px]">picture_as_pdf</span>
                <span className="font-label-caps text-[10px] text-on-surface-variant">{r.createdAt.slice(0,10)}</span>
              </div>
              <h3 className="font-title-sm text-title-sm mb-xs">{r.title}</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-md flex-1">{r.summary ?? "No summary available."}</p>
              <div className="flex items-center justify-between pt-sm border-t border-outline-variant">
                <Link href={`/dashboard/projects/${r.project.id}`} className="font-label-caps text-[11px] text-secondary hover:underline">
                  {r.project.name}
                </Link>
                <button
                  onClick={() => generateReport(r.project.id)}
                  disabled={generating === r.project.id}
                  className="flex items-center gap-xs text-primary font-label-caps text-[11px] hover:underline disabled:opacity-50"
                >
                  {generating === r.project.id ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      GENERATING...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      DOWNLOAD PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
