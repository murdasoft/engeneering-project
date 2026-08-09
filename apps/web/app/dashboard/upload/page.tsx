"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ToolOverlay } from "@/app/components/ToolOverlay";

interface Finding {
  id: string;
  className: string;
  confidence: number;
  severity: string;
  bbox: { x: number; y: number; width: number; height: number; polygon?: number[][] | null };
  widthMm: number | null;
  heightMm: number | null;
}

interface Project {
  id: string;
  name: string;
  siteId: string | null;
}

const SEV_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 border-red-300",
  HIGH: "bg-orange-100 text-orange-700 border-orange-300",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-300",
  LOW: "bg-emerald-100 text-emerald-700 border-emerald-300",
};

const SEV_LABEL: Record<string, string> = {
  CRITICAL: "Critical", HIGH: "High", MEDIUM: "Medium", LOW: "Low",
};

interface UploadedFile {
  file: File;
  name: string;
  size: number;
  status: "pending" | "uploading" | "analyzing" | "done" | "error";
  url?: string;
  previewUrl: string;
  assetId?: string;
  error?: string;
  analysis?: {
    analysisId: string;
    findingsCount: number;
    summary: { total: number; high: number; medium: number; low: number; other?: number };
  } | null;
}

export default function UploadPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [detail, setDetail] = useState<{ findings: Finding[]; blobUrl: string } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<{ tool: string; search: string; finding: Finding } | null>(null);
  const [showParams, setShowParams] = useState(false);
  const [analysisParams, setAnalysisParams] = useState<Record<string, string | number>>({
    pixel_scale_mm: 0.05,
    environment: "atmospheric",
    aggression: "normal",
    threshold: 0.15,
  });
  const imgRef = useRef<HTMLImageElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        setProjects(data.projects ?? []);
        if (data.projects?.length > 0) setSelectedProject(data.projects[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles = Array.from(fileList).map((f) => ({
      file: f,
      name: f.name,
      size: f.size,
      status: "pending" as const,
      previewUrl: URL.createObjectURL(f),
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        const dt = new DataTransfer();
        imageFiles.forEach((f) => dt.items.add(f));
        handleFiles(dt.files);
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [handleFiles]);

  const crackcalcSearch = (f: Finding) => {
    const params = new URLSearchParams();
    if (f.widthMm) params.set("width", f.widthMm.toFixed(2));
    if (f.heightMm) params.set("length", f.heightMm.toFixed(2));
    return params.toString() ? `?${params.toString()}` : "";
  };

  async function uploadAll() {
    if (!selectedProject || files.length === 0) return;
    setIsProcessing(true);
    setResultMessage(null);
    setProgress(0);

    const total = files.length;
    let done = 0;
    let failed = 0;
    let totalFindings = 0;

    for (let i = 0; i < total; i++) {
      const item = files[i];
      setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: "uploading", error: undefined } : f)));
      setProgress(Math.round((i / total) * 100));

      let assetId: string | undefined;
      let analysisResult: UploadedFile["analysis"] = null;
      try {
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("projectId", selectedProject);
        const uploadRes = await fetch("/api/assets/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
        const uploadData = await uploadRes.json();
        assetId = uploadData.asset?.id;
        setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: "analyzing", url: uploadData.asset?.blobUrl, assetId } : f)));

        if (!assetId) throw new Error("No asset ID returned");
        const analysisRes = await fetch("/api/analyses/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetId, projectId: selectedProject, params: analysisParams }),
        });
        if (!analysisRes.ok) {
          const err = await analysisRes.json().catch(() => ({}));
          throw new Error(err.error || `Analysis failed: ${analysisRes.status}`);
        }
        const analysisData = await analysisRes.json();
        analysisResult = {
          analysisId: analysisData.analysisId,
          findingsCount: analysisData.findingsCount ?? 0,
          summary: analysisData.summary ?? { total: 0, high: 0, medium: 0, low: 0, other: 0 },
        };
        totalFindings += analysisResult.findingsCount;
        setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: "done", analysis: analysisResult } : f)));
        done++;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: "error", error: message } : f)));
        failed++;
      }
      setProgress(Math.round(((i + 1) / total) * 100));
    }

    setIsProcessing(false);
    setResultMessage(`Done: ${done} · Failed: ${failed} · Defects found: ${totalFindings}`);
  }

  async function openResult(index: number) {
    setSelectedIndex(index);
    const file = files[index];
    if (!file.analysis?.analysisId) return;
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/analyses/${file.analysis.analysisId}`);
      if (res.ok) {
        const data = await res.json();
        setDetail({
          findings: data.analysis?.findings ?? [],
          blobUrl: data.analysis?.asset?.blobUrl ?? file.url ?? "",
        });
      }
    } finally {
      setDetailLoading(false);
    }
  }

  function closeResult() {
    setSelectedIndex(null);
    setDetail(null);
    setScale(1);
  }

  const onImgLoad = () => {
    if (imgRef.current && wrapRef.current) {
      setScale(wrapRef.current.clientWidth / imgRef.current.naturalWidth);
    }
  };

  const selectedFile = selectedIndex !== null ? files[selectedIndex] : null;

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-4rem)]">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-md mb-xl">
        <div>
          <p className="font-label-caps text-label-caps text-secondary mb-xs">BATCH UPLOAD</p>
          <h2 className="font-headline-md text-headline-md">Upload Inspection Photos</h2>
        </div>
        <div className="flex flex-wrap items-center gap-md">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-md py-sm border border-outline-variant bg-surface-container-lowest rounded-lg font-body-sm text-body-sm focus:border-primary focus:outline-none"
          >
            {loading && <option>Loading...</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {files.length > 0 && (
            <button
              onClick={uploadAll}
              className="px-md py-sm bg-primary text-on-primary font-label-caps text-label-caps rounded-lg hover:bg-primary-container transition-colors"
            >
              UPLOAD {files.length} FILES
            </button>
          )}
        </div>
      </header>

      {projects.length === 0 && !loading ? (
        <div className="bg-surface-container-lowest border border-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-[64px] text-outline-variant">folder_off</span>
          <h3 className="font-headline-md text-headline-md mt-md">No projects</h3>
          <p className="font-body-sm text-on-surface-variant mt-xs mb-lg">Create a project first to upload photos.</p>
          <Link href="/dashboard/projects" className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-md font-label-caps text-label-caps rounded-lg hover:bg-primary-container transition-colors">
            <span className="material-symbols-outlined text-[18px]">add</span>
            CREATE PROJECT
          </Link>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row flex-1 gap-gutter overflow-y-auto md:overflow-hidden">
          {/* Drop Zone */}
          <div className="flex-1 flex flex-col">
            <div
              className={`relative flex-1 min-h-[300px] border-2 border-dashed rounded-xl bg-surface-container-low technical-grid flex flex-col items-center justify-center transition-all ${
                dragging ? "border-primary bg-primary/5" : "border-outline-variant hover:border-primary"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
              <span className="material-symbols-outlined text-outline-variant text-[64px] mb-lg">upload_file</span>
              <p className="font-headline-md text-headline-md text-on-surface-variant mb-xs">Drop files to scan</p>
              <p className="font-body-sm text-body-sm text-outline">JPG, PNG, WEBP (Max 50MB per file)</p>
              <p className="font-body-sm text-body-sm text-outline-variant mt-sm flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]">content_paste</span>
                or press <kbd className="px-1.5 py-0.5 bg-surface-container border border-outline-variant rounded text-[11px] font-mono">Ctrl+V</kbd> to paste from clipboard
              </p>
            </div>

            {/* Preview Grid */}
            {files.length > 0 && (
              <div className="mt-xl grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter overflow-y-auto">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className={`bg-surface-container-lowest border border-outline-variant p-xs rounded shadow-sm ${f.status === "done" ? "cursor-pointer hover:border-primary" : ""}`}
                    onClick={() => f.status === "done" && openResult(i)}
                  >
                    <div className="aspect-square bg-surface-container rounded-xs overflow-hidden flex items-center justify-center relative">
                      {f.previewUrl ? (
                        <img src={f.previewUrl} alt={f.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className={`material-symbols-outlined text-[32px] ${
                          f.status === "done" ? "text-primary" :
                          f.status === "uploading" || f.status === "analyzing" ? "text-secondary animate-spin" :
                          f.status === "error" ? "text-error" :
                          "text-outline-variant"
                        }`}>
                          {f.status === "done" ? "check_circle" :
                           f.status === "uploading" || f.status === "analyzing" ? "progress_activity" :
                           f.status === "error" ? "error" :
                           "image"}
                        </span>
                      )}
                      {(f.status === "uploading" || f.status === "analyzing") && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-[32px] animate-spin">progress_activity</span>
                        </div>
                      )}
                      {f.status === "error" && (
                        <div className="absolute inset-0 bg-error/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-error text-[32px]">error</span>
                        </div>
                      )}
                      {f.status === "done" && (
                        <div className="absolute bottom-1 right-1 bg-primary text-on-primary rounded-full p-1">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        </div>
                      )}
                      {f.status === "error" && (
                        <div className="absolute bottom-1 right-1 bg-error text-on-error rounded-full p-1">
                          <span className="material-symbols-outlined text-[14px]">error</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-sm flex justify-between items-start">
                      <div className="overflow-hidden">
                        <p className="font-mono-data text-mono-data truncate">{f.name}</p>
                        <p className="font-label-caps text-[10px] text-outline">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                        {f.status === "done" && f.analysis && (
                          <p className="text-[10px] text-primary mt-xs">
                            {f.analysis.findingsCount} defects
                            {f.analysis.summary.high > 0 && ` · ${f.analysis.summary.high} critical`}
                          </p>
                        )}
                        {f.status === "error" && (
                          <p className="text-[10px] text-error mt-xs truncate" title={f.error}>Failed</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel: Quality Guidance */}
          <aside className="w-full md:w-80 border-l border-outline-variant bg-surface-container-lowest flex flex-col p-lg space-y-lg overflow-y-auto">
            <section>
              <h3 className="font-label-caps text-label-caps text-outline mb-md">PROJECT CONTEXT</h3>
              <div className="p-md bg-surface-container border border-outline-variant rounded">
                <p className="font-body-sm text-body-sm">{projects.find(p => p.id === selectedProject)?.name ?? "—"}</p>
                <p className="text-[11px] text-on-surface-variant font-mono-data mt-xs">
                  ID: {projects.find(p => p.id === selectedProject)?.siteId ?? "—"}
                </p>
              </div>
            </section>

            <hr className="border-outline-variant" />

            <section>
              <button
                onClick={() => setShowParams((v) => !v)}
                className="w-full flex items-center justify-between font-label-caps text-label-caps text-outline mb-md"
              >
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  ANALYSIS PARAMETERS
                </span>
                <span className="material-symbols-outlined text-[18px]">{showParams ? "expand_less" : "expand_more"}</span>
              </button>
              {showParams && (
                <div className="grid grid-cols-2 gap-sm mb-md p-md bg-surface-container border border-outline-variant rounded">
                  <div>
                    <label className="block font-label-caps text-[10px] text-on-surface-variant mb-xs">PIXEL SCALE (mm/px)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={analysisParams.pixel_scale_mm}
                      onChange={(e) => setAnalysisParams((p) => ({ ...p, pixel_scale_mm: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-sm py-xs bg-surface-container-lowest border border-outline-variant rounded font-body-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-label-caps text-[10px] text-on-surface-variant mb-xs">ENVIRONMENT</label>
                    <select
                      value={analysisParams.environment}
                      onChange={(e) => setAnalysisParams((p) => ({ ...p, environment: e.target.value }))}
                      className="w-full px-sm py-xs bg-surface-container-lowest border border-outline-variant rounded font-body-sm focus:border-primary focus:outline-none"
                    >
                      <option value="atmospheric">Atmospheric</option>
                      <option value="indoor">Indoor</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-label-caps text-[10px] text-on-surface-variant mb-xs">AGGRESSION</label>
                    <select
                      value={analysisParams.aggression}
                      onChange={(e) => setAnalysisParams((p) => ({ ...p, aggression: e.target.value }))}
                      className="w-full px-sm py-xs bg-surface-container-lowest border border-outline-variant rounded font-body-sm focus:border-primary focus:outline-none"
                    >
                      <option value="normal">Normal</option>
                      <option value="aggressive">Aggressive</option>
                      <option value="mild">Mild</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-label-caps text-[10px] text-on-surface-variant mb-xs">THRESHOLD</label>
                    <input
                      type="range"
                      min="0.05"
                      max="0.95"
                      step="0.05"
                      value={analysisParams.threshold}
                      onChange={(e) => setAnalysisParams((p) => ({ ...p, threshold: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <p className="font-mono-data text-[10px] text-on-surface-variant mt-xs">
                      {Number(analysisParams.threshold).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={uploadAll}
                disabled={files.length === 0 || isProcessing}
                className="w-full h-12 bg-primary text-on-primary font-title-sm text-title-sm rounded-lg hover:bg-primary-container transition-all flex items-center justify-center gap-md disabled:opacity-50"
              >
                {isProcessing ? (
                  <><span className="material-symbols-outlined animate-spin">progress_activity</span>PROCESSING...</>
                ) : (
                  <><span className="material-symbols-outlined">analytics</span>UPLOAD & ANALYZE</>
                )}
              </button>
              {isProcessing && (
                <div className="mt-md">
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-xs text-center">{progress}%</p>
                </div>
              )}
              {resultMessage && (
                <p className="mt-md text-sm text-center text-primary">{resultMessage}</p>
              )}
              {!isProcessing && resultMessage && (
                <Link
                  href={`/dashboard/projects/${selectedProject}`}
                  className="mt-md w-full h-10 flex items-center justify-center gap-xs border border-primary text-primary font-label-caps text-label-caps rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  VIEW RESULTS IN PROJECT
                </Link>
              )}
            </section>

            <section className="flex-1 bg-surface-container-low rounded-xl p-md border border-outline-variant">
              <div className="flex items-center gap-sm mb-md text-primary">
                <span className="material-symbols-outlined">lightbulb</span>
                <h3 className="font-label-caps text-label-caps">QUALITY GUIDANCE</h3>
              </div>
              <ul className="space-y-lg">
                <li className="flex gap-md">
                  <span className="material-symbols-outlined text-secondary text-[20px]">wb_sunny</span>
                  <div>
                    <p className="font-body-sm text-body-sm font-bold">Uniform Lighting</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Avoid harsh shadows or direct sunlight on concrete surfaces.</p>
                  </div>
                </li>
                <li className="flex gap-md">
                  <span className="material-symbols-outlined text-secondary text-[20px]">center_focus_strong</span>
                  <div>
                    <p className="font-body-sm text-body-sm font-bold">Critical Sharpness</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">AI requires clear edges for crack measurement. Use a tripod for low-light.</p>
                  </div>
                </li>
                <li className="flex gap-md">
                  <span className="material-symbols-outlined text-secondary text-[20px]">straighten</span>
                  <div>
                    <p className="font-body-sm text-body-sm font-bold">Orthogonal Angle</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Shoot perpendicular to the surface for accurate measurements.</p>
                  </div>
                </li>
              </ul>
              <div className="mt-lg p-sm bg-tertiary-fixed text-on-tertiary-fixed rounded border border-tertiary-container">
                <p className="font-label-caps text-[10px] uppercase font-black mb-xs">CONFIDENCE TIP</p>
                <p className="font-body-sm text-[11px] leading-tight">High-resolution images (4K+) result in 35% higher AI confidence scores.</p>
              </div>
            </section>
          </aside>
        </div>
      )}

      {/* Result Viewer Modal */}
      {selectedIndex !== null && selectedFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={closeResult}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-md md:p-lg" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeResult} className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface z-10">
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="font-headline-md text-headline-md mb-md">{selectedFile.name}</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
              <div ref={wrapRef} className="relative rounded-lg overflow-hidden bg-surface-container">
                {detailLoading ? (
                  <div className="aspect-square flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[48px] animate-spin">progress_activity</span>
                  </div>
                ) : (
                  <>
                    <img
                      ref={imgRef}
                      src={detail?.blobUrl ?? selectedFile.url ?? selectedFile.previewUrl}
                      alt={selectedFile.name}
                      className="w-full h-auto block"
                      onLoad={onImgLoad}
                    />
                    {detail && detail.findings.map((f, i) => {
                      const sev = (f.severity || "low").toUpperCase();
                      const color = sev === "CRITICAL" ? "#ef4444" : sev === "HIGH" ? "#f97316" : sev === "MEDIUM" ? "#f59e0b" : "#10b981";
                      const polygon = f.bbox.polygon;
                      return polygon?.length ? (
                        <svg
                          key={f.id || i}
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          viewBox={`0 0 ${imgRef.current?.naturalWidth || 1} ${imgRef.current?.naturalHeight || 1}`}
                          preserveAspectRatio="none"
                        >
                          <polygon points={polygon.map((p) => `${p[0]},${p[1]}`).join(" ")} fill={`${color}45`} stroke={color} strokeWidth="3" />
                        </svg>
                      ) : (
                        <div
                          key={f.id || i}
                          className="absolute border-2 bg-transparent"
                          style={{
                            left: f.bbox.x * scale,
                            top: f.bbox.y * scale,
                            width: f.bbox.width * scale,
                            height: f.bbox.height * scale,
                            borderColor: color,
                          }}
                          title={`${f.className} ${(f.confidence * 100).toFixed(0)}%`}
                        />
                      );
                    })}
                  </>
                )}
              </div>

              <div className="space-y-md">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <span className="material-symbols-outlined text-primary text-[32px] animate-spin">progress_activity</span>
                  </div>
                ) : detail ? (
                  <>
                    <div className="p-md bg-surface-container border border-outline-variant rounded-lg">
                      <p className="font-label-caps text-label-caps text-on-surface-variant">DEFECTS FOUND</p>
                      <p className="text-[32px] font-bold mt-xs">{detail.findings.length}</p>
                    </div>

                    {detail.findings.length === 0 ? (
                      <p className="text-sm text-on-surface-variant text-center py-8">No defects detected on this photo.</p>
                    ) : (
                      <div className="space-y-sm max-h-[360px] overflow-y-auto pr-xs">
                        {detail.findings.map((f) => {
                          const sev = (f.severity || "low").toUpperCase();
                          const sevClass = SEV_COLORS[sev] || SEV_COLORS.LOW;
                          return (
                            <div key={f.id} className="p-sm bg-surface-container-lowest border border-outline-variant rounded flex flex-wrap items-start justify-between gap-sm">
                              <div className="flex-1 min-w-0">
                                <p className="font-body-sm font-bold capitalize truncate">{f.className}</p>
                                <p className="text-[11px] text-on-surface-variant">
                                  {Math.round(f.bbox.width)}×{Math.round(f.bbox.height)} px · {(f.confidence * 100).toFixed(0)}%
                                  {f.widthMm ? ` · ${f.widthMm.toFixed(1)} mm` : ""}
                                  {f.heightMm ? ` / ${f.heightMm.toFixed(1)} mm` : ""}
                                </p>
                              </div>
                              <span className={`text-[10px] font-bold px-sm py-xs rounded border ${sevClass}`}>{SEV_LABEL[sev] || sev}</span>
                              {f.className.toLowerCase().includes("crack") && (
                                <button
                                  onClick={() => setActiveTool({ tool: "crackcalc", search: crackcalcSearch(f), finding: f })}
                                  className="text-primary text-[11px] font-bold hover:underline whitespace-nowrap"
                                >
                                  CrackCalc
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-on-surface-variant text-center py-8">Could not load analysis details.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTool && selectedFile && (
        <ToolOverlay
          tool={activeTool.tool}
          search={activeTool.search}
          imageUrl={detail?.blobUrl ?? selectedFile.url ?? selectedFile.previewUrl}
          finding={activeTool.finding}
          onClose={() => setActiveTool(null)}
        />
      )}
    </div>
  );
}
