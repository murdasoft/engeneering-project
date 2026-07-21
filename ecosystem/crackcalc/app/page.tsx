"use client";

import { useState, useEffect, useRef } from "react";
import { Ruler, AlertTriangle, ArrowRight, TrendingUp, FileText, ChevronDown, Menu, X, ShieldCheck, Globe, Plus, Trash2, Camera, Download, Calendar, History, Save, FolderOpen, ClipboardList, BarChart3 } from "lucide-react";
import Link from "next/link";
import GrowthChart from "./components/GrowthChart";

const standards = {
  gost: {
    name: "GOST 31937-2011",
    nameRu: "ГОСТ 31937-2011",
    categories: [
      { max: 0.1, label: { en: "C1 — Insignificant", ru: "Н1 — Незначительный" }, desc: { en: "No repair required. Annual monitoring.", ru: "Не требует ремонта. Мониторинг 1 раз/год." }, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "✅", monitor: { en: "Annual", ru: "1 раз/год" } },
      { max: 0.2, label: { en: "C2 — Significant", ru: "Н2 — Значительный" }, desc: { en: "Repair required within 1-2 years.", ru: "Требует ремонта в течение 1-2 лет." }, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "⚠️", monitor: { en: "Quarterly", ru: "1 раз/квартал" } },
      { max: 0.3, label: { en: "C3 — Critical", ru: "Н3 — Критический" }, desc: { en: "Immediate repair or strengthening required.", ru: "Требует немедленного ремонта или усиления." }, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: "🔴", monitor: { en: "Monthly", ru: "1 раз/месяц" } },
      { max: 999, label: { en: "C4 — Hazardous", ru: "Н4 — Опасный" }, desc: { en: "Inadmissible condition. Urgent strengthening or decommissioning.", ru: "Недопустимое состояние. Срочное усиление или вывод из эксплуатации." }, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: "🚨", monitor: { en: "Continuous", ru: "Непрерывный" } },
    ],
  },
  aci: {
    name: "ACI 224R-01",
    nameRu: "ACI 224R-01",
    categories: [
      { max: 0.1, label: { en: "T1 — Fine", ru: "Т1 — Тонкая" }, desc: { en: "Width < 0.1mm. Normal for reinforced concrete.", ru: "Ширина < 0.1мм. Норма для ж/б." }, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "✅", monitor: { en: "Annual", ru: "1 раз/год" } },
      { max: 0.3, label: { en: "T2 — Narrow", ru: "Т2 — Узкая" }, desc: { en: "Width 0.1-0.3mm. Acceptable in dry conditions.", ru: "Ширина 0.1-0.3мм. Допустимо в сухих условиях." }, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "⚠️", monitor: { en: "Semi-annual", ru: "2 раза/год" } },
      { max: 0.4, label: { en: "T3 — Medium", ru: "Т3 — Средняя" }, desc: { en: "Width 0.3-0.4mm. Requires investigation.", ru: "Ширина 0.3-0.4мм. Требует обследования." }, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: "🔴", monitor: { en: "Quarterly", ru: "1 раз/квартал" } },
      { max: 999, label: { en: "T4 — Wide", ru: "Т4 — Широкая" }, desc: { en: "Width > 0.4mm. Excessive cracking.", ru: "Ширина > 0.4мм. Чрезмерное раскрытие." }, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: "🚨", monitor: { en: "Monthly", ru: "1 раз/месяц" } },
    ],
  },
  en: {
    name: "EN 1992-1-1",
    nameRu: "ЕН 1992-1-1",
    categories: [
      { max: 0.2, label: { en: "X1 — Exposure XC1", ru: "X1 — XC1" }, desc: { en: "wmax = 0.2mm for exposure class XC1.", ru: "wmax = 0.2мм для класса XC1." }, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "✅", monitor: { en: "Annual", ru: "1 раз/год" } },
      { max: 0.3, label: { en: "X2 — Exposure XC2-XC4", ru: "X2 — XC2-XC4" }, desc: { en: "wmax = 0.3mm for exposure classes XC2-XC4.", ru: "wmax = 0.3мм для классов XC2-XC4." }, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "⚠️", monitor: { en: "Semi-annual", ru: "2 раза/год" } },
      { max: 0.4, label: { en: "X3 — Exposure XD/XS", ru: "X3 — XD/XS" }, desc: { en: "wmax = 0.3mm for exposure classes XD, XS.", ru: "wmax = 0.3мм для классов XD, XS." }, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: "🔴", monitor: { en: "Quarterly", ru: "1 раз/квартал" } },
      { max: 999, label: { en: "X4 — Excessive", ru: "X4 — Превышение" }, desc: { en: "Width exceeds all limits. Immediate action.", ru: "Превышение всех лимитов. Срочные меры." }, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: "🚨", monitor: { en: "Monthly", ru: "1 раз/месяц" } },
    ],
  },
};

const gostRefs = [
  { en: "GOST 31937-2011 — Buildings and structures. Rules for inspection and monitoring", ru: "ГОСТ 31937-2011 — Здания и сооружения. Правила обследования и мониторинга" },
  { en: "SP 63.13330.2018 — Concrete and reinforced concrete structures", ru: "СП 63.13330.2018 — Бетонные и железобетонные конструкции" },
  { en: "STO NOSTROY 2.7.64 — Repair and strengthening of reinforced concrete structures", ru: "СТО НОСТРОЙ 2.7.64 — Ремонт и усиление железобетонных конструкций" },
  { en: "ACI 224R-01 — Control of Cracking in Concrete Structures", ru: "ACI 224R-01 — Контроль трещин в бетонных конструкциях" },
  { en: "EN 1992-1-1 — Design of concrete structures", ru: "ЕН 1992-1-1 — Проектирование бетонных конструкций" },
];

const faqItems = [
  { q: { en: "What to do for category C3?", ru: "Что делать при категории Н3?" }, a: { en: "For category C3 (critical condition), immediate strengthening or repair is required. It is recommended to limit operational loads until repair work is completed.", ru: "При категории Н3 (критическое состояние) требуется немедленное усиление конструкции или её ремонт. Рекомендуется ограничить эксплуатационные нагрузки до завершения ремонтных работ." } },
  { q: { en: "How to measure crack width?", ru: "Как измерить ширину трещины?" }, a: { en: "Use a crack gauge or feeler gauge with 0.05 mm graduations. For precise measurements, a microscope with 0.01 mm resolution is used. Take measurements at 3-5 points along the crack.", ru: "Используйте трещиномер или щуп с делениями 0.05 мм. Для точных измерений применяется микроскоп с ценой деления 0.01 мм. Замеры проводятся в 3-5 точках по длине трещины." } },
  { q: { en: "What is crack growth rate?", ru: "Что такое скорость роста трещины?" }, a: { en: "Growth rate is the increase in crack opening width per unit time. 15% of current width per year is used as a design estimate when monitoring data is unavailable.", ru: "Скорость роста — это увеличение ширины раскрытия трещины за единицу времени. Принимается 15% от текущей ширины в год для расчётной оценки при отсутствии данных мониторинга." } },
  { q: { en: "When is monitoring needed?", ru: "Когда нужен мониторинг?" }, a: { en: "Crack monitoring is mandatory for category C2 and above. Frequency: C1 — annually, C2 — quarterly, C3 — monthly, C4 — continuous.", ru: "Мониторинг трещин обязателен при категории Н2 и выше. Периодичность: Н1 — 1 раз/год, Н2 — 1 раз/квартал, Н3 — 1 раз/месяц, Н4 — непрерывный." } },
  { q: { en: "How do standards compare?", ru: "Как сравниваются нормативы?" }, a: { en: "GOST 31937 uses 4 categories (C1-C4) based on width thresholds (0.1, 0.2, 0.3mm). ACI 224R uses similar thresholds but different exposure conditions. EN 1992 links limits to exposure classes.", ru: "ГОСТ 31937 использует 4 категории (Н1-Н4) по порогам ширины (0.1, 0.2, 0.3мм). ACI 224R использует схожие пороги, но учитывает условия эксплуатации. ЕН 1992 привязывает лимиты к классам воздействия." } },
];

const relatedTools = [
  { name: "ConcreteMix", desc: { en: "Repair concrete mix design", ru: "Подбор состава ремонтного бетона" }, href: "/dashboard/tools/concretemix", icon: "🧪" },
  { name: "LoadBear", desc: { en: "Load-bearing capacity calculator", ru: "Расчёт несущей способности" }, href: "/dashboard/tools/loadbear", icon: "🏗️" },
  { name: "InspectAI", desc: { en: "AI structural inspection", ru: "AI-обследование конструкций" }, href: "/dashboard", icon: "🔍" },
  { name: "NormBase", desc: { en: "Normative documents reference", ru: "Справочник нормативов" }, href: "/dashboard/tools/normbase", icon: "📚" },
];

interface Measurement {
  id: string;
  date: string;
  width: number;
  length: number;
  depth: number;
  note: string;
}

interface Session {
  id: string;
  name: string;
  objectName: string;
  inspectorName: string;
  createdAt: string;
  measurements: Measurement[];
}

const tr = {
  en: {
    calculator: "Calculator", monitoring: "Monitoring", howItWorks: "How it works", faq: "FAQ", tools: "Tools",
    calculate: "Calculate", assess: "Assess crack", addMeasurement: "Add measurement", saveSession: "Save session",
    newSession: "New session", loadSession: "Load session", deleteSession: "Delete session", noSessions: "No saved sessions yet",
    sessionName: "Session name", objectName: "Object / building", inspectorName: "Inspector name",
    width: "Width (mm)", length: "Length (mm)", depth: "Depth (mm)", date: "Date", note: "Note",
    growthYear: "Growth/year", toCritical: "Until critical", openingArea: "Opening area", repairVolume: "Repair volume",
    normativeBase: "Normative basis:", repairMix: "Repair mix", uploadPhoto: "Upload photo to InspectAI",
    multiStandard: "Multi-standard comparison", monitoringSchedule: "Monitoring schedule",
    measurements: "Measurements", sessionInfo: "Session info", exportPDF: "Export PDF", useTrend: "Use monitoring trend", trendHint: "Forecast based on linear regression of saved measurements",
    steps: [
      { title: "Measure parameters", desc: "Measure crack opening width, length and depth using a crack gauge or feeler gauge." },
      { title: "Classification", desc: "The system determines the defect category per GOST 31937, ACI 224R and EN 1992." },
      { title: "Monitor & forecast", desc: "Track growth over time, forecast critical condition and generate inspection report." },
    ],
    faqTitle: "Frequently Asked Questions", toolsTitle: "Related Tools", open: "Open",
    heroBadge: "GOST 31937 · ACI 224R · EN 1992",
    heroDesc: "Assessment and classification of cracks per GOST 31937-2011, ACI 224R-01 and EN 1992-1-1. Multi-standard comparison, growth monitoring and PDF inspection reports.",
    footerDesc: "AI-powered structural inspection of building structures",
  },
  ru: {
    calculator: "Калькулятор", monitoring: "Мониторинг", howItWorks: "Как работает", faq: "FAQ", tools: "Инструменты",
    calculate: "Рассчитать", assess: "Оценить трещину", addMeasurement: "Добавить замер", saveSession: "Сохранить сессию",
    newSession: "Новая сессия", loadSession: "Загрузить", deleteSession: "Удалить", noSessions: "Нет сохранённых сессий",
    sessionName: "Название сессии", objectName: "Объект / здание", inspectorName: "Имя инспектора",
    width: "Ширина (мм)", length: "Длина (мм)", depth: "Глубина (мм)", date: "Дата", note: "Примечание",
    growthYear: "Рост в год", toCritical: "До критического", openingArea: "Площадь раскрытия", repairVolume: "Объём ремонта",
    normativeBase: "Нормативная база:", repairMix: "Ремонтный состав", uploadPhoto: "Загрузить фото в InspectAI",
    multiStandard: "Сравнение по нормативам", monitoringSchedule: "График мониторинга",
    measurements: "Замеры", sessionInfo: "Информация о сессии", exportPDF: "Экспорт PDF", useTrend: "Использовать тренд замеров", trendHint: "Прогноз основан на линейной регрессии сохранённых замеров",
    steps: [
      { title: "Замер параметров", desc: "Измерьте ширину раскрытия трещины, её длину и глубину с помощью трещиномера или щупа." },
      { title: "Классификация", desc: "Система определяет категорию дефекта по ГОСТ 31937, ACI 224R и ЕН 1992." },
      { title: "Мониторинг и прогноз", desc: "Отслеживайте рост во времени, прогнозируйте критическое состояние и формируйте отчёт." },
    ],
    faqTitle: "Частые вопросы", toolsTitle: "Связанные инструменты", open: "Открыть",
    heroBadge: "ГОСТ 31937 · ACI 224R · ЕН 1992",
    heroDesc: "Оценка и классификация трещин по ГОСТ 31937-2011, ACI 224R-01 и ЕН 1992-1-1. Сравнение по нормативам, мониторинг роста и PDF-отчёты обследования.",
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
  const [activeStd, setActiveStd] = useState<"gost" | "aci" | "en">("gost");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionForm, setSessionForm] = useState({ name: "", objectName: "", inspectorName: "" });
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [measureForm, setMeasureForm] = useState({ width: "", length: "", depth: "", note: "" });
  const [useTrend, setUseTrend] = useState(false);
  const [trend, setTrend] = useState({ yearlyMm: 0, yearlyPct: 0, r2: 0 });
  const [embed, setEmbed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lang") as "en" | "ru" | null;
    if (saved) setLang(saved);
    const savedSessions = localStorage.getItem("crackcalc_sessions");
    if (savedSessions) setSessions(JSON.parse(savedSessions));
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const w = sp.get("width");
      const l = sp.get("length");
      const d = sp.get("depth");
      if (w) setWidth(w);
      if (l) setLength(l);
      if (d) setDepth(d);
      setEmbed(sp.get("embed") === "1");
    }
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
    const cats = standards[activeStd].categories;
    const cat = cats.find((c) => w <= c.max) || cats[3];
    const useSessionTrend = useTrend && trend.yearlyMm > 0;
    const growthPerYear = useSessionTrend ? trend.yearlyMm : w * 0.15;
    const yearsToCritical = Math.max(0, (0.3 - w) / growthPerYear);
    const area = parseFloat(lengthV) * w / 1000;
    const d = parseFloat(depth) || 0;
    const volume = area * d / 10;
    const allStdResults = (Object.keys(standards) as ("gost" | "aci" | "en")[]).map((key) => {
      const c = standards[key].categories.find((cc) => w <= cc.max) || standards[key].categories[3];
      return { key, name: lang === "en" ? standards[key].name : standards[key].nameRu, cat: c.label[lang], color: c.color, icon: c.icon, monitor: c.monitor[lang] };
    });
    setResult({ ...cat, width: w, length: parseFloat(lengthV) || 0, depth: d, growthPerYear, yearsToCritical, area, volume, allStdResults, useSessionTrend, trendR2: trend.r2 });
  };

  const saveSession = () => {
    if (!sessionForm.name.trim()) return;
    const s: Session = { id: `s_${Date.now()}`, name: sessionForm.name, objectName: sessionForm.objectName, inspectorName: sessionForm.inspectorName, createdAt: new Date().toISOString(), measurements: currentSession?.measurements ?? [] };
    const updated = [s, ...sessions.filter((x) => x.id !== s.id)];
    setSessions(updated);
    localStorage.setItem("crackcalc_sessions", JSON.stringify(updated));
    setCurrentSession(s);
    setShowSessionForm(false);
    setSessionForm({ name: "", objectName: "", inspectorName: "" });
  };

  const loadSession = (s: Session) => { setCurrentSession(s); setSessionForm({ name: s.name, objectName: s.objectName, inspectorName: s.inspectorName }); };

  const deleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    localStorage.setItem("crackcalc_sessions", JSON.stringify(updated));
    if (currentSession?.id === id) setCurrentSession(null);
  };

  const addMeasurement = () => {
    if (!currentSession || !measureForm.width) return;
    const m: Measurement = { id: `m_${Date.now()}`, date: new Date().toISOString(), width: parseFloat(measureForm.width), length: parseFloat(measureForm.length) || 0, depth: parseFloat(measureForm.depth) || 0, note: measureForm.note };
    const updated = { ...currentSession, measurements: [...currentSession.measurements, m] };
    setCurrentSession(updated);
    setSessions((prev) => { const next = prev.map((s) => (s.id === updated.id ? updated : s)); localStorage.setItem("crackcalc_sessions", JSON.stringify(next)); return next; });
    setMeasureForm({ width: "", length: "", depth: "", note: "" });
  };

  const deleteMeasurement = (mid: string) => {
    if (!currentSession) return;
    const updated = { ...currentSession, measurements: currentSession.measurements.filter((m) => m.id !== mid) };
    setCurrentSession(updated);
    setSessions((prev) => { const next = prev.map((s) => (s.id === updated.id ? updated : s)); localStorage.setItem("crackcalc_sessions", JSON.stringify(next)); return next; });
  };

  const computeTrend = (measurements: Measurement[]) => {
    if (measurements.length < 2) return { yearlyMm: 0, yearlyPct: 0, r2: 0 };
    const sorted = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const daysBetween = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24);
    const x = sorted.map((m, i) => daysBetween(sorted[0].date, m.date));
    const y = sorted.map(m => m.width);
    const n = sorted.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    const denom = n * sumXX - sumX * sumX;
    if (denom === 0) return { yearlyMm: 0, yearlyPct: 0, r2: 0 };
    const daily = (n * sumXY - sumX * sumY) / denom;
    const yearlyMm = daily * 365;
    const yearlyPct = y[0] ? (yearlyMm / y[0]) * 100 : 0;
    const intercept = (sumY - daily * sumX) / n;
    const yMean = sumY / n;
    const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
    const ssRes = y.reduce((acc, yi, i) => acc + Math.pow(yi - (daily * x[i] + intercept), 2), 0);
    const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
    return { yearlyMm, yearlyPct, r2 };
  };

  useEffect(() => {
    if (currentSession && currentSession.measurements.length >= 2) {
      setTrend(computeTrend(currentSession.measurements));
    } else {
      setTrend({ yearlyMm: 0, yearlyPct: 0, r2: 0 });
    }
  }, [currentSession]);

  return (
    <div className="min-h-screen">
      {!embed && (
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass py-3" : "py-5 bg-transparent"}`}>
        <div className="container-max flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center font-display font-bold text-on-primary text-lg group-hover:scale-105 transition-transform">E</div>
            <span className="font-display font-bold text-xl text-on-surface">Eng<span className="gradient-text">AI</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#calculator" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">{t.calculator}</a>
            <a href="#monitoring" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">{t.monitoring}</a>
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
            <a href="#monitoring" onClick={() => setMobileOpen(false)} className="text-on-surface-variant hover:text-primary">{t.monitoring}</a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="text-on-surface-variant hover:text-primary">{t.howItWorks}</a>
            <a href="#faq" onClick={() => setMobileOpen(false)} className="text-on-surface-variant hover:text-primary">{t.faq}</a>
            <a href="#tools" onClick={() => setMobileOpen(false)} className="text-on-surface-variant hover:text-primary">{t.tools}</a>
            <button onClick={() => { setLang(lang === "en" ? "ru" : "en"); setMobileOpen(false); }} className="flex items-center gap-1.5 text-on-surface-variant">
              <Globe className="w-4 h-4" /> {lang === "en" ? "Русский" : "English"}
            </button>
          </div>
        )}
      </header>
      )}

      {!embed && (
      <section className="relative pt-40 pb-16 grid-bg overflow-hidden">
        <div className="container-max text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-6 animate-fade-in">
            <Ruler className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-on-surface-variant">{t.heroBadge}</span>
          </div>
          <div className="inline-flex items-center gap-3 mb-4 animate-slide-up">
            <div className="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center">
              <Ruler className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-on-surface">CrackCalc</h1>
          </div>
          <p className="text-on-surface-variant text-lg max-w-2xl mx-auto animate-slide-up">{t.heroDesc}</p>
        </div>
      </section>
      )}

      <section id="calculator" className={embed ? "py-4" : "py-16"}>
        <div className="container-max max-w-4xl">
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {(Object.keys(standards) as ("gost" | "aci" | "en")[]).map((key) => (
              <button key={key} onClick={() => setActiveStd(key)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeStd === key ? "bg-primary text-on-primary" : "glass text-on-surface-variant hover:text-primary"}`}>
                {lang === "en" ? standards[key].name : standards[key].nameRu}
              </button>
            ))}
          </div>

          <div className="glass rounded-2xl p-6 md:p-8 space-y-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-on-surface-variant mb-2 block">{t.width}</label>
                <input value={width} onChange={(e) => setWidth(e.target.value)} placeholder="0.15" type="number" step="0.01" className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="text-sm text-on-surface-variant mb-2 block">{t.length}</label>
                <input value={lengthV} onChange={(e) => setLength(e.target.value)} placeholder="120" type="number" className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="text-sm text-on-surface-variant mb-2 block">{t.depth}</label>
                <input value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="10" type="number" className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none transition-colors" />
              </div>
            </div>
            {currentSession && trend.yearlyMm > 0 && (
              <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
                <input type="checkbox" checked={useTrend} onChange={(e) => setUseTrend(e.target.checked)} className="w-4 h-4 accent-primary rounded" />
                <span>{t.useTrend} (R² {trend.r2.toFixed(2)})</span>
              </label>
            )}
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
                    <p className="text-sm text-on-surface-variant">{t.width}: {result.width} mm · {t.length}: {result.length} mm · {t.depth}: {result.depth || "—"}</p>
                  </div>
                </div>
                <p className="text-on-surface-variant mb-4">{result.desc[lang]}</p>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="glass rounded-xl p-3">
                    <div className="flex items-center gap-2 text-on-surface-variant mb-1"><TrendingUp className="w-3 h-3" /> {t.growthYear}</div>
                    <p className="text-on-surface font-semibold text-lg">{result.growthPerYear.toFixed(3)} mm</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <div className="flex items-center gap-2 text-on-surface-variant mb-1"><AlertTriangle className="w-3 h-3" /> {t.toCritical}</div>
                    <p className="text-on-surface font-semibold text-lg">{result.yearsToCritical.toFixed(1)} {lang === "en" ? "years" : "лет"}</p>
                  </div>
                  {result.area > 0 && (
                    <div className="glass rounded-xl p-3">
                      <p className="text-on-surface-variant mb-1">{t.openingArea}</p>
                      <p className="text-on-surface font-semibold">{result.area.toFixed(2)} cm²</p>
                    </div>
                  )}
                  {result.volume > 0 && (
                    <div className="glass rounded-xl p-3">
                      <p className="text-on-surface-variant mb-1">{t.repairVolume}</p>
                      <p className="text-on-surface font-semibold">{result.volume.toFixed(2)} cm³</p>
                    </div>
                  )}
                </div>

                {result.allStdResults && (
                  <div className="glass rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 text-on-surface-variant mb-3"><BarChart3 className="w-3 h-3" /> {t.multiStandard}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {result.allStdResults.map((sr: any) => (
                        <div key={sr.key} className="rounded-lg bg-surface-container-lowest/50 p-3 border border-outline-variant/10">
                          <p className="text-xs text-on-surface-variant mb-1">{sr.name}</p>
                          <p className={`text-sm font-bold ${sr.color}`}>{sr.icon} {sr.cat}</p>
                          <p className="text-xs text-on-surface-variant mt-1">{t.monitoringSchedule}: {sr.monitor}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="glass rounded-xl p-3">
                  <div className="flex items-center gap-2 text-on-surface-variant mb-2"><FileText className="w-3 h-3" /> {t.normativeBase}</div>
                  {gostRefs.map((r, i) => <p key={i} className="text-xs text-on-surface-variant mb-1">• {r[lang]}</p>)}
                </div>
              </div>
              {!embed && (
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="/dashboard/tools/concretemix" target="_blank" rel="noopener noreferrer" className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                  {t.repairMix} <ArrowRight className="w-4 h-4" />
                </a>
                <a href="/dashboard" target="_blank" rel="noopener noreferrer" className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm">
                  {t.uploadPhoto} <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Monitoring Section */}
      {!embed && (
      <section id="monitoring" className="py-16 grid-bg">
        <div className="container-max max-w-4xl">
          <h2 className="font-display text-3xl font-bold text-on-surface text-center mb-3">{t.monitoring}</h2>
          <p className="text-on-surface-variant text-center mb-10 text-sm">{t.monitoringSchedule}</p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-on-surface text-lg flex items-center gap-2"><FolderOpen className="w-5 h-5 text-primary" /> {t.sessionInfo}</h3>
                  <button onClick={() => setShowSessionForm(!showSessionForm)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> {t.newSession}
                  </button>
                </div>

                {showSessionForm && (
                  <div className="space-y-3 mb-4 animate-fade-in">
                    <input value={sessionForm.name} onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })} placeholder={t.sessionName} className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none text-sm" />
                    <input value={sessionForm.objectName} onChange={(e) => setSessionForm({ ...sessionForm, objectName: e.target.value })} placeholder={t.objectName} className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none text-sm" />
                    <input value={sessionForm.inspectorName} onChange={(e) => setSessionForm({ ...sessionForm, inspectorName: e.target.value })} placeholder={t.inspectorName} className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none text-sm" />
                    <button onClick={saveSession} className="btn-primary w-full text-sm flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {t.saveSession}</button>
                  </div>
                )}

                {sessions.length === 0 && !showSessionForm && (
                  <p className="text-sm text-on-surface-variant text-center py-6">{t.noSessions}</p>
                )}

                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div key={s.id} className={`glass rounded-xl p-3 flex items-center justify-between transition-all ${currentSession?.id === s.id ? "border-primary/40" : ""}`}>
                      <button onClick={() => loadSession(s)} className="flex-1 text-left">
                        <p className="text-sm text-on-surface font-medium">{s.name}</p>
                        <p className="text-xs text-on-surface-variant">{s.objectName || "—"} · {s.measurements.length} {t.measurements.toLowerCase()}</p>
                      </button>
                      <button onClick={() => deleteSession(s.id)} className="text-on-surface-variant hover:text-red-400 transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {currentSession && (
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-display font-bold text-on-surface text-lg mb-4 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" /> {t.addMeasurement}</h3>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <input value={measureForm.width} onChange={(e) => setMeasureForm({ ...measureForm, width: e.target.value })} placeholder={t.width} type="number" step="0.01" className="px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none text-sm" />
                    <input value={measureForm.length} onChange={(e) => setMeasureForm({ ...measureForm, length: e.target.value })} placeholder={t.length} type="number" className="px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none text-sm" />
                    <input value={measureForm.depth} onChange={(e) => setMeasureForm({ ...measureForm, depth: e.target.value })} placeholder={t.depth} type="number" className="px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none text-sm" />
                  </div>
                  <input value={measureForm.note} onChange={(e) => setMeasureForm({ ...measureForm, note: e.target.value })} placeholder={t.note} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none text-sm mb-3" />
                  <button onClick={addMeasurement} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> {t.addMeasurement}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {currentSession && currentSession.measurements.length > 0 && (
                <>
                  <GrowthChart measurements={currentSession.measurements} lang={lang} />
                  <div className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-bold text-on-surface text-lg flex items-center gap-2"><History className="w-5 h-5 text-primary" /> {t.measurements}</h3>
                      <button onClick={() => window.print()} className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1">
                        <Download className="w-3 h-3" /> {t.exportPDF}
                      </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {currentSession.measurements.map((m) => (
                        <div key={m.id} className="glass rounded-lg p-3 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-on-surface font-medium">{m.width.toFixed(2)}mm</span>
                              <span className="text-on-surface-variant text-xs">{new Date(m.date).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU")}</span>
                            </div>
                            {m.note && <p className="text-xs text-on-surface-variant mt-1">{m.note}</p>}
                          </div>
                          <button onClick={() => deleteMeasurement(m.id)} className="text-on-surface-variant hover:text-red-400 transition-colors p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {!currentSession && (
                <div className="glass rounded-2xl p-12 text-center">
                  <Calendar className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
                  <p className="text-sm text-on-surface-variant">{t.noSessions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      )}

      {!embed && (
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
      )}

      {!embed && (
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
      )}

      {!embed && (
      <section id="tools" className="py-20 grid-bg">
        <div className="container-max max-w-4xl">
          <h2 className="font-display text-3xl font-bold text-on-surface text-center mb-12">{t.toolsTitle}</h2>
          <div className="grid md:grid-cols-4 gap-6">
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
      )}

      {!embed && (
      <footer className="py-12 border-t border-outline-variant/10">
        <div className="container-max max-w-4xl text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center font-display font-bold text-on-surface">E</div>
            <span className="font-display font-bold text-on-surface">Eng<span className="gradient-text">AI</span></span>
          </div>
          <p className="text-sm text-on-surface-variant mb-4">{t.footerDesc}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-on-surface-variant">
            <span>GOST 31937-2011</span>
            <span>·</span>
            <span>ACI 224R-01</span>
            <span>·</span>
            <span>EN 1992-1-1</span>
            <span>·</span>
            <a href="/dashboard" className="hover:text-primary transition-colors">EngAI Hub</a>
            <span>·</span>
            <a href="/dashboard" className="hover:text-primary transition-colors">InspectAI</a>
            <span>·</span>
            <span>© 2025 EngAI</span>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}
