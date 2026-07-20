"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

interface Asset {
  id: string;
  filename: string;
  blobUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  analyses: Array<{ id: string; status: string; confidence: number | null; modelVersion: string | null; createdAt: string; _count: { findings: number } }>;
}

interface AnalysisDetail {
  id: string;
  status: string;
  confidence: number | null;
  modelVersion: string | null;
  parameters: any;
  resultData: any;
  findings: Finding[];
  createdAt: string;
}

interface Finding {
  id: string;
  className: string;
  confidence: number;
  severity: string;
  bbox: { x: number; y: number; width: number; height: number };
  widthMm: number | null;
  heightMm: number | null;
  areaMm2: number | null;
  reviewStatus: string;
  reviewerNote: string | null;
}

const SEV_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 border-red-300",
  HIGH: "bg-orange-100 text-orange-700 border-orange-300",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-300",
  LOW: "bg-emerald-100 text-emerald-700 border-emerald-300",
};

const SEV_LABEL: Record<string, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export default function AssetModal({
  asset,
  projectId,
  analyzing,
  onAnalyze,
  onClose,
}: {
  asset: Asset;
  projectId: string;
  analyzing: string | null;
  onAnalyze: (asset: Asset) => void;
  onClose: () => void;
}) {
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [classFilter, setClassFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showOther, setShowOther] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  function loadLatestAnalysis() {
    const completed = asset.analyses.find((a) => a.status === "COMPLETED");
    if (!completed) return;
    setLoading(true);
    fetch(`/api/analyses/${completed.id}`)
      .then((r) => r.json())
      .then((data) => setAnalysis(data.analysis ?? null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadLatestAnalysis();
  }, [asset]);

  const onImgLoad = () => {
    if (imgRef.current && wrapRef.current) {
      setScale(wrapRef.current.clientWidth / imgRef.current.naturalWidth);
    }
  };

  const allItems = useMemo(() => {
    if (!analysis) return [];
    const items: any[] = [];
    analysis.findings.forEach((f) =>
      items.push({
        id: f.id,
        class: f.className,
        confidence: f.confidence,
        severity: f.severity,
        bbox: f.bbox,
        widthMm: f.widthMm,
        heightMm: f.heightMm,
        areaMm2: f.areaMm2,
        source: "finding",
      })
    );
    if (showOther && analysis.resultData?.detections_detailed) {
      analysis.resultData.detections_detailed.forEach((d: any) => {
        if (d.class === "other") {
          items.push({
            id: `other-${d.bbox?.x ?? 0}-${d.bbox?.y ?? 0}`,
            class: d.class,
            confidence: d.confidence,
            severity: d.severity || "low",
            bbox: d.bbox,
            source: "other",
          });
        }
      });
    }
    return items.filter((d) => {
      if (classFilter !== "all" && d.class !== classFilter) return false;
      if (severityFilter !== "all" && (d.severity || "").toUpperCase() !== severityFilter) return false;
      return true;
    });
  }, [analysis, classFilter, severityFilter, showOther]);

  const classes = useMemo(() => {
    if (!analysis) return [];
    const set = new Set<string>();
    analysis.findings.forEach((f) => set.add(f.className));
    if (analysis.resultData?.detections_detailed) {
      analysis.resultData.detections_detailed.forEach((d: any) => set.add(d.class));
    }
    return Array.from(set).sort();
  }, [analysis]);

  const severities = useMemo(() => {
    if (!analysis) return [];
    const set = new Set<string>();
    analysis.findings.forEach((f) => set.add(f.severity.toUpperCase()));
    if (analysis.resultData?.detections_detailed) {
      analysis.resultData.detections_detailed.forEach((d: any) => {
        if (d.severity) set.add(d.severity.toUpperCase());
      });
    }
    return Array.from(set).sort();
  }, [analysis]);

  const crackcalcUrl = (item: any) => {
    const width = item.widthMm ?? 0;
    const length = item.heightMm ?? 0;
    const params = new URLSearchParams();
    if (width > 0) params.set("width", String(width.toFixed(2)));
    if (length > 0) params.set("length", String(length.toFixed(2)));
    return `/dashboard/tools/crackcalc${params.toString() ? `?${params.toString()}` : ""}`;
  };

  const completedAnalysis = asset.analyses.find((a) => a.status === "COMPLETED");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-lg" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface z-10">
          <span className="material-symbols-outlined">close</span>
        </button>

        <h3 className="font-headline-md text-headline-md mb-md">{asset.filename}</h3>
        <p className="font-body-sm text-on-surface-variant mb-lg">
          Uploaded {new Date(asset.createdAt).toLocaleString()}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
          <div ref={wrapRef} className="relative rounded-lg overflow-hidden bg-surface-container">
            <img ref={imgRef} src={asset.blobUrl} alt={asset.filename} className="w-full h-auto block" onLoad={onImgLoad} />
            {allItems.map((d, i) => {
              const sev = (d.severity || "low").toUpperCase();
              const color = d.class === "other" ? "bg-slate-400/60" : sev === "CRITICAL" ? "bg-red-500/50" : sev === "HIGH" ? "bg-orange-500/50" : sev === "MEDIUM" ? "bg-amber-500/50" : "bg-emerald-500/50";
              return (
                <div
                  key={d.id || i}
                  className={`absolute border-2 border-white/80 ${color}`}
                  style={{
                    left: d.bbox.x * scale,
                    top: d.bbox.y * scale,
                    width: d.bbox.width * scale,
                    height: d.bbox.height * scale,
                  }}
                  title={`${d.class} ${(d.confidence * 100).toFixed(0)}%`}
                />
              );
            })}
          </div>

          <div className="space-y-md">
            {!completedAnalysis ? (
              <button
                onClick={() => onAnalyze(asset)}
                disabled={analyzing === asset.id}
                className="w-full py-md bg-primary text-on-primary font-label-caps text-label-caps rounded-lg hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center justify-center gap-xs"
              >
                {analyzing === asset.id ? (
                  <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>ANALYZING...</>
                ) : (
                  <><span className="material-symbols-outlined text-[18px]">psychology</span>RUN AI ANALYSIS</>
                )}
              </button>
            ) : (
              <div className="p-md bg-surface-container border border-outline-variant rounded-lg">
                <div className="flex justify-between items-center mb-sm">
                  <span className="font-label-caps text-[10px] px-sm py-xs rounded bg-primary/10 text-primary">COMPLETED</span>
                  <span className="font-mono-data text-[11px] text-on-surface-variant">{completedAnalysis.modelVersion ?? "—"}</span>
                </div>
                <div className="flex gap-lg mb-md">
                  <div>
                    <p className="font-label-caps text-[10px] text-on-surface-variant">FINDINGS</p>
                    <p className="font-bold text-lg">{completedAnalysis._count.findings}</p>
                  </div>
                  {completedAnalysis.confidence !== null && (
                    <div>
                      <p className="font-label-caps text-[10px] text-on-surface-variant">CONFIDENCE</p>
                      <p className="font-bold text-lg">{(completedAnalysis.confidence * 100).toFixed(0)}%</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-sm mb-md">
                  <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="px-sm py-xs bg-surface-container-lowest border border-outline-variant rounded font-body-sm text-body-sm">
                    <option value="all">All classes</option>
                    {classes.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                  <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="px-sm py-xs bg-surface-container-lowest border border-outline-variant rounded font-body-sm text-body-sm">
                    <option value="all">All severities</option>
                    {severities.map((s) => (<option key={s} value={s}>{SEV_LABEL[s] || s}</option>))}
                  </select>
                  <label className="flex items-center gap-xs text-sm text-on-surface-variant cursor-pointer">
                    <input type="checkbox" checked={showOther} onChange={(e) => setShowOther(e.target.checked)} />
                    Show other
                  </label>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <span className="material-symbols-outlined text-primary text-[32px] animate-spin">progress_activity</span>
                  </div>
                ) : allItems.length === 0 ? (
                  <p className="text-sm text-on-surface-variant text-center py-8">No findings match the current filters.</p>
                ) : (
                  <div className="space-y-sm max-h-[360px] overflow-y-auto pr-xs">
                    {allItems.map((d, i) => {
                      const sev = (d.severity || "low").toUpperCase();
                      const sevClass = SEV_COLORS[sev] || SEV_COLORS.LOW;
                      const isOther = d.class === "other";
                      return (
                        <div key={d.id || i} className="p-sm bg-surface-container-lowest border border-outline-variant rounded flex flex-wrap items-start justify-between gap-sm">
                          <div className="flex-1 min-w-0">
                            <p className="font-body-sm font-bold capitalize truncate">{d.class}</p>
                            <p className="text-[11px] text-on-surface-variant">
                              {Math.round(d.bbox?.width || 0)}×{Math.round(d.bbox?.height || 0)} px · {(d.confidence * 100).toFixed(0)}%
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-sm py-xs rounded border ${isOther ? "bg-slate-100 text-slate-600 border-slate-300" : sevClass}`}>
                            {isOther ? "OTHER" : SEV_LABEL[sev] || sev}
                          </span>
                          {!isOther && d.class.toLowerCase().includes("crack") && (
                            <a
                              href={crackcalcUrl(d)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary text-[11px] font-bold hover:underline whitespace-nowrap"
                            >
                              CrackCalc
                            </a>
                          )}
                          {!isOther && (
                            <button
                              onClick={() => { setReviewingId(d.id); setReviewNote(d.reviewerNote || ""); }}
                              className="text-on-surface-variant hover:text-primary text-[11px]"
                              title="Review"
                            >
                              <span className="material-symbols-outlined text-[16px]">rate_review</span>
                            </button>
                          )}
                        {reviewingId === d.id && (
                          <div className="w-full mt-sm space-y-sm border-t border-outline-variant pt-sm">
                            <textarea
                              value={reviewNote}
                              onChange={(e) => setReviewNote(e.target.value)}
                              placeholder="Add expert note..."
                              className="w-full px-sm py-xs bg-surface-container border border-outline-variant rounded text-[11px] focus:border-primary focus:outline-none"
                              rows={2}
                            />
                            <div className="flex gap-xs">
                              <button
                                onClick={async () => {
                                  await fetch(`/api/findings/${d.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewStatus: "CONFIRMED", reviewerNote: reviewNote }) });
                                  setReviewingId(null);
                                  loadLatestAnalysis();
                                }}
                                className="px-sm py-xs bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold"
                              >Confirm</button>
                              <button
                                onClick={async () => {
                                  await fetch(`/api/findings/${d.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewStatus: "REJECTED", reviewerNote: reviewNote }) });
                                  setReviewingId(null);
                                  loadLatestAnalysis();
                                }}
                                className="px-sm py-xs bg-red-100 text-red-700 rounded text-[10px] font-bold"
                              >Reject</button>
                              <button
                                onClick={() => setReviewingId(null)}
                                className="px-sm py-xs bg-surface-container text-on-surface-variant rounded text-[10px] font-bold"
                              >Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
