"use client";

import { useState, useCallback, useEffect } from "react";

interface EngineeringInfo {
  ru_name: string;
  en_name: string;
  category: string;
  estimated_width_mm: number;
  estimated_length_mm: number;
  estimated_area_cm2: number;
  width_cm: number;
  length_cm: number;
  normative_limit: string;
  is_critical: boolean;
  why_nn_detected: string;
  causes: string[];
  danger_level: string;
  recommended_actions: string[];
  norms: string[];
  concrete_grades_affected: string;
  rebar_impact: string;
  measurement_methods: string[];
  license_required: string;
}

interface Detection {
  class: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  severity?: string;
  engineering?: EngineeringInfo;
}

interface Summary {
  total: number;
  high: number;
  medium: number;
  low: number;
  class_counts: Record<string, number>;
  overall_condition: string;
}

interface AnalysisResult {
  image_width: number;
  image_height: number;
  detections: Detection[];
  annotated_image: string;
  processing_time: number;
  model_version: string;
  detections_detailed?: Detection[];
  summary?: Summary;
}

function severityLabel(s: string): string {
  if (s === "high") return "КРИТИЧЕСКИЙ";
  if (s === "medium") return "ЗНАЧИТЕЛЬНЫЙ";
  return "НЕЗНАЧИТЕЛЬНЫЙ";
}

function severityColor(s: string): string {
  if (s === "high") return "#ef4444";
  if (s === "medium") return "#f59e0b";
  return "#22c55e";
}

function conditionLabel(c: string): string {
  const m: Record<string, string> = {
    INADMISSIBLE: "НЕДОПУСТИМОЕ",
    LIMITED: "ОГРАНИЧЕННО ПРИГОДНОЕ",
    SERVICEABLE: "ПРИГОДНОЕ",
    NORMAL: "НОРМАЛЬНОЕ",
  };
  return m[c] || c;
}

function conditionColor(c: string): string {
  if (c === "INADMISSIBLE") return "#ef4444";
  if (c === "LIMITED") return "#f59e0b";
  return "#22c55e";
}

export default function DemoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [pixelScale, setPixelScale] = useState("");
  const [environment, setEnvironment] = useState("atmospheric");
  const [aggression, setAggression] = useState("normal");
  const [projectName, setProjectName] = useState("");
  const [inspector, setInspector] = useState("");
  const [location, setLocation] = useState("");
  const [structureType, setStructureType] = useState("wall");
  const [concreteGrade, setConcreteGrade] = useState("B25");
  const [rebarClass, setRebarClass] = useState("A400");
  const [structureAge, setStructureAge] = useState("");
  const [protectiveLayer, setProtectiveLayer] = useState("");
  const [selectedDefect, setSelectedDefect] = useState<number | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f); setError(""); setResult(null); setSelectedDefect(null);
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
          setFile(blob); setError(""); setResult(null); setSelectedDefect(null);
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
    setLoading(true); setError(""); setResult(null); setSelectedDefect(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const params = new URLSearchParams();
      if (pixelScale) params.set("pixel_scale_mm", pixelScale);
      if (environment) params.set("environment", environment);
      if (aggression) params.set("aggression", aggression);
      if (structureType) params.set("structure_type", structureType);
      if (concreteGrade) params.set("concrete_grade", concreteGrade);
      if (rebarClass) params.set("rebar_class", rebarClass);
      if (structureAge) params.set("structure_age", structureAge);
      if (protectiveLayer) params.set("protective_layer_mm", protectiveLayer);
      const res = await fetch(`/api/ml/predict?${params.toString()}`, { method: "POST", body: formData });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.detail || `Error ${res.status}`); }
      const data: AnalysisResult = await res.json();
      setResult(data);
      if (data.detections_detailed && data.detections_detailed.length > 0) setSelectedDefect(0);
    } catch (err: any) { setError(err.message || "Analysis failed"); }
    finally { setLoading(false); }
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
      if (structureType) params.set("structure_type", structureType);
      if (concreteGrade) params.set("concrete_grade", concreteGrade);
      if (rebarClass) params.set("rebar_class", rebarClass);
      if (structureAge) params.set("structure_age", structureAge);
      if (protectiveLayer) params.set("protective_layer_mm", protectiveLayer);
      const res = await fetch(`/api/ml/report?${params.toString()}`, { method: "POST", body: formData });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.detail || `Error ${res.status}`); }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "InspectAI_Engineering_Report.pdf"; a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) { setError(err.message || "Report generation failed"); }
    finally { setLoading(false); }
  };

  const detections = result?.detections_detailed || result?.detections || [];
  const summary = result?.summary;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>InspectAI — Инженерный анализ дефектов</h1>
      <p style={{ color: "#94a3b8", marginBottom: 24 }}>
        Загрузите фотографию бетонной или железобетонной конструкции. ИИ определит дефекты с полным инженерным анализом.
      </p>

      <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        <label style={{ display: "block", padding: 16, border: "2px dashed #334155", borderRadius: 8, cursor: "pointer" }}>
          <input type="file" accept="image/*" onChange={onFileChange} style={{ display: "none" }} />
          <div style={{ textAlign: "center", color: "#94a3b8" }}>
            {file ? file.name : "Нажмите для загрузки или вставьте из буфера (Ctrl+V / Cmd+V)"}
          </div>
        </label>

        {preview && !result && (
          <img src={preview} alt="preview" style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #334155" }} />
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <input placeholder="Масштаб (мм/px)" value={pixelScale} onChange={(e) => setPixelScale(e.target.value)} style={inputStyle} />
          <select value={environment} onChange={(e) => setEnvironment(e.target.value)} style={inputStyle}>
            <option value="atmospheric">Атмосферная среда</option>
            <option value="aggressive">Агрессивная среда</option>
            <option value="indoor">Закрытое помещение</option>
          </select>
          <select value={aggression} onChange={(e) => setAggression(e.target.value)} style={inputStyle}>
            <option value="normal">Нормальная</option>
            <option value="medium">Средняя</option>
            <option value="high">Высокая</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <input placeholder="Объект" value={projectName} onChange={(e) => setProjectName(e.target.value)} style={inputStyle} />
          <input placeholder="Обследовал" value={inspector} onChange={(e) => setInspector(e.target.value)} style={inputStyle} />
          <input placeholder="Адрес" value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <select value={structureType} onChange={(e) => setStructureType(e.target.value)} style={inputStyle}>
            <option value="wall">Стена</option>
            <option value="column">Колонна</option>
            <option value="beam">Балка</option>
            <option value="slab">Плита перекрытия</option>
            <option value="foundation">Фундамент</option>
            <option value="other">Прочее</option>
          </select>
          <select value={concreteGrade} onChange={(e) => setConcreteGrade(e.target.value)} style={inputStyle}>
            <option value="B15">B15 (М200)</option>
            <option value="B20">B20 (М250)</option>
            <option value="B25">B25 (М350)</option>
            <option value="B30">B30 (М400)</option>
            <option value="B35">B35 (М450)</option>
            <option value="B40">B40 (М500)</option>
            <option value="B45">B45 (М550)</option>
            <option value="B50">B50 (М600)</option>
            <option value="unknown">Неизвестна</option>
          </select>
          <select value={rebarClass} onChange={(e) => setRebarClass(e.target.value)} style={inputStyle}>
            <option value="A240">A240 (I класс)</option>
            <option value="A300">A300 (II класс)</option>
            <option value="A400">A400 (III класс)</option>
            <option value="A500">A500 (IV класс)</option>
            <option value="A600">A600 (V класс)</option>
            <option value="unknown">Неизвестен</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input placeholder="Возраст конструкции (лет)" value={structureAge} onChange={(e) => setStructureAge(e.target.value)} style={inputStyle} />
          <input placeholder="Толщина защитного слоя (мм)" value={protectiveLayer} onChange={(e) => setProtectiveLayer(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={analyze} disabled={!file || loading} style={{ ...btnStyle, opacity: !file || loading ? 0.6 : 1 }}>
            {loading ? "Анализ..." : "Анализировать"}
          </button>
          <button onClick={downloadReport} disabled={!file || loading} style={{ ...btnStyle, background: "#0ea5e9", opacity: !file || loading ? 0.6 : 1 }}>
            {loading ? "Генерация PDF..." : "Скачать PDF отчёт"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#450a0a", borderRadius: 8, color: "#fca5a5", marginBottom: 24 }}>{error}</div>
      )}

      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Left: image + summary + defect list */}
          <div style={{ display: "grid", gap: 16 }}>
            {result.annotated_image && (
              <div style={{ padding: 12, background: "#1e293b", borderRadius: 8 }}>
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>Результат детекции</h3>
                <img
                  src={`data:image/jpeg;base64,${result.annotated_image}`}
                  alt="annotated"
                  style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #334155" }}
                />
                <p style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>
                  {result.image_width} × {result.image_height} px | {result.processing_time.toFixed(2)}с | {result.model_version}
                </p>
              </div>
            )}

            {summary && (
              <div style={{ padding: 16, background: "#1e293b", borderRadius: 8 }}>
                <h3 style={{ marginTop: 0, marginBottom: 12 }}>Сводка</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  <StatBox label="Всего" value={summary.total} />
                  <StatBox label="Критич." value={summary.high} color="#ef4444" />
                  <StatBox label="Значит." value={summary.medium} color="#f59e0b" />
                  <StatBox label="Незнач." value={summary.low} color="#22c55e" />
                </div>
                <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: conditionColor(summary.overall_condition) + "22", borderLeft: `4px solid ${conditionColor(summary.overall_condition)}` }}>
                  <span style={{ color: conditionColor(summary.overall_condition), fontWeight: 700, fontSize: 14 }}>
                    Общее состояние: {conditionLabel(summary.overall_condition)}
                  </span>
                </div>
              </div>
            )}

            {detections.length > 0 && (
              <div style={{ padding: 12, background: "#1e293b", borderRadius: 8 }}>
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>Обнаруженные дефекты</h3>
                {detections.map((det, idx) => {
                  const eng = det.engineering;
                  const sev = det.severity || "low";
                  const color = severityColor(sev);
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDefect(idx)}
                      style={{
                        padding: 10, marginBottom: 6, borderRadius: 6, cursor: "pointer",
                        background: selectedDefect === idx ? "#334155" : "#0f172a",
                        borderLeft: `4px solid ${color}`,
                        transition: "background 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>
                          #{idx + 1} {eng?.ru_name || det.class}
                        </span>
                        <span style={{ padding: "2px 8px", borderRadius: 999, background: color, color: "#fff", fontSize: 11, fontWeight: 700 }}>
                          {severityLabel(sev)} {(det.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      {eng && (
                        <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
                          Ширина: {eng.estimated_width_mm.toFixed(2)} мм ({eng.width_cm.toFixed(2)} см) | Длина: {eng.estimated_length_mm.toFixed(2)} мм | Площадь: {eng.estimated_area_cm2.toFixed(2)} см²
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {detections.length === 0 && (
              <div style={{ padding: 16, background: "#1e293b", borderRadius: 8, color: "#22c55e" }}>
                Дефекты не обнаружены. Конструкция в нормальном состоянии по визуальным признакам.
              </div>
            )}
          </div>

          {/* Right: detailed engineering info */}
          <div>
            {selectedDefect !== null && detections[selectedDefect] ? (
              <DefectDetails det={detections[selectedDefect]} index={selectedDefect + 1} />
            ) : (
              <div style={{ padding: 16, background: "#1e293b", borderRadius: 8, color: "#94a3b8" }}>
                Выберите дефект слева для просмотра детальной инженерной информации.
              </div>
            )}
          </div>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 24, padding: 16, background: "#1e293b", borderRadius: 8, color: "#94a3b8", fontSize: 13 }}>
          <strong style={{ color: "#fca5a5" }}>Дисклеймер:</strong> Предварительная визуальная оценка автоматизированной ИИ-системой (YOLOv8).
          Не заменяет полного инструментального обследования по ГОСТ 31937-2011 и СП 13-102-2003, проводимого аттестованной лабораторией.
        </div>
      )}
    </div>
  );
}

function DefectDetails({ det, index }: { det: Detection; index: number }) {
  const eng = det.engineering;
  const sev = det.severity || "low";
  const color = severityColor(sev);

  if (!eng) {
    return (
      <div style={{ padding: 16, background: "#1e293b", borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>#{index} {det.class}</h3>
        <p style={{ color: "#94a3b8" }}>Инженерный анализ недоступен.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, background: "#1e293b", borderRadius: 8, borderLeft: `4px solid ${color}`, maxHeight: "80vh", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>#{index} {eng.ru_name}</h3>
        <span style={{ padding: "4px 10px", borderRadius: 999, background: color, color: "#fff", fontSize: 12, fontWeight: 700 }}>
          {severityLabel(sev)} — {(det.confidence * 100).toFixed(0)}%
        </span>
      </div>

      <Section title="Категория"><p style={pStyle}>{eng.category}</p></Section>

      <Section title="Геометрические параметры">
        <ParamTable params={[
          ["Ширина", `${eng.estimated_width_mm.toFixed(2)} мм`, `${eng.width_cm.toFixed(2)} см`],
          ["Длина", `${eng.estimated_length_mm.toFixed(2)} мм`, `${eng.length_cm.toFixed(2)} см`],
          ["Площадь", `${eng.estimated_area_cm2.toFixed(2)} см²`, ""],
          ["Позиция (X, Y)", `${Math.round(det.bbox.x)}, ${Math.round(det.bbox.y)} px`, ""],
          ["Размер бокса", `${Math.round(det.bbox.width)} × ${Math.round(det.bbox.height)} px`, ""],
        ]} />
      </Section>

      <Section title="Нормативные пределы">
        <p style={pStyle}>{eng.normative_limit}</p>
        <p style={{ ...pStyle, color: eng.is_critical ? "#ef4444" : "#22c55e", fontWeight: 700 }}>
          {eng.is_critical ? "⚠ ПРЕВЫШЕНО — требуется немедленное вмешательство" : "✓ В пределах допустимого"}
        </p>
      </Section>

      <Section title="Почему ИИ обнаружил этот дефект">
        <p style={pStyle}>{eng.why_nn_detected}</p>
      </Section>

      <Section title="Возможные причины">
        <ul style={{ margin: 0, paddingLeft: 18, color: "#94a3b8" }}>
          {eng.causes.map((c: string, i: number) => <li key={i} style={{ marginBottom: 4, fontSize: 13 }}>{c}</li>)}
        </ul>
      </Section>

      <Section title="Оценка опасности" color={color}>
        <p style={{ ...pStyle, color, fontWeight: 700 }}>{eng.danger_level}</p>
      </Section>

      <Section title="Влияние на классы бетона">
        <p style={pStyle}>{eng.concrete_grades_affected}</p>
      </Section>

      <Section title="Влияние на арматуру">
        <p style={pStyle}>{eng.rebar_impact}</p>
      </Section>

      <Section title="Рекомендуемые действия">
        <ol style={{ margin: 0, paddingLeft: 18, color: "#94a3b8" }}>
          {eng.recommended_actions.map((a: string, i: number) => <li key={i} style={{ marginBottom: 4, fontSize: 13 }}>{a}</li>)}
        </ol>
      </Section>

      <Section title="Применимые нормативы">
        {eng.norms.map((n: string, i: number) => <div key={i} style={{ ...pStyle, fontSize: 13 }}>• {n}</div>)}
      </Section>

      <Section title="Методы измерения">
        {eng.measurement_methods.map((m: string, i: number) => <div key={i} style={{ ...pStyle, fontSize: 13 }}>• {m}</div>)}
      </Section>

      <Section title="Требования к квалификации">
        <p style={pStyle}>{eng.license_required}</p>
      </Section>
    </div>
  );
}

function Section({ title, children, color }: { title: string; children: React.ReactNode; color?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 700, color: color || "#cbd5e1", fontSize: 13, marginBottom: 4 }}>{title}</div>
      {children}
    </div>
  );
}

function ParamTable({ params }: { params: [string, string, string][] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <tbody>
        {params.map(([label, val1, val2], i) => (
          <tr key={i} style={{ borderBottom: "1px solid #334155" }}>
            <td style={{ padding: "6px 8px", color: "#64748b", width: "35%" }}>{label}</td>
            <td style={{ padding: "6px 8px", color: "#e2e8f0" }}>{val1}</td>
            <td style={{ padding: "6px 8px", color: "#94a3b8", fontSize: 12 }}>{val2}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ padding: 10, background: "#0f172a", borderRadius: 6, textAlign: "center" }}>
      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || "#e2e8f0" }}>{value}</div>
    </div>
  );
}

const pStyle: React.CSSProperties = { margin: 0, color: "#94a3b8", lineHeight: 1.5, fontSize: 13 };

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
