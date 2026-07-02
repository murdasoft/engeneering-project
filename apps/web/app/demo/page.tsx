"use client";

import { useState, useCallback, useEffect } from "react";

interface Detection {
  class: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  severity?: string;
}

interface AnalysisResult {
  image_width: number;
  image_height: number;
  detections: Detection[];
  annotated_image: string;
  processing_time: number;
  model_version: string;
  summary?: { total: number; high: number; medium: number; low: number };
}

const DEFECT_KNOWLEDGE: Record<string, {
  name: string;
  type: string;
  causes: string[];
  whyNN: string;
  norms: string;
  limits: string;
  danger: string;
  actions: string[];
  severityText: Record<string, string>;
}> = {
  Crack: {
    name: "Crack / Treshchina",
    type: "Mechanical defect — violation of material monolithicity",
    causes: [
      "Excess of tensile stresses over material strength",
      "Uneven foundation settlement",
      "Temperature-humidity deformations",
      "Impact and vibration loads",
      "Rebar corrosion expansion",
      "Concrete shrinkage during curing",
    ],
    whyNN:
      "The neural network (YOLOv8) detected this region because it exhibits characteristic visual patterns of cracks: " +
      "dark linear discontinuities with high contrast against the background, narrow elongated shape, and typical orientation. " +
      "The model was trained on thousands of annotated images of concrete and masonry cracks, learning to recognize " +
      "their texture, geometry, and local gradient patterns. Higher confidence (>75%) means the visual signature closely " +
      "matches known crack patterns in the training dataset.",
    norms: "SP 13-102-2003, GOST 31937-2011, SNiP 2.03.01-84*",
    limits:
      "Maximum allowable crack width: normal conditions — 0.3 mm; aggressive environment — 0.1 mm",
    danger:
      "Cracks wider than 0.3 mm indicate potential loss of load-bearing capacity. Hairline cracks (<0.1 mm) require monitoring. " +
      "Through-cracks (penetrating the full section) require immediate structural engineer assessment.",
    actions: [
      "1. Install crack gauges (mayaki) to monitor crack width dynamics over time.",
      "2. Perform instrumental inspection with feeler gauge and crack meter.",
      "3. If width > 0.3 mm: inject with cement slurry or epoxy resin.",
      "4. For active (growing) cracks: perform structural calculation accounting for the defect.",
      "5. Document in the building technical condition log.",
    ],
    severityText: {
      high: "CRITICAL — immediate intervention required",
      medium: "SIGNIFICANT — repair within 30 days",
      low: "MINOR — schedule monitoring",
    },
  },
  Spalling: {
    name: "Spalling / Skol",
    type: "Destructive defect — loss of surface material",
    causes: [
      "Rebar corrosion with expansion of rust products",
      "Freeze-thaw cycling",
      "Mechanical impact or abrasion",
      "Concrete carbonation",
      "Poor casting/compaction technology",
    ],
    whyNN:
      "The model identified a spall because the region shows missing material, exposed aggregates or rebar, " +
      "irregular surface geometry, and sharp edges contrasting with the surrounding intact surface. " +
      "YOLOv8 learned these patterns from training images where spalls were annotated with bounding boxes.",
    norms: "SP 13-102-2003, GOST 31937-2011, STO NOSTROY 2.7.64-2012",
    limits: "Spalling depth > 20 mm or exposed rebar = critical defect",
    danger:
      "Exposed rebar undergoes active corrosion, reducing load-bearing capacity. If spalling area exceeds 10% " +
      "of the element cross-section, immediate structural evaluation is required.",
    actions: [
      "1. Determine spalling depth and check for exposed rebar.",
      "2. Remove loose material from the damaged zone.",
      "3. Apply anti-corrosion treatment to exposed rebar.",
      "4. Fill with repair mortar (Emaco, Sika MonoTop, Cemax).",
      "5. Apply hydrophobic protective coating.",
    ],
    severityText: {
      high: "CRITICAL — exposed rebar or deep spall",
      medium: "SIGNIFICANT — shallow spall, no rebar exposed",
      low: "MINOR — surface blemish",
    },
  },
  default: {
    name: "Unknown defect",
    type: "Surface anomaly detected by neural network",
    causes: ["Requires detailed instrumental inspection to determine root cause."],
    whyNN:
      "The neural network flagged this region because its visual features (texture, color, shape) deviate from " +
      "normal surface patterns learned during training. The exact type may require expert confirmation.",
    norms: "GOST 31937-2011, SP 13-102-2003",
    limits: "Determined by project and applicable normative documents",
    danger: "Requires additional inspection to assess hazard level.",
    actions: [
      "1. Conduct instrumental inspection by structural engineer.",
      "2. Document with photographs and measurements.",
    ],
    severityText: {
      high: "CRITICAL",
      medium: "SIGNIFICANT",
      low: "MINOR",
    },
  },
};

function getKnowledge(cls: string) {
  return DEFECT_KNOWLEDGE[cls] || DEFECT_KNOWLEDGE.default;
}

function severityLabel(conf: number): string {
  if (conf >= 0.75) return "high";
  if (conf >= 0.45) return "medium";
  return "low";
}

function severityColor(sev: string): string {
  if (sev === "high") return "#ef4444";
  if (sev === "medium") return "#f59e0b";
  return "#22c55e";
}

export default function DemoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>("");
  const [pixelScale, setPixelScale] = useState("");
  const [environment, setEnvironment] = useState("atmospheric");
  const [aggression, setAggression] = useState("normal");
  const [projectName, setProjectName] = useState("");
  const [inspector, setInspector] = useState("");
  const [location, setLocation] = useState("");

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError("");
    setResult(null);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const blob = items[i].getAsFile();
        if (blob) {
          setFile(blob);
          setError("");
          setResult(null);
          const reader = new FileReader();
          reader.onloadend = () => setPreview(reader.result as string);
          reader.readAsDataURL(blob);
        }
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const params = new URLSearchParams();
      if (pixelScale) params.set("pixel_scale_mm", pixelScale);
      if (environment) params.set("environment", environment);
      if (aggression) params.set("aggression", aggression);

      const res = await fetch(`/api/ml/predict?${params.toString()}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Error ${res.status}`);
      }
      const data: AnalysisResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const params = new URLSearchParams();
      if (pixelScale) params.set("pixel_scale_mm", pixelScale);
      if (environment) params.set("environment", environment);
      if (aggression) params.set("aggression", aggression);
      if (projectName) params.set("project_name", projectName);
      if (inspector) params.set("inspector", inspector);
      if (location) params.set("location", location);

      const res = await fetch(`/api/ml/report?${params.toString()}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Error ${res.status}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "InspectAI_Report.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Report generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>InspectAI — Structural Defect Analysis</h1>
      <p style={{ color: "#94a3b8", marginBottom: 24 }}>
        Upload a photo of a concrete or masonry structure. The AI will detect cracks, spalling, and other defects with detailed engineering assessment.
      </p>

      <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        <label style={{ display: "block", padding: 16, border: "2px dashed #334155", borderRadius: 8, cursor: "pointer" }}>
          <input type="file" accept="image/*" onChange={onFileChange} style={{ display: "none" }} />
          <div style={{ textAlign: "center", color: "#94a3b8" }}>
            {file ? file.name : "Click to upload or paste image (Ctrl+V / Cmd+V)"}
          </div>
        </label>

        {preview && (
          <img src={preview} alt="preview" style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #334155" }} />
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <input placeholder="Pixel scale (mm/px)" value={pixelScale} onChange={(e) => setPixelScale(e.target.value)} style={inputStyle} />
          <select value={environment} onChange={(e) => setEnvironment(e.target.value)} style={inputStyle}>
            <option value="atmospheric">Atmospheric</option>
            <option value="aggressive">Aggressive</option>
            <option value="indoor">Indoor</option>
          </select>
          <select value={aggression} onChange={(e) => setAggression(e.target.value)} style={inputStyle}>
            <option value="normal">Normal</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <input placeholder="Project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} style={inputStyle} />
          <input placeholder="Inspector name" value={inspector} onChange={(e) => setInspector(e.target.value)} style={inputStyle} />
          <input placeholder="Location / address" value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={analyze} disabled={!file || loading} style={{ ...btnStyle, opacity: !file || loading ? 0.6 : 1 }}>
            {loading ? "Analyzing..." : "Analyze Image"}
          </button>
          <button onClick={downloadReport} disabled={!file || loading} style={{ ...btnStyle, background: "#0ea5e9", opacity: !file || loading ? 0.6 : 1 }}>
            {loading ? "Generating PDF..." : "Download PDF Report"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#450a0a", borderRadius: 8, color: "#fca5a5", marginBottom: 24 }}>{error}</div>
      )}

      {result && <ResultsPanel result={result} />}
    </div>
  );
}

function ResultsPanel({ result }: { result: AnalysisResult }) {
  const summary = result.summary || { total: 0, high: 0, medium: 0, low: 0 };
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div style={{ padding: 16, background: "#1e293b", borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Analysis Results</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
          <StatBox label="Total defects" value={summary.total} />
          <StatBox label="Critical" value={summary.high} color="#ef4444" />
          <StatBox label="Significant" value={summary.medium} color="#f59e0b" />
          <StatBox label="Minor" value={summary.low} color="#22c55e" />
        </div>
        <p style={{ color: "#94a3b8", fontSize: 14 }}>
          Image size: {result.image_width} × {result.image_height} px | Processing time: {result.processing_time.toFixed(2)}s | Model: {result.model_version}
        </p>
        {result.annotated_image && (
          <img
            src={`data:image/jpeg;base64,${result.annotated_image}`}
            alt="annotated"
            style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #334155", marginTop: 12 }}
          />
        )}
      </div>

      <div>
        <h2>Detected Defects — Detailed Engineering Analysis</h2>
        {result.detections.length === 0 && (
          <p style={{ color: "#94a3b8" }}>No defects detected. The structure appears to be in normal condition per GOST 31937-2011.</p>
        )}
        {result.detections.map((det, idx) => (
          <DefectCard key={idx} index={idx + 1} detection={det} />
        ))}
      </div>

      <div style={{ padding: 16, background: "#1e293b", borderRadius: 8, color: "#94a3b8", fontSize: 14 }}>
        <strong style={{ color: "#fca5a5" }}>Disclaimer:</strong> This is a preliminary visual assessment generated by an automated AI system (YOLOv8). 
        It does <strong>not</strong> replace a full instrumental engineering inspection performed by a licensed structural engineer per GOST 31937-2011 and SP 13-102-2003.
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ padding: 12, background: "#0f172a", borderRadius: 8, textAlign: "center" }}>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || "#e2e8f0" }}>{value}</div>
    </div>
  );
}

function DefectCard({ index, detection }: { index: number; detection: Detection }) {
  const sev = detection.severity || severityLabel(detection.confidence);
  const knowledge = getKnowledge(detection.class);
  const color = severityColor(sev);

  return (
    <div style={{ marginBottom: 20, padding: 16, background: "#1e293b", borderRadius: 8, borderLeft: `4px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>
          #{index} {knowledge.name}
        </h3>
        <span style={{ padding: "4px 10px", borderRadius: 999, background: color, color: "#fff", fontSize: 12, fontWeight: 700 }}>
          {knowledge.severityText[sev] || sev.toUpperCase()} — {(detection.confidence * 100).toFixed(0)}%
        </span>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <InfoRow label="Defect Type" value={knowledge.type} />
        <InfoRow label="Position (top-left)" value={`x = ${Math.round(detection.bbox.x)} px,  y = ${Math.round(detection.bbox.y)} px`} />
        <InfoRow label="Bounding Box Size" value={`${Math.round(detection.bbox.width)} × ${Math.round(detection.bbox.height)} px`} />
        <InfoRow label="Applicable Standards" value={knowledge.norms} />
        <InfoRow label="Normative Limits" value={knowledge.limits} />

        <div>
          <div style={{ fontWeight: 700, color: "#cbd5e1", marginBottom: 4 }}>Why the Neural Network Detected This</div>
          <p style={{ margin: 0, color: "#94a3b8", lineHeight: 1.6 }}>{knowledge.whyNN}</p>
        </div>

        <div>
          <div style={{ fontWeight: 700, color: "#cbd5e1", marginBottom: 4 }}>Probable Causes</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#94a3b8" }}>
            {knowledge.causes.map((c, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{c}</li>
            ))}
          </ul>
        </div>

        <div>
          <div style={{ fontWeight: 700, color: "#fca5a5", marginBottom: 4 }}>Hazard Assessment</div>
          <p style={{ margin: 0, color: "#94a3b8", lineHeight: 1.6 }}>{knowledge.danger}</p>
        </div>

        <div>
          <div style={{ fontWeight: 700, color: "#86efac", marginBottom: 4 }}>Recommended Actions</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#94a3b8" }}>
            {knowledge.actions.map((a, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{a}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <span style={{ color: "#64748b", minWidth: 160 }}>{label}:</span>
      <span style={{ color: "#e2e8f0" }}>{value}</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 6,
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#e2e8f0",
  fontSize: 14,
};

const btnStyle: React.CSSProperties = {
  padding: "12px 20px",
  borderRadius: 6,
  border: "none",
  background: "#22c55e",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 14,
};
