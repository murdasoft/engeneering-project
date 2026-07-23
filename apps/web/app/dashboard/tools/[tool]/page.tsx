"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const TOOL_URLS: Record<string, { url: string; name: string; desc: string }> = {
  crackcalc: {
    url: "/tools-assets/crackcalc",
    name: "CrackCalc",
    desc: "Crack width calculation, growth prediction, multi-standard analysis",
  },
  loadbear: {
    url: "/tools-assets/loadbear",
    name: "LoadBear",
    desc: "Load-bearing capacity of reinforced concrete sections",
  },
  concretemix: {
    url: "/tools-assets/concretemix",
    name: "ConcreteMix",
    desc: "Concrete mix design, cost calculation, granulometry",
  },
  rebardesign: {
    url: "/tools-assets/rebardesign",
    name: "RebarDesign",
    desc: "Reinforcement design for concrete sections",
  },
  normbase: {
    url: "/tools-assets/normbase",
    name: "NormBase",
    desc: "Normative database — GOST, SP, SNiP full-text search",
  },
};

export default function ToolPage({ params }: { params: { tool: string } }) {
  const tool = TOOL_URLS[params.tool];
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSearch(window.location.search);
    }
  }, []);

  if (!tool) {
    return (
      <div className="animate-fade-in">
        <div className="bg-surface-container-lowest border border-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-[64px] text-outline-variant">error</span>
          <h2 className="font-headline-md text-headline-md mt-md">Tool not found</h2>
          <p className="font-body-sm text-on-surface-variant mt-xs mb-lg">
            The tool &quot;{params.tool}&quot; does not exist.
          </p>
          <Link
            href="/dashboard/tools"
            className="inline-flex items-center gap-xs bg-primary text-on-primary px-lg py-md font-label-caps text-label-caps rounded-lg hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            BACK TO TOOLS
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-4rem)]">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-md mb-lg">
        <div className="flex items-center gap-md">
          <Link
            href="/dashboard/tools"
            className="flex items-center gap-xs text-on-surface-variant hover:text-primary font-label-caps text-[11px] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            TOOLS
          </Link>
          <span className="text-outline-variant">/</span>
          <div>
            <h2 className="font-headline-md text-headline-md">{tool.name}</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{tool.desc}</p>
          </div>
        </div>
        <a
          href={`${tool.url}${search}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-xs text-primary font-label-caps text-[11px] hover:underline"
        >
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          OPEN IN NEW TAB
        </a>
      </header>

      <div className="flex-1 relative bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[48px] animate-spin">progress_activity</span>
          </div>
        )}
        <iframe
          src={`${tool.url}${search}`}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          title={tool.name}
        />
      </div>
    </div>
  );
}
