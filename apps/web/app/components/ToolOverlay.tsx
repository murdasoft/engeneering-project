"use client";

import { useState } from "react";
import { DetectionOverlay } from "@/app/components/DetectionOverlay";

interface FindingLike {
  id: string;
  className: string;
  confidence: number;
  severity: string;
  bbox: { x: number; y: number; width: number; height: number; polygon?: number[][] | null };
  widthMm: number | null;
  heightMm: number | null;
}

const TOOLS: Record<string, { name: string; url: string }> = {
  crackcalc: { name: "CrackCalc", url: "/tools-assets/crackcalc" },
  loadbear: { name: "LoadBear", url: "/tools-assets/loadbear" },
  concretemix: { name: "ConcreteMix", url: "/tools-assets/concretemix" },
  rebardesign: { name: "RebarDesign", url: "/tools-assets/rebardesign" },
  normbase: { name: "NormBase", url: "/tools-assets/normbase" },
};

const SEV_LABEL: Record<string, string> = {
  CRITICAL: "Critical", HIGH: "High", MEDIUM: "Medium", LOW: "Low",
};

export function ToolOverlay({
  tool,
  search,
  imageUrl,
  finding,
  onClose,
}: {
  tool: string;
  search?: string;
  imageUrl: string;
  finding: FindingLike;
  onClose: () => void;
}) {
  const meta = TOOLS[tool] ?? { name: tool, url: "" };
  const [loaded, setLoaded] = useState(false);

  const sp = new URLSearchParams(search ? search.replace(/^\?/, "") : "");
  sp.set("embed", "1");
  const src = meta.url ? `${meta.url}?${sp.toString()}` : "";

  const sev = (finding.severity || "low").toUpperCase();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-surface-container-lowest border border-outline-variant rounded-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-md py-sm border-b border-outline-variant">
          <div className="flex items-center gap-md">
            <button onClick={onClose} className="text-on-surface-variant hover:text-primary flex items-center gap-xs font-label-caps text-[11px]">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              BACK
            </button>
            <span className="text-outline-variant">/</span>
            <h3 className="font-headline-sm text-headline-sm">{meta.name}</h3>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
          <div className="lg:col-span-1 border-r border-outline-variant overflow-y-auto p-md bg-surface-container-low">
            <DetectionOverlay
              imageUrl={imageUrl}
              alt="Finding"
              items={[{
                id: finding.id,
                class: finding.className,
                confidence: finding.confidence,
                severity: finding.severity,
                bbox: finding.bbox,
              }]}
              className="rounded-lg mb-md"
            />

            <div className="space-y-sm">
              <p className="font-body-sm text-body-sm text-on-surface-variant uppercase">Measured finding</p>
              <p className="font-headline-sm text-headline-sm capitalize">{finding.className}</p>
              <div className="grid grid-cols-2 gap-sm text-sm">
                <div className="p-sm bg-surface-container-lowest border border-outline-variant rounded">
                  <p className="text-[10px] text-on-surface-variant">WIDTH</p>
                  <p className="font-mono-data font-bold">{finding.widthMm ? `${finding.widthMm.toFixed(2)} mm` : "—"}</p>
                </div>
                <div className="p-sm bg-surface-container-lowest border border-outline-variant rounded">
                  <p className="text-[10px] text-on-surface-variant">LENGTH</p>
                  <p className="font-mono-data font-bold">{finding.heightMm ? `${finding.heightMm.toFixed(2)} mm` : "—"}</p>
                </div>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Confidence: {(finding.confidence * 100).toFixed(0)}% · Severity: {SEV_LABEL[sev] || sev}
              </p>
              {!finding.widthMm && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-sm">
                  Set pixel scale (mm/px) when running analysis for calibrated CrackCalc widths. Without it, mm values are not passed into the tool.
                </p>
              )}
              <button
                onClick={onClose}
                className="mt-md w-full py-sm bg-surface-container text-on-surface-variant font-label-caps text-label-caps rounded-lg border border-outline-variant hover:bg-primary/5 hover:text-primary transition-colors"
              >
                ← Return to results
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 relative bg-surface-container-lowest">
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <span className="material-symbols-outlined text-primary text-[48px] animate-spin">progress_activity</span>
              </div>
            )}
            {src && (
              <iframe
                src={src}
                className="w-full h-full border-0"
                title={meta.name}
                onLoad={() => setLoaded(true)}
                allow="fullscreen"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
