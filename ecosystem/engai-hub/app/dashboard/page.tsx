"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ScanLine, Calculator, Layers, FlaskConical, Ruler, BookOpen, FolderKanban, Clock, ArrowRight, Trash2, Plus, Workflow } from "lucide-react";

interface SharedProject {
  id: string;
  name: string;
  tool: string;
  data: Record<string, unknown>;
  date: string;
}

interface ActivityItem {
  id: string;
  tool: string;
  action: string;
  detail: string;
  date: string;
}

const toolMeta: Record<string, { icon: typeof ScanLine; color: string; href: string }> = {
  InspectAI: { icon: ScanLine, color: "text-sky-400", href: "https://inspectai-app-coral.vercel.app" },
  CrackCalc: { icon: Calculator, color: "text-amber-400", href: "https://crackcalc.vercel.app" },
  LoadBear: { icon: Layers, color: "text-violet-400", href: "https://loadbear.vercel.app" },
  ConcreteMix: { icon: FlaskConical, color: "text-emerald-400", href: "https://concretemix.vercel.app" },
  RebarDesign: { icon: Ruler, color: "text-rose-400", href: "https://rebardesign.vercel.app" },
  NormBase: { icon: BookOpen, color: "text-cyan-400", href: "https://normbase.vercel.app" },
};

const workflows = [
  {
    name: "Inspection → Assessment → Repair",
    steps: [
      { tool: "InspectAI", action: "Upload photo & detect defects" },
      { tool: "CrackCalc", action: "Assess crack severity & category" },
      { tool: "LoadBear", action: "Calculate residual capacity" },
      { tool: "ConcreteMix", action: "Design repair concrete mix" },
    ],
  },
  {
    name: "Design → Verification → Norms",
    steps: [
      { tool: "RebarDesign", action: "Design reinforcement layout" },
      { tool: "LoadBear", action: "Verify load-bearing capacity" },
      { tool: "NormBase", action: "Check normative requirements" },
    ],
  },
  {
    name: "Diagnosis → Specification",
    steps: [
      { tool: "InspectAI", action: "Identify concrete defects" },
      { tool: "NormBase", action: "Find relevant GOST/SP clauses" },
      { tool: "ConcreteMix", action: "Specify repair composition" },
      { tool: "RebarDesign", action: "Design reinforcement if needed" },
    ],
  },
];

export default function DashboardPage() {
  const [projects, setProjects] = useState<SharedProject[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTool, setNewTool] = useState("InspectAI");

  useEffect(() => {
    const p = localStorage.getItem("engai_projects");
    if (p) setProjects(JSON.parse(p));
    const a = localStorage.getItem("engai_activity");
    if (a) setActivities(JSON.parse(a));
  }, []);

  const saveProjects = (p: SharedProject[]) => {
    setProjects(p);
    localStorage.setItem("engai_projects", JSON.stringify(p));
  };

  const saveActivities = (a: ActivityItem[]) => {
    setActivities(a);
    localStorage.setItem("engai_activity", JSON.stringify(a));
  };

  const addProject = () => {
    if (!newName.trim()) return;
    const proj: SharedProject = {
      id: Date.now().toString(),
      name: newName,
      tool: newTool,
      data: {},
      date: new Date().toISOString(),
    };
    saveProjects([proj, ...projects]);
    const act: ActivityItem = {
      id: Date.now().toString() + "a",
      tool: newTool,
      action: "Project created",
      detail: newName,
      date: new Date().toISOString(),
    };
    saveActivities([act, ...activities]);
    setNewName("");
    setShowForm(false);
  };

  const deleteProject = (id: string) => {
    saveProjects(projects.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container-max">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-4">
            <FolderKanban className="w-4 h-4 text-accent" />
            <span className="text-sm text-slate-400">EngAI Dashboard</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Cross-Tool <span className="gradient-text">Workspace</span>
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg">
            Shared projects, activity history, and cross-tool workflows across the EngAI ecosystem.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: "Projects", value: projects.length, icon: FolderKanban },
            { label: "Activities", value: activities.length, icon: Clock },
            { label: "Tools", value: 6, icon: Workflow },
            { label: "Workflows", value: workflows.length, icon: ArrowRight },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="glass rounded-xl p-5">
                <Icon className="w-5 h-5 text-accent mb-2" />
                <div className="font-display text-3xl font-bold text-white">{s.value}</div>
                <div className="text-sm text-slate-500">{s.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-white">Shared Projects</h2>
                <button onClick={() => setShowForm(!showForm)} className="btn-ghost text-sm flex items-center gap-1">
                  <Plus className="w-4 h-4" /> New
                </button>
              </div>

              {showForm && (
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Project name"
                    className="flex-1 px-4 py-2 rounded-xl bg-bg-700 border border-white/10 text-white placeholder:text-slate-500 focus:border-accent/50 focus:outline-none text-sm"
                  />
                  <select
                    value={newTool}
                    onChange={(e) => setNewTool(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-bg-700 border border-white/10 text-white text-sm focus:border-accent/50 focus:outline-none"
                  >
                    {Object.keys(toolMeta).map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={addProject} className="btn-primary text-sm px-4">Add</button>
                </div>
              )}

              {projects.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No projects yet. Create one or save from any ecosystem tool.
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((p) => {
                    const meta = toolMeta[p.tool];
                    const Icon = meta?.icon ?? ScanLine;
                    return (
                      <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                            <Icon className={`w-5 h-5 ${meta?.color ?? "text-slate-400"}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{p.name}</h3>
                            <p className="text-xs text-slate-500">{p.tool} · {new Date(p.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={meta?.href} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:text-white transition-colors">
                            Open →
                          </a>
                          <button onClick={() => deleteProject(p.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Workflows */}
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Workflow className="w-5 h-5 text-accent" /> Cross-Tool Workflows
              </h2>
              <div className="space-y-4">
                {workflows.map((wf, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <h3 className="font-semibold text-white mb-3 text-sm">{wf.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {wf.steps.map((step, j) => {
                        const meta = toolMeta[step.tool];
                        const Icon = meta?.icon ?? ScanLine;
                        return (
                          <div key={j} className="flex items-center gap-2">
                            <a href={meta?.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-700 border border-white/10 hover:border-accent/30 transition-colors">
                              <Icon className={`w-4 h-4 ${meta?.color ?? "text-slate-400"}`} />
                              <div>
                                <div className="text-xs font-semibold text-white">{step.tool}</div>
                                <div className="text-[10px] text-slate-500">{step.action}</div>
                              </div>
                            </a>
                            {j < wf.steps.length - 1 && <ArrowRight className="w-4 h-4 text-slate-600" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity History */}
          <div className="glass rounded-2xl p-6 h-fit">
            <h2 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" /> Activity History
            </h2>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No activity yet. Actions from ecosystem tools will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 20).map((a) => {
                  const meta = toolMeta[a.tool];
                  const Icon = meta?.icon ?? ScanLine;
                  return (
                    <div key={a.id} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0">
                      <Icon className={`w-4 h-4 mt-0.5 ${meta?.color ?? "text-slate-400"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{a.action}</p>
                        <p className="text-xs text-slate-500 truncate">{a.tool} · {a.detail}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{new Date(a.date).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Back to hub */}
        <div className="text-center mt-12">
          <Link href="/" className="text-sm text-slate-500 hover:text-accent transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
