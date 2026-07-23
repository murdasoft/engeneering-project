"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  siteId: string | null;
  objectType: string | null;
  status: string;
  createdAt: string;
  _count: { assets: number; reports: number };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({ name: "", siteId: "", objectType: "", address: "", description: "" });

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    const res = await fetch("/api/projects");
    if (res.ok) {
      const data = await res.json();
      setProjects(data.projects);
    }
    setLoading(false);
  }

  async function generateReport(e: React.MouseEvent, projectId: string) {
    e.preventDefault();
    e.stopPropagation();
    setGenerating(projectId);
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
      a.download = `InspectAI-Report-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Error generating PDF: " + (e as Error).message);
    } finally {
      setGenerating(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProject),
    });
    if (res.ok) {
      setShowCreate(false);
      setNewProject({ name: "", siteId: "", objectType: "", address: "", description: "" });
      loadProjects();
    }
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-primary/10 text-primary",
    COMPLETED: "bg-secondary/10 text-secondary",
    CRITICAL: "bg-error/10 text-error",
    ARCHIVED: "bg-outline-variant/30 text-outline",
  };

  return (
    <div className="animate-fade-in">
      <header className="flex justify-between items-center mb-xl">
        <div>
          <p className="font-label-caps text-label-caps text-secondary mb-xs">PROJECTS</p>
          <h2 className="font-display-lg text-display-lg">All Projects</h2>
          <p className="font-body-md text-on-surface-variant mt-xs">Manage your inspection projects and sites.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-xs bg-primary text-on-primary px-lg py-md font-label-caps text-label-caps rounded-lg hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          CREATE PROJECT
        </button>
      </header>

      {showCreate && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-8 animate-fade-in" onClick={() => setShowCreate(false)}>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-headline-md text-headline-md mb-lg">Create New Project</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">PROJECT NAME *</label>
                <input
                  type="text"
                  required
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-md py-md bg-surface border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:outline-none"
                  placeholder="Golden Gate Span-B"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">SITE ID</label>
                  <input
                    type="text"
                    value={newProject.siteId}
                    onChange={(e) => setNewProject({ ...newProject, siteId: e.target.value })}
                    className="w-full px-md py-md bg-surface border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:outline-none"
                    placeholder="SF-2991-X"
                  />
                </div>
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">OBJECT TYPE</label>
                  <select
                    value={newProject.objectType}
                    onChange={(e) => setNewProject({ ...newProject, objectType: e.target.value })}
                    className="w-full px-md py-md bg-surface border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="Bridge">Bridge</option>
                    <option value="Facade">Facade</option>
                    <option value="Pier">Pier</option>
                    <option value="Building">Building</option>
                    <option value="Road">Road</option>
                    <option value="Dam">Dam</option>
                    <option value="Tunnel">Tunnel</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">ADDRESS</label>
                <input
                  type="text"
                  value={newProject.address}
                  onChange={(e) => setNewProject({ ...newProject, address: e.target.value })}
                  className="w-full px-md py-md bg-surface border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:outline-none"
                  placeholder="123 Main St, San Francisco, CA"
                />
              </div>
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">DESCRIPTION</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                  className="w-full px-md py-md bg-surface border border-outline-variant rounded-lg font-body-md text-body-md focus:border-primary focus:outline-none"
                  placeholder="Brief description of the inspection scope..."
                />
              </div>
              <div className="flex gap-sm justify-end pt-sm">
                <button type="button" onClick={() => setShowCreate(false)} className="px-lg py-md border border-outline-variant font-label-caps text-label-caps rounded-lg hover:bg-surface-container transition-colors">
                  CANCEL
                </button>
                <button type="submit" className="px-lg py-md bg-primary text-on-primary font-label-caps text-label-caps rounded-lg hover:bg-primary-container transition-colors">
                  CREATE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined text-primary text-[48px] animate-spin">progress_activity</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-[64px] text-outline-variant">folder_off</span>
          <h3 className="font-headline-md text-headline-md mt-md">No projects yet</h3>
          <p className="font-body-sm text-on-surface-variant mt-xs mb-lg">Create your first inspection project to get started.</p>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-md font-label-caps text-label-caps rounded-lg hover:bg-primary-container transition-colors">
            <span className="material-symbols-outlined text-[18px]">add</span>
            CREATE PROJECT
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/projects/${p.id}`}
              className="bg-surface-container-lowest border border-outline-variant p-lg hover:border-primary transition-colors group"
            >
              <div className="flex justify-between items-start mb-md">
                <div>
                  <h3 className="font-title-sm text-title-sm group-hover:text-primary transition-colors">{p.name}</h3>
                  <p className="text-[11px] text-on-surface-variant font-mono-data mt-xs">ID: {p.siteId ?? "—"}</p>
                </div>
                <span className={`px-sm py-xs font-label-caps text-[10px] ${statusColors[p.status] ?? statusColors.ACTIVE}`}>
                  {p.status}
                </span>
              </div>
              <div className="flex gap-lg text-on-surface-variant font-body-sm text-body-sm">
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px]">photo_library</span>
                  {p._count.assets} photos
                </span>
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px]">description</span>
                  {p._count.reports} reports
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-md font-mono-data">
                {p.objectType ?? "Unspecified"} · Created {p.createdAt.slice(0,10)}
              </p>
              <div className="mt-md pt-sm border-t border-outline-variant flex justify-end">
                <button
                  onClick={(e) => generateReport(e, p.id)}
                  disabled={generating === p.id}
                  className="flex items-center gap-xs text-primary font-label-caps text-[11px] hover:underline disabled:opacity-50"
                >
                  {generating === p.id ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      GENERATING...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                      GENERATE PDF
                    </>
                  )}
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
