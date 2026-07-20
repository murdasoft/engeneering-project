"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AnalysisItem {
  id: string;
  status: string;
  confidence: number | null;
  createdAt: string;
  asset: { filename: string; blobUrl: string };
  _count: { findings: number };
}

export default function AnalysisPage() {
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analyses")
      .then((r) => r.json())
      .then((data) => setAnalyses(data.analyses ?? []))
      .finally(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    PENDING: "bg-outline-variant/30 text-outline",
    PROCESSING: "bg-tertiary-fixed text-tertiary-container",
    COMPLETED: "bg-primary/10 text-primary",
    FAILED: "bg-error/10 text-error",
  };

  return (
    <div className="animate-fade-in">
      <header className="mb-xl">
        <p className="font-label-caps text-label-caps text-secondary mb-xs">ANALYSIS ENGINE</p>
        <h2 className="font-display-lg text-display-lg">AI Defect Detection</h2>
        <p className="font-body-md text-on-surface-variant mt-xs">Run and review AI-powered structural defect analyses.</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined text-primary text-[48px] animate-spin">progress_activity</span>
        </div>
      ) : analyses.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-[64px] text-outline-variant">psychology</span>
          <h3 className="font-headline-md text-headline-md mt-md">No analyses yet</h3>
          <p className="font-body-sm text-on-surface-variant mt-xs mb-lg">Upload photos and run AI analysis to see results here.</p>
          <Link href="/dashboard/upload" className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-md font-label-caps text-label-caps rounded-lg hover:bg-primary-container transition-colors">
            <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
            UPLOAD PHOTOS
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {analyses.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/analysis/${a.id}`}
              className="bg-surface-container-lowest border border-outline-variant p-lg hover:border-primary transition-colors group"
            >
              <div className="aspect-video bg-surface-container rounded mb-md overflow-hidden flex items-center justify-center">
                <img src={a.asset.blobUrl} alt={a.asset.filename} className="w-full h-full object-cover" />
              </div>
              <div className="flex justify-between items-start mb-sm">
                <p className="font-mono-data text-mono-data truncate">{a.asset.filename}</p>
                <span className={`px-sm py-xs font-label-caps text-[10px] ${statusColors[a.status]}`}>
                  {a.status}
                </span>
              </div>
              <div className="flex gap-lg text-on-surface-variant font-body-sm text-body-sm">
                <span>{a._count.findings} findings</span>
                {a.confidence !== null && <span>{(a.confidence * 100).toFixed(0)}% conf.</span>}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-xs font-mono-data">
                {new Date(a.createdAt).toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
