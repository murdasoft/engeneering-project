"use client";

import { useState, useEffect } from "react";
import { FlaskConical, Droplets, ArrowRight, Package, Beaker, BookOpen, ChevronDown, Menu, X, CheckCircle2, Globe } from "lucide-react";
import Link from "next/link";

const mixes: Record<string, { cement: number; sand: number; gravel: number; water: number; additive: Record<string, string>; wc: number }> = {
  "B15 (M200)": { cement: 280, sand: 680, gravel: 1250, water: 170, additive: { en: "Plasticizer S-3 (0.5% of cement mass)", ru: "Пластификатор С-3 (0.5% от массы цемента)" }, wc: 0.61 },
  "B20 (M250)": { cement: 330, sand: 650, gravel: 1230, water: 175, additive: { en: "Plasticizer S-3 (1%)", ru: "Пластификатор С-3 (1%)" }, wc: 0.53 },
  "B25 (M350)": { cement: 380, sand: 620, gravel: 1200, water: 180, additive: { en: "Superplasticizer S-3 (2%)", ru: "Суперпластификатор С-3 (2%)" }, wc: 0.47 },
  "B30 (M400)": { cement: 420, sand: 580, gravel: 1180, water: 185, additive: { en: "Superplasticizer S-3 (2.5%)", ru: "Суперпластификатор С-3 (2.5%)" }, wc: 0.44 },
  "B35 (M450)": { cement: 470, sand: 540, gravel: 1150, water: 185, additive: { en: "Superplasticizer + silica fume (5%)", ru: "Суперпластификатор + микрокремнезём (5%)" }, wc: 0.39 },
  "B40 (M500)": { cement: 520, sand: 500, gravel: 1120, water: 180, additive: { en: "Superplasticizer + silica fume (8%)", ru: "Суперпластификатор + микрокремнезём (8%)" }, wc: 0.35 },
};

const faqItems = [
  { q: { en: "Which cement should I use?", ru: "Какой цемент использовать?" }, a: { en: "Use Portland cement grade M500 D0 (without mineral additives). For aggressive environments — sulfate-resistant cement.", ru: "Используется портландцемент марки М500 Д0 (без минеральных добавок). Для агрессивных сред — сульфатостойкий цемент." } },
  { q: { en: "Which concrete grade to choose for repair?", ru: "Какую марку бетона выбрать для ремонта?" }, a: { en: "For structural repair, use concrete one to two grades higher than the existing one. Minimum B25 (M350) for load-bearing elements.", ru: "Для ремонта конструкций рекомендуется бетон на одну-две марки выше существующего. Минимум B25 (М350) для несущих элементов." } },
  { q: { en: "What is the water-cement ratio?", ru: "Что такое В/Ц отношение?" }, a: { en: "The water-cement ratio (W/C) is the ratio of water mass to cement mass. The lower the W/C, the stronger the concrete. Optimal range is 0.35–0.55.", ru: "Водоцементное отношение (В/Ц) — это отношение массы воды к массе цемента. Чем ниже В/Ц, тем прочнее бетон. Оптимальный диапазон 0.35–0.55." } },
  { q: { en: "Is a plasticizer necessary?", ru: "Нужен ли пластификатор?" }, a: { en: "Yes, plasticizer S-3 reduces water consumption by 10–20%, increases mix workability and concrete strength. Mandatory for grades B30 and above.", ru: "Да, пластификатор С-3 снижает расход воды на 10–20%, повышает подвижность смеси и прочность готового бетона. Обязателен для марок B30 и выше." } },
];

const relatedTools = [
  { name: "LoadBear", desc: { en: "Load-bearing capacity calculator", ru: "Расчёт несущей способности" }, href: "https://loadbear.vercel.app", icon: "🏗️" },
  { name: "CrackCalc", desc: { en: "Crack assessment by GOST", ru: "Оценка трещин по ГОСТ" }, href: "https://crackcalc.vercel.app", icon: "📏" },
  { name: "InspectAI", desc: { en: "AI structural inspection", ru: "AI-обследование конструкций" }, href: "https://inspectai-app-coral.vercel.app", icon: "🔍" },
];

const tr = {
  en: {
    calculator: "Calculator", howItWorks: "How it works", faq: "FAQ", tools: "Tools",
    calculate: "Calculate", recipe: "Recipe for", grade: "Required concrete grade", volume: "Concrete volume (m³)",
    selectMix: "Select mix design", cement: "Cement M500", sand: "Sand Mf=2.0", gravel: "Gravel 5-20", water: "Water",
    kg: "kg", liters: "L", wcRatio: "W/C ratio", density: "Density", additive: "Additive",
    steps: [
      { title: "Select grade", desc: "Choose the required concrete grade from B15 to B40 depending on the structure type and operating conditions." },
      { title: "Specify volume", desc: "Enter the concrete volume in cubic meters. All components are recalculated automatically." },
      { title: "Get the mix", desc: "Get precise quantities of cement, sand, gravel, water and additives with W/C ratio." },
    ],
    faqTitle: "Frequently Asked Questions",
    toolsTitle: "Related Tools", open: "Open",
    heroBadge: "GOST 27006-2019",
    heroDesc: "Repair concrete mix design per GOST 27006-2019. Component calculation for grades B15–B40 including plasticizers and water-cement ratio.",
  },
  ru: {
    calculator: "Калькулятор", howItWorks: "Как работает", faq: "FAQ", tools: "Инструменты",
    calculate: "Рассчитать", recipe: "Состав на", grade: "Требуемая марка бетона", volume: "Объём бетона (м³)",
    selectMix: "Подобрать состав", cement: "Цемент М500", sand: "Песок Мк=2.0", gravel: "Щебень 5-20", water: "Вода",
    kg: "кг", liters: "л", wcRatio: "В/Ц отношение", density: "Плотность", additive: "Добавка",
    steps: [
      { title: "Выбор марки", desc: "Выберите требуемую марку бетона от B15 до B40 в зависимости от типа конструкции и условий эксплуатации." },
      { title: "Указание объёма", desc: "Введите объём бетона в кубических метрах. Все компоненты пересчитываются автоматически." },
      { title: "Получение состава", desc: "Получите точный расход цемента, песка, щебня, воды и добавок с указанием В/Ц отношения." },
    ],
    faqTitle: "Частые вопросы",
    toolsTitle: "Связанные инструменты", open: "Открыть",
    heroBadge: "ГОСТ 27006-2019",
    heroDesc: "Подбор состава ремонтного бетона по ГОСТ 27006-2019. Расчёт компонентов для марок B15–B40 с учётом пластификаторов и водоцементного отношения.",
  },
};

export default function Page() {
  const [lang, setLang] = useState<"en" | "ru">("en");
  const [grade, setGrade] = useState("B25 (M350)");
  const [volume, setVolume] = useState("1");
  const [result, setResult] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const saved = localStorage.getItem("lang") as "en" | "ru" | null;
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const t = tr[lang];

  const calculate = () => {
    const v = parseFloat(volume) || 1;
    const m = mixes[grade];
    if (!m) return;
    setResult({ ...m, volume: v, cement: Math.round(m.cement * v), sand: Math.round(m.sand * v), gravel: Math.round(m.gravel * v), water: Math.round(m.water * v) });
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
            <Beaker className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs text-slate-400">{t.heroBadge}</span>
          </div>
          <div className="inline-flex items-center gap-3 mb-4 animate-slide-up">
            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
              <FlaskConical className="w-7 h-7 text-accent" />
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-white">ConcreteMix</h1>
          </div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto animate-slide-up">{t.heroDesc}</p>
        </div>
      </section>

      <section id="calculator" className="py-16">
        <div className="container-max max-w-3xl">
          <div className="glass rounded-2xl p-6 md:p-8 space-y-5 mb-6">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">{t.grade}</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-bg-700 border border-white/10 text-white focus:border-accent focus:outline-none transition-colors">
                {Object.keys(mixes).map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">{t.volume}</label>
              <input value={volume} onChange={(e) => setVolume(e.target.value)} type="number" min="0.1" step="0.1" className="w-full px-4 py-3 rounded-xl bg-bg-700 border border-white/10 text-white focus:border-accent focus:outline-none transition-colors" />
            </div>
            <button onClick={calculate} className="btn-primary w-full flex items-center justify-center gap-2">
              <FlaskConical className="w-4 h-4" /> {t.selectMix}
            </button>
          </div>

          {result && (
            <div className="glass rounded-2xl p-6 md:p-8 space-y-5 animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-white">{t.recipe} {result.volume} m³</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass rounded-xl p-4 border border-white/5 card-hover">
                  <div className="flex items-center gap-2 mb-2"><Package className="w-4 h-4 text-slate-500" /><p className="text-xs text-slate-500">{t.cement}</p></div>
                  <p className="text-3xl font-bold text-white">{result.cement}<span className="text-sm text-slate-400 ml-1">{t.kg}</span></p>
                </div>
                <div className="glass rounded-xl p-4 border border-white/5 card-hover">
                  <div className="flex items-center gap-2 mb-2"><Package className="w-4 h-4 text-slate-500" /><p className="text-xs text-slate-500">{t.sand}</p></div>
                  <p className="text-3xl font-bold text-white">{result.sand}<span className="text-sm text-slate-400 ml-1">{t.kg}</span></p>
                </div>
                <div className="glass rounded-xl p-4 border border-white/5 card-hover">
                  <div className="flex items-center gap-2 mb-2"><Package className="w-4 h-4 text-slate-500" /><p className="text-xs text-slate-500">{t.gravel}</p></div>
                  <p className="text-3xl font-bold text-white">{result.gravel}<span className="text-sm text-slate-400 ml-1">{t.kg}</span></p>
                </div>
                <div className="glass rounded-xl p-4 border border-white/5 card-hover">
                  <div className="flex items-center gap-2 mb-2"><Droplets className="w-4 h-4 text-slate-500" /><p className="text-xs text-slate-500">{t.water}</p></div>
                  <p className="text-3xl font-bold text-white">{result.water}<span className="text-sm text-slate-400 ml-1">{t.liters}</span></p>
                </div>
              </div>
              <div className="glass rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-emerald-400"><Droplets className="w-4 h-4" />{result.additive[lang]}</div>
                <p className="text-xs text-slate-500">{t.wcRatio}: <span className="text-accent font-mono">{result.wc}</span> · {t.density}: <span className="text-accent font-mono">~{Math.round((result.cement + result.sand + result.gravel + result.water) / result.volume)} kg/m³</span></p>
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
          <p className="text-sm text-slate-500 mb-4">{lang === "en" ? "AI-powered structural inspection of building structures" : "Инженерное обследование строительных конструкций с применением AI"}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
            <span>GOST 27006-2019</span>
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
