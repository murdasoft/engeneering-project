"use client";

import { useState, useEffect } from "react";
import { Calculator, TrendingDown, Shield, ArrowRight, FileText, ChevronDown, Menu, X, Globe, Plus, Trash2, Save, Download, History, FolderOpen, Layers, GitCompare } from "lucide-react";
import Link from "next/link";

const concreteGrades: Record<string, number> = { "B15": 11, "B20": 13.4, "B25": 14.5, "B30": 16.5, "B35": 18.5, "B40": 19.5, "B45": 21, "B50": 22 };
const rebarClasses: Record<string, number> = { "A240": 240, "A300": 300, "A400": 355, "A500": 435, "A600": 510 };
const shearCoeffs: Record<string, { Rbt: number; phi_b2: number }> = { "B15": { Rbt: 0.75, phi_b2: 1.7 }, "B20": { Rbt: 0.90, phi_b2: 1.7 }, "B25": { Rbt: 1.05, phi_b2: 1.7 }, "B30": { Rbt: 1.20, phi_b2: 1.7 }, "B35": { Rbt: 1.30, phi_b2: 1.7 }, "B40": { Rbt: 1.40, phi_b2: 1.7 }, "B45": { Rbt: 1.50, phi_b2: 1.7 }, "B50": { Rbt: 1.60, phi_b2: 1.7 } };

type SectionType = "rect" | "tbeam" | "circular";

const sectionTypes: { key: SectionType; label: { en: string; ru: string }; icon: string }[] = [
  { key: "rect", label: { en: "Rectangular", ru: "Прямоугольное" }, icon: "▭" },
  { key: "tbeam", label: { en: "T-beam", ru: "Тавровое" }, icon: "⊤" },
  { key: "circular", label: { en: "Circular (Column)", ru: "Круглое (Колонна)" }, icon: "◯" },
];

interface SavedCalc {
  id: string;
  name: string;
  date: string;
  sectionType: SectionType;
  b: string; h: string; a: string;
  concrete: string; rebar: string; As: string;
  defectLoss: string;
  N: string;
  result: any;
}

const faqItems = [
  { q: { en: "What are ξ and ξR?", ru: "Что такое ξ и ξR?" }, a: { en: "ξ is the relative depth of the concrete compression zone. ξR is the boundary value at which brittle failure occurs. If ξ > ξR, the section is over-reinforced and calculation is based on ξR.", ru: "ξ — относительная высота сжатой зоны бетона. ξR — граничное значение, при котором происходит хрупкое разрушение. Если ξ > ξR, сечение переармировано и расчёт ведётся по ξR." } },
  { q: { en: "How to account for defects?", ru: "Как учесть дефекты в расчёте?" }, a: { en: "Specify the percentage of section loss due to defects (cracks, spalling, rebar corrosion). The system recalculates the residual load-bearing capacity considering the reduction.", ru: "Укажите процент потери сечения от дефектов (трещины, сколы, коррозия арматуры). Система пересчитает остаточную несущую способность с учётом снижения." } },
  { q: { en: "What does ADEQUATE / LIMITED / CRITICAL mean?", ru: "Что означает ADEQUATE / LIMITED / CRITICAL?" }, a: { en: "ADEQUATE — safety factor >70%, structure is fine. LIMITED — factor 40-70%, repair needed. CRITICAL — factor <40%, urgent strengthening required.", ru: "ADEQUATE — запас прочности >70%, конструкция в норме. LIMITED — запас 40-70%, требуется ремонт. CRITICAL — запас <40, срочное усиление." } },
  { q: { en: "Which standard is used?", ru: "Какой норматив используется?" }, a: { en: "Calculation is performed per SP 63.13330.2018 'Concrete and reinforced concrete structures. General provisions', limit state design method.", ru: "Расчёт ведётся по СП 63.13330.2018 «Бетонные и железобетонные конструкции. Основные положения», метод предельных состояний." } },
];

const relatedTools = [
  { name: "RebarDesign", desc: { en: "Reinforcement section designer", ru: "Конструктор армирования сечения" }, href: "https://rebardesign.vercel.app", icon: "🔧" },
  { name: "CrackCalc", desc: { en: "Crack assessment by GOST", ru: "Оценка трещин по ГОСТ" }, href: "https://crackcalc.vercel.app", icon: "📏" },
  { name: "ConcreteMix", desc: { en: "Concrete mix design", ru: "Подбор состава бетона" }, href: "https://concretemix.vercel.app", icon: "🧪" },
  { name: "NormBase", desc: { en: "Normative documents reference", ru: "Справочник нормативов" }, href: "https://normbase.vercel.app", icon: "📚" },
  { name: "InspectAI", desc: { en: "AI structural inspection", ru: "AI-обследование конструкций" }, href: "https://inspectai-app-coral.vercel.app", icon: "🔍" },
];

const tr = {
  en: {
    calculator: "Calculator", saved: "Saved", howItWorks: "How it works", faq: "FAQ", tools: "Tools",
    calculate: "Calculate", calcCapacity: "Calculate load-bearing capacity",
    sectionType: "Section type", concreteClass: "Concrete class", rebarClass: "Rebar class", rebarArea: "Reinforcement area As (mm²)",
    defectLoss: "Section loss from defects (%)", sectionParams: "Section parameters",
    axialForce: "Axial force N (kN)", shearCapacity: "Shear capacity", momentCapacity: "Moment capacity",
    capacity: "Capacity", residual: "Residual", loss: "Loss", safetyFactor: "Safety factor",
    designMoment: "Design moment M (kN·m)", designShear: "Design shear Q (kN)", utilization: "Utilization", designCheck: "Design load check",
    calcParams: "Design parameters:", shearParams: "Shear parameters:", mndiagram: "M-N interaction",
    noSaved: "No saved calculations yet", saveCalc: "Save calculation", calcName: "Calculation name",
    exportPDF: "Export PDF", savedCalcs: "Saved calculations",
    steps: [
      { title: "Select section type", desc: "Choose rectangular, T-beam or circular section. Specify geometry, concrete and rebar classes, reinforcement area." },
      { title: "Calculation per SP 63", desc: "System calculates moment capacity, shear capacity and M-N interaction diagram with defect consideration." },
      { title: "Assessment & save", desc: "Get condition category, save calculations for comparison, export PDF report." },
    ],
    faqTitle: "Frequently Asked Questions", toolsTitle: "Related Tools", open: "Open",
    heroBadge: "SP 63.13330.2018",
    heroDesc: "Load-bearing capacity of RC structures: moment, shear and M-N interaction per SP 63.13330.2018. Multiple section types, defect consideration and calculation history.",
    footerDesc: "AI-powered structural inspection of building structures",
    strengthen: "Calculate strengthening",
  },
  ru: {
    calculator: "Калькулятор", saved: "История", howItWorks: "Как работает", faq: "FAQ", tools: "Инструменты",
    calculate: "Рассчитать", calcCapacity: "Рассчитать несущую способность",
    sectionType: "Тип сечения", concreteClass: "Класс бетона", rebarClass: "Класс арматуры", rebarArea: "Площадь арматуры As (мм²)",
    defectLoss: "Потеря сечения от дефектов (%)", sectionParams: "Параметры сечения",
    axialForce: "Продольная сила N (кН)", shearCapacity: "Прочность на сдвиг", momentCapacity: "Прочность на изгиб",
    capacity: "Несущая способность", residual: "Остаточная", loss: "Потеря", safetyFactor: "Запас прочности",
    designMoment: "Расчётный момент M (кН·м)", designShear: "Расчётная поперечная сила Q (кН)", utilization: "Использование", designCheck: "Проверка по нагрузкам",
    calcParams: "Расчётные параметры:", shearParams: "Параметры сдвига:", mndiagram: "Диаграмма M-N",
    noSaved: "Нет сохранённых расчётов", saveCalc: "Сохранить расчёт", calcName: "Название расчёта",
    exportPDF: "Экспорт PDF", savedCalcs: "Сохранённые расчёты",
    steps: [
      { title: "Выбор типа сечения", desc: "Выберите прямоугольное, тавровое или круглое сечение. Укажите геометрию, классы бетона и арматуры, площадь арматуры." },
      { title: "Расчёт по СП 63", desc: "Система рассчитывает прочность на изгиб, сдвиг и диаграмму M-N с учётом дефектов." },
      { title: "Оценка и сохранение", desc: "Получите категорию состояния, сохраните расчёты для сравнения, экспортируйте PDF-отчёт." },
    ],
    faqTitle: "Частые вопросы", toolsTitle: "Связанные инструменты", open: "Открыть",
    heroBadge: "СП 63.13330.2018",
    heroDesc: "Несущая способность ж/б конструкций: изгиб, сдвиг и M-N по СП 63.13330.2018. Несколько типов сечений, учёт дефектов и история расчётов.",
    footerDesc: "Инженерное обследование строительных конструкций с применением AI",
    strengthen: "Рассчитать усиление",
  },
};

export default function Page() {
  const [lang, setLang] = useState<"en" | "ru">("en");
  const [sectionType, setSectionType] = useState<SectionType>("rect");
  const [b, setB] = useState("300");
  const [h, setH] = useState("500");
  const [a, setA] = useState("50");
  const [concrete, setConcrete] = useState("B25");
  const [rebar, setRebar] = useState("A400");
  const [As, setAs] = useState("1256");
  const [defectLoss, setDefectLoss] = useState("0");
  const [axialN, setAxialN] = useState("0");
  const [designM, setDesignM] = useState("0");
  const [designQ, setDesignQ] = useState("0");
  const [result, setResult] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [savedCalcs, setSavedCalcs] = useState<SavedCalc[]>([]);
  const [calcName, setCalcName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lang") as "en" | "ru" | null;
    if (saved) setLang(saved);
    const savedC = localStorage.getItem("loadbear_calcs");
    if (savedC) setSavedCalcs(JSON.parse(savedC));
  }, []);
  useEffect(() => { localStorage.setItem("lang", lang); }, [lang]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const t = tr[lang];

  const calculate = () => {
    const B = parseFloat(b), H = parseFloat(h), A = parseFloat(a), A_s = parseFloat(As), loss = parseFloat(defectLoss), N_kn = parseFloat(axialN) || 0;
    const h0 = H - A;
    const Rb = concreteGrades[concrete] || 14.5;
    const Rs = rebarClasses[rebar] || 355;
    const sc = shearCoeffs[concrete] || { Rbt: 1.05, phi_b2: 1.7 };
    const N = N_kn * 1000;

    let xi: number, M: number, beff = B;
    if (sectionType === "tbeam") { beff = B * 2; }
    xi = (Rs * A_s) / (Rb * beff * h0);
    const xiR = 0.531;
    if (xi <= xiR) { M = Rb * beff * h0 * h0 * xi * (1 - 0.5 * xi) / 1e6; }
    else { const alphaR = xiR * (1 - 0.5 * xiR); M = Rb * beff * h0 * h0 * alphaR / 1e6; }

    let M_with_N = M;
    if (N > 0) {
      const e_N = N * (h0 / 2 - A) / 1e6;
      M_with_N = M - e_N;
    }

    const phi_b2 = sc.phi_b2;
    const Rbt = sc.Rbt;
    const Qb = phi_b2 * Rbt * B * h0 * h0 / 1000;
    const Qsw = 0.75 * 0.9 * 170 * 0.001 * B * h0 / 1000;
    const Qmax = 0.3 * phi_b2 * Rbt * B * h0 / 1000;
    const Qtotal = Math.min(Qb + Qsw, Qmax);

    const mnPoints: { n: number; m: number }[] = [];
    for (let i = 0; i <= 10; i++) {
      const n_frac = i / 10;
      const n_val = n_frac * Rb * B * H / 1000;
      const m_val = M * (1 - n_frac * 0.7);
      mnPoints.push({ n: n_val, m: m_val });
    }

    const reduction = loss / 100;
    const residual = M_with_N * (1 - reduction);
    const shearResidual = Qtotal * (1 - reduction);

    const designM_val = parseFloat(designM) || 0;
    const designQ_val = parseFloat(designQ) || 0;
    const utilM = designM_val > 0 ? designM_val / residual : 0;
    const utilQ = designQ_val > 0 ? designQ_val / shearResidual : 0;
    const overallUtil = Math.max(utilM, utilQ);
    const designVerdict = overallUtil < 0.7 ? "ADEQUATE" : overallUtil < 1 ? "LIMITED" : "CRITICAL";
    const designVerdictRu = overallUtil < 0.7 ? "НОРМА" : overallUtil < 1 ? "ОГРАНИЧЕНО" : "КРИТИЧНО";
    const safetyFactor = residual / (M || 1);

    setResult({
      M: M_with_N.toFixed(2), residual: residual.toFixed(2), reduction: (reduction * 100).toFixed(1),
      xi: xi.toFixed(3), xiR, Rs, Rb, h0, beff,
      Qb: Qb.toFixed(2), Qsw: Qsw.toFixed(2), Qmax: Qmax.toFixed(2), Qtotal: Qtotal.toFixed(2), shearResidual: shearResidual.toFixed(2),
      mnPoints, N: N_kn,
      designM: designM_val, designQ: designQ_val,
      utilM, utilQ, overallUtil,
      capacity: safetyFactor > 0.7 ? "ADEQUATE" : safetyFactor > 0.4 ? "LIMITED" : "CRITICAL",
      capacityRu: safetyFactor > 0.7 ? "НОРМА" : safetyFactor > 0.4 ? "ОГРАНИЧЕНО" : "КРИТИЧНО",
      designVerdict, designVerdictRu,
      safetyFactor: (safetyFactor * 100).toFixed(0),
      sectionType,
    });
  };

  const saveCalc = () => {
    if (!calcName.trim() || !result) return;
    const c: SavedCalc = { id: `c_${Date.now()}`, name: calcName, date: new Date().toISOString(), sectionType, b, h, a, concrete, rebar, As, defectLoss, N: axialN, result };
    const updated = [c, ...savedCalcs];
    setSavedCalcs(updated);
    localStorage.setItem("loadbear_calcs", JSON.stringify(updated));
    setShowSaveForm(false);
    setCalcName("");
  };

  const loadCalc = (c: SavedCalc) => {
    setSectionType(c.sectionType); setB(c.b); setH(c.h); setA(c.a);
    setConcrete(c.concrete); setRebar(c.rebar); setAs(c.As);
    setDefectLoss(c.defectLoss); setAxialN(c.N); setResult(c.result);
  };

  const deleteCalc = (id: string) => {
    const updated = savedCalcs.filter((c) => c.id !== id);
    setSavedCalcs(updated);
    localStorage.setItem("loadbear_calcs", JSON.stringify(updated));
  };

  const capacityColor = result?.capacity === "ADEQUATE" ? "text-emerald-400" : result?.capacity === "LIMITED" ? "text-amber-400" : "text-red-400";
  const capacityBg = result?.capacity === "ADEQUATE" ? "bg-emerald-500/10 border-emerald-500/30" : result?.capacity === "LIMITED" ? "bg-amber-500/10 border-amber-500/30" : "bg-red-500/10 border-red-500/30";

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
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-on-surface-variant">{t.heroBadge}</span>
          </div>
          <div className="inline-flex items-center gap-3 mb-4 animate-slide-up">
            <div className="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center">
              <Calculator className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-on-surface">LoadBear</h1>
          </div>
          <p className="text-on-surface-variant text-lg max-w-2xl mx-auto animate-slide-up">{t.heroDesc}</p>
        </div>
      </section>

      <section id="calculator" className="py-16">
        <div className="container-max max-w-4xl">
          <div className="glass rounded-2xl p-6 md:p-8 space-y-5 mb-6">
            <div className="flex flex-wrap gap-2">
              {sectionTypes.map((st) => (
                <button key={st.key} onClick={() => setSectionType(st.key)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${sectionType === st.key ? "bg-primary text-on-primary" : "glass text-on-surface-variant hover:text-primary"}`}>
                  <span className="text-base">{st.icon}</span> {st.label[lang]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-on-surface-variant mb-1 block">b (mm)</label><input value={b} onChange={(e) => setB(e.target.value)} type="number" className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm focus:border-primary focus:outline-none transition-colors" /></div>
              <div><label className="text-xs text-on-surface-variant mb-1 block">h (mm)</label><input value={h} onChange={(e) => setH(e.target.value)} type="number" className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm focus:border-primary focus:outline-none transition-colors" /></div>
              <div><label className="text-xs text-on-surface-variant mb-1 block">a (mm)</label><input value={a} onChange={(e) => setA(e.target.value)} type="number" className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm focus:border-primary focus:outline-none transition-colors" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">{t.concreteClass}</label>
                <select value={concrete} onChange={(e) => setConcrete(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm focus:border-primary focus:outline-none">
                  {Object.keys(concreteGrades).map((g) => <option key={g} value={g}>{g} (Rb={concreteGrades[g]} MPa)</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">{t.rebarClass}</label>
                <select value={rebar} onChange={(e) => setRebar(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm focus:border-primary focus:outline-none">
                  {Object.keys(rebarClasses).map((g) => <option key={g} value={g}>{g} (Rs={rebarClasses[g]} MPa)</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-on-surface-variant mb-1 block">{t.rebarArea}</label><input value={As} onChange={(e) => setAs(e.target.value)} type="number" className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm focus:border-primary focus:outline-none transition-colors" /></div>
              <div><label className="text-xs text-on-surface-variant mb-1 block">{t.axialForce}</label><input value={axialN} onChange={(e) => setAxialN(e.target.value)} placeholder="0" type="number" className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm focus:border-primary focus:outline-none transition-colors" /></div>
            </div>
            <div><label className="text-xs text-on-surface-variant mb-1 block">{t.defectLoss}</label><input value={defectLoss} onChange={(e) => setDefectLoss(e.target.value)} placeholder="0" type="number" className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm focus:border-primary focus:outline-none transition-colors" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-on-surface-variant mb-1 block">{t.designMoment}</label><input value={designM} onChange={(e) => setDesignM(e.target.value)} placeholder="0" type="number" className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm focus:border-primary focus:outline-none transition-colors" /></div>
              <div><label className="text-xs text-on-surface-variant mb-1 block">{t.designShear}</label><input value={designQ} onChange={(e) => setDesignQ(e.target.value)} placeholder="0" type="number" className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm focus:border-primary focus:outline-none transition-colors" /></div>
            </div>
            <button onClick={calculate} className="btn-primary w-full flex items-center justify-center gap-2"><Calculator className="w-4 h-4" /> {t.calcCapacity}</button>
          </div>

          {result && (
            <div className="space-y-4 animate-fade-in">
              <div className={`glass rounded-2xl p-6 md:p-8 border ${capacityBg}`}>
                <div className="flex items-center gap-3 mb-4">
                  <TrendingDown className={`w-8 h-8 ${capacityColor}`} />
                  <div>
                    <h2 className={`font-display text-2xl font-bold ${capacityColor}`}>{lang === "en" ? result.capacity : result.capacityRu}</h2>
                    <p className="text-sm text-on-surface-variant">{t.safetyFactor}: {result.safetyFactor}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div className="glass rounded-xl p-3"><p className="text-xs text-on-surface-variant">{t.momentCapacity}</p><p className="text-xl font-bold text-on-surface">{result.M} kN·m</p></div>
                  <div className="glass rounded-xl p-3"><p className="text-xs text-on-surface-variant">{t.residual}</p><p className="text-xl font-bold text-emerald-400">{result.residual} kN·m</p></div>
                  <div className="glass rounded-xl p-3"><p className="text-xs text-on-surface-variant">{t.loss}</p><p className="text-xl font-bold text-amber-400">{result.reduction}%</p></div>
                </div>

                {result.Qtotal && (
                  <div className="glass rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 text-on-surface-variant mb-3"><Layers className="w-3 h-3" /> {t.shearCapacity}</div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div><p className="text-xs text-on-surface-variant">Qb</p><p className="text-sm font-bold text-on-surface">{result.Qb} kN</p></div>
                      <div><p className="text-xs text-on-surface-variant">Qsw</p><p className="text-sm font-bold text-on-surface">{result.Qsw} kN</p></div>
                      <div><p className="text-xs text-on-surface-variant">{t.shearCapacity}</p><p className="text-sm font-bold text-emerald-400">{result.Qtotal} kN</p></div>
                    </div>
                  </div>
                )}

                <div className="glass rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 text-on-surface-variant mb-3"><Shield className="w-3 h-3" /> {t.designCheck}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div><p className="text-xs text-on-surface-variant">M_d / M_cap</p><p className="text-sm font-bold text-on-surface">{result.utilM ? (result.utilM * 100).toFixed(0) : 0}%</p></div>
                    <div><p className="text-xs text-on-surface-variant">Q_d / Q_cap</p><p className="text-sm font-bold text-on-surface">{result.utilQ ? (result.utilQ * 100).toFixed(0) : 0}%</p></div>
                    <div><p className="text-xs text-on-surface-variant">{t.utilization}</p><p className={`text-sm font-bold ${result.overallUtil > 1 ? "text-red-400" : result.overallUtil > 0.7 ? "text-amber-400" : "text-emerald-400"}`}>{result.overallUtil ? (result.overallUtil * 100).toFixed(0) : 0}%</p></div>
                    <div><p className="text-xs text-on-surface-variant">{t.safetyFactor}</p><p className={`text-sm font-bold ${result.overallUtil > 1 ? "text-red-400" : result.overallUtil > 0.7 ? "text-amber-400" : "text-emerald-400"}`}>{lang === "en" ? result.designVerdict : result.designVerdictRu}</p></div>
                  </div>
                </div>

                {result.mnPoints && result.mnPoints.length > 0 && (
                  <div className="glass rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 text-on-surface-variant mb-3"><GitCompare className="w-3 h-3" /> {t.mndiagram}</div>
                    <svg viewBox="0 0 300 200" className="w-full h-48">
                      <line x1="40" y1="170" x2="290" y2="170" stroke="rgb(87,103,103)" strokeWidth="1" />
                      <line x1="40" y1="10" x2="40" y2="170" stroke="rgb(87,103,103)" strokeWidth="1" />
                      <text x="150" y="195" fill="rgb(100,116,139)" fontSize="11" textAnchor="middle">N (kN)</text>
                      <text x="15" y="90" fill="rgb(100,116,139)" fontSize="11" textAnchor="middle" transform="rotate(-90 15 90)">M (kN·m)</text>
                      <polygon points={result.mnPoints.map((p: any, i: number) => { const x = 40 + (i / (result.mnPoints.length - 1)) * 250; const maxM = Math.max(...result.mnPoints.map((pp: any) => pp.m)); const y = 170 - (p.m / maxM) * 150; return `${x},${y}`; }).join(" ")} fill="rgba(0,67,73,0.15)" stroke="#0f5c63" strokeWidth="2" />
                      {result.N > 0 && (() => { const maxN = result.mnPoints[result.mnPoints.length - 1].n; const xN = 40 + (result.N / maxN) * 250; return <line x1={xN} y1="10" x2={xN} y2="170" stroke="rgb(239,68,68)" strokeWidth="1" strokeDasharray="4 2" />; })()}
                    </svg>
                  </div>
                )}

                <div className="glass rounded-xl p-3 text-sm space-y-1">
                  <p className="text-on-surface-variant">{t.calcParams}</p>
                  <p className="text-on-surface-variant font-mono text-xs">h₀ = {result.h0} mm · ξ = {result.xi} · ξR = {result.xiR} · Rb = {result.Rb} MPa · Rs = {result.Rs} MPa{result.beff !== parseFloat(b) ? ` · b_eff = ${result.beff} mm` : ""}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setShowSaveForm(!showSaveForm)} className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm">
                  <Save className="w-4 h-4" /> {t.saveCalc}
                </button>
                <button onClick={() => window.print()} className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm">
                  <Download className="w-4 h-4" /> {t.exportPDF}
                </button>
                <a href="https://rebardesign.vercel.app" target="_blank" rel="noopener noreferrer" className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"><Shield className="w-4 h-4" /> {t.strengthen} <ArrowRight className="w-4 h-4" /></a>
              </div>

              {showSaveForm && (
                <div className="glass rounded-2xl p-6 space-y-3 animate-fade-in">
                  <input value={calcName} onChange={(e) => setCalcName(e.target.value)} placeholder={t.calcName} className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none text-sm" />
                  <button onClick={saveCalc} className="btn-primary w-full text-sm flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {t.saveCalc}</button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section id="saved" className="py-16 grid-bg">
        <div className="container-max max-w-4xl">
          <h2 className="font-display text-3xl font-bold text-on-surface text-center mb-3">{t.savedCalcs}</h2>
          <div className="glass rounded-2xl p-6 mt-6">
            {savedCalcs.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-8">{t.noSaved}</p>
            ) : (
              <div className="space-y-2">
                {savedCalcs.map((c) => (
                  <div key={c.id} className="glass rounded-xl p-4 flex items-center justify-between">
                    <button onClick={() => loadCalc(c)} className="flex-1 text-left">
                      <p className="text-sm text-on-surface font-medium">{c.name}</p>
                      <p className="text-xs text-on-surface-variant">{sectionTypes.find((st) => st.key === c.sectionType)?.label[lang]} · {c.concrete} · M={c.result?.M} kN·m · {new Date(c.date).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU")}</p>
                    </button>
                    <button onClick={() => deleteCalc(c.id)} className="text-on-surface-variant hover:text-red-400 transition-colors p-1">
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
          <p className="text-sm text-on-surface-variant mb-4">{t.footerDesc}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-on-surface-variant">
            <span>SP 63.13330.2018</span>
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
