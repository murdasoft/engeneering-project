"use client";

import { useState, useEffect } from "react";
import { Ruler, AlertTriangle, ArrowRight, TrendingUp, FileText, ChevronDown, Menu, X, ShieldCheck, Globe } from "lucide-react";
import Link from "next/link";

const categories = [
  { max: 0.1, label: { en: "C1 — Insignificant", ru: "Н1 — Незначительный" }, desc: { en: "No repair required. Annual monitoring.", ru: "Не требует ремонта. Мониторинг 1 раз в год." }, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "✅" },
  { max: 0.2, label: { en: "C2 — Significant", ru: "Н2 — Значительный" }, desc: { en: "Repair required within 1-2 years.", ru: "Требует ремонта в течение 1-2 лет." }, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "⚠️" },
  { max: 0.3, label: { en: "C3 — Critical", ru: "Н3 — Критический" }, desc: { en: "Immediate repair or strengthening required.", ru: "Требует немедленного ремонта или усиления." }, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: "🔴" },
  { max: 999, label: { en: "C4 — Hazardous", ru: "Н4 — Опасный" }, desc: { en: "Inadmissible condition. Urgent strengthening or decommissioning.", ru: "Недопустимое состояние. Срочное усиление или вывод из эксплуатации." }, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: "🚨" },
];

const gostRefs = [
  { en: "GOST 31937-2011 — Buildings and structures. Rules for inspection and monitoring", ru: "ГОСТ 31937-2011 — Здания и сооружения. Правила обследования и мониторинга" },
  { en: "SP 63.13330.2018 — Concrete and reinforced concrete structures", ru: "СП 63.13330.2018 — Бетонные и железобетонные конструкции" },
  { en: "STO NOSTROY 2.7.64 — Repair and strengthening of reinforced concrete structures", ru: "СТО НОСТРОЙ 2.7.64 — Ремонт и усиление железобетонных конструкций" },
];

const faqItems = [
  { q: { en: "What to do for category C3?", ru: "Что делать при категории Н3?" }, a: { en: "For category C3 (critical condition), immediate strengthening or repair is required. It is recommended to limit operational loads until repair work is completed.", ru: "При категории Н3 (критическое состояние) требуется немедленное усиление конструкции или её ремонт. Рекомендуется ограничить эксплуатационные нагрузки до завершения ремонтных работ." } },
  { q: { en: "How to measure crack width?", ru: "Как измерить ширину трещины?" }, a: { en: "Use a crack gauge or feeler gauge with 0.05 mm graduations. For precise measurements, a microscope with 0.01 mm resolution is used. Take measurements at 3-5 points along the crack.", ru: "Используйте трещиномер или щуп с делениями 0.05 мм. Для точных измерений применяется микроскоп с ценой деления 0.01 мм. Замеры проводятся в 3-5 точках по длине трещины." } },
  { q: { en: "What is crack growth rate?", ru: "Что такое скорость роста трещины?" }, a: { en: "Growth rate is the increase in crack opening width per unit time. 15% of current width per year is used as a design estimate when monitoring data is unavailable.", ru: "Скорость роста — это увеличение ширины раскрытия трещины за единицу времени. Принимается 15% от текущей ширины в год для расчётной оценки при отсутствии данных мониторинга." } },
  { q: { en: "When is monitoring needed?", ru: "Когда нужен мониторинг?" }, a: { en: "Crack monitoring is mandatory for category C2 and above. Frequency: C1 — annually, C2 — quarterly, C3 — monthly, C4 — continuous.", ru: "Мониторинг трещин обязателен при категории Н2 и выше. Периодичность: Н1 — 1 раз/год, Н2 — 1 раз/квартал, Н3 — 1 раз/месяц, Н4 — непрерывный." } },
];

const relatedTools = [
  { name: "ConcreteMix", desc: { en: "Repair concrete mix design", ru: "Подбор состава ремонтного бетона" }, href: "https://concretemix.vercel.app", icon: "🧪" },
  { name: "LoadBear", desc: { en: "Load-bearing capacity calculator", ru: "Расчёт несущей способности" }, href: "https://loadbear.vercel.app", icon: "🏗️" },
  { name: "InspectAI", desc: { en: "AI structural inspection", ru: "AI-обследование конструкций" }, href: "https://inspectai-app-coral.vercel.app", icon: "🔍" },
];

const tr = {
  en: {
    calculator: "Calculator", howItWorks: "How it works", faq: "FAQ", tools: "Tools",
    calculate: "Calculate", assess: "Assess crack",
    width: "Width (mm)", length: "Length (mm)", depth: "Depth (mm)",
    growthYear: "Growth/year", toCritical: "Until critical", openingArea: "Opening area", repairVolume: "Repair volume",
    normativeBase: "Normative basis:", repairMix: "Repair mix", uploadPhoto: "Upload photo to InspectAI",
    steps: [
      { title: "Measure parameters", desc: "Measure crack opening width, length and depth using a crack gauge or feeler gauge." },
      { title: "Classification", desc: "The system determines the defect category (C1–C4) per GOST 31937-2011 based on opening width." },
      { title: "Forecast & recommendations", desc: "Crack growth rate, time to critical condition and repair volume are calculated." },
    ],
    faqTitle: "Frequently Asked Questions", toolsTitle: "Related Tools", open: "Open",
    heroBadge: "GOST 31937-2011",
    heroDesc: "Assessment and classification of cracks in concrete and reinforced concrete structures per GOST 31937-2011. Defect category, growth rate and repair volume calculation.",
    footerDesc: "AI-powered structural inspection of building structures",
  },
  ru: {
    calculator: "Калькулятор", howItWorks: "Как работает", faq: "FAQ", tools: "Инструменты",
    calculate: "Рассчитать", assess: "Оценить трещину",
    width: "Ширина (мм)", length: "Длина (мм)", depth: "Глубина (мм)",
    growthYear: "Рост в год", toCritical: "До критического", openingArea: "Площадь раскрытия", repairVolume: "Объём ремонта",
    normativeBase: "Нормативная база:", repairMix: "Ремонтный состав", uploadPhoto: "Загрузить фото в InspectAI",
    steps: [
      { title: "Замер параметров", desc: "Измерьте ширину раскрытия трещины, её длину и глубину с помощью трещиномера или щупа." },
      { title: "Классификация", desc: "Система определяет категорию дефекта (Н1–Н4) по ГОСТ 31937-2011 на основе ширины раскрытия." },
      { title: "Прогноз и рекомендации", desc: "Рассчитывается скорость роста трещины, время до критического состояния и объём ремонтных работ." },
    ],
    faqTitle: "Частые вопросы", toolsTitle: "Связанные инструменты", open: "Открыть",
    heroBadge: "ГОСТ 31937-2011",
    heroDesc: "Оценка и классификация трещин в бетонных и железобетонных конструкциях по ГОСТ 31937-2011. Расчёт категории дефекта, скорости роста и объёма ремонта.",
    footerDesc: "Инженерное обследование строительных конструкций с применением AI",
  },
};

export default function Page() {
  const [lang, setLang] = useState<"en" | "ru">("en");
  const [width, setWidth] = useState("");
  const [lengthV, setLength] = useState("");
  const [depth, setDepth] = useState("");
  const [result, setResult] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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

  const t = tr[lang];

  const calculate = () => {
    const w = parseFloat(width);
    if (!w || w <= 0) return;
    const cat = categories.find((c) => w <= c.max) || categories[3];
    const growthPerYear = w * 0.15;
    const yearsToCritical = Math.max(0, (0.3 - w) / growthPerYear);
    const area = parseFloat(lengthV) * w / 1000;
    const d = parseFloat(depth) || 0;
    const volume = area * d / 10;
    setResult({ ...cat, width: w, length: parseFloat(lengthV) || 0, depth: d, growthPerYear, yearsToCritical, area, volume });
  };

  return (
    <div className="min-h-screen">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass py-3" : "py-5 bg-transparent"}`}>
        <div className="container-max flex items-center justify-between">
          <Link href="https://engai-hub.vercel.app" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-eng-700 flex items-center justify-center font-display font-bold text-white text-lg group-hover:scale-105 transition-transform">E</div>
            <span className="font-display font-bold text-xl text-white">Eng<span className="gradient-text">AI</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#calculator" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{t.calculator}</a>
            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{t.howItWorks}</a>
            <a href="#faq" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{t.faq}</a>
            <a href="#tools" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{t.tools}</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => setLang(lang === "en" ? "ru" : "en")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:border-accent/40 hover:text-white transition-all text-sm">
              <Globe className="w-3.5 h-3.5" /> {lang === "en" ? "RU" : "EN"}
            </button>
            <a href="#calculator" className="btn-primary text-sm">{t.calculate}</a>
          </div>
          <button className="md:hidden text-slate-300 p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden glass mt-3 mx-4 rounded-xl p-6 flex flex-col gap-4">
            <a href="#calculator" onClick={() => setMobileOpen(false)} className="text-slate-300 hover:text-white">{t.calculator}</a>
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
            <Ruler className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs text-slate-400">{t.heroBadge}</span>
          </div>
          <div className="inline-flex items-center gap-3 mb-4 animate-slide-up">
            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
              <Ruler className="w-7 h-7 text-accent" />
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-white">CrackCalc</h1>
          </div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto animate-slide-up">{t.heroDesc}</p>
        </div>
      </section>

      <section id="calculator" className="py-16">
        <div className="container-max max-w-3xl">
          <div className="glass rounded-2xl p-6 md:p-8 space-y-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">{t.width}</label>
                <input value={width} onChange={(e) => setWidth(e.target.value)} placeholder="0.15" type="number" step="0.01" className="w-full px-4 py-3 rounded-xl bg-bg-700 border border-white/10 text-white placeholder:text-slate-500 focus:border-accent focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">{t.length}</label>
                <input value={lengthV} onChange={(e) => setLength(e.target.value)} placeholder="120" type="number" className="w-full px-4 py-3 rounded-xl bg-bg-700 border border-white/10 text-white placeholder:text-slate-500 focus:border-accent focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">{t.depth}</label>
                <input value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="10" type="number" className="w-full px-4 py-3 rounded-xl bg-bg-700 border border-white/10 text-white placeholder:text-slate-500 focus:border-accent focus:outline-none transition-colors" />
              </div>
            </div>
            <button onClick={calculate} className="btn-primary w-full flex items-center justify-center gap-2">
              <Ruler className="w-4 h-4" /> {t.assess}
            </button>
          </div>

          {result && (
            <div className="space-y-4 animate-fade-in">
              <div className={`glass rounded-2xl p-6 md:p-8 border ${result.border}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{result.icon}</span>
                  <div>
                    <h2 className={`font-display text-2xl font-bold ${result.color}`}>{result.label[lang]}</h2>
                    <p className="text-sm text-slate-400">{t.width}: {result.width} mm · {t.length}: {result.length} mm · {t.depth}: {result.depth || "—"}</p>
                  </div>
                </div>
                <p className="text-slate-300 mb-4">{result.desc[lang]}</p>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="glass rounded-xl p-3">
                    <div className="flex items-center gap-2 text-slate-500 mb-1"><TrendingUp className="w-3 h-3" /> {t.growthYear}</div>
                    <p className="text-white font-semibold text-lg">{result.growthPerYear.toFixed(3)} mm</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <div className="flex items-center gap-2 text-slate-500 mb-1"><AlertTriangle className="w-3 h-3" /> {t.toCritical}</div>
                    <p className="text-white font-semibold text-lg">{result.yearsToCritical.toFixed(1)} {lang === "en" ? "years" : "лет"}</p>
                  </div>
                  {result.area > 0 && (
                    <div className="glass rounded-xl p-3">
                      <p className="text-slate-500 mb-1">{t.openingArea}</p>
                      <p className="text-white font-semibold">{result.area.toFixed(2)} cm²</p>
                    </div>
                  )}
                  {result.volume > 0 && (
                    <div className="glass rounded-xl p-3">
                      <p className="text-slate-500 mb-1">{t.repairVolume}</p>
                      <p className="text-white font-semibold">{result.volume.toFixed(2)} cm³</p>
                    </div>
                  )}
                </div>
                <div className="glass rounded-xl p-3">
                  <div className="flex items-center gap-2 text-slate-500 mb-2"><FileText className="w-3 h-3" /> {t.normativeBase}</div>
                  {gostRefs.map((r, i) => <p key={i} className="text-xs text-slate-400 mb-1">• {r[lang]}</p>)}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="https://concretemix.vercel.app" target="_blank" rel="noopener noreferrer" className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                  {t.repairMix} <ArrowRight className="w-4 h-4" />
                </a>
                <a href="https://inspectai-app-coral.vercel.app" target="_blank" rel="noopener noreferrer" className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm">
                  {t.uploadPhoto} <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
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
            <span>GOST 31937-2011</span>
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
