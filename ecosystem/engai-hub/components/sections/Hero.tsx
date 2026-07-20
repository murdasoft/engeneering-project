"use client";

import Link from "next/link";
import { ScanLine, FileText, ShieldCheck, Zap, FolderKanban } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 grid-bg opacity-40" />
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-eng-700/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: "2s" }} />

      <div className="container-max relative z-10">
        <div className="max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-slate-300">Работаем по ГОСТ 31937-2011 и СП 63.13330.2018</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-tight mb-6 animate-slide-up">
            Инженерное обследование
            <br />
            <span className="gradient-text">с искусственным интеллектом</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Полный цикл — от AI-диагностики дефектов бетона до расчёта усиления и подбора ремонтных составов.
            20+ страниц инженерного отчёта с нормативными ссылками.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <a href="https://inspectai-app-coral.vercel.app" target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center justify-center gap-2">
              <ScanLine className="w-5 h-5" />
              Загрузить фото для анализа
            </a>
            <Link href="/dashboard" className="btn-ghost flex items-center justify-center gap-2">
              <FolderKanban className="w-5 h-5" />
              Dashboard
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {[
              { icon: ScanLine, value: "6", label: "AI-инструментов" },
              { icon: FileText, value: "21 стр", label: "в отчёте PDF" },
              { icon: ShieldCheck, value: "8+", label: "ГОСТ и СП" },
              { icon: Zap, value: "< 30 сек", label: "анализ фото" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="glass rounded-xl p-4">
                  <Icon className="w-5 h-5 text-accent mb-2" />
                  <div className="font-display text-2xl font-bold text-white">{item.value}</div>
                  <div className="text-sm text-slate-500">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}
