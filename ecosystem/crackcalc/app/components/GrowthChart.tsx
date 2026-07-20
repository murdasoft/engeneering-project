"use client";

interface Measurement {
  id: string;
  date: string;
  width: number;
  length: number;
  depth: number;
  note?: string;
}

function daysBetween(a: string, b: string) {
  return (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24);
}

function linearRegression(sorted: Measurement[]) {
  const n = sorted.length;
  const x = sorted.map((m, i) => daysBetween(sorted[0].date, m.date));
  const y = sorted.map(m => m.width);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: y[0], r2: 0 };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const yMean = sumY / n;
  const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
  const ssRes = y.reduce((acc, yi, i) => acc + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

export default function GrowthChart({ measurements, lang }: { measurements: Measurement[]; lang: "en" | "ru" }) {
  if (measurements.length < 2) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <p className="text-sm text-on-surface-variant">
          {lang === "en" ? "At least 2 measurements needed to show growth trend" : "Минимум 2 замера для отображения динамики роста"}
        </p>
      </div>
    );
  }

  const sorted = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const widths = sorted.map(m => m.width);
  const maxWidth = Math.max(0.3, Math.max(...widths) * 1.2);
  const dates = sorted.map(m => new Date(m.date).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU"));

  const { slope, intercept, r2 } = linearRegression(sorted);
  const daily = slope;
  const yearlyMm = daily * 365;
  const yearlyPct = widths[0] ? (yearlyMm / widths[0]) * 100 : 0;
  const lastW = widths[widths.length - 1];
  const yearsToCritical = daily > 0 && yearlyMm > 0 ? (0.3 - lastW) / yearlyMm : Infinity;

  const W = 600;
  const H = 260;
  const pad = { l: 56, r: 24, t: 24, b: 48 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const maxDays = Math.max(1, daysBetween(sorted[0].date, sorted[sorted.length - 1].date));
  const xScale = (d: number) => pad.l + (d / maxDays) * plotW;
  const yScale = (v: number) => pad.t + plotH - (v / maxWidth) * plotH;

  const points = sorted.map((m, i) => ({ x: xScale(daysBetween(sorted[0].date, m.date)), y: yScale(m.width), m }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${pad.t + plotH} L ${pad.l} ${pad.t + plotH} Z`;

  const trendStart = { x: pad.l, y: yScale(intercept) };
  const trendEnd = { x: xScale(maxDays), y: yScale(slope * maxDays + intercept) };
  const trendD = `M ${trendStart.x} ${trendStart.y} L ${trendEnd.x} ${trendEnd.y}`;

  const t = lang === "en"
    ? { title: "Crack Growth Trend", width: "Width (mm)", growth: "Growth", absPerYear: "mm/year", relPerYear: "%/year", reliability: "R²", critical: "Critical threshold (0.3mm)", toCritical: "Years to critical" }
    : { title: "Динамика роста трещины", width: "Ширина (мм)", growth: "Рост", absPerYear: "мм/год", relPerYear: "%/год", reliability: "R²", critical: "Критический порог (0.3мм)", toCritical: "Лет до критического" };

  const yearsText = isFinite(yearsToCritical) && yearsToCritical > 0 && yearsToCritical < 100
    ? `${yearsToCritical.toFixed(1)} ${lang === "en" ? "y" : "л"}`
    : lang === "en" ? "n/a" : "н/д";

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="font-display font-bold text-on-surface text-lg">{t.title}</h3>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-on-surface-variant">{t.growth}:</span>
          <span className={`text-sm font-bold ${yearlyPct > 15 ? "text-red-400" : yearlyPct > 5 ? "text-amber-400" : "text-emerald-400"}`}>{yearlyMm.toFixed(2)} {t.absPerYear}</span>
          <span className={`text-sm font-bold ${yearlyPct > 15 ? "text-red-400" : yearlyPct > 5 ? "text-amber-400" : "text-emerald-400"}`}>{yearlyPct.toFixed(1)} {t.relPerYear}</span>
          <span className="text-xs text-on-surface-variant">R² = {r2.toFixed(2)}</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 300 }}>
        <defs>
          <linearGradient id="crackGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#004349" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#004349" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.1, 0.2, 0.3].map((v) => (
          <g key={v}>
            <line x1={pad.l} y1={yScale(v)} x2={W - pad.r} y2={yScale(v)} stroke={v === 0.3 ? "#ef4444" : "#bfc8c9"} strokeDasharray={v === 0.3 ? "4 4" : "0"} strokeWidth="1" />
            <text x={pad.l - 8} y={yScale(v) + 4} textAnchor="end" fill="#576767" fontSize="10" fontFamily="JetBrains Mono">{v.toFixed(1)}</text>
          </g>
        ))}
        <path d={areaD} fill="url(#crackGrad)" />
        <path d={pathD} fill="none" stroke="#004349" strokeWidth="2.5" />
        <path d={trendD} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 4" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="#004349" stroke="#f0fcfb" strokeWidth="2" />
            <text x={p.x} y={H - pad.b + 18} textAnchor="middle" fill="#576767" fontSize="9" fontFamily="JetBrains Mono">{dates[i]}</text>
            <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#131d1d" fontSize="10" fontFamily="JetBrains Mono" fontWeight="600">{p.m.width.toFixed(2)}</text>
          </g>
        ))}
        <text x={pad.l - 35} y={H / 2} textAnchor="middle" fill="#576767" fontSize="10" transform={`rotate(-90 ${pad.l - 35} ${H / 2})`}>{t.width}</text>
        {sorted.length > 1 && (
          <text x={W - pad.r} y={yScale(0.3) - 6} textAnchor="end" fill="#ef4444" fontSize="9">{t.critical}</text>
        )}
      </svg>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="glass rounded-xl p-3">
          <p className="text-xs text-on-surface-variant mb-1">{t.absPerYear}</p>
          <p className="font-bold text-on-surface">{yearlyMm.toFixed(3)}</p>
        </div>
        <div className="glass rounded-xl p-3">
          <p className="text-xs text-on-surface-variant mb-1">{t.relPerYear}</p>
          <p className={`font-bold ${yearlyPct > 15 ? "text-red-400" : yearlyPct > 5 ? "text-amber-400" : "text-emerald-400"}`}>{yearlyPct.toFixed(1)}%</p>
        </div>
        <div className="glass rounded-xl p-3">
          <p className="text-xs text-on-surface-variant mb-1">{t.reliability}</p>
          <p className="font-bold text-on-surface">{r2.toFixed(2)}</p>
        </div>
        <div className="glass rounded-xl p-3">
          <p className="text-xs text-on-surface-variant mb-1">{t.toCritical}</p>
          <p className={`font-bold ${isFinite(yearsToCritical) && yearsToCritical < 5 ? "text-red-400" : "text-on-surface"}`}>{yearsText}</p>
        </div>
      </div>
    </div>
  );
}
