"use client";

import { useState, useRef, useEffect } from "react";
import { Ruler, Plus, Minus, ChevronDown, Menu, X, ArrowRight, Grid3x3, Globe, Save, Trash2, Download, Link2, Layers } from "lucide-react";
import Link from "next/link";

const barAreas: Record<number, number> = { 8: 50.3, 10: 78.5, 12: 113.1, 14: 153.9, 16: 201.1, 18: 254.5, 20: 314.2, 22: 380.1, 25: 490.9, 28: 615.8, 32: 804.2 };

type SectionType = "rectangular" | "tbeam" | "circular";

interface SavedDesign {
  id: string;
  name: string;
  sectionType: SectionType;
  b: number;
  h: number;
  bars: { d: number; x: number; y: number }[];
  stirrupD: number;
  stirrupSpacing: number;
  concreteClass: string;
  rebarClass: string;
  date: string;
}

const concreteProps: Record<string, { Rb: number; Rbt: number }> = {
  "B15": { Rb: 8.5, Rbt: 0.75 },
  "B20": { Rb: 11.5, Rbt: 0.9 },
  "B25": { Rb: 14.5, Rbt: 1.05 },
  "B30": { Rb: 17, Rbt: 1.15 },
  "B35": { Rb: 19.5, Rbt: 1.3 },
  "B40": { Rb: 22, Rbt: 1.4 },
};

const rebarProps: Record<string, { Rs: number; Es: number }> = {
  "A240": { Rs: 215, Es: 200000 },
  "A400": { Rs: 350, Es: 200000 },
  "A500": { Rs: 435, Es: 200000 },
  "A600": { Rs: 520, Es: 200000 },
};

const faqItems = [
  { q: { en: "What reinforcement percentage is considered normal?", ru: "Какой процент армирования считается нормой?" }, a: { en: "For flexural elements, minimum reinforcement is 0.1%, optimal is 1–3%. Above 5% is over-reinforced — section enlargement is needed.", ru: "Для изгибаемых элементов минимальный процент армирования 0.1%, оптимальный 1–3%. Свыше 5% — переармирование, требуется увеличение сечения." } },
  { q: { en: "How to choose bar diameter?", ru: "Как выбрать диаметр стержней?" }, a: { en: "For longitudinal reinforcement, bars Ø12–25 mm are typically used. For stirrups and transverse reinforcement — Ø6–12 mm. Diameter depends on loads and rebar class.", ru: "Для продольной арматуры обычно используются стержни Ø12–25 мм. Для хомутов и поперечной арматуры — Ø6–12 мм. Диаметр зависит от нагрузок и класса арматуры." } },
  { q: { en: "Can I move bars around?", ru: "Можно ли перемещать стержни?" }, a: { en: "Yes, bars can be added, removed and their diameter changed. Position is displayed on the visual section diagram in real time.", ru: "Да, стержни можно добавлять, удалять и изменять их диаметр. Положение отображается на визуальной схеме сечения в реальном времени." } },
  { q: { en: "How is reinforcement area calculated?", ru: "Как рассчитывается площадь арматуры?" }, a: { en: "Each bar's area is taken from the GOST 5781-82 table. Total area is summed, reinforcement percentage = (ΣAs / (b×h)) × 100.", ru: "Площадь каждого стержня берётся из таблицы ГОСТ 5781-82. Общая площадь суммируется, процент армирования = (ΣAs / (b×h)) × 100." } },
  { q: { en: "How is anchorage length calculated?", ru: "Как рассчитывается длина анкеровки?" }, a: { en: "Anchorage length lan = (Rs / Rb) × ds × α, where Rs is rebar design strength, Rb is concrete design strength, ds is bar diameter, α is coefficient (0.7-1.0).", ru: "Длина анкеровки lan = (Rs / Rb) × ds × α, где Rs — расчётное сопротивление арматуры, Rb — расчётное сопротивление бетона, ds — диаметр стержня, α — коэффициент (0.7-1.0)." } },
];

const relatedTools = [
  { name: "LoadBear", desc: { en: "Load-bearing capacity calculator", ru: "Расчёт несущей способности" }, href: "/dashboard/tools/loadbear", icon: "🏗️" },
  { name: "ConcreteMix", desc: { en: "Concrete mix design", ru: "Подбор состава бетона" }, href: "/dashboard/tools/concretemix", icon: "🧪" },
  { name: "CrackCalc", desc: { en: "Crack assessment by GOST", ru: "Оценка трещин по ГОСТ" }, href: "/dashboard/tools/crackcalc", icon: "📏" },
  { name: "NormBase", desc: { en: "Normative documents reference", ru: "Справочник нормативов" }, href: "/dashboard/tools/normbase", icon: "📚" },
  { name: "InspectAI", desc: { en: "AI structural inspection", ru: "AI-обследование конструкций" }, href: "/dashboard", icon: "🔍" },
];

const tr = {
  en: {
    designer: "Designer", howItWorks: "How it works", faq: "FAQ", tools: "Tools", design: "Design", saved: "Saved",
    sectionScheme: "Section scheme", sectionParams: "Section parameters", widthB: "Width b (mm)", heightH: "Height h (mm)",
    sectionType: "Section type", rectangular: "Rectangular", tbeam: "T-beam", circular: "Circular",
    flangeWidth: "Flange width (mm)", flangeHeight: "Flange height (mm)", diameter: "Diameter (mm)",
    reinforcement: "Reinforcement", bars: "bars", add: "Add", remove: "Remove",
    rebarArea: "Reinforcement area", rebarPercent: "Reinforcement %", requiredArea: "Required area", momentCapacity: "Moment capacity", designMoment: "Design moment M (kN·m)",
    stirrups: "Stirrups", stirrupDiameter: "Stirrup diameter", stirrupSpacing: "Spacing (mm)",
    anchorage: "Anchorage length", anchorageLength: "Required anchorage length",
    materials: "Materials", concreteClass: "Concrete class", rebarClass: "Rebar class",
    saveDesign: "Save design", savedDesigns: "Saved designs", noSaved: "No saved designs yet", designName: "Design name",
    exportSVG: "Export SVG", exportPDF: "Export PDF",
    steps: [
      { title: "Configure section", desc: "Set the section type, width and height using sliders. The diagram updates in real time." },
      { title: "Place reinforcement", desc: "Add bars of the required diameter (Ø8–Ø32). Select an active bar to edit it. Configure stirrups." },
      { title: "Control reinforcement", desc: "The system automatically calculates reinforcement area, percentage, anchorage length with color-coded status." },
    ],
    faqTitle: "Frequently Asked Questions", toolsTitle: "Related Tools", open: "Open",
    heroBadge: "GOST 5781-82 · SP 63.13330",
    heroDesc: "Visual reinforcement designer for RC sections. Multiple section types, stirrups, anchorage length, SVG export, and save/load functionality.",
    footerDesc: "AI-powered structural inspection of building structures",
  },
  ru: {
    designer: "Конструктор", howItWorks: "Как работает", faq: "FAQ", tools: "Инструменты", design: "Конструировать", saved: "История",
    sectionScheme: "Схема сечения", sectionParams: "Параметры сечения", widthB: "Ширина b (мм)", heightH: "Высота h (мм)",
    sectionType: "Тип сечения", rectangular: "Прямоугольное", tbeam: "Тавровое", circular: "Круглое",
    flangeWidth: "Ширина полки (мм)", flangeHeight: "Высота полки (мм)", diameter: "Диаметр (мм)",
    reinforcement: "Арматура", bars: "стержней", add: "Добавить", remove: "Удалить",
    rebarArea: "Площадь арматуры", rebarPercent: "% армирования", requiredArea: "Требуемая площадь", momentCapacity: "Несущий момент", designMoment: "Расчётный момент M (кН·м)",
    stirrups: "Хомуты", stirrupDiameter: "Диаметр хомута", stirrupSpacing: "Шаг (мм)",
    anchorage: "Анкеровка", anchorageLength: "Требуемая длина анкеровки",
    materials: "Материалы", concreteClass: "Класс бетона", rebarClass: "Класс арматуры",
    saveDesign: "Сохранить", savedDesigns: "Сохранённые designs", noSaved: "Нет сохранённых designs", designName: "Название",
    exportSVG: "Экспорт SVG", exportPDF: "Экспорт PDF",
    steps: [
      { title: "Настройка сечения", desc: "Задайте тип сечения, ширину и высоту с помощью ползунков. Схема обновляется в реальном времени." },
      { title: "Размещение арматуры", desc: "Добавляйте стержни нужного диаметра (Ø8–Ø32). Выбирайте активный стержень для редактирования. Настройте хомуты." },
      { title: "Контроль армирования", desc: "Система автоматически рассчитывает площадь арматуры, процент, длину анкеровки с цветовой индикацией нормы." },
    ],
    faqTitle: "Частые вопросы", toolsTitle: "Связанные инструменты", open: "Открыть",
    heroBadge: "ГОСТ 5781-82 · СП 63.13330",
    heroDesc: "Визуальный конструктор армирования ЖБ сечений. Несколько типов сечений, хомуты, длина анкеровки, экспорт SVG и сохранение.",
    footerDesc: "Инженерное обследование строительных конструкций с применением AI",
  },
};

export default function Page() {
  const [lang, setLang] = useState<"en" | "ru">("en");
  const [sectionType, setSectionType] = useState<SectionType>("rectangular");
  const [b, setB] = useState(300);
  const [h, setH] = useState(500);
  const [bf, setBf] = useState(600);
  const [hf, setHf] = useState(80);
  const [diameter, setDiameter] = useState(400);
  const [bars, setBars] = useState<{ d: number; x: number; y: number }[]>([{ d: 16, x: 50, y: 50 }]);
  const [selected, setSelected] = useState(0);
  const [stirrupD, setStirrupD] = useState(8);
  const [stirrupSpacing, setStirrupSpacing] = useState(200);
  const [concreteClass, setConcreteClass] = useState("B25");
  const [rebarClass, setRebarClass] = useState("A400");
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [designName, setDesignName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [designMoment, setDesignMoment] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const totalArea = bars.reduce((sum: number, bar: { d: number; x: number; y: number }) => sum + barAreas[bar.d], 0);
  const sectionArea = sectionType === "circular" ? Math.PI * diameter * diameter / 4 : sectionType === "tbeam" ? b * h + (bf - b) * hf : b * h;
  const percent = (totalArea / sectionArea) * 100;
  const t = tr[lang];

  const cover = 50;
  const h0 = sectionType === "circular" ? diameter / 2 - cover : h - cover;
  const b_eff = sectionType === "tbeam" ? bf : (sectionType === "circular" ? diameter : b);
  const Rs = rebarProps[rebarClass]?.Rs ?? 350;
  const Rb = concreteProps[concreteClass]?.Rb ?? 14.5;
  const xiR = 0.531;
  const requiredAs = (() => {
    const M = parseFloat(designMoment) || 0;
    if (M <= 0 || h0 <= 0 || b_eff <= 0) return 0;
    // Iterative solve: M = Rs * As * (h0 - 0.5*x), x = Rs*As/(Rb*b_eff)
    let As = M * 1e6 / (Rs * 0.9 * h0);
    for (let i = 0; i < 5; i++) {
      const x = (Rs * As) / (Rb * b_eff);
      const z = h0 - 0.5 * x;
      As = (M * 1e6) / (Rs * Math.max(z, 0.1 * h0));
    }
    return Math.max(0, As);
  })();
  const momentCap = (() => {
    if (h0 <= 0 || b_eff <= 0) return 0;
    const xi = (Rs * totalArea) / (Rb * b_eff * h0);
    const xi_eff = Math.min(xi, xiR);
    const M = Rb * b_eff * h0 * h0 * xi_eff * (1 - 0.5 * xi_eff) / 1e6;
    return M;
  })();

  const anchorageLen = (() => {
    const Rb = concreteProps[concreteClass]?.Rb ?? 14.5;
    const Rs = rebarProps[rebarClass]?.Rs ?? 350;
    const ds = bars[selected]?.d ?? 16;
    const alpha = 0.9;
    return Math.round((Rs / Rb) * ds * alpha);
  })();

  useEffect(() => {
    const saved = localStorage.getItem("lang") as "en" | "ru" | null;
    if (saved) setLang(saved);
    const savedDesignsRaw = localStorage.getItem("rebardesign_saved");
    if (savedDesignsRaw) setSavedDesigns(JSON.parse(savedDesignsRaw));
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

    if (sectionType === "circular") {
      const scale = 300 / diameter;
      canvas.width = diameter * scale + 40;
      canvas.height = diameter * scale + 40;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.arc(20 + diameter * scale / 2, 20 + diameter * scale / 2, diameter * scale / 2, 0, Math.PI * 2);
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(14, 165, 233, 0.03)";
      ctx.fill();
    } else if (sectionType === "tbeam") {
      const maxW = Math.max(bf, b);
      const scale = Math.min(300 / maxW, 300 / h);
      canvas.width = maxW * scale + 40;
      canvas.height = h * scale + 40;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const offsetX = 20 + (maxW - b) * scale / 2;
      const offsetBF = 20 + (maxW - bf) * scale / 2;
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.strokeRect(offsetBF, 20, bf * scale, hf * scale);
      ctx.fillStyle = "rgba(14, 165, 233, 0.03)";
      ctx.fillRect(offsetBF, 20, bf * scale, hf * scale);
      ctx.strokeRect(offsetX, 20 + hf * scale, b * scale, (h - hf) * scale);
      ctx.fillRect(offsetX, 20 + hf * scale, b * scale, (h - hf) * scale);
    } else {
      const scale = Math.min(300 / b, 300 / h);
      canvas.width = b * scale + 40;
      canvas.height = h * scale + 40;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, b * scale, h * scale);
      ctx.fillStyle = "rgba(14, 165, 233, 0.03)";
      ctx.fillRect(20, 20, b * scale, h * scale);
    }

    bars.forEach((bar: { d: number; x: number; y: number }, i: number) => {
      let bx = bar.x, by = bar.y;
      if (sectionType === "circular") { bx = diameter / 2; by = diameter / 2; }
      const scale = sectionType === "circular" ? 300 / diameter : Math.min(300 / b, 300 / h);
      ctx.beginPath();
      ctx.arc(20 + bx * scale, 20 + by * scale, Math.max((bar.d / 2) * scale, 3), 0, Math.PI * 2);
      ctx.fillStyle = i === selected ? "#004349" : "#f59e0b";
      ctx.fill();
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, [b, h, bf, hf, diameter, bars, selected, sectionType]);

  const addBar = () => {
    if (sectionType === "circular") {
      setBars([...bars, { d: 16, x: diameter / 2, y: diameter / 2 }]);
    } else {
      setBars([...bars, { d: 16, x: b / 2, y: h / 2 }]);
    }
  };
  const removeBar = () => bars.length > 1 && setBars(bars.slice(0, -1));

  const saveDesign = () => {
    if (!designName.trim()) return;
    const design: SavedDesign = {
      id: Date.now().toString(),
      name: designName,
      sectionType, b, h, bars, stirrupD, stirrupSpacing, concreteClass, rebarClass,
      date: new Date().toISOString(),
    };
    const updated = [design, ...savedDesigns];
    setSavedDesigns(updated);
    localStorage.setItem("rebardesign_saved", JSON.stringify(updated));
    setDesignName("");
    setShowSaveForm(false);
  };

  const loadDesign = (d: SavedDesign) => {
    setSectionType(d.sectionType);
    setB(d.b); setH(d.h);
    setBars(d.bars);
    setStirrupD(d.stirrupD); setStirrupSpacing(d.stirrupSpacing);
    setConcreteClass(d.concreteClass); setRebarClass(d.rebarClass);
    setSelected(0);
  };

  const deleteDesign = (id: string) => {
    const updated = savedDesigns.filter((d: SavedDesign) => d.id !== id);
    setSavedDesigns(updated);
    localStorage.setItem("rebardesign_saved", JSON.stringify(updated));
  };

  const exportSVG = () => {
    const w = sectionType === "circular" ? diameter : b;
    const ht = h;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w + 40}" height="${ht + 40}" viewBox="0 0 ${w + 40} ${ht + 40}">`;
    svg += `<rect x="20" y="20" width="${w}" height="${ht}" fill="rgba(14,165,233,0.03)" stroke="#334155" stroke-width="2"/>`;
    bars.forEach((bar: { d: number; x: number; y: number }) => {
      svg += `<circle cx="${20 + bar.x}" cy="${20 + bar.y}" r="${bar.d / 2}" fill="#f59e0b" stroke="#1e293b" stroke-width="1.5"/>`;
    });
    svg += `</svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `rebar_design_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCanvasScale = () => {
    if (sectionType === "circular") return 300 / diameter;
    const maxW = sectionType === "tbeam" ? Math.max(bf, b) : b;
    return Math.min(300 / maxW, 300 / h);
  };

  const getMouseSectionPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const scale = getCanvasScale();
    return { x: (mx - 20) / scale, y: (my - 20) / scale };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMouseSectionPos(e);
    if (!pos) return;
    let found = -1;
    bars.forEach((bar, i) => {
      const dx = pos.x - bar.x;
      const dy = pos.y - bar.y;
      if (Math.sqrt(dx * dx + dy * dy) <= bar.d / 2 + 4) found = i;
    });
    if (found >= 0) {
      setSelected(found);
      setDragIndex(found);
      setIsDragging(true);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || dragIndex === null) return;
    const pos = getMouseSectionPos(e);
    if (!pos) return;
    const newBars = [...bars];
    const bar = newBars[dragIndex];
    const c = cover + bar.d / 2;
    if (sectionType === "circular") {
      const cx = diameter / 2, cy = diameter / 2;
      const maxR = Math.max(0, diameter / 2 - cover - bar.d / 2);
      let dx = pos.x - cx, dy = pos.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxR && dist > 0) { dx = dx / dist * maxR; dy = dy / dist * maxR; }
      newBars[dragIndex] = { ...bar, x: cx + dx, y: cy + dy };
    } else {
      const maxW = sectionType === "tbeam" ? Math.min(b, bf) : b;
      const maxX = Math.max(c, (sectionType === "tbeam" ? Math.min(b, bf) : b) - c);
      const clampX = (v: number) => Math.max(c, Math.min(maxX, v));
      const clampY = (v: number) => Math.max(c, Math.min(h - c, v));
      newBars[dragIndex] = { ...bar, x: clampX(pos.x), y: clampY(pos.y) };
    }
    setBars(newBars);
  };

  const handleCanvasMouseUp = () => { setIsDragging(false); setDragIndex(null); };

  return (
    <div className="min-h-screen">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass py-3" : "py-5 bg-transparent"}`}>
        <div className="container-max flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center font-display font-bold text-on-primary text-lg group-hover:scale-105 transition-transform">E</div>
            <span className="font-display font-bold text-xl text-on-surface">Eng<span className="gradient-text">AI</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#designer" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">{t.designer}</a>
            <a href="#saved" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">{t.saved}</a>
            <a href="#how-it-works" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">{t.howItWorks}</a>
            <a href="#faq" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">{t.faq}</a>
            <a href="#tools" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">{t.tools}</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => setLang(lang === "en" ? "ru" : "en")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:border-primary/40 hover:text-primary transition-all text-sm">
              <Globe className="w-3.5 h-3.5" /> {lang === "en" ? "RU" : "EN"}
            </button>
            <a href="#designer" className="btn-primary text-sm">{t.design}</a>
          </div>
          <button className="md:hidden text-on-surface-variant p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden glass mt-3 mx-4 rounded-xl p-6 flex flex-col gap-4">
            <a href="#designer" onClick={() => setMobileOpen(false)} className="text-on-surface-variant hover:text-primary">{t.designer}</a>
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
            <Grid3x3 className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-on-surface-variant">{t.heroBadge}</span>
          </div>
          <div className="inline-flex items-center gap-3 mb-4 animate-slide-up">
            <div className="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center">
              <Ruler className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-on-surface">RebarDesign</h1>
          </div>
          <p className="text-on-surface-variant text-lg max-w-2xl mx-auto animate-slide-up">{t.heroDesc}</p>
        </div>
      </section>

      <section id="designer" className="py-16">
        <div className="container-max max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="font-display font-bold text-on-surface mb-4 text-lg">{t.sectionScheme}</h3>
              <div className="flex items-center justify-center bg-surface-container-lowest rounded-xl p-4" style={{ minHeight: 400 }}>
                <canvas ref={canvasRef} onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} className={`max-w-full ${isDragging ? "cursor-grabbing" : "cursor-grab"}`} style={{ maxHeight: 380 }} />
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={exportSVG} className="btn-ghost flex-1 flex items-center justify-center gap-1 text-xs"><Download className="w-3.5 h-3.5" /> {t.exportSVG}</button>
                <a href="/dashboard/tools/loadbear" target="_blank" rel="noopener noreferrer" className="btn-ghost flex-1 flex items-center justify-center gap-1 text-xs"><Link2 className="w-3.5 h-3.5" /> LoadBear →</a>
              </div>
            </div>
            <div className="space-y-4">
              <div className="glass rounded-2xl p-5 space-y-3">
                <h3 className="font-display font-bold text-on-surface">{t.sectionType}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {([["rectangular", t.rectangular], ["tbeam", t.tbeam], ["circular", t.circular]] as const).map(([st, label]) => (
                    <button key={st} onClick={() => setSectionType(st)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${sectionType === st ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-outline-variant/10"}`}>{label}</button>
                  ))}
                </div>
                {sectionType === "circular" ? (
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">{t.diameter}</label>
                    <input type="range" min="200" max="800" value={diameter} onChange={(e) => setDiameter(parseInt(e.target.value))} className="w-full accent-accent" />
                    <span className="text-sm text-on-surface font-mono">{diameter}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-on-surface-variant mb-1 block">{t.widthB}</label>
                      <input type="range" min="150" max="600" value={b} onChange={(e) => setB(parseInt(e.target.value))} className="w-full accent-accent" />
                      <span className="text-sm text-on-surface font-mono">{b}</span>
                    </div>
                    <div>
                      <label className="text-xs text-on-surface-variant mb-1 block">{t.heightH}</label>
                      <input type="range" min="200" max="800" value={h} onChange={(e) => setH(parseInt(e.target.value))} className="w-full accent-accent" />
                      <span className="text-sm text-on-surface font-mono">{h}</span>
                    </div>
                    {sectionType === "tbeam" && (
                      <>
                        <div>
                          <label className="text-xs text-on-surface-variant mb-1 block">{t.flangeWidth}</label>
                          <input type="range" min="300" max="1000" value={bf} onChange={(e) => setBf(parseInt(e.target.value))} className="w-full accent-accent" />
                          <span className="text-sm text-on-surface font-mono">{bf}</span>
                        </div>
                        <div>
                          <label className="text-xs text-on-surface-variant mb-1 block">{t.flangeHeight}</label>
                          <input type="range" min="50" max="200" value={hf} onChange={(e) => setHf(parseInt(e.target.value))} className="w-full accent-accent" />
                          <span className="text-sm text-on-surface font-mono">{hf}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="glass rounded-2xl p-5 space-y-3">
                <h3 className="font-display font-bold text-on-surface">{t.materials}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">{t.concreteClass}</label>
                    <select value={concreteClass} onChange={(e) => setConcreteClass(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm rounded px-2 py-1.5 focus:border-primary focus:outline-none">
                      {Object.keys(concreteProps).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">{t.rebarClass}</label>
                    <select value={rebarClass} onChange={(e) => setRebarClass(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm rounded px-2 py-1.5 focus:border-primary focus:outline-none">
                      {Object.keys(rebarProps).map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-5 space-y-3">
                <h3 className="font-display font-bold text-on-surface">{t.reinforcement} ({bars.length} {t.bars})</h3>
                {bars.map((bar: { d: number; x: number; y: number }, i: number) => (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${i === selected ? "bg-primary-container border border-primary/30" : "border border-outline-variant/10 hover:border-outline-variant/20"}`} onClick={() => setSelected(i)}>
                    <span className="text-sm text-on-surface-variant w-6">#{i + 1}</span>
                    <select value={bar.d} onChange={(e) => { const newBars = [...bars]; newBars[i].d = parseInt(e.target.value); setBars(newBars); }} className="bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm rounded px-2 py-1 focus:border-primary focus:outline-none">
                      {Object.keys(barAreas).map((d) => <option key={d} value={d}>Ø{d}</option>)}
                    </select>
                    <span className="text-xs text-on-surface-variant">{barAreas[bar.d]} mm²</span>
                  </div>
                ))}
                <div className="flex gap-2">
                  <button onClick={addBar} className="btn-ghost flex-1 flex items-center justify-center gap-1 text-sm"><Plus className="w-4 h-4" /> {t.add}</button>
                  <button onClick={removeBar} className="btn-ghost flex-1 flex items-center justify-center gap-1 text-sm"><Minus className="w-4 h-4" /> {t.remove}</button>
                </div>
              </div>

              <div className="glass rounded-2xl p-5 space-y-3">
                <h3 className="font-display font-bold text-on-surface">{t.stirrups}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">{t.stirrupDiameter}</label>
                    <select value={stirrupD} onChange={(e) => setStirrupD(parseInt(e.target.value))} className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm rounded px-2 py-1.5 focus:border-primary focus:outline-none">
                      {[6, 8, 10, 12].map((d) => <option key={d} value={d}>Ø{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">{t.stirrupSpacing}</label>
                    <input type="range" min="50" max="400" value={stirrupSpacing} onChange={(e) => setStirrupSpacing(parseInt(e.target.value))} className="w-full accent-accent" />
                    <span className="text-sm text-on-surface font-mono">{stirrupSpacing} mm</span>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-5 space-y-3">
                <h3 className="font-display font-bold text-on-surface">{t.reinforcement}</h3>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">{t.designMoment}</label>
                  <input value={designMoment} onChange={(e) => setDesignMoment(e.target.value)} type="number" placeholder="0" className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm focus:border-primary focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass rounded-xl p-3 text-center"><p className="text-xs text-on-surface-variant mb-1">{t.requiredArea}</p><p className="text-lg font-bold text-on-surface">{requiredAs.toFixed(1)} mm²</p></div>
                  <div className="glass rounded-xl p-3 text-center"><p className="text-xs text-on-surface-variant mb-1">{t.momentCapacity}</p><p className="text-lg font-bold text-emerald-400">{momentCap.toFixed(1)} kN·m</p></div>
                </div>
                <div className="flex justify-between items-center mb-2"><span className="text-sm text-on-surface-variant">{t.rebarArea}</span><span className="text-on-surface font-bold text-lg">{totalArea.toFixed(1)} mm²</span></div>
                <div className="flex justify-between items-center mb-2"><span className="text-sm text-on-surface-variant">{t.rebarPercent}</span><span className={`font-bold text-lg ${percent > 5 ? "text-red-400" : percent > 1 ? "text-emerald-400" : "text-amber-400"}`}>{percent.toFixed(2)}%</span></div>
                <div className="w-full bg-surface-container-lowest rounded-full h-2 mb-4"><div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(percent * 10, 100)}%` }} /></div>
                <div className="flex justify-between items-center mb-2"><span className="text-sm text-on-surface-variant">{t.anchorageLength}</span><span className="text-on-surface font-bold text-lg">{anchorageLen} mm</span></div>
                <div className="text-xs text-on-surface-variant mb-4">lan = (Rs/Rb) × ds × α = ({rebarProps[rebarClass]?.Rs}/{concreteProps[concreteClass]?.Rb}) × {bars[selected]?.d ?? 16} × 0.9</div>
                {showSaveForm ? (
                  <div className="flex gap-2 mb-2">
                    <input type="text" value={designName} onChange={(e) => setDesignName(e.target.value)} placeholder={t.designName} className="flex-1 bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm rounded px-3 py-1.5 focus:border-primary focus:outline-none" />
                    <button onClick={saveDesign} className="btn-primary text-sm px-4"><Save className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => setShowSaveForm(true)} className="btn-ghost w-full flex items-center justify-center gap-1 text-sm mb-2"><Save className="w-4 h-4" /> {t.saveDesign}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="saved" className="py-16">
        <div className="container-max max-w-5xl">
          <h2 className="font-display text-3xl font-bold text-on-surface text-center mb-8">{t.savedDesigns}</h2>
          {savedDesigns.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center text-on-surface-variant">{t.noSaved}</div>
          ) : (
            <div className="space-y-3">
              {savedDesigns.map((d: SavedDesign) => (
                <div key={d.id} className="glass rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface">{d.name}</h3>
                    <p className="text-xs text-on-surface-variant">{d.sectionType} · {d.b}×{d.h} · {d.concreteClass} · {d.rebarClass} · {d.bars.length} bars</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => loadDesign(d)} className="btn-ghost text-xs px-3 py-1.5">{t.design}</button>
                    <button onClick={() => deleteDesign(d.id)} className="text-on-surface-variant hover:text-red-400 transition-colors p-1.5"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            <span>GOST 5781-82</span>
            <span>·</span>
            <a href="/dashboard" className="hover:text-primary transition-colors">EngAI Hub</a>
            <span>·</span>
            <a href="/dashboard" className="hover:text-primary transition-colors">InspectAI</a>
            <span>·</span>
            <span>© 2025 EngAI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
