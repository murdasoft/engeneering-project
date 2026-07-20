import Link from "next/link";
import { ScanLine, Calculator, Layers, FlaskConical, Ruler, BookOpen } from "lucide-react";

const tools = [
  {
    icon: ScanLine,
    name: "InspectAI",
    desc: "AI-анализ дефектов бетона по фото. Полный инженерный отчёт с нормативными ссылками.",
    href: "https://inspectai-app-coral.vercel.app",
    badge: "Флагман",
    color: "from-sky-500/20 to-blue-500/5",
    border: "border-sky-500/30",
  },
  {
    icon: Calculator,
    name: "CrackCalc",
    desc: "Оценка трещин по ГОСТ 31937-2011. Категория дефекта, прогноз развития, срочность ремонта.",
    href: "https://crackcalc.vercel.app",
    badge: "Инструмент",
    color: "from-amber-500/20 to-orange-500/5",
    border: "border-amber-500/30",
  },
  {
    icon: Layers,
    name: "LoadBear",
    desc: "Расчёт остаточной несущей способности ЖБК с учётом дефектов и потери сечения.",
    href: "https://loadbear.vercel.app",
    badge: "Инструмент",
    color: "from-violet-500/20 to-purple-500/5",
    border: "border-violet-500/30",
  },
  {
    icon: FlaskConical,
    name: "ConcreteMix",
    desc: "Подбор состава ремонтного бетона. Пропорции, добавки, объём, прогноз срока службы.",
    href: "https://concretemix.vercel.app",
    badge: "Инструмент",
    color: "from-emerald-500/20 to-green-500/5",
    border: "border-emerald-500/30",
  },
  {
    icon: Ruler,
    name: "RebarDesign",
    desc: "Конструктор армирования и усиления. Визуализация сечения, подбор диаметров, % армирования.",
    href: "https://rebardesign.vercel.app",
    badge: "Инструмент",
    color: "from-rose-500/20 to-red-500/5",
    border: "border-rose-500/30",
  },
  {
    icon: BookOpen,
    name: "NormBase",
    desc: "AI-справочник по ГОСТ и СП. Семантический поиск по 20+ нормативным документам.",
    href: "https://normbase.vercel.app",
    badge: "Справочник",
    color: "from-cyan-500/20 to-teal-500/5",
    border: "border-cyan-500/30",
  },
];

export default function ToolsSection() {
  return (
    <section id="tools" className="section-padding relative">
      <div className="container-max">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-4">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm text-slate-400">Инструменты экосистемы</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            EngAI <span className="gradient-text">Ecosystem</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            6 взаимосвязанных инструментов для полного инженерного цикла — от диагностики до ремонта
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isInternal = tool.href.startsWith("/");
            return (
              <Link
                key={tool.name}
                href={tool.href}
                target={isInternal ? undefined : "_blank"}
                rel={isInternal ? undefined : "noopener noreferrer"}
                className={`group relative glass-hover rounded-2xl p-6 bg-gradient-to-br ${tool.color} border ${tool.border} overflow-hidden`}
              >
                <div className="absolute top-4 right-4">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-slate-400 border border-white/10">
                    {tool.badge}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-2">{tool.name}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{tool.desc}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-accent group-hover:gap-3 transition-all">
                  <span>Открыть</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 glass rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold">Все инструменты связаны между собой</p>
              <p className="text-sm text-slate-400">Результаты одного автоматически передаются в другой</p>
            </div>
          </div>
          <a href="/dashboard" className="btn-primary text-sm whitespace-nowrap">
            Open Dashboard →
          </a>
        </div>
      </div>
    </section>
  );
}
