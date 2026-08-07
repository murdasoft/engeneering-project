"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AssetModal from "./AssetModal";

interface Asset {
  id: string;
  filename: string;
  blobUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  analyses: Array<{
    id: string;
    status: string;
    confidence: number | null;
    modelVersion: string | null;
    createdAt: string;
    _count: { findings: number };
  }>;
}

interface Report {
  id: string;
  title: string;
  reportUrl: string | null;
  summary: string | null;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  siteId: string | null;
  objectType: string | null;
  address: string | null;
  description: string | null;
  status: string;
  createdAt: string;
  assets: Asset[];
  reports: Report[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [analysisParams, setAnalysisParams] = useState<Record<string, string | number>>({
    pixel_scale_mm: 0.05,
    environment: "atmospheric",
    aggression: "normal",
    structure_type: "",
    concrete_grade: "",
    rebar_class: "",
    structure_age: "",
    protective_layer_mm: "",
    threshold: 0.25,
  });

  useEffect(() => {
    loadProject();
  }, [projectId]);

  async function loadProject() {
    const res = await fetch(`/api/projects/${projectId}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data.project);
    }
    setLoading(false);
  }

  async function runAnalysis(asset: Asset) {
    setAnalyzing(asset.id);
    try {
      const res = await fetch("/api/analyses/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: asset.id, projectId, params: analysisParams }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Analysis failed");
      } else {
        loadProject();
      }
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setAnalyzing(null);
    }
  }

  async function generateReport() {
    setGenerating(true);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Failed to generate report");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `InspectAI-Report-${project?.name ?? "project"}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      loadProject();
    } catch (e) {
      alert("Error generating PDF: " + (e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="material-symbols-outlined text-primary text-[48px] animate-spin">progress_activity</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant p-xl text-center">
        <span className="material-symbols-outlined text-[64px] text-outline-variant">folder_off</span>
        <h2 className="font-headline-md text-headline-md mt-md">Project not found</h2>
        <Link href="/dashboard/projects" className="inline-flex items-center gap-xs text-primary font-bold mt-lg hover:underline">
          Back to projects
        </Link>
      </div>
    );
  }

  const totalFindings = project.assets.reduce(
    (sum, a) => sum + a.analyses.reduce((s, an) => s + an._count.findings, 0),
    0
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-start gap-md mb-xl">
        <div>
          <Link href="/dashboard/projects" className="flex items-center gap-xs text-on-surface-variant hover:text-primary font-label-caps text-[11px] mb-xs transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            ALL PROJECTS
          </Link>
          <h2 className="font-display-lg text-display-lg">{project.name}</h2>
          <div className="flex flex-wrap gap-lg mt-xs text-on-surface-variant font-body-sm text-body-sm">
            <span className="flex items-center gap-xs"><span className="material-symbols-outlined text-[16px]">badge</span>{project.siteId ?? "—"}</span>
            <span className="flex items-center gap-xs"><span className="material-symbols-outlined text-[16px]">apartment</span>{project.objectType ?? "Unspecified"}</span>
            <span className="flex items-center gap-xs"><span className="material-symbols-outlined text-[16px]">location_on</span>{project.address ?? "—"}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-sm">
          <Link
            href={`/dashboard/upload?project=${project.id}`}
            className="flex items-center gap-xs px-lg py-md border border-outline-variant font-label-caps text-label-caps rounded-lg hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
            ADD PHOTOS
          </Link>
          <button
            onClick={generateReport}
            disabled={generating}
            className="flex items-center gap-xs bg-primary text-on-primary px-lg py-md font-label-caps text-label-caps rounded-lg hover:bg-primary-container transition-colors disabled:opacity-50"
          >
            {generating ? (
              <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>GENERATING...</>
            ) : (
              <><span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>GENERATE REPORT</>
            )}
          </button>
        </div>
      </header>

      {project.description && (
        <div className="bg-surface-container-lowest border border-outline-variant p-lg mb-xl">
          <p className="font-label-caps text-label-caps text-on-surface-variant mb-xs">DESCRIPTION</p>
          <p className="font-body-md text-body-md">{project.description}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter mb-xl">
        <div className="bg-surface-container-lowest border border-outline-variant p-lg">
          <p className="font-label-caps text-label-caps text-on-surface-variant">PHOTOS</p>
          <p className="text-[32px] font-bold mt-xs">{project.assets.length}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant p-lg">
          <p className="font-label-caps text-label-caps text-on-surface-variant">ANALYSES</p>
          <p className="text-[32px] font-bold mt-xs">{project.assets.reduce((s, a) => s + a.analyses.length, 0)}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant p-lg">
          <p className="font-label-caps text-label-caps text-on-surface-variant">DEFECTS FOUND</p>
          <p className="text-[32px] font-bold mt-xs text-error">{totalFindings}</p>
        </div>
      </div>

      {/* Analysis Context */}
      <section className="mb-xl">
        <h3 className="font-headline-md text-headline-md mb-lg">Analysis Context</h3>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
          <div>
            <label className="block font-label-caps text-[10px] text-on-surface-variant mb-xs">PIXEL SCALE (mm/px)</label>
            <input
              type="number"
              step="0.001"
              value={analysisParams.pixel_scale_mm}
              onChange={(e) => setAnalysisParams((p) => ({ ...p, pixel_scale_mm: parseFloat(e.target.value) || 0 }))}
              className="w-full px-sm py-xs bg-surface-container border border-outline-variant rounded font-body-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-label-caps text-[10px] text-on-surface-variant mb-xs">ENVIRONMENT</label>
            <select
              value={analysisParams.environment}
              onChange={(e) => setAnalysisParams((p) => ({ ...p, environment: e.target.value }))}
              className="w-full px-sm py-xs bg-surface-container border border-outline-variant rounded font-body-sm focus:border-primary focus:outline-none"
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
              className="w-full px-sm py-xs bg-surface-container border border-outline-variant rounded font-body-sm focus:border-primary focus:outline-none"
            >
              <option value="normal">Normal</option>
              <option value="aggressive">Aggressive</option>
              <option value="mild">Mild</option>
            </select>
          </div>
          <div>
            <label className="block font-label-caps text-[10px] text-on-surface-variant mb-xs">CONCRETE GRADE</label>
            <input
              type="text"
              value={analysisParams.concrete_grade}
              onChange={(e) => setAnalysisParams((p) => ({ ...p, concrete_grade: e.target.value }))}
              placeholder="e.g. B25"
              className="w-full px-sm py-xs bg-surface-container border border-outline-variant rounded font-body-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-label-caps text-[10px] text-on-surface-variant mb-xs">STRUCTURE TYPE</label>
            <input
              type="text"
              value={analysisParams.structure_type}
              onChange={(e) => setAnalysisParams((p) => ({ ...p, structure_type: e.target.value }))}
              placeholder="e.g. wall"
              className="w-full px-sm py-xs bg-surface-container border border-outline-variant rounded font-body-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-label-caps text-[10px] text-on-surface-variant mb-xs">REBAR CLASS</label>
            <input
              type="text"
              value={analysisParams.rebar_class}
              onChange={(e) => setAnalysisParams((p) => ({ ...p, rebar_class: e.target.value }))}
              placeholder="e.g. A500"
              className="w-full px-sm py-xs bg-surface-container border border-outline-variant rounded font-body-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-label-caps text-[10px] text-on-surface-variant mb-xs">STRUCTURE AGE (years)</label>
            <input
              type="number"
              value={analysisParams.structure_age}
              onChange={(e) => setAnalysisParams((p) => ({ ...p, structure_age: e.target.value }))}
              className="w-full px-sm py-xs bg-surface-container border border-outline-variant rounded font-body-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-label-caps text-[10px] text-on-surface-variant mb-xs">PROTECTIVE LAYER (mm)</label>
            <input
              type="number"
              value={analysisParams.protective_layer_mm}
              onChange={(e) => setAnalysisParams((p) => ({ ...p, protective_layer_mm: e.target.value }))}
              className="w-full px-sm py-xs bg-surface-container border border-outline-variant rounded font-body-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-label-caps text-[10px] text-on-surface-variant mb-xs">CONFIDENCE THRESHOLD</label>
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
              Current: {Number(analysisParams.threshold).toFixed(2)} — Lower = more detections (more false positives)
            </p>
          </div>
        </div>
        <p className="text-[11px] text-on-surface-variant mt-sm">
          Pixel scale converts bounding box dimensions to millimeters. Use a reference object or known camera distance.
        </p>
      </section>

      {/* Photo Gallery */}
      <section className="mb-xl">
        <h3 className="font-headline-md text-headline-md mb-lg">Inspection Photos</h3>
        {project.assets.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant p-xl text-center">
            <span className="material-symbols-outlined text-[64px] text-outline-variant">photo_library</span>
            <p className="font-body-sm text-on-surface-variant mt-md">No photos uploaded yet.</p>
            <Link
              href={`/dashboard/upload?project=${project.id}`}
              className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-md font-label-caps text-label-caps rounded-lg hover:bg-primary-container transition-colors mt-lg"
            >
              <span className="material-symbols-outlined text-[18px]">upload</span>
              UPLOAD PHOTOS
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
            {project.assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden hover:border-primary transition-colors group cursor-pointer"
                onClick={() => setSelectedAsset(asset)}
              >
                <div className="aspect-square bg-surface-container overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.blobUrl}
                    alt={asset.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {asset.analyses.length > 0 && (
                    <div className="absolute top-2 right-2 px-xs py-xs bg-primary text-on-primary font-label-caps text-[9px] rounded">
                      {asset.analyses[0]._count.findings} DEFECTS
                    </div>
                  )}
                </div>
                <div className="p-sm">
                  <p className="font-mono-data text-mono-data truncate text-[11px]">{asset.filename}</p>
                  <div className="flex justify-between items-center mt-xs">
                    <span className="text-[10px] text-on-surface-variant">{(asset.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                    {asset.analyses.length === 0 ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); runAnalysis(asset); }}
                        disabled={analyzing === asset.id}
                        className="flex items-center gap-xs text-primary font-label-caps text-[10px] hover:underline disabled:opacity-50"
                      >
                        {analyzing === asset.id ? (
                          <><span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>ANALYZING</>
                        ) : (
                          <><span className="material-symbols-outlined text-[14px]">psychology</span>ANALYZE</>
                        )}
                      </button>
                    ) : (
                      <span className="flex items-center gap-xs text-primary font-label-caps text-[10px]">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        {asset.analyses.length} ANALYSES
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reports */}
      {project.reports.length > 0 && (
        <section className="mb-xl">
          <h3 className="font-headline-md text-headline-md mb-lg">Generated Reports</h3>
          <div className="space-y-sm">
            {project.reports.map((report) => (
              <div key={report.id} className="bg-surface-container-lowest border border-outline-variant p-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
                <div className="flex items-center gap-md">
                  <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
                  <div>
                    <p className="font-body-md font-bold">{report.title}</p>
                    <p className="text-[11px] text-on-surface-variant font-mono-data">
                      {report.createdAt.slice(0,16).replace("T", " ")}
                    </p>
                  </div>
                </div>
                {report.reportUrl && (
                  <a
                    href={report.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-xs text-primary font-label-caps text-[11px] hover:underline"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    DOWNLOAD
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <AssetModal
          asset={selectedAsset}
          projectId={projectId}
          analyzing={analyzing}
          onAnalyze={runAnalysis}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}
