"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";

type Detection = {
  class: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number; polygon?: number[][] | null };
  width_mm: number;
  length_mm: number;
  area_mm2: number;
  severity: string;
};

type Result = {
  detections: Detection[];
  annotated_image: string;
  processing_time: number;
  model_version: string;
  summary: {
    total: number;
    high: number;
    medium: number;
    low: number;
    class_counts: Record<string, number>;
    overall_condition: string;
  };
};

const SV = {
  critical: { c: "#dc2626", bg: "#fef2f2", l: "Critical" },
  high: { c: "#ea580c", bg: "#fff7ed", l: "High" },
  medium: { c: "#d97706", bg: "#fffbeb", l: "Medium" },
  low: { c: "#16a34a", bg: "#f0fdf4", l: "Low" },
};

const CC: Record<string, string> = {
  CRITICAL: "#dc2626", SEVERE: "#ea580c", LIMITED: "#d97706", NORMAL: "#16a34a", GOOD: "#16a34a",
};

export default function DemoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "crack" | "other">("all");
  const [showBoxes, setShowBoxes] = useState(true);
  const [scale, setScale] = useState(1);
  const [pixelScale, setPixelScale] = useState(0.05);
  const [threshold, setThreshold] = useState(0.15);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) { setError("Please upload an image"); return; }
    if (f.size > 10 * 1024 * 1024) { setError("Max 10 MB"); return; }
    setError(null); setFile(f); setResult(null); setActive(null);
    const r = new FileReader();
    r.onload = (e) => setPreview(e.target?.result as string);
    r.readAsDataURL(f);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const analyze = async () => {
    if (!file) return;
    setLoading(true); setError(null);
    const form = new FormData(); form.append("file", file);
    const params = new URLSearchParams();
    params.set("pixel_scale_mm", String(pixelScale));
    params.set("threshold", String(threshold));
    try {
      const res = await fetch(`/api/ml/predict?${params.toString()}`, { method: "POST", body: form });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.detail || `Error ${res.status}`); setLoading(false); return; }
      setResult(await res.json());
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  const downloadPdf = async () => {
    if (!file) return;
    const form = new FormData(); form.append("file", file);
    const params = new URLSearchParams();
    params.set("pixel_scale_mm", String(pixelScale));
    params.set("threshold", String(threshold));
    try {
      const res = await fetch(`/api/ml/report?${params.toString()}`, { method: "POST", body: form });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "InspectAI_Report.pdf"; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const onImgLoad = () => {
    if (imgRef.current && wrapRef.current) {
      setScale(wrapRef.current.clientWidth / imgRef.current.naturalWidth);
    }
  };

  const visible = useMemo(() => {
    if (!result) return [];
    const list = result.detections.filter((d) => {
      const c = d.class.toLowerCase();
      return !c.includes("background") && !c.includes("wall") && !c.includes("concrete");
    });
    if (filter === "all") return list;
    const isCrack = (c: string) => /crack|fissure|fracture/.test(c.toLowerCase());
    return filter === "crack" ? list.filter((d) => isCrack(d.class)) : list.filter((d) => !isCrack(d.class));
  }, [result, filter]);

  const counts = useMemo(() => {
    const c = { all: visible.length, crack: 0, other: 0 };
    visible.forEach((d) => (/crack|fissure|fracture/.test(d.class.toLowerCase()) ? c.crack++ : c.other++));
    return c;
  }, [visible]);

  const reset = () => { setFile(null); setPreview(null); setResult(null); setError(null); setActive(null); setScale(1); };

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", background: "#f4f6f8", color: "#111827", minHeight: "100vh" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .anim-fade { animation: fadeIn 0.35s ease both }
        .anim-up { animation: slideUp 0.4s ease both }
        .hover-lift { transition: transform .2s, box-shadow .2s }
        .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(0,0,0,0.08) }
        .drop-active { border-color: #0f766e !important; background: rgba(15,118,110,0.04) !important }
        @media (max-width: 768px) {
          .demo-grid { grid-template-columns: 1fr !important }
          .demo-header { padding: 12px 16px !important }
          .demo-nav { display: none !important }
        }
      `}</style>

      <header className="demo-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #0f766e, #0d5c56)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, boxShadow: "0 4px 12px rgba(15,118,110,0.25)" }}>I</div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px" }}>InspectAI</span>
        </Link>
        <nav className="demo-nav" style={{ display: "flex", gap: 24, fontSize: 13, color: "#4b5563", fontWeight: 600 }}>
          <Link href="/#how" style={{ textDecoration: "none", color: "inherit" }}>How it works</Link>
          <Link href="/#types" style={{ textDecoration: "none", color: "inherit" }}>Defect types</Link>
          <Link href="/#cases" style={{ textDecoration: "none", color: "inherit" }}>Use cases</Link>
          <Link href="/#faq" style={{ textDecoration: "none", color: "inherit" }}>FAQ</Link>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ padding: "6px 12px", fontSize: 12, color: "#0f766e", fontWeight: 700, background: "#f0fdf4", borderRadius: 8 }}>Demo</span>
          <button style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #0f766e, #0d5c56)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(15,118,110,0.2)" }}>Sign in</button>
        </div>
      </header>

      <main style={{ maxWidth: 1160, margin: "0 auto", padding: "32px 24px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.02em", color: "#111827" }}>AI Defect Detection</h1>
          <p style={{ fontSize: 15, color: "#6b7280", margin: 0 }}>Upload a surface photo — AI finds and measures defects</p>
        </div>

        <div className="demo-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, alignItems: "start" }}>
          <div>
            {!preview ? (
              <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop} onClick={() => fileRef.current?.click()} className={dragOver ? "drop-active" : ""} style={{ border: "2px dashed #d1d5db", borderRadius: 14, padding: "52px 32px", textAlign: "center", cursor: "pointer", background: "#fff", transition: "border-color 0.2s, background 0.2s" }}>
                <div style={{ width: 56, height: 56, margin: "0 auto 16px", background: "#f0fdf4", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>Drop photo here</p>
                <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>or click to browse</p>
                <p style={{ fontSize: 11, color: "#d1d5db", marginTop: 6 }}>JPG, PNG, WEBP · up to 10 MB</p>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div className="anim-fade" style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb" }}>
                <div ref={wrapRef} style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#f3f4f6", lineHeight: 0 }}>
                  <img ref={imgRef} src={preview} alt="Preview" style={{ width: "100%", height: "auto", display: "block" }} onLoad={onImgLoad} />
                  {showBoxes && visible.map((d, i) => {
                    const s = SV[d.severity as keyof typeof SV] || SV.low;
                    const a = active === i;
                    const dim = active !== null && !a;
                    return d.bbox.polygon?.length ? (
                      <svg
                        key={i}
                        onMouseEnter={() => setActive(i)}
                        onMouseLeave={() => setActive(null)}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: dim ? 0.25 : 0.9, transition: "opacity .15s ease" }}
                        viewBox={`0 0 ${imgRef.current?.naturalWidth || 1} ${imgRef.current?.naturalHeight || 1}`}
                        preserveAspectRatio="none"
                      >
                        <polygon points={d.bbox.polygon.map((p) => `${p[0]},${p[1]}`).join(" ")} fill={a ? `${s.c}35` : `${s.c}20`} stroke={s.c} strokeWidth="3" />
                      </svg>
                    ) : (
                      <div key={i} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} style={{
                        position: "absolute", left: d.bbox.x * scale, top: d.bbox.y * scale,
                        width: d.bbox.width * scale, height: d.bbox.height * scale,
                        border: `2.5px solid ${s.c}`, background: "transparent",
                        opacity: dim ? 0.25 : 0.9, transition: "all .15s ease", cursor: "pointer", borderRadius: 4,
                      }} />
                    );
                  })}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4b5563", fontWeight: 600 }}>
                      Scale:
                      <input
                        type="number"
                        step="0.001"
                        value={pixelScale}
                        onChange={(e) => setPixelScale(parseFloat(e.target.value) || 0)}
                        style={{ width: 60, padding: "4px 6px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12 }}
                      />
                      mm/px
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4b5563", fontWeight: 600 }}>
                      Threshold:
                      <input
                        type="range"
                        min="0.05"
                        max="0.95"
                        step="0.05"
                        value={threshold}
                        onChange={(e) => setThreshold(parseFloat(e.target.value))}
                        style={{ width: 80, accentColor: "#0f766e" }}
                      />
                      {threshold.toFixed(2)}
                    </label>
                    {!result && (
                      <button onClick={analyze} disabled={loading} style={{
                        padding: "10px 22px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #0f766e, #0d5c56)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1, display: "inline-flex", alignItems: "center", boxShadow: "0 4px 12px rgba(15,118,110,0.2)",
                      }}>
                        {loading && <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block", marginRight: 8 }} />}
                        {loading ? "Analyzing..." : "Analyze"}
                      </button>
                    )}
                    {result && (
                      <button onClick={downloadPdf} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        PDF
                      </button>
                    )}
                    <button onClick={reset} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Reset</button>
                  </div>
                  {result && (
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#4b5563", fontWeight: 600, cursor: "pointer" }}>
                      <input type="checkbox" checked={showBoxes} onChange={(e) => setShowBoxes(e.target.checked)} style={{ accentColor: "#0f766e" }} />
                      Show boxes
                    </label>
                  )}
                </div>
                {error && <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#b91c1c", fontSize: 13, fontWeight: 600 }}>{error}</div>}
              </div>
            )}
          </div>

          <div>
            {!result && !loading && (
              <div style={{ background: "#fff", borderRadius: 14, padding: "48px 24px", textAlign: "center", border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
                <div style={{ width: 52, height: 52, margin: "0 auto 14px", background: "#f9fafb", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 4px" }}>No analysis yet</p>
                <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Upload a photo and click Analyze</p>
              </div>
            )}

            {loading && (
              <div style={{ background: "#fff", borderRadius: 14, padding: 48, textAlign: "center", border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
                <div style={{ width: 44, height: 44, margin: "0 auto 14px", border: "3px solid #e5e7eb", borderTopColor: "#0f766e", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
                <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Analyzing image...</p>
                <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>Running AI ensemble</p>
              </div>
            )}

            {result && (
              <div className="anim-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#111827" }}>Result summary</h3>
                    <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{result.processing_time.toFixed(1)}s &middot; {result.model_version}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                    <div style={{ background: "#f9fafb", borderRadius: 10, padding: "14px 10px", textAlign: "center" }}>
                      <p style={{ fontSize: 26, fontWeight: 800, color: "#111827", margin: 0 }}>{result.summary.total}</p>
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0", fontWeight: 600 }}>Defects found</p>
                    </div>
                    <div style={{ background: result.summary.high > 0 ? "#fef2f2" : "#f9fafb", borderRadius: 10, padding: "14px 10px", textAlign: "center" }}>
                      <p style={{ fontSize: 26, fontWeight: 800, color: result.summary.high > 0 ? "#dc2626" : "#111827", margin: 0 }}>{result.summary.high}</p>
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0", fontWeight: 600 }}>Critical</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: `${CC[result.summary.overall_condition] || "#9ca3af"}10`, borderLeft: `3px solid ${CC[result.summary.overall_condition] || "#9ca3af"}` }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: CC[result.summary.overall_condition] || "#374151" }}>Condition: {result.summary.overall_condition}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, padding: 4, background: "#f3f4f6", borderRadius: 10 }}>
                  {(["all","crack","other"] as const).map((f) => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                      flex: 1, padding: "7px 0", borderRadius: 8, border: "none", background: filter === f ? "#fff" : "transparent",
                      color: filter === f ? "#111827" : "#6b7280", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.06)" : "none", transition: "all .15s",
                    }}>
                      {f === "all" ? `All (${counts.all})` : f === "crack" ? `Cracks (${counts.crack})` : `Other (${counts.other})`}
                    </button>
                  ))}
                </div>

                <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 14px", color: "#111827" }}>Detected defects</h3>
                  {visible.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", margin: "16px 0" }}>No defects match the current filter.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {visible.map((d, i) => {
                        const s = SV[d.severity as keyof typeof SV] || SV.low;
                        const a = active === i;
                        return (
                          <div key={i} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} className="hover-lift" style={{
                            padding: "12px 14px", borderRadius: 10, background: a ? "#f9fafb" : "#fff", border: "1px solid #f3f4f6",
                            display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "background .15s",
                          }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: s.c }}>{(d.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111827", textTransform: "capitalize", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.class}</p>
                              <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                                {Math.round(d.bbox.width)}&times;{Math.round(d.bbox.height)} px
                                {d.width_mm > 0 && ` &middot; ${d.width_mm.toFixed(1)} mm`}
                                {d.length_mm > 0 && ` / ${d.length_mm.toFixed(1)} mm`}
                              </p>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: s.bg, color: s.c, textTransform: "uppercase", flexShrink: 0 }}>{s.l}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 8, background: "#fffbeb", border: "1px solid #fde68a", display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <p style={{ fontSize: 11, color: "#92400e", margin: 0, lineHeight: 1.4 }}>Preliminary visual assessment. Not a substitute for an engineering inspection.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
