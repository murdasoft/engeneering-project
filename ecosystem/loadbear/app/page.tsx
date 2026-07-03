"use client";

import { useState, useEffect } from "react";
import { Calculator, TrendingDown, Shield, ArrowRight, FileText, ChevronDown, Menu, X, Globe } from "lucide-react";
import Link from "next/link";

const concreteGrades: Record<string, number> = { "B15": 11, "B20": 13.4, "B25": 14.5, "B30": 16.5, "B35": 18.5, "B40": 19.5, "B45": 21, "B50": 22 };
const rebarClasses: Record<string, number> = { "A240": 240, "A300": 300, "A400": 355, "A500": 435, "A600": 510 };

const faqItems = [
  { q: { en: "What are ξ and ξR?", ru: "Что такое ξ и ξR?" }, a: { en: "ξ is the relative depth of the concrete compression zone. ξR is the boundary value at which brittle failure occurs. If ξ > ξR, the section is over-reinforced and calculation is based on ξR.", ru: "ξ — относительная высота сжатой зоны бетона. ξR — граничное значение, при котором происходит хрупкое разрушение. Если ξ > ξR, сечение переармировано и расчёт ведётся по ξR." } },
  { q: { en: "How to account for defects?", ru: "Как учесть дефекты в расчёте?" }, a: { en: "Specify the percentage of section loss due to defects (cracks, spalling, rebar corrosion). The system recalculates the residual load-bearing capacity considering the reduction.", ru: "Укажите процент потери сечения от дефектов (трещины, сколы, коррозия арматуры). Система пересчитает остаточную несущую способность с учётом снижения." } },
  { q: { en: "What does ADEQUATE / LIMITED / CRITICAL mean?", ru: "Что означает ADEQUATE / LIMITED / CRITICAL?" }, a: { en: "ADEQUATE — safety factor >70%, structure is fine. LIMITED — factor 40-70%, repair needed. CRITICAL — factor <40%, urgent strengthening required.", ru: "ADEQUATE — запас прочности >70%, конструкция в норме. LIMITED — запас 40-70%, требуется ремонт. CRITICAL — запас <40, срочное усиление." } },
  { q: { en: "Which standard is used?", ru: "Какой норматив используется?" }, a: { en: "Calculation is performed per SP 63.13330.2018 'Concrete and reinforced concrete structures. General provisions', limit state design method.", ru: "Расчёт ведётся по СП 63.13330.2018 «Бетонные и железобетонные конструкции. Основные положения», метод предельных состояний." } },
];

const relatedTools = [
  { name: "RebarDesign", desc: { en: "Reinforcement section designer", ru: "Конструктор армирования сечения" }, href: "https://rebardesign.vercel.app", icon: "🔧" },
  { name: "CrackCalc", desc: { en: "Crack assessment by GOST", ru: "Оценка трещин по ГОСТ" }, href: "https://crackcalc.vercel.app", icon: "📏" },
  { name: "InspectAI", desc: { en: "AI structural inspection", ru: "AI-обследование конструкций" }, href: "https://inspectai-app-coral.vercel.app", icon: "🔍" },
];

const tr = {
  en: {
    calculator: "Calculator", howItWorks: "How it works", faq: "FAQ", tools: "Tools",
    calculate: "Calculate", calcCapacity: "Calculate load-bearing capacity",
    concreteClass: "Concrete class", rebarClass: "Rebar class", rebarArea: "Reinforcement area As (mm²)",
    defectLoss: "Section loss from defects (%)", sectionParams: "Section parameters",
    capacity: "Capacity", residual: "Residual", loss: "Loss", safetyFactor: "Safety factor",
    calcParams: "Design parameters:", steps: [
      { title: "Input parameters", desc: "Specify section geometry (b, h, a), concrete and rebar classes, reinforcement area and percentage of section loss from defects." },
      { title: "Calculation per SP 63", desc: "The system calculates the relative compression zone depth ξ, load-bearing capacity M and residual strength considering defects." },
      { title: "Condition assessment", desc: "Get the structure condition category: ADEQUATE, LIMITED or CRITICAL with the safety factor." },
    ],
    faqTitle: "Frequently Asked Questions", toolsTitle: "Related Tools", open: "Open",
    heroBadge: "SP 63.13330.2018",
    heroDesc: "Load-bearing capacity calculation of reinforced concrete structures per SP 63.13330.2018. Defect consideration, section loss and residual strength.",
    footerDesc: "AI-powered structural inspection of building structures",
    strengthen: "Calculate strengthening",
  },
  ru: {
    calculator: "Калькулятор", howItWorks: "Как работает", faq: "FAQ", tools: "Инструменты",
    calculate: "Рассчитать", calcCapacity: "Рассчитать несущую способность",
    concreteClass: "Класс бетона", rebarClass: "Класс арматуры", rebarArea: "Площадь арматуры As (мм²)",
    defectLoss: "Потеря сечения от дефектов (%)", sectionParams: "Параметры сечения",
    capacity: "Несущая способность", residual: "Остаточная", loss: "Потеря", safetyFactor: "Запас прочности",
    calcParams: "Расчётные параметры:", steps: [
      { title: "Ввод параметров", desc: "Укажите геометрию сечения (b, h, a), классы бетона и арматуры, площадь арматуры и процент потери сечения от дефектов." },
      { title: "Расчёт по СП 63", desc: "Система рассчитывает относительную высоту сжатой зоны ξ, несущую способность M и остаточную прочность с учётом дефектов." },
      { title: "Оценка состояния", desc: "Получаете категорию состояния конструкции: НОРМА, ОГРАНИЧЕНО или КРИТИЧНО с указанием запаса прочности." },
    ],
    faqTitle: "Частые вопросы", toolsTitle: "Связанные инструменты", open: "Открыть",
    heroBadge: "СП 63.13330.2018",
    heroDesc: "Расчёт несущей способности железобетонных конструкций по СП 63.13330.2018. Учёт дефектов, потеря сечения и остаточная прочность.",
    footerDesc: "Инженерное обследование строительных конструкций с применением AI",
    strengthen: "Рассчитать усиление",
  },
};

export default function Page() {
  const [lang, setLang] = useState<"en" | "ru">("en");
  const [b, setB] = useState("300");
  const [h, setH] = useState("500");
  const [a, setA] = useState("50");
  const [concrete, setConcrete] = useState("B25");
  const [rebar, setRebar] = useState("A400");
  const [As, setAs] = useState("1256");
  const [defectLoss, setDefectLoss] = useState("0");
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
    const B = parseFloat(b), H = parseFloat(h), A = parseFloat(a), A_s = parseFloat(As), loss = parseFloat(defectLoss);
    const h0 = H - A;
    const Rb = concreteGrades[concrete] || 14.5;
    const Rs = rebarClasses[rebar] || 355;
    const xi = (Rs * A_s) / (Rb * B * h0);
    const xiR = 0.531;
    let M = 0;
    if (xi <= xiR) { M = Rb * B * h0 * h0 * xi * (1 - 0.5 * xi) / 1e6; }
    else { const alphaR = xiR * (1 - 0.5 * xiR); M = Rb * B * h0 * h0 * alphaR / 1e6; }
    const reduction = loss / 100;
    const residual = M * (1 - reduction);
    const safetyFactor = residual / (M || 1);
    setResult({
      M: M.toFixed(2), residual: residual.toFixed(2), reduction: (reduction * 100).toFixed(1),
      xi: xi.toFixed(3), xiR, Rs, Rb, h0,
      capacity: safetyFactor > 0.7 ? "ADEQUATE" : safetyFactor > 0.4 ? "LIMITED" : "CRITICAL",
      capacityRu: safetyFactor > 0.7 ? "НОРМА" : safetyFactor > 0.4 ? "ОГРАНИЧЕНО" : "КРИТИЧНО",
      safetyFactor: (safetyFactor * 100).toFixed(0),
    });
  };

  const capacityColor = result?.capacity === "ADEQUATE" ? "text-emerald-400" : result?.capacity === "LIMITED" ? "text-amber-400" : "text-red-400";
  const capacityBg = result?.capacity === "ADEQUATE" ? "bg-emerald-500/10 border-emerald-500/30" : result?.capacity === "LIMITED" ? "bg-amber-500/10 border-amber-500/30" : "bg-red-500/10 border-red-500/30";

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
            <Shield className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs text-slate-400">{t.heroBadge}</span>
          </div>
          <div className="inline-flex items-center gap-3 mb-4 animate-slide-up">
            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
              <Calculator className="w-7 h-7 text-accent" />
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-white">LoadBear</h1>
          </div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto animate-slide-up">{t.heroDesc}</p>
        </div>
      </section>

      <section id="calculator" className="py-16">
        <div className="container-max max-w-3xl">
          <div className="glass rounded-2xl p-6 md:p-8 space-y-5 mb-6">
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-slate-400 mb-1 block">b (mm)</label><input value={b} onChange={(e) => setB(e.target.value)} type="number" className="w-full px-3 py-2.5 rounded-lg bg-bg-700 border border-white/10 text-white text-sm focus:border-accent focus:outline-none transition-colors" /></div>
              <div><label className="text-xs text-slate-400 mb-1 block">h (mm)</label><input value={h} onChange={(e) => setH(e.target.value)} type="number" className="w-full px-3 py-2.5 rounded-lg bg-bg-700 border border-white/10 text-white text-sm focus:border-accent focus:outline-none transition-colors" /></div>
              <div><label className="text-xs text-slate-400 mb-1 block">a (mm)</label><input value={a} onChange={(e) => setA(e.target.value)} type="number" className="w-full px-3 py-2.5 rounded-lg bg-bg-700 border border-white/10 text-white text-sm focus:border-accent focus:outline-none transition-colors" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">{t.concreteClass}</label>
                <select value={concrete} onChange={(e) => setConcrete(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-bg-700 border border-white/10 text-white text-sm focus:border-accent focus:outline-none">
                  {Object.keys(concreteGrades).map((g) => <option key={g} value={g}>{g} (Rb={concreteGrades[g]} MPa)</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">{t.rebarClass}</label>
                <select value={rebar} onChange={(e) => setRebar(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-bg-700 border border-white/10 text-white text-sm focus:border-accent focus:outline-none">
                  {Object.keys(rebarClasses).map((g) => <option key={g} value={g}>{g} (Rs={rebarClasses[g]} MPa)</option>)}
                </select>
              </div>
            </div>
            <div><label className="text-xs text-slate-400 mb-1 block">{t.rebarArea}</label><input value={As} onChange={(e) => setAs(e.target.value)} type="number" className="w-full px-3 py-2.5 rounded-lg bg-bg-700 border border-white/10 text-white text-sm focus:border-accent focus:outline-none transition-colors" /></div>
            <div><label className="text-xs text-slate-400 mb-1 block">{t.defectLoss}</label><input value={defectLoss} onChange={(e) => setDefectLoss(e.target.value)} placeholder="0" type="number" className="w-full px-3 py-2.5 rounded-lg bg-bg-700 border border-white/10 text-white text-sm focus:border-accent focus:outline-none transition-colors" /></div>
            <button onClick={calculate} className="btn-primary w-full flex items-center justify-center gap-2"><Calculator className="w-4 h-4" /> {t.calcCapacity}</button>
          </div>

          {result && (
            <div className="space-y-4 animate-fade-in">
              <div className={`glass rounded-2xl p-6 md:p-8 border ${capacityBg}`}>
                <div className="flex items-center gap-3 mb-4">
                  <TrendingDown className={`w-8 h-8 ${capacityColor}`} />
                  <div>
                    <h2 className={`font-display text-2xl font-bold ${capacityColor}`}>{lang === "en" ? result.capacity : result.capacityRu}</h2>
                    <p className="text-sm text-slate-400">{t.safetyFactor}: {result.safetyFactor}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div className="glass rounded-xl p-3"><p className="text-xs text-slate-500">{t.capacity}</p><p className="text-xl font-bold text-white">{result.M} kN·m</p></div>
                  <div className="glass rounded-xl p-3"><p className="text-xs text-slate-500">{t.residual}</p><p className="text-xl font-bold text-emerald-400">{result.residual} kN·m</p></div>
                  <div className="glass rounded-xl p-3"><p className="text-xs text-slate-500">{t.loss}</p><p className="text-xl font-bold text-amber-400">{result.reduction}%</p></div>
                </div>
                <div className="glass rounded-xl p-3 text-sm space-y-1">
                  <p className="text-slate-500">{t.calcParams}</p>
                  <p className="text-slate-400 font-mono text-xs">h₀ = {result.h0} mm · ξ = {result.xi} · ξR = {result.xiR} · Rb = {result.Rb} MPa · Rs = {result.Rs} MPa</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="https://rebardesign.vercel.app" target="_blank" rel="noopener noreferrer" className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"><Shield className="w-4 h-4" /> {t.strengthen} <ArrowRight className="w-4 h-4" /></a>
                <a href="https://inspectai-app-coral.vercel.app" target="_blank" rel="noopener noreferrer" className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm">InspectAI <ArrowRight className="w-4 h-4" /></a>
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
            <span>SP 63.13330.2018</span>
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
