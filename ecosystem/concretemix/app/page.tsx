"use client";

import { useState, useEffect } from "react";
import { FlaskConical, Droplets, ArrowRight, Package, Beaker, BookOpen, ChevronDown, Menu, X, CheckCircle2, Globe, DollarSign, TrendingUp, GitCompare, Save, Trash2, Activity } from "lucide-react";
import Link from "next/link";

const materialCosts: Record<string, { en: string; ru: string; price: number; unit: string }> = {
  cement: { en: "Cement M500", ru: "Цемент М500", price: 0.35, unit: "kg" },
  sand: { en: "Sand", ru: "Песок", price: 0.015, unit: "kg" },
  gravel: { en: "Gravel 5-20", ru: "Щебень 5-20", price: 0.025, unit: "kg" },
  water: { en: "Water", ru: "Вода", price: 0.003, unit: "L" },
  additive: { en: "Additive S-3", ru: "Добавка С-3", price: 2.5, unit: "kg" },
};

const granulometryData = [
  { size: 0.16, sand: 5, gravel: 0, ideal: 8 },
  { size: 0.315, sand: 20, gravel: 0, ideal: 18 },
  { size: 0.63, sand: 50, gravel: 0, ideal: 35 },
  { size: 1.25, sand: 80, gravel: 5, ideal: 55 },
  { size: 2.5, sand: 95, gravel: 15, ideal: 72 },
  { size: 5.0, sand: 100, gravel: 40, ideal: 85 },
  { size: 10.0, sand: 100, gravel: 70, ideal: 95 },
  { size: 20.0, sand: 100, gravel: 100, ideal: 100 },
];

interface SavedMix {
  id: string;
  name: string;
  grade: string;
  volume: string;
  result: any;
  cost: number;
  date: string;
}

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
  { name: "RebarDesign", desc: { en: "Reinforcement section designer", ru: "Конструктор армирования" }, href: "https://rebardesign.vercel.app", icon: "🔧" },
  { name: "CrackCalc", desc: { en: "Crack assessment by GOST", ru: "Оценка трещин по ГОСТ" }, href: "https://crackcalc.vercel.app", icon: "📏" },
  { name: "NormBase", desc: { en: "Normative documents reference", ru: "Справочник нормативов" }, href: "https://normbase.vercel.app", icon: "📚" },
  { name: "InspectAI", desc: { en: "AI structural inspection", ru: "AI-обследование конструкций" }, href: "https://inspectai-app-coral.vercel.app", icon: "🔍" },
];

const tr = {
  en: {
    calculator: "Calculator", cost: "Cost", granulometry: "Granulometry", howItWorks: "How it works", faq: "FAQ", tools: "Tools", saved: "Saved",
    calculate: "Calculate", recipe: "Recipe for", grade: "Required concrete grade", volume: "Concrete volume (m³)",
    selectMix: "Select mix design", customMix: "Custom mix design", byGrade: "By grade", byTarget: "By target strength", targetStrength: "Target strength R28 (MPa)", cementActivity: "Cement activity Rc (MPa)", workability: "Slump / workability (mm)", aggregateType: "Aggregate type", gravel: "Gravel", crushed: "Crushed stone", sand: "Sand Mf=2.0", water: "Water", cement: "Cement M500",
    kg: "kg", liters: "L", wcRatio: "W/C ratio", density: "Density", additive: "Additive",
    totalCost: "Total cost", costPerM3: "Cost per m³", materialCosts: "Material costs",
    strength28d: "28-day strength prediction", strength7d: "7-day strength", strengthClass: "Strength class",
    granulometryTitle: "Aggregate granulometry curves", sieveSize: "Sieve size (mm)", passing: "Passing (%)",
    saveMix: "Save mix", savedMixes: "Saved mixes", noSaved: "No saved mixes yet", mixName: "Mix name",
    compareMixes: "Compare mixes", exportPDF: "Export PDF",
    steps: [
      { title: "Select grade", desc: "Choose the required concrete grade from B15 to B40 depending on the structure type and operating conditions." },
      { title: "Specify volume", desc: "Enter the concrete volume in cubic meters. All components are recalculated automatically." },
      { title: "Get the mix", desc: "Get precise quantities of cement, sand, gravel, water and additives with W/C ratio, cost estimate and strength prediction." },
    ],
    faqTitle: "Frequently Asked Questions",
    toolsTitle: "Related Tools", open: "Open",
    heroBadge: "GOST 27006-2019",
    heroDesc: "Repair concrete mix design per GOST 27006-2019. Component calculation, cost estimation, granulometry curves and strength prediction for grades B15–B40.",
  },
  ru: {
    calculator: "Калькулятор", cost: "Стоимость", granulometry: "Гранулометрия", howItWorks: "Как работает", faq: "FAQ", tools: "Инструменты", saved: "История",
    calculate: "Рассчитать", recipe: "Состав на", grade: "Требуемая марка бетона", volume: "Объём бетона (м³)",
    selectMix: "Подобрать состав", customMix: "Индивидуальный состав", byGrade: "По марке", byTarget: "По целевой прочности", targetStrength: "Целевая прочность R28 (МПа)", cementActivity: "Активность цемента Rc (МПа)", workability: "Подвижность / осадка (мм)", aggregateType: "Тип заполнителя", gravel: "Гравий", crushed: "Щебень", sand: "Песок Мк=2.0", water: "Вода", cement: "Цемент М500",
    kg: "кг", liters: "л", wcRatio: "В/Ц отношение", density: "Плотность", additive: "Добавка",
    totalCost: "Итого", costPerM3: "Стоимость за м³", materialCosts: "Стоимость материалов",
    strength28d: "Прогноз прочности 28 сут", strength7d: "Прочность 7 сут", strengthClass: "Класс прочности",
    granulometryTitle: "Кривые гранулометрии заполнителей", sieveSize: "Размер сита (мм)", passing: "Проход (%)",
    saveMix: "Сохранить состав", savedMixes: "Сохранённые составы", noSaved: "Нет сохранённых составов", mixName: "Название состава",
    compareMixes: "Сравнить составы", exportPDF: "Экспорт PDF",
    steps: [
      { title: "Выбор марки", desc: "Выберите требуемую марку бетона от B15 до B40 в зависимости от типа конструкции и условий эксплуатации." },
      { title: "Указание объёма", desc: "Введите объём бетона в кубических метрах. Все компоненты пересчитываются автоматически." },
      { title: "Получение состава", desc: "Получите точный расход цемента, песка, щебня, воды и добавок с В/Ц, оценкой стоимости и прогнозом прочности." },
    ],
    faqTitle: "Частые вопросы",
    toolsTitle: "Связанные инструменты", open: "Открыть",
    heroBadge: "ГОСТ 27006-2019",
    heroDesc: "Подбор состава ремонтного бетона по ГОСТ 27006-2019. Расчёт компонентов, оценка стоимости, кривые гранулометрии и прогноз прочности для марок B15–B40.",
  },
};

export default function Page() {
  const [lang, setLang] = useState<"en" | "ru">("en");
  const [grade, setGrade] = useState("B25 (M350)");
  const [volume, setVolume] = useState("1");
  const [customMode, setCustomMode] = useState(false);
  const [targetStrength, setTargetStrength] = useState("30");
  const [cementActivity, setCementActivity] = useState("42.5");
  const [slump, setSlump] = useState("50");
  const [aggregateType, setAggregateType] = useState<"gravel" | "crushed">("crushed");
  const [result, setResult] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [savedMixes, setSavedMixes] = useState<SavedMix[]>([]);
  const [mixName, setMixName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lang") as "en" | "ru" | null;
    if (saved) setLang(saved);
    const savedM = localStorage.getItem("concretemix_saved");
    if (savedM) setSavedMixes(JSON.parse(savedM));
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
    if (!customMode) {
      const m = mixes[grade];
      if (!m) return;
      const cementT = Math.round(m.cement * v);
      const sandT = Math.round(m.sand * v);
      const gravelT = Math.round(m.gravel * v);
      const waterT = Math.round(m.water * v);
      const additiveKg = Math.round(m.cement * v * 0.02);

      const cost = cementT * materialCosts.cement.price + sandT * materialCosts.sand.price + gravelT * materialCosts.gravel.price + waterT * materialCosts.water.price + additiveKg * materialCosts.additive.price;
      const costPerM3 = cost / v;

      const wc = m.wc;
      const strength28 = Math.round(40 / wc * 0.65 * 10) / 10;
      const strength7 = Math.round(strength28 * 0.65 * 10) / 10;
      const strengthClassStr = strength28 >= 30 ? "B30+" : strength28 >= 25 ? "B25" : strength28 >= 20 ? "B20" : strength28 >= 15 ? "B15" : "B10";

      setResult({ ...m, mode: "grade", volume: v, cement: cementT, sand: sandT, gravel: gravelT, water: waterT, additiveKg, cost, costPerM3, strength28, strength7, strengthClass: strengthClassStr });
      return;
    }

    const R28 = parseFloat(targetStrength) || 30;
    const Rc = parseFloat(cementActivity) || 42.5;
    const slumpVal = parseFloat(slump) || 50;
    const A = aggregateType === "gravel" ? 0.60 : 0.55;
    const ratioC_W = R28 / (A * Rc) + 0.5;
    const wc = Math.max(0.28, Math.min(0.75, 1 / ratioC_W));

    const baseWater = aggregateType === "gravel" ? 160 : 175;
    const waterPerM3 = Math.max(120, Math.min(230, baseWater + (slumpVal - 50) * 0.5));
    const cementPerM3 = Math.round(waterPerM3 / wc);
    const air = 20; // liters entrained air
    const rhoC = 3100, rhoW = 1000, rhoS = 2650, rhoG = aggregateType === "gravel" ? 2700 : 2800;
    const pasteL = cementPerM3 / rhoC + waterPerM3 / rhoW + air;
    const aggregateL = Math.max(0, 1000 - pasteL);
    const sandRatio = 0.42;
    const sandPerM3 = Math.round(aggregateL * sandRatio * rhoS / 1000);
    const gravelPerM3 = Math.round(aggregateL * (1 - sandRatio) * rhoG / 1000);
    const additivePerM3 = wc < 0.45 ? Math.round(cementPerM3 * 0.02) : 0;
    const additiveTxt = wc < 0.45
      ? (lang === "en" ? `Superplasticizer S-3 (${(additivePerM3 / cementPerM3 * 100).toFixed(1)}% of cement)` : `Суперпластификатор С-3 (${(additivePerM3 / cementPerM3 * 100).toFixed(1)}% от цемента)`)
      : (lang === "en" ? "No additive required" : "Добавка не требуется");

    const cementT = Math.round(cementPerM3 * v);
    const sandT = Math.round(sandPerM3 * v);
    const gravelT = Math.round(gravelPerM3 * v);
    const waterT = Math.round(waterPerM3 * v);
    const additiveKg = Math.round(additivePerM3 * v);

    const cost = cementT * materialCosts.cement.price + sandT * materialCosts.sand.price + gravelT * materialCosts.gravel.price + waterT * materialCosts.water.price + additiveKg * materialCosts.additive.price;
    const costPerM3 = cost / v;

    const strength28 = Math.round(R28 * 10) / 10;
    const strength7 = Math.round(strength28 * 0.65 * 10) / 10;
    const strengthClassStr = strength28 >= 30 ? "B30+" : strength28 >= 25 ? "B25" : strength28 >= 20 ? "B20" : strength28 >= 15 ? "B15" : "B10";

    setResult({
      mode: "custom", volume: v, grade: `${t.byTarget} R28=${R28}MPa`,
      cement: cementT, sand: sandT, gravel: gravelT, water: waterT, additiveKg,
      additive: { en: additiveTxt, ru: additiveTxt }, wc,
      cost, costPerM3, strength28, strength7, strengthClass: strengthClassStr,
      targetStrength: R28, cementActivity: Rc, slump: slumpVal, aggregateType,
    });
  };

  const saveMix = () => {
    if (!mixName.trim() || !result) return;
    const sm: SavedMix = { id: `m_${Date.now()}`, name: mixName, grade, volume, result, cost: result.cost, date: new Date().toISOString() };
    const updated = [sm, ...savedMixes];
    setSavedMixes(updated);
    localStorage.setItem("concretemix_saved", JSON.stringify(updated));
    setShowSaveForm(false);
    setMixName("");
  };

  const loadMix = (sm: SavedMix) => {
    setGrade(sm.grade); setVolume(sm.volume); setResult(sm.result);
  };

  const deleteMix = (id: string) => {
    const updated = savedMixes.filter((m) => m.id !== id);
    setSavedMixes(updated);
    localStorage.setItem("concretemix_saved", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass py-3" : "py-5 bg-transparent"}`}>
        <div className="container-max flex items-center justify-between">
          <Link href="https://engai-hub.vercel.app" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center font-display font-bold text-on-primary text-lg group-hover:scale-105 transition-transform">E</div>
            <span className="font-display font-bold text-xl text-on-surface">Eng<span className="gradient-text">AI</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#calculator" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">{t.calculator}</a>
            <a href="#granulometry" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">{t.granulometry}</a>
            <a href="#saved" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">{t.saved}</a>
            <a href="#how-it-works" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">{t.howItWorks}</a>
            <a href="#faq" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">{t.faq}</a>
            <a href="#tools" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">{t.tools}</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => setLang(lang === "en" ? "ru" : "en")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:border-primary/40 hover:text-primary transition-all text-sm">
              <Globe className="w-3.5 h-3.5" /> {lang === "en" ? "RU" : "EN"}
            </button>
            <a href="#calculator" className="btn-primary text-sm">{t.calculate}</a>
          </div>
          <button className="md:hidden text-on-surface-variant p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden glass mt-3 mx-4 rounded-xl p-6 flex flex-col gap-4">
            <a href="#calculator" onClick={() => setMobileOpen(false)} className="text-on-surface-variant hover:text-primary">{t.calculator}</a>
            <a href="#granulometry" onClick={() => setMobileOpen(false)} className="text-on-surface-variant hover:text-primary">{t.granulometry}</a>
            <a href="#saved" onClick={() => setMobileOpen(false)} className="text-on-surface-variant hover:text-primary">{t.saved}</a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="text-on-surface-variant hover:text-primary">{t.howItWorks}</a>
            <a href="#faq" onClick={() => setMobileOpen(false)} className="text-on-surface-variant hover:text-primary">{t.faq}</a>
            <a href="#tools" onClick={() => setMobileOpen(false)} className="text-on-surface-variant hover:text-primary">{t.tools}</a>
            <button onClick={() => { setLang(lang === "en" ? "ru" : "en"); setMobileOpen(false); }} className="flex items-center gap-1.5 text-on-surface-variant">
              <Globe className="w-4 h-4" /> {lang === "en" ? "Русский" : "English"}
            </button>
          </div>
        )}
      </header>

      <section className="relative pt-40 pb-16 grid-bg overflow-hidden">
        <div className="container-max text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-6 animate-fade-in">
            <Beaker className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-on-surface-variant">{t.heroBadge}</span>
          </div>
          <div className="inline-flex items-center gap-3 mb-4 animate-slide-up">
            <div className="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center">
              <FlaskConical className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-on-surface">ConcreteMix</h1>
          </div>
          <p className="text-on-surface-variant text-lg max-w-2xl mx-auto animate-slide-up">{t.heroDesc}</p>
        </div>
      </section>

      <section id="calculator" className="py-16">
        <div className="container-max max-w-3xl">
          <div className="glass rounded-2xl p-6 md:p-8 space-y-5 mb-6">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCustomMode(false)} className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${!customMode ? "bg-primary text-on-primary" : "glass text-on-surface-variant hover:text-primary"}`}>{t.byGrade}</button>
              <button onClick={() => setCustomMode(true)} className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${customMode ? "bg-primary text-on-primary" : "glass text-on-surface-variant hover:text-primary"}`}>{t.byTarget}</button>
            </div>

            {!customMode ? (
              <div>
                <label className="text-sm text-on-surface-variant mb-2 block">{t.grade}</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-on-surface focus:border-primary focus:outline-none transition-colors">
                  {Object.keys(mixes).map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-on-surface-variant mb-1 block">{t.targetStrength}</label><input value={targetStrength} onChange={(e) => setTargetStrength(e.target.value)} type="number" className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm focus:border-primary focus:outline-none transition-colors" /></div>
                  <div><label className="text-xs text-on-surface-variant mb-1 block">{t.cementActivity}</label><input value={cementActivity} onChange={(e) => setCementActivity(e.target.value)} type="number" className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm focus:border-primary focus:outline-none transition-colors" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-on-surface-variant mb-1 block">{t.workability}</label><input value={slump} onChange={(e) => setSlump(e.target.value)} type="number" className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm focus:border-primary focus:outline-none transition-colors" /></div>
                  <div><label className="text-xs text-on-surface-variant mb-1 block">{t.aggregateType}</label>
                    <select value={aggregateType} onChange={(e) => setAggregateType(e.target.value as any)} className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm focus:border-primary focus:outline-none">
                      <option value="gravel">{t.gravel}</option>
                      <option value="crushed">{t.crushed}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm text-on-surface-variant mb-2 block">{t.volume}</label>
              <input value={volume} onChange={(e) => setVolume(e.target.value)} type="number" min="0.1" step="0.1" className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-on-surface focus:border-primary focus:outline-none transition-colors" />
            </div>
            <button onClick={calculate} className="btn-primary w-full flex items-center justify-center gap-2">
              <FlaskConical className="w-4 h-4" /> {customMode ? t.customMix : t.selectMix}
            </button>
          </div>

          {result && (
            <div className="space-y-4 animate-fade-in">
              <div className="glass rounded-2xl p-6 md:p-8 space-y-5">
                <h2 className="font-display text-2xl font-bold text-on-surface">{t.recipe} {result.volume} m³</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass rounded-xl p-4 border border-outline-variant/10 card-hover">
                    <div className="flex items-center gap-2 mb-2"><Package className="w-4 h-4 text-on-surface-variant" /><p className="text-xs text-on-surface-variant">{t.cement}</p></div>
                    <p className="text-3xl font-bold text-on-surface">{result.cement}<span className="text-sm text-on-surface-variant ml-1">{t.kg}</span></p>
                  </div>
                  <div className="glass rounded-xl p-4 border border-outline-variant/10 card-hover">
                    <div className="flex items-center gap-2 mb-2"><Package className="w-4 h-4 text-on-surface-variant" /><p className="text-xs text-on-surface-variant">{t.sand}</p></div>
                    <p className="text-3xl font-bold text-on-surface">{result.sand}<span className="text-sm text-on-surface-variant ml-1">{t.kg}</span></p>
                  </div>
                  <div className="glass rounded-xl p-4 border border-outline-variant/10 card-hover">
                    <div className="flex items-center gap-2 mb-2"><Package className="w-4 h-4 text-on-surface-variant" /><p className="text-xs text-on-surface-variant">{t.gravel}</p></div>
                    <p className="text-3xl font-bold text-on-surface">{result.gravel}<span className="text-sm text-on-surface-variant ml-1">{t.kg}</span></p>
                  </div>
                  <div className="glass rounded-xl p-4 border border-outline-variant/10 card-hover">
                    <div className="flex items-center gap-2 mb-2"><Droplets className="w-4 h-4 text-on-surface-variant" /><p className="text-xs text-on-surface-variant">{t.water}</p></div>
                    <p className="text-3xl font-bold text-on-surface">{result.water}<span className="text-sm text-on-surface-variant ml-1">{t.liters}</span></p>
                  </div>
                </div>
                <div className="glass rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-emerald-400"><Droplets className="w-4 h-4" />{result.additive[lang]}</div>
                  <p className="text-xs text-on-surface-variant">{t.wcRatio}: <span className="text-primary font-mono">{result.wc}</span> · {t.density}: <span className="text-primary font-mono">~{Math.round((result.cement + result.sand + result.gravel + result.water) / result.volume)} kg/m³</span></p>
                </div>
              </div>

              {result.cost && (
                <div className="glass rounded-2xl p-6 space-y-3">
                  <div className="flex items-center gap-2 text-on-surface-variant mb-2"><DollarSign className="w-4 h-4" /> {t.materialCosts}</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between"><span className="text-on-surface-variant">{t.cement}</span><span className="text-on-surface font-mono">${(result.cement * materialCosts.cement.price).toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">{t.sand}</span><span className="text-on-surface font-mono">${(result.sand * materialCosts.sand.price).toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">{t.gravel}</span><span className="text-on-surface font-mono">${(result.gravel * materialCosts.gravel.price).toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">{t.water}</span><span className="text-on-surface font-mono">${(result.water * materialCosts.water.price).toFixed(2)}</span></div>
                  </div>
                  <div className="border-t border-outline-variant/20 pt-3 flex justify-between items-center">
                    <span className="text-sm text-on-surface-variant">{t.totalCost}</span>
                    <span className="text-2xl font-bold text-primary">${result.cost.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant text-right">{t.costPerM3}: <span className="text-primary font-mono">${result.costPerM3.toFixed(2)}/m³</span></p>
                </div>
              )}

              {result.strength28 && (
                <div className="glass rounded-2xl p-6 space-y-3">
                  <div className="flex items-center gap-2 text-on-surface-variant mb-2"><Activity className="w-4 h-4" /> {t.strength28d}</div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="glass rounded-xl p-3"><p className="text-xs text-on-surface-variant">{t.strength7d}</p><p className="text-xl font-bold text-on-surface">{result.strength7d} MPa</p></div>
                    <div className="glass rounded-xl p-3"><p className="text-xs text-on-surface-variant">{t.strength28d}</p><p className="text-xl font-bold text-emerald-400">{result.strength28} MPa</p></div>
                    <div className="glass rounded-xl p-3"><p className="text-xs text-on-surface-variant">{t.strengthClass}</p><p className="text-xl font-bold text-primary">{result.strengthClass}</p></div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setShowSaveForm(!showSaveForm)} className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm">
                  <Save className="w-4 h-4" /> {t.saveMix}
                </button>
                <button onClick={() => window.print()} className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4" /> {t.exportPDF}
                </button>
              </div>

              {showSaveForm && (
                <div className="glass rounded-2xl p-6 space-y-3 animate-fade-in">
                  <input value={mixName} onChange={(e) => setMixName(e.target.value)} placeholder={t.mixName} className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none text-sm" />
                  <button onClick={saveMix} className="btn-primary w-full text-sm flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {t.saveMix}</button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section id="granulometry" className="py-16 grid-bg">
        <div className="container-max max-w-4xl">
          <h2 className="font-display text-3xl font-bold text-on-surface text-center mb-3">{t.granulometryTitle}</h2>
          <div className="glass rounded-2xl p-6 mt-6">
            <svg viewBox="0 0 400 250" className="w-full h-64">
              <line x1="50" y1="220" x2="380" y2="220" stroke="rgb(87,103,103)" strokeWidth="1" />
              <line x1="50" y1="20" x2="50" y2="220" stroke="rgb(87,103,103)" strokeWidth="1" />
              <text x="215" y="245" fill="rgb(100,116,139)" fontSize="11" textAnchor="middle">{t.sieveSize}</text>
              <text x="18" y="120" fill="rgb(100,116,139)" fontSize="11" textAnchor="middle" transform="rotate(-90 18 120)">{t.passing}</text>
              {[0, 25, 50, 75, 100].map((p) => { const y = 220 - (p / 100) * 200; return <g key={p}><line x1="48" y1={y} x2="52" y2={y} stroke="rgb(87,103,103)" strokeWidth="1" /><text x="42" y={y + 4} fill="rgb(100,116,139)" fontSize="9" textAnchor="end">{p}</text></g>; })}
              {granulometryData.map((d) => { const x = 50 + Math.log10(d.size / 0.16) / Math.log10(20 / 0.16) * 330; return <g key={d.size}><line x1={x} y1="218" x2={x} y2="222" stroke="rgb(87,103,103)" strokeWidth="1" /><text x={x} y="235" fill="rgb(100,116,139)" fontSize="9" textAnchor="middle">{d.size}</text></g>; })}
              <polyline points={granulometryData.map((d) => { const x = 50 + Math.log10(d.size / 0.16) / Math.log10(20 / 0.16) * 330; const y = 220 - (d.sand / 100) * 200; return `${x},${y}`; }).join(" ")} fill="none" stroke="rgb(250,204,21)" strokeWidth="2" />
              <polyline points={granulometryData.map((d) => { const x = 50 + Math.log10(d.size / 0.16) / Math.log10(20 / 0.16) * 330; const y = 220 - (d.gravel / 100) * 200; return `${x},${y}`; }).join(" ")} fill="none" stroke="#0f5c63" strokeWidth="2" />
              <polyline points={granulometryData.map((d) => { const x = 50 + Math.log10(d.size / 0.16) / Math.log10(20 / 0.16) * 330; const y = 220 - (d.ideal / 100) * 200; return `${x},${y}`; }).join(" ")} fill="none" stroke="rgb(52,211,153)" strokeWidth="2" strokeDasharray="4 2" />
              <line x1="340" y1="30" x2="370" y2="30" stroke="rgb(250,204,21)" strokeWidth="2" /><text x="375" y="34" fill="rgb(250,204,21)" fontSize="9">Sand</text>
              <line x1="340" y1="50" x2="370" y2="50" stroke="#0f5c63" strokeWidth="2" /><text x="375" y="54" fill="#0f5c63" fontSize="9">Gravel</text>
              <line x1="340" y1="70" x2="370" y2="70" stroke="rgb(52,211,153)" strokeWidth="2" strokeDasharray="4 2" /><text x="375" y="74" fill="rgb(52,211,153)" fontSize="9">Ideal</text>
            </svg>
          </div>
        </div>
      </section>

      <section id="saved" className="py-16">
        <div className="container-max max-w-4xl">
          <h2 className="font-display text-3xl font-bold text-on-surface text-center mb-3">{t.savedMixes}</h2>
          <div className="glass rounded-2xl p-6 mt-6">
            {savedMixes.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-8">{t.noSaved}</p>
            ) : (
              <div className="space-y-2">
                {savedMixes.map((sm) => (
                  <div key={sm.id} className="glass rounded-xl p-4 flex items-center justify-between">
                    <button onClick={() => loadMix(sm)} className="flex-1 text-left">
                      <p className="text-sm text-on-surface font-medium">{sm.name}</p>
                      <p className="text-xs text-on-surface-variant">{sm.grade} · {sm.volume} m³ · ${sm.cost.toFixed(2)} · {new Date(sm.date).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU")}</p>
                    </button>
                    <button onClick={() => deleteMix(sm.id)} className="text-on-surface-variant hover:text-red-400 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 grid-bg">
        <div className="container-max max-w-5xl">
          <h2 className="font-display text-3xl font-bold text-on-surface text-center mb-12">{t.howItWorks}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {t.steps.map((s, i) => (
              <div key={i} className="glass rounded-2xl p-6 card-hover">
                <div className="text-4xl font-display font-bold text-primary/20 mb-3">0{i + 1}</div>
                <h3 className="font-display text-lg font-bold text-on-surface mb-2">{s.title}</h3>
                <p className="text-sm text-on-surface-variant">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20">
        <div className="container-max max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-on-surface text-center mb-12">{t.faqTitle}</h2>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-6 py-4 flex items-center justify-between text-left">
                  <span className="text-on-surface font-medium">{item.q[lang]}</span>
                  <ChevronDown className={`w-5 h-5 text-on-surface-variant transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-on-surface-variant animate-fade-in">{item.a[lang]}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tools" className="py-20 grid-bg">
        <div className="container-max max-w-4xl">
          <h2 className="font-display text-3xl font-bold text-on-surface text-center mb-12">{t.toolsTitle}</h2>
          <div className="grid md:grid-cols-5 gap-6">
            {relatedTools.map((tool) => (
              <a key={tool.name} href={tool.href} target="_blank" rel="noopener noreferrer" className="glass rounded-2xl p-6 card-hover group">
                <div className="text-3xl mb-3">{tool.icon}</div>
                <h3 className="font-display text-lg font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">{tool.name}</h3>
                <p className="text-sm text-on-surface-variant">{tool.desc[lang]}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  {t.open} <ArrowRight className="w-3 h-3" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-outline-variant/10">
        <div className="container-max max-w-4xl text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center font-display font-bold text-on-surface">E</div>
            <span className="font-display font-bold text-on-surface">Eng<span className="gradient-text">AI</span></span>
          </div>
          <p className="text-sm text-on-surface-variant mb-4">{lang === "en" ? "AI-powered structural inspection of building structures" : "Инженерное обследование строительных конструкций с применением AI"}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-on-surface-variant">
            <span>GOST 27006-2019</span>
            <span>·</span>
            <a href="https://engai-hub.vercel.app" className="hover:text-primary transition-colors">EngAI Hub</a>
            <span>·</span>
            <a href="https://inspectai-app-coral.vercel.app" className="hover:text-primary transition-colors">InspectAI</a>
            <span>·</span>
            <span>© 2025 EngAI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
