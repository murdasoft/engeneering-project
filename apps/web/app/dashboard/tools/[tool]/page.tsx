"use client";

import { useState } from "react";
import Link from "next/link";

const TOOL_URLS: Record<string, { url: string; name: string; desc: string }> = {
  crackcalc: {
    url: "https://crackcalc.vercel.app",
    name: "CrackCalc",
    desc: "Crack width calculation, growth prediction, multi-standard analysis",
  },
  loadbear: {
    url: "https://loadbear.vercel.app",
    name: "LoadBear",
    desc: "Load-bearing capacity of reinforced concrete sections",
  },
  concretemix: {
    url: "https://concretemix.vercel.app",
    name: "ConcreteMix",
    desc: "Concrete mix design, cost calculation, granulometry",
  },
  rebardesign: {
    url: "https://rebardesign.vercel.app",
    name: "RebarDesign",
    desc: "Reinforcement design for concrete sections",
  },
  normbase: {
    url: "https://normbase.vercel.app",
    name: "NormBase",
    desc: "Normative database — GOST, SP, SNiP full-text search",
  },
};

export default function ToolPage({ params }: { params: { tool: string } }) {
  const tool = TOOL_URLS[params.tool];
  const [loading, setLoading] = useState(true);

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
      <header className="flex items-center justify-between mb-lg">
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
          href={tool.url}
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
          src={tool.url}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          title={tool.name}
        />
      </div>
    </div>
  );
}
