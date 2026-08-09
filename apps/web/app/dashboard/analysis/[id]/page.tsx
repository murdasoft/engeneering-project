"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ToolOverlay } from "@/app/components/ToolOverlay";
import { DetectionOverlay } from "@/app/components/DetectionOverlay";

interface Finding {
  id: string;
  className: string;
  confidence: number;
  severity: string;
  bbox: { x: number; y: number; width: number; height: number; polygon?: number[][] | null };
  widthMm: number | null;
  heightMm: number | null;
  areaMm2: number | null;
  reviewStatus: string;
  reviewerNote: string | null;
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
  asset: { id: string; filename: string; blobUrl: string };
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

const REVIEW_COLORS: Record<string, string> = {
  PENDING: "bg-surface-container text-on-surface-variant",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  EDITED: "bg-blue-100 text-blue-700",
};

export default function AnalysisDetailPage() {
  const params = useParams();
  const analysisId = params.id as string;
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [classFilter, setClassFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showOther, setShowOther] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [activeTool, setActiveTool] = useState<{ tool: string; search: string; finding: any } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  async function loadAnalysis() {
    setLoading(true);
    try {
      const res = await fetch(`/api/analyses/${analysisId}`);
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data.analysis ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalysis();
  }, [analysisId]);

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
        reviewStatus: f.reviewStatus,
        reviewerNote: f.reviewerNote,
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

  const crackcalcSearch = (item: any) => {
    const width = item.widthMm ?? 0;
    const length = item.heightMm ?? 0;
    const params = new URLSearchParams();
    if (width > 0) params.set("width", String(width.toFixed(2)));
    if (length > 0) params.set("length", String(length.toFixed(2)));
    return params.toString() ? `?${params.toString()}` : "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="material-symbols-outlined text-primary text-[48px] animate-spin">progress_activity</span>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant p-xl text-center">
        <span className="material-symbols-outlined text-[64px] text-outline-variant">search_off</span>
        <h2 className="font-headline-md text-headline-md mt-md">Analysis not found</h2>
        <Link href="/dashboard/analysis" className="inline-flex items-center gap-xs text-primary font-bold mt-lg hover:underline">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to analyses
        </Link>
      </div>
    );
  }

  const sevCounts: Record<string, number> = {};
  analysis.findings.forEach((f) => {
    const s = (f.severity || "low").toUpperCase();
    sevCounts[s] = (sevCounts[s] || 0) + 1;
  });

  return (
    <div className="animate-fade-in">
      <header className="mb-xl">
        <Link href="/dashboard/analysis" className="flex items-center gap-xs text-on-surface-variant hover:text-primary font-label-caps text-[11px] mb-xs transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          ALL ANALYSES
        </Link>
        <h2 className="font-display-lg text-display-lg">{analysis.asset.filename}</h2>
        <div className="flex flex-wrap gap-lg mt-xs text-on-surface-variant font-body-sm text-body-sm">
          <span className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">science</span>
            {analysis.modelVersion ?? "—"}
          </span>
          <span className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            {analysis.createdAt.slice(0, 16).replace("T", " ")}
          </span>
          {analysis.confidence !== null && (
            <span className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              {(analysis.confidence * 100).toFixed(0)}% confidence
            </span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <div ref={wrapRef} className="relative rounded-lg overflow-hidden">
          <DetectionOverlay
            imageUrl={analysis.asset.blobUrl}
            alt={analysis.asset.filename}
            items={allItems.map((d) => ({
              id: d.id,
              class: d.class,
              confidence: d.confidence,
              severity: d.severity,
              bbox: d.bbox,
            }))}
            className="rounded-lg"
          />
        </div>

        <div className="space-y-md">
          <div className="p-md bg-surface-container border border-outline-variant rounded-lg">
            <div className="flex justify-between items-center mb-sm">
              <span className={`font-label-caps text-[10px] px-sm py-xs rounded ${analysis.status === "COMPLETED" ? "bg-primary/10 text-primary" : analysis.status === "FAILED" ? "bg-error/10 text-error" : "bg-tertiary/15 text-tertiary"}`}>
                {analysis.status}
              </span>
              <span className="font-mono-data text-[11px] text-on-surface-variant">{analysis.modelVersion ?? "—"}</span>
            </div>
            <div className="flex gap-lg mb-md">
              <div>
                <p className="font-label-caps text-[10px] text-on-surface-variant">FINDINGS</p>
                <p className="font-bold text-lg">{analysis.findings.length}</p>
              </div>
              {analysis.confidence !== null && (
                <div>
                  <p className="font-label-caps text-[10px] text-on-surface-variant">CONFIDENCE</p>
                  <p className="font-bold text-lg">{(analysis.confidence * 100).toFixed(0)}%</p>
                </div>
              )}
              <div>
                <p className="font-label-caps text-[10px] text-on-surface-variant">SEVERITY</p>
                <div className="flex gap-xs mt-xs">
                  {Object.entries(sevCounts).map(([sev, count]) => (
                    <span key={sev} className={`text-[10px] font-bold px-sm py-xs rounded border ${SEV_COLORS[sev] || SEV_COLORS.LOW}`}>
                      {SEV_LABEL[sev] || sev}: {count}
                    </span>
                  ))}
                </div>
              </div>
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

            {allItems.length === 0 ? (
              <div className="text-center py-8">
                {analysis.findings.length === 0 && classFilter === "all" && severityFilter === "all" && showOther ? (
                  <>
                    <span className="material-symbols-outlined text-outline-variant text-[40px]">search_off</span>
                    <p className="text-sm font-bold text-on-surface mt-md">No defects detected</p>
                    <p className="text-xs text-on-surface-variant mt-xs">Try a higher-resolution photo or adjust the pixel scale.</p>
                  </>
                ) : (
                  <p className="text-sm text-on-surface-variant">No findings match the current filters.</p>
                )}
              </div>
            ) : (
              <div className="space-y-sm max-h-[400px] overflow-y-auto pr-xs">
                {allItems.map((d, i) => {
                  const sev = (d.severity || "low").toUpperCase();
                  const sevClass = SEV_COLORS[sev] || SEV_COLORS.LOW;
                  const isOther = d.class === "other";
                  return (
                    <div key={d.id || i} className="p-sm bg-surface-container-lowest border border-outline-variant rounded flex flex-wrap items-start justify-between gap-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-body-sm font-bold capitalize truncate">{d.class}</p>
                        <p className="text-[11px] text-on-surface-variant">
                          {Math.round(d.bbox?.width || 0)}&times;{Math.round(d.bbox?.height || 0)} px &middot; {(d.confidence * 100).toFixed(0)}%
                          {d.widthMm ? ` · ${d.widthMm.toFixed(1)} mm` : ""}
                          {d.heightMm ? ` / ${d.heightMm.toFixed(1)} mm` : ""}
                        </p>
                        {!isOther && d.reviewStatus && d.reviewStatus !== "PENDING" && (
                          <span className={`inline-block mt-xs text-[9px] font-bold px-xs py-xs rounded ${REVIEW_COLORS[d.reviewStatus] || ""}`}>
                            {d.reviewStatus}
                            {d.reviewerNote ? ` · "${d.reviewerNote}"` : ""}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-sm py-xs rounded border ${isOther ? "bg-slate-100 text-slate-600 border-slate-300" : sevClass}`}>
                        {isOther ? "OTHER" : SEV_LABEL[sev] || sev}
                      </span>
                      {!isOther && d.class.toLowerCase().includes("crack") && (
                        <button
                          onClick={() => setActiveTool({ tool: "crackcalc", search: crackcalcSearch(d), finding: d })}
                          className="text-primary text-[11px] font-bold hover:underline whitespace-nowrap"
                        >
                          CrackCalc
                        </button>
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
                                loadAnalysis();
                              }}
                              className="px-sm py-xs bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold"
                            >Confirm</button>
                            <button
                              onClick={async () => {
                                await fetch(`/api/findings/${d.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewStatus: "REJECTED", reviewerNote: reviewNote }) });
                                setReviewingId(null);
                                loadAnalysis();
                              }}
                              className="px-sm py-xs bg-red-100 text-red-700 rounded text-[10px] font-bold"
                            >Reject</button>
                            <button
                              onClick={async () => {
                                await fetch(`/api/findings/${d.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewStatus: "EDITED", reviewerNote: reviewNote }) });
                                setReviewingId(null);
                                loadAnalysis();
                              }}
                              className="px-sm py-xs bg-blue-100 text-blue-700 rounded text-[10px] font-bold"
                            >Edit</button>
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
        </div>
      </div>

      {activeTool && (
        <ToolOverlay
          tool={activeTool.tool}
          search={activeTool.search}
          imageUrl={analysis.asset.blobUrl}
          finding={{
            id: activeTool.finding.id,
            className: activeTool.finding.class,
            confidence: activeTool.finding.confidence,
            severity: activeTool.finding.severity,
            bbox: activeTool.finding.bbox,
            widthMm: activeTool.finding.widthMm,
            heightMm: activeTool.finding.heightMm,
          }}
          onClose={() => setActiveTool(null)}
        />
      )}
    </div>
  );
}
