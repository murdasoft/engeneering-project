"use client";

import { useState } from "react";

const facadeTypes = [
  { name: "Ventilated Facades", icon: "view_in_ar", desc: "Cladding with air gap between insulation and outer layer. Common in modern commercial buildings." },
  { name: "Wet Facades (Plaster)", icon: "format_paint", desc: "Plaster/render applied directly to insulation. Prone to cracking and delamination." },
  { name: "Structural Glazing", icon: "window", desc: "Glass panels bonded to structural frame with silicone. Risk of sealant failure." },
  { name: "Curtain Walls", icon: "grid_view", desc: "Aluminum-framed non-structural wall system. Issues with gaskets and water ingress." },
  { name: "Precast Concrete", icon: "foundation", desc: "Factory-cast panels. Joint failure, staining, and surface cracking are common." },
  { name: "Stone Cladding", icon: "diamond", desc: "Natural stone panels on sub-frame. Anchor failure and spalling risks." },
];

const defectTypes = [
  { name: "Surface Cracks", severity: "MEDIUM", desc: "Hairline to 2mm width. Usually non-structural but indicates stress." },
  { name: "Structural Cracks", severity: "HIGH", desc: ">2mm width, through-thickness. Requires immediate engineering assessment." },
  { name: "Spalling", severity: "HIGH", desc: "Concrete surface breaking away. Often caused by rebar corrosion." },
  { name: "Efflorescence", severity: "LOW", desc: "White mineral deposits. Indicates moisture penetration." },
  { name: "Delamination", severity: "HIGH", desc: "Separation of layers in plaster/coating. Hollow sound on tapping." },
  { name: "Corrosion Staining", severity: "MEDIUM", desc: "Rust stains from exposed or corroding reinforcement." },
  { name: "Joint Failure", severity: "MEDIUM", desc: "Deteriorated sealant or mortar joints allowing water ingress." },
  { name: "Biological Growth", severity: "LOW", desc: "Algae, moss, or lichen. Indicates moisture retention and poor drainage." },
];

const standards = [
  { code: "GOST 31937-2011", title: "Building and structures — Rules for inspection and monitoring" },
  { code: "EN 1992-1-1", title: "Eurocode 2 — Design of concrete structures" },
  { code: "ACI 562-16", title: "Code Requirements for Assessment, Repair, and Rehabilitation of Concrete Structures" },
  { code: "ISO 13822", title: "Bases for design of structures — Assessment of existing structures" },
];

export default function KnowledgePage() {
  const [tab, setTab] = useState<"facades" | "defects" | "standards">("facades");

  const severityColors: Record<string, string> = {
    LOW: "bg-outline-variant/30 text-outline",
    MEDIUM: "bg-tertiary/15 text-tertiary",
    HIGH: "bg-error/15 text-error",
    CRITICAL: "bg-error text-on-error",
  };

  return (
    <div className="animate-fade-in">
      <header className="mb-xl">
        <p className="font-label-caps text-label-caps text-secondary mb-xs">KNOWLEDGE BASE</p>
        <h2 className="font-display-lg text-display-lg">Facade Engineering Reference</h2>
        <p className="font-body-md text-on-surface-variant mt-xs">Reference guide for facade systems, defect types, and engineering standards.</p>
      </header>

      <div className="flex gap-xs mb-lg">
        {[
          { key: "facades", label: "FACADE SYSTEMS" },
          { key: "defects", label: "DEFECT TYPES" },
          { key: "standards", label: "STANDARDS" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-md py-sm font-label-caps text-label-caps rounded-lg transition-colors ${
              tab === t.key ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-variant"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "facades" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {facadeTypes.map((f) => (
            <div key={f.name} className="bg-surface-container-lowest border border-outline-variant p-lg hover:border-primary transition-colors">
              <div className="flex items-center gap-sm mb-md">
                <span className="material-symbols-outlined text-primary text-[28px]">{f.icon}</span>
                <h3 className="font-title-sm text-title-sm">{f.name}</h3>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{f.desc}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "defects" && (
        <div className="space-y-gutter">
          {defectTypes.map((d) => (
            <div key={d.name} className="bg-surface-container-lowest border border-outline-variant p-lg flex items-center gap-lg">
              <span className={`px-sm py-xs font-label-caps text-[10px] ${severityColors[d.severity]} flex-shrink-0`}>
                {d.severity}
              </span>
              <div className="flex-1">
                <h3 className="font-title-sm text-title-sm">{d.name}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "standards" && (
        <div className="bg-surface-container-lowest border border-outline-variant">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider">
                <th className="px-lg py-md font-bold">Code</th>
                <th className="px-lg py-md font-bold">Title</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-body-sm">
              {standards.map((s) => (
                <tr key={s.code} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-lg py-lg font-mono-data text-primary font-bold">{s.code}</td>
                  <td className="px-lg py-lg">{s.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
