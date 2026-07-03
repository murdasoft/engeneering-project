"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, Download, AlertCircle, ScanLine } from "lucide-react";
import Link from "next/link";

const ML_API_URL = "https://alllxndr-inspectai-ml.hf.space";

interface Detection {
  class: string;
  confidence: number;
  severity: string;
  engineering?: {
    ru_name: string;
    estimated_width_mm?: number;
    estimated_length_mm?: number;
    severity_category?: string;
    normative_ref?: string;
    recommended_action?: string;
    cause?: string;
    description?: string;
  };
}

interface AnalysisResult {
  annotated_image: string;
  detections_detailed: Detection[];
  summary: {
    total: number;
    high: number;
    medium: number;
    low: number;
    overall_condition: string;
  };
}

export default function InspectAIPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pixelScale, setPixelScale] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const params = new URLSearchParams();
      if (pixelScale) params.set("pixel_scale_mm", pixelScale);
      params.set("environment", "atmospheric");
      params.set("aggression", "normal");

      const res = await fetch(`/api/ml/predict?${params.toString()}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
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
      params.set("environment", "atmospheric");
      params.set("aggression", "normal");
      params.set("project_name", "EngAI Hub");
      params.set("inspector", "InspectAI");
      params.set("location", "Не указан");

      const res = await fetch(`/api/ml/report?${params.toString()}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Report failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "inspectai_report.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Report error");
    } finally {
      setLoading(false);
    }
  };

  const severityColor: Record<string, string> = {
    high: "text-red-400 bg-red-500/10 border-red-500/30",
    medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  };

  const severityLabel: Record<string, string> = {
    high: "Критический",
    medium: "Значительный",
    low: "Незначительный",
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container-max">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-4">
            <ScanLine className="w-4 h-4 text-accent" />
            <span className="text-sm text-slate-400">InspectAI — AI-анализ дефектов</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Загрузите фото конструкции
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            AI найдёт дефекты, оценит критичность и подготовит инженерный отчёт
          </p>
        </div>

        {/* Upload area */}
        {!preview && (
          <div
            onClick={() => fileRef.current?.click()}
            className="glass rounded-2xl p-12 text-center cursor-pointer hover:border-accent/30 transition-all max-w-2xl mx-auto"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFile(e.dataTransfer.files[0]);
            }}
          >
            <Upload className="w-12 h-12 text-accent mx-auto mb-4" />
            <p className="text-white font-semibold mb-2">Перетащите фото или нажмите для выбора</p>
            <p className="text-sm text-slate-500">JPG, PNG до 10 МБ</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
          </div>
        )}

        {/* Preview + Controls */}
        {preview && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Image */}
            <div className="glass rounded-2xl p-4">
              <img
                src={result?.annotated_image || preview}
                alt="Analysis"
                className="w-full rounded-xl"
              />
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setResult(null);
                }}
                className="mt-3 text-sm text-slate-500 hover:text-white transition-colors"
              >
                ← Загрузить другое фото
              </button>
            </div>

            {/* Controls + Results */}
            <div className="space-y-4">
              {/* Controls */}
              <div className="glass rounded-2xl p-5 space-y-3">
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Масштаб (мм/пиксель)</label>
                  <input
                    placeholder="Напр. 0.5"
                    value={pixelScale}
                    onChange={(e) => setPixelScale(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-700 border border-white/10 text-white placeholder:text-slate-500 focus:border-accent/50 focus:outline-none text-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={analyze}
                    disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                    {loading ? "Анализ..." : "Анализировать"}
                  </button>
                  {result && (
                    <button
                      onClick={downloadReport}
                      disabled={loading}
                      className="btn-ghost flex items-center justify-center gap-2 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="glass rounded-xl p-4 border-red-500/30 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Results */}
              {result && (
                <>
                  {/* Summary */}
                  <div className="glass rounded-2xl p-5">
                    <h3 className="font-display font-bold text-white mb-3">Результат</h3>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: "Всего", value: result.summary.total, color: "text-white" },
                        { label: "🔴", value: result.summary.high, color: "text-red-400" },
                        { label: "🟡", value: result.summary.medium, color: "text-amber-400" },
                        { label: "🟢", value: result.summary.low, color: "text-emerald-400" },
                      ].map((s) => (
                        <div key={s.label} className="text-center">
                          <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
                          <div className="text-xs text-slate-500">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-sm text-slate-400">
                        Состояние: <span className="text-white font-semibold">{result.summary.overall_condition}</span>
                      </p>
                    </div>
                  </div>

                  {/* Detections */}
                  <div className="space-y-3">
                    {result.detections_detailed.map((det, idx) => (
                      <div key={idx} className="glass rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="text-white font-semibold">
                              {det.engineering?.ru_name || det.class}
                            </span>
                            <span className="text-slate-500 text-sm ml-2">
                              {Math.round(det.confidence * 100)}%
                            </span>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full border ${severityColor[det.severity] || severityColor.low}`}>
                            {severityLabel[det.severity] || det.severity}
                          </span>
                        </div>
                        {det.engineering && (
                          <div className="text-sm text-slate-400 space-y-1">
                            {det.engineering.estimated_width_mm && (
                              <p>Ширина: <span className="text-slate-300">{det.engineering.estimated_width_mm.toFixed(2)} мм</span></p>
                            )}
                            {det.engineering.normative_ref && (
                              <p>Норматив: <span className="text-slate-300">{det.engineering.normative_ref}</span></p>
                            )}
                            {det.engineering.cause && (
                              <p>Причина: <span className="text-slate-300">{det.engineering.cause}</span></p>
                            )}
                            {det.engineering.recommended_action && (
                              <p className="pt-1 text-accent">→ {det.engineering.recommended_action}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Cross-links */}
                  <div className="glass rounded-xl p-4">
                    <p className="text-sm text-slate-400 mb-3">Дальнейшие действия:</p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`https://crackcalc.vercel.app?width=${result.detections_detailed[0]?.engineering?.estimated_width_mm || ""}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                      >
                        Оценить в CrackCalc →
                      </a>
                      <a
                        href="https://loadbear.vercel.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors"
                      >
                        Расчёт несущей способности →
                      </a>
                      <a
                        href="https://concretemix.vercel.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                      >
                        Подобрать ремонтный состав →
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Back to hub */}
        <div className="text-center mt-12">
          <Link href="/" className="text-sm text-slate-500 hover:text-accent transition-colors">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}
