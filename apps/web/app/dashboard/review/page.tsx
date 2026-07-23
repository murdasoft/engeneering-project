"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Finding {
  id: string;
  className: string;
  confidence: number;
  severity: string;
  reviewStatus: string;
  analysis: {
    id: string;
    asset: { filename: string; blobUrl: string };
  };
}

export default function ReviewPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");

  useEffect(() => {
    fetch(`/api/findings?status=${filter}`)
      .then((r) => r.json())
      .then((data) => setFindings(data.findings ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  async function updateFinding(id: string, status: string) {
    await fetch(`/api/findings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewStatus: status }),
    });
    setFindings((prev) => prev.filter((f) => f.id !== id));
  }

  const severityColors: Record<string, string> = {
    LOW: "bg-outline-variant/30 text-outline",
    MEDIUM: "bg-tertiary/15 text-tertiary",
    HIGH: "bg-error/15 text-error",
    CRITICAL: "bg-error text-on-error",
  };

  const filters = ["PENDING", "CONFIRMED", "REJECTED", "EDITED"];

  return (
    <div className="animate-fade-in">
      <header className="mb-xl">
        <p className="font-label-caps text-label-caps text-secondary mb-xs">REVIEW QUEUE</p>
        <h2 className="font-display-lg text-display-lg">Findings Review</h2>
        <p className="font-body-md text-on-surface-variant mt-xs">Confirm, reject, or edit AI-detected defects.</p>
      </header>

      <div className="flex flex-wrap gap-xs mb-lg">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setLoading(true); }}
            className={`px-md py-sm font-label-caps text-label-caps rounded-lg transition-colors ${
              filter === f ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-variant"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined text-primary text-[48px] animate-spin">progress_activity</span>
        </div>
      ) : findings.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-[64px] text-outline-variant">fact_check</span>
          <h3 className="font-headline-md text-headline-md mt-md">No findings in review</h3>
          <p className="font-body-sm text-on-surface-variant mt-xs">Run AI analysis on uploaded photos to generate findings.</p>
        </div>
      ) : (
        <div className="space-y-gutter">
          {findings.map((f) => (
            <div key={f.id} className="bg-surface-container-lowest border border-outline-variant p-lg flex flex-col sm:flex-row gap-lg sm:items-center">
              <div className="w-20 h-20 bg-surface-container rounded overflow-hidden flex-shrink-0">
                <img src={f.analysis.asset.blobUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-sm mb-xs">
                  <h3 className="font-title-sm text-title-sm">{f.className}</h3>
                  <span className={`px-sm py-xs font-label-caps text-[10px] ${severityColors[f.severity]}`}>
                    {f.severity}
                  </span>
                </div>
                <p className="font-mono-data text-mono-data text-on-surface-variant">
                  {f.analysis.asset.filename} · {(f.confidence * 100).toFixed(0)}% confidence
                </p>
              </div>
              {filter === "PENDING" && (
                <div className="flex flex-wrap gap-sm">
                  <button
                    onClick={() => updateFinding(f.id, "CONFIRMED")}
                    className="flex items-center gap-xs px-md py-sm bg-primary text-on-primary font-label-caps text-label-caps rounded-lg hover:bg-primary-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    CONFIRM
                  </button>
                  <button
                    onClick={() => updateFinding(f.id, "REJECTED")}
                    className="flex items-center gap-xs px-md py-sm border border-error text-error font-label-caps text-label-caps rounded-lg hover:bg-error/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                    REJECT
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
