"use client";

import { useState, useRef, useEffect } from "react";
import { Ruler, Plus, Minus, ChevronDown, Menu, X, ArrowRight, Grid3x3, Globe } from "lucide-react";
import Link from "next/link";

const barAreas: Record<number, number> = { 8: 50.3, 10: 78.5, 12: 113.1, 14: 153.9, 16: 201.1, 18: 254.5, 20: 314.2, 22: 380.1, 25: 490.9, 28: 615.8, 32: 804.2 };

const faqItems = [
  { q: { en: "What reinforcement percentage is considered normal?", ru: "Какой процент армирования считается нормой?" }, a: { en: "For flexural elements, minimum reinforcement is 0.1%, optimal is 1–3%. Above 5% is over-reinforced — section enlargement is needed.", ru: "Для изгибаемых элементов минимальный процент армирования 0.1%, оптимальный 1–3%. Свыше 5% — переармирование, требуется увеличение сечения." } },
  { q: { en: "How to choose bar diameter?", ru: "Как выбрать диаметр стержней?" }, a: { en: "For longitudinal reinforcement, bars Ø12–25 mm are typically used. For stirrups and transverse reinforcement — Ø6–12 mm. Diameter depends on loads and rebar class.", ru: "Для продольной арматуры обычно используются стержни Ø12–25 мм. Для хомутов и поперечной арматуры — Ø6–12 мм. Диаметр зависит от нагрузок и класса арматуры." } },
  { q: { en: "Can I move bars around?", ru: "Можно ли перемещать стержни?" }, a: { en: "Yes, bars can be added, removed and their diameter changed. Position is displayed on the visual section diagram in real time.", ru: "Да, стержни можно добавлять, удалять и изменять их диаметр. Положение отображается на визуальной схеме сечения в реальном времени." } },
  { q: { en: "How is reinforcement area calculated?", ru: "Как рассчитывается площадь арматуры?" }, a: { en: "Each bar's area is taken from the GOST 5781-82 table. Total area is summed, reinforcement percentage = (ΣAs / (b×h)) × 100.", ru: "Площадь каждого стержня берётся из таблицы ГОСТ 5781-82. Общая площадь суммируется, процент армирования = (ΣAs / (b×h)) × 100." } },
];

const relatedTools = [
  { name: "LoadBear", desc: { en: "Load-bearing capacity calculator", ru: "Расчёт несущей способности" }, href: "https://loadbear.vercel.app", icon: "🏗️" },
  { name: "ConcreteMix", desc: { en: "Concrete mix design", ru: "Подбор состава бетона" }, href: "https://concretemix.vercel.app", icon: "🧪" },
  { name: "InspectAI", desc: { en: "AI structural inspection", ru: "AI-обследование конструкций" }, href: "https://inspectai-app-coral.vercel.app", icon: "🔍" },
];

const tr = {
  en: {
    designer: "Designer", howItWorks: "How it works", faq: "FAQ", tools: "Tools", design: "Design",
    sectionScheme: "Section scheme", sectionParams: "Section parameters", widthB: "Width b (mm)", heightH: "Height h (mm)",
    reinforcement: "Reinforcement", bars: "bars", add: "Add", remove: "Remove",
    rebarArea: "Reinforcement area", rebarPercent: "Reinforcement %",
    steps: [
      { title: "Configure section", desc: "Set the section width and height using sliders. The diagram updates in real time." },
      { title: "Place reinforcement", desc: "Add bars of the required diameter (Ø8–Ø32). Select an active bar to edit it." },
      { title: "Control reinforcement", desc: "The system automatically calculates reinforcement area and percentage with color-coded status." },
    ],
    faqTitle: "Frequently Asked Questions", toolsTitle: "Related Tools", open: "Open",
    heroBadge: "GOST 5781-82",
    heroDesc: "Visual reinforcement designer for reinforced concrete sections. Bar diameter and quantity selection, reinforcement percentage calculation in real time.",
    footerDesc: "AI-powered structural inspection of building structures",
  },
  ru: {
    designer: "Конструктор", howItWorks: "Как работает", faq: "FAQ", tools: "Инструменты", design: "Конструировать",
    sectionScheme: "Схема сечения", sectionParams: "Параметры сечения", widthB: "Ширина b (мм)", heightH: "Высота h (мм)",
    reinforcement: "Арматура", bars: "стержней", add: "Добавить", remove: "Удалить",
    rebarArea: "Площадь арматуры", rebarPercent: "% армирования",
    steps: [
      { title: "Настройка сечения", desc: "Задайте ширину и высоту сечения с помощью ползунков. Схема обновляется в реальном времени." },
      { title: "Размещение арматуры", desc: "Добавляйте стержни нужного диаметра (Ø8–Ø32). Выбирайте активный стержень для редактирования." },
      { title: "Контроль армирования", desc: "Система автоматически рассчитывает площадь арматуры и процент армирования с цветовой индикацией нормы." },
    ],
    faqTitle: "Частые вопросы", toolsTitle: "Связанные инструменты", open: "Открыть",
    heroBadge: "ГОСТ 5781-82",
    heroDesc: "Визуальный конструктор армирования железобетонных сечений. Подбор диаметра и количества стержней, расчёт процента армирования в реальном времени.",
    footerDesc: "Инженерное обследование строительных конструкций с применением AI",
  },
};

export default function Page() {
  const [lang, setLang] = useState<"en" | "ru">("en");
  const [b, setB] = useState(300);
  const [h, setH] = useState(500);
  const [bars, setBars] = useState<{ d: number; x: number; y: number }[]>([{ d: 16, x: 50, y: 50 }]);
  const [selected, setSelected] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const totalArea = bars.reduce((sum, bar) => sum + barAreas[bar.d], 0);
  const percent = (totalArea / (b * h)) * 100;
  const t = tr[lang];

  useEffect(() => {
    const saved = localStorage.getItem("lang") as "en" | "ru" | null;
    if (saved) setLang(saved);
  }, []);
  useEffect(() => { localStorage.setItem("lang", lang); }, [lang]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scale = Math.min(300 / b, 300 / h);
    canvas.width = b * scale + 40;
    canvas.height = h * scale + 40;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, b * scale, h * scale);
    ctx.fillStyle = "rgba(14, 165, 233, 0.03)";
    ctx.fillRect(20, 20, b * scale, h * scale);
    bars.forEach((bar, i) => {
      ctx.beginPath();
      ctx.arc(20 + bar.x * scale, 20 + bar.y * scale, Math.max((bar.d / 2) * scale, 3), 0, Math.PI * 2);
      ctx.fillStyle = i === selected ? "#0ea5e9" : "#f59e0b";
      ctx.fill();
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, [b, h, bars, selected]);

  const addBar = () => setBars([...bars, { d: 16, x: b / 2, y: h / 2 }]);
  const removeBar = () => bars.length > 1 && setBars(bars.slice(0, -1));

  return (
    <div className="min-h-screen">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass py-3" : "py-5 bg-transparent"}`}>
        <div className="container-max flex items-center justify-between">
          <Link href="https://engai-hub.vercel.app" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-eng-700 flex items-center justify-center font-display font-bold text-white text-lg group-hover:scale-105 transition-transform">E</div>
            <span className="font-display font-bold text-xl text-white">Eng<span className="gradient-text">AI</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#designer" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{t.designer}</a>
            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{t.howItWorks}</a>
            <a href="#faq" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{t.faq}</a>
            <a href="#tools" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{t.tools}</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => setLang(lang === "en" ? "ru" : "en")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:border-accent/40 hover:text-white transition-all text-sm">
              <Globe className="w-3.5 h-3.5" /> {lang === "en" ? "RU" : "EN"}
            </button>
            <a href="#designer" className="btn-primary text-sm">{t.design}</a>
          </div>
          <button className="md:hidden text-slate-300 p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden glass mt-3 mx-4 rounded-xl p-6 flex flex-col gap-4">
            <a href="#designer" onClick={() => setMobileOpen(false)} className="text-slate-300 hover:text-white">{t.designer}</a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="text-slate-300 hover:text-white">{t.howItWorks}</a>
            <a href="#faq" onClick={() => setMobileOpen(false)} className="text-slate-300 hover:text-white">{t.faq}</a>
            <a href="#tools" onClick={() => setMobileOpen(false)} className="text-slate-300 hover:text-white">{t.tools}</a>
            <button onClick={() => { setLang(lang === "en" ? "ru" : "en"); setMobileOpen(false); }} className="flex items-center gap-1.5 text-slate-300">
              <Globe className="w-4 h-4" /> {lang === "en" ? "Русский" : "English"}
            </button>
          </div>
        )}
      </header>

      <section className="relative pt-40 pb-16 grid-bg overflow-hidden">
        <div className="container-max text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-6 animate-fade-in">
            <Grid3x3 className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs text-slate-400">{t.heroBadge}</span>
          </div>
          <div className="inline-flex items-center gap-3 mb-4 animate-slide-up">
            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
              <Ruler className="w-7 h-7 text-accent" />
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-white">RebarDesign</h1>
          </div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto animate-slide-up">{t.heroDesc}</p>
        </div>
      </section>

      <section id="designer" className="py-16">
        <div className="container-max max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="font-display font-bold text-white mb-4 text-lg">{t.sectionScheme}</h3>
              <div className="flex items-center justify-center bg-bg-700 rounded-xl p-4" style={{ minHeight: 400 }}>
                <canvas ref={canvasRef} className="max-w-full" style={{ maxHeight: 380 }} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="glass rounded-2xl p-5 space-y-3">
                <h3 className="font-display font-bold text-white">{t.sectionParams}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">{t.widthB}</label>
                    <input type="range" min="150" max="600" value={b} onChange={(e) => setB(parseInt(e.target.value))} className="w-full accent-accent" />
                    <span className="text-sm text-white font-mono">{b}</span>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">{t.heightH}</label>
                    <input type="range" min="200" max="800" value={h} onChange={(e) => setH(parseInt(e.target.value))} className="w-full accent-accent" />
                    <span className="text-sm text-white font-mono">{h}</span>
                  </div>
                </div>
              </div>
              <div className="glass rounded-2xl p-5 space-y-3">
                <h3 className="font-display font-bold text-white">{t.reinforcement} ({bars.length} {t.bars})</h3>
                {bars.map((bar, i) => (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${i === selected ? "bg-accent/10 border border-accent/30" : "border border-white/5 hover:border-white/10"}`} onClick={() => setSelected(i)}>
                    <span className="text-sm text-slate-400 w-6">#{i + 1}</span>
                    <select value={bar.d} onChange={(e) => { const newBars = [...bars]; newBars[i].d = parseInt(e.target.value); setBars(newBars); }} className="bg-bg-700 border border-white/10 text-white text-sm rounded px-2 py-1 focus:border-accent focus:outline-none">
                      {Object.keys(barAreas).map((d) => <option key={d} value={d}>Ø{d}</option>)}
                    </select>
                    <span className="text-xs text-slate-500">{barAreas[bar.d]} mm²</span>
                  </div>
                ))}
                <div className="flex gap-2">
                  <button onClick={addBar} className="btn-ghost flex-1 flex items-center justify-center gap-1 text-sm"><Plus className="w-4 h-4" /> {t.add}</button>
                  <button onClick={removeBar} className="btn-ghost flex-1 flex items-center justify-center gap-1 text-sm"><Minus className="w-4 h-4" /> {t.remove}</button>
                </div>
              </div>
              <div className="glass rounded-2xl p-5">
                <div className="flex justify-between items-center mb-2"><span className="text-sm text-slate-400">{t.rebarArea}</span><span className="text-white font-bold text-lg">{totalArea.toFixed(1)} mm²</span></div>
                <div className="flex justify-between items-center mb-2"><span className="text-sm text-slate-400">{t.rebarPercent}</span><span className={`font-bold text-lg ${percent > 5 ? "text-red-400" : percent > 1 ? "text-emerald-400" : "text-amber-400"}`}>{percent.toFixed(2)}%</span></div>
                <div className="w-full bg-bg-700 rounded-full h-2 mb-4"><div className="bg-accent h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(percent * 10, 100)}%` }} /></div>
                <div className="flex gap-2">
                  <a href="https://loadbear.vercel.app" target="_blank" rel="noopener noreferrer" className="btn-ghost flex-1 flex items-center justify-center gap-1 text-xs">LoadBear →</a>
                  <a href="https://inspectai-app-coral.vercel.app" target="_blank" rel="noopener noreferrer" className="btn-ghost flex-1 flex items-center justify-center gap-1 text-xs">InspectAI →</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 grid-bg">
        <div className="container-max max-w-5xl">
          <h2 className="font-display text-3xl font-bold text-white text-center mb-12">{t.howItWorks}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {t.steps.map((s, i) => (
              <div key={i} className="glass rounded-2xl p-6 card-hover">
                <div className="text-4xl font-display font-bold text-accent/20 mb-3">0{i + 1}</div>
                <h3 className="font-display text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20">
        <div className="container-max max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-white text-center mb-12">{t.faqTitle}</h2>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-6 py-4 flex items-center justify-between text-left">
                  <span className="text-white font-medium">{item.q[lang]}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-slate-400 animate-fade-in">{item.a[lang]}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tools" className="py-20 grid-bg">
        <div className="container-max max-w-4xl">
          <h2 className="font-display text-3xl font-bold text-white text-center mb-12">{t.toolsTitle}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedTools.map((tool) => (
              <a key={tool.name} href={tool.href} target="_blank" rel="noopener noreferrer" className="glass rounded-2xl p-6 card-hover group">
                <div className="text-3xl mb-3">{tool.icon}</div>
                <h3 className="font-display text-lg font-bold text-white mb-1 group-hover:text-accent transition-colors">{tool.name}</h3>
                <p className="text-sm text-slate-400">{tool.desc[lang]}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  {t.open} <ArrowRight className="w-3 h-3" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5">
        <div className="container-max max-w-4xl text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-eng-700 flex items-center justify-center font-display font-bold text-white">E</div>
            <span className="font-display font-bold text-white">Eng<span className="gradient-text">AI</span></span>
          </div>
          <p className="text-sm text-slate-500 mb-4">{t.footerDesc}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
            <span>GOST 5781-82</span>
            <span>·</span>
            <a href="https://engai-hub.vercel.app" className="hover:text-accent transition-colors">EngAI Hub</a>
            <span>·</span>
            <a href="https://inspectai-app-coral.vercel.app" className="hover:text-accent transition-colors">InspectAI</a>
            <span>·</span>
            <span>© 2025 EngAI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
