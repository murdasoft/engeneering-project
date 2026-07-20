"use client";

import { useState, useEffect } from "react";
import { BookOpen, Search, ExternalLink, FileText, Tag, ChevronDown, Menu, X, ArrowRight, Layers, Globe, Copy, Quote, Link2, CheckCircle2, X as XIcon } from "lucide-react";
import Link from "next/link";

interface NormSection {
  num: string;
  title: { en: string; ru: string };
  text: { en: string; ru: string };
}

interface Norm {
  code: string;
  title: { en: string; ru: string };
  tags: string[];
  category: { en: string; ru: string };
  year: string;
  status: { en: string; ru: string };
  sections: NormSection[];
  crossRefs: string[];
}

const norms: Norm[] = [
  {
    code: "GOST 31937-2011", year: "2011", status: { en: "Active", ru: "Действует" },
    title: { en: "Buildings and structures. Rules for inspection and monitoring of technical condition", ru: "Здания и сооружения. Правила обследования и мониторинга технического состояния" },
    tags: ["inspection", "defects", "assessment", "monitoring", "обследование", "дефекты"],
    category: { en: "Inspection", ru: "Обследование" },
    crossRefs: ["SP 13-102-2003", "GOST 27751-2014"],
    sections: [
      { num: "4.1", title: { en: "Types of inspection", ru: "Виды обследования" }, text: { en: "Inspection can be preliminary, detailed or emergency. Preliminary inspection determines the general technical condition and the need for detailed inspection.", ru: "Обследование может быть предварительным, детальным или аварийным. Предварительное обследование определяет общее техническое состояние и необходимость детального обследования." } },
      { num: "5.2", title: { en: "Defect classification", ru: "Классификация дефектов" }, text: { en: "Defects are classified by category: critical, significant, minor. Critical defects require immediate intervention.", ru: "Дефекты классифицируются по категориям: критические, значительные, малозначительные. Критические дефекты требуют немедленного вмешательства." } },
      { num: "6.3", title: { en: "Documentation requirements", ru: "Требования к документации" }, text: { en: "Inspection results must include: technical report, photo documentation, measurement data, conclusions and recommendations.", ru: "Результаты обследования должны включать: технический отчёт, фотофиксацию, данные измерений, выводы и рекомендации." } },
    ],
  },
  {
    code: "SP 63.13330.2018", year: "2018", status: { en: "Active", ru: "Действует" },
    title: { en: "Concrete and reinforced concrete structures. General provisions", ru: "Бетонные и железобетонные конструкции. Основные положения" },
    tags: ["concrete", "reinforcement", "calculation", "RCS", "бетон", "армирование"],
    category: { en: "Calculation", ru: "Расчёт" },
    crossRefs: ["GOST 27751-2014", "SP 70.13330.2012", "GOST 10180-2012"],
    sections: [
      { num: "8.1.1", title: { en: "Strength calculation method", ru: "Метод расчёта по прочности" }, text: { en: "Strength calculation is performed for the first group of limit states. The condition: internal forces ≤ bearing capacity of the section.", ru: "Расчёт по прочности выполняется по первой группе предельных состояний. Условие: внутренние усилия ≤ несущая способность сечения." } },
      { num: "8.1.3", title: { en: "Reinforcement requirements", ru: "Требования к армированию" }, text: { en: "Minimum reinforcement ratio for flexural elements: 0.05%. Maximum reinforcement ratio should not exceed ξR·100%.", ru: "Минимальный коэффициент армирования для изгибаемых элементов: 0.05%. Максимальный коэффициент армирования не должен превышать ξR·100%." } },
      { num: "8.1.4", title: { en: "Shear calculation", ru: "Расчёт на поперечную силу" }, text: { en: "Shear capacity: Q ≤ Qb + Qsw, where Qb = φb2·Rbt·b·h0²/c and Qsw = 0.75·qsw·c.", ru: "Прочность на поперечную силу: Q ≤ Qb + Qsw, где Qb = φb2·Rbt·b·h0²/c и Qsw = 0.75·qsw·c." } },
      { num: "8.1.5", title: { en: "Crack width limitation", ru: "Ограничение ширины раскрытия трещин" }, text: { en: "Allowable crack width: 0.3 mm for normal conditions, 0.2 mm for aggressive environments, 0.1 mm for high-density requirements.", ru: "Допустимая ширина раскрытия трещин: 0.3 мм для нормальных условий, 0.2 мм для агрессивных сред, 0.1 мм для требований высокой плотности." } },
    ],
  },
  {
    code: "GOST 17624-2012", year: "2012", status: { en: "Active", ru: "Действует" },
    title: { en: "Concrete. Ultrasonic method for strength determination", ru: "Бетоны. Ультразвуковой метод определения прочности" },
    tags: ["ultrasonic", "strength", "control", "non-destructive", "ультразвук"],
    category: { en: "Control", ru: "Контроль" },
    crossRefs: ["GOST 10180-2012", "GOST 22690.0-77"],
    sections: [
      { num: "5.1", title: { en: "Method principle", ru: "Принцип метода" }, text: { en: "Ultrasonic pulse velocity method: strength is determined from the dependence of ultrasonic wave propagation velocity on concrete density and structure.", ru: "Метод ультразвукового импульса: прочность определяется по зависимости скорости распространения ультразвуковых волн от плотности и структуры бетона." } },
      { num: "6.2", title: { en: "Calibration curves", ru: "Градуировочные зависимости" }, text: { en: "Calibration curves must be established for each concrete composition. Minimum 15 samples required for calibration.", ru: "Градуировочные зависимости должны устанавливаться для каждого состава бетона. Минимум 15 образцов для градуировки." } },
    ],
  },
  {
    code: "GOST 22690.0-77", year: "1977", status: { en: "Active", ru: "Действует" },
    title: { en: "Concrete. Strength determination by mechanical non-destructive methods", ru: "Бетоны. Определение прочности механическими методами неразрушающего контроля" },
    tags: ["Schmidt hammer", "strength", "non-destructive", "молоток Шмидта"],
    category: { en: "Control", ru: "Контроль" },
    crossRefs: ["GOST 17624-2012", "GOST 10180-2012"],
    sections: [
      { num: "3.1", title: { en: "Rebound method (Schmidt hammer)", ru: "Метод отскока (молоток Шмидта)" }, text: { en: "Rebound number is measured. Strength is determined from calibration curves specific to concrete type and age.", ru: "Измеряется число отскока. Прочность определяется по градуировочным кривым для типа и возраста бетона." } },
      { num: "3.2", title: { en: "Plastic deformation method", ru: "Метод пластической деформации" }, text: { en: "Strength is estimated by the diameter of the imprint left by a steel ball on the concrete surface.", ru: "Прочность оценивается по диаметру отпечатка, оставленного стальным шариком на поверхности бетона." } },
    ],
  },
  {
    code: "SP 70.13330.2012", year: "2012", status: { en: "Active", ru: "Действует" },
    title: { en: "Load-bearing and enclosing structures", ru: "Несущие и ограждающие конструкции" },
    tags: ["structures", "installation", "requirements", "конструкции", "монтаж"],
    category: { en: "Installation", ru: "Монтаж" },
    crossRefs: ["SP 63.13330.2018", "GOST 23615-79"],
    sections: [
      { num: "5.18", title: { en: "Concrete curing requirements", ru: "Требования к твердению бетона" }, text: { en: "Concrete must be cured for at least 28 days under normal conditions (20±2°C, 95% humidity). Minimum stripping strength: 70% of design strength.", ru: "Бетон должен твердеть не менее 28 суток в нормальных условиях (20±2°C, 95% влажность). Минимальная прочность при распалубке: 70% от проектной." } },
    ],
  },
  {
    code: "STO NOSTROY 2.7.64", year: "2012", status: { en: "Active", ru: "Действует" },
    title: { en: "Repair and strengthening of reinforced concrete structures", ru: "Ремонт и усиление железобетонных конструкций" },
    tags: ["repair", "strengthening", "mixes", "ремонт", "усиление"],
    category: { en: "Repair", ru: "Ремонт" },
    crossRefs: ["SP 63.13330.2018", "GOST 27006-2019", "SP 70.13330.2012"],
    sections: [
      { num: "4.2", title: { en: "Repair materials", ru: "Материалы для ремонта" }, text: { en: "Repair mortars must have compressive strength at least equal to the substrate concrete. Polymer-modified mortars are recommended for better adhesion.", ru: "Ремонтные составы должны иметь прочность на сжатие не ниже прочности бетона основания. Рекомендуются полимерцементные составы для лучшей адгезии." } },
      { num: "5.3", title: { en: "Strengthening methods", ru: "Методы усиления" }, text: { en: "Strengthening methods: section enlargement, additional reinforcement, external FRP wrapping, steel profiles, prestressing.", ru: "Методы усиления: увеличение сечения, дополнительное армирование, внешнее армирование FRP, стальные профили, преднапряжение." } },
    ],
  },
  {
    code: "SP 13-102-2003", year: "2003", status: { en: "Active", ru: "Действует" },
    title: { en: "Rules for inspection of load-bearing building structures", ru: "Правила обследования несущих строительных конструкций" },
    tags: ["inspection", "structures", "load-bearing", "обследование", "несущие"],
    category: { en: "Inspection", ru: "Обследование" },
    crossRefs: ["GOST 31937-2011", "GOST 27751-2014"],
    sections: [
      { num: "3.1", title: { en: "Inspection stages", ru: "Этапы обследования" }, text: { en: "Inspection includes: preparatory work, visual inspection, instrumental measurements, verification calculations, technical report.", ru: "Обследование включает: подготовительные работы, визуальный осмотр, инструментальные измерения, поверочные расчёты, технический отчёт." } },
    ],
  },
  {
    code: "GOST 27751-2014", year: "2014", status: { en: "Active", ru: "Действует" },
    title: { en: "Reliability of building structures and foundations", ru: "Надёжность строительных конструкций и оснований" },
    tags: ["reliability", "strength", "stability", "надёжность", "прочность"],
    category: { en: "Calculation", ru: "Расчёт" },
    crossRefs: ["SP 63.13330.2018", "SP 16.13330.2017"],
    sections: [
      { num: "2.1", title: { en: "Limit states", ru: "Предельные состояния" }, text: { en: "Two groups of limit states: Group 1 — loss of bearing capacity or stability; Group 2 — excessive deformations, cracking, vibration.", ru: "Две группы предельных состояний: Группа 1 — потеря несущей способности или устойчивости; Группа 2 — чрезмерные деформации, трещинообразование, вибрация." } },
      { num: "3.2", title: { en: "Safety factors", ru: "Коэффициенты надёжности" }, text: { en: "Safety factor for load: 1.1 (permanent), 1.2-1.4 (variable). Safety factor for material: 1.0-1.5 depending on material type.", ru: "Коэффициент надёжности по нагрузке: 1.1 (постоянные), 1.2-1.4 (временные). Коэффициент надёжности по материалу: 1.0-1.5 в зависимости от типа материала." } },
    ],
  },
  {
    code: "GOST 27006-2019", year: "2019", status: { en: "Active", ru: "Действует" },
    title: { en: "Concrete. Rules for mix design", ru: "Бетоны. Правила подбора составов" },
    tags: ["concrete", "mix", "design", "recipe", "бетон", "состав"],
    category: { en: "Materials", ru: "Материалы" },
    crossRefs: ["GOST 10180-2012", "SP 63.13330.2018"],
    sections: [
      { num: "4.1", title: { en: "Mix design principles", ru: "Принципы подбора состава" }, text: { en: "Mix design ensures required strength, workability, durability. W/C ratio is the primary factor controlling strength.", ru: "Подбор состава обеспечивает требуемую прочность, удобоукладываемость, долговечность. В/Ц отношение — основной фактор, контролирующий прочность." } },
    ],
  },
  {
    code: "SP 14.13330.2014", year: "2014", status: { en: "Active", ru: "Действует" },
    title: { en: "Construction in seismic regions", ru: "Строительство в сейсмических районах" },
    tags: ["seismic", "calculation", "strengthening", "сейсмичность"],
    category: { en: "Calculation", ru: "Расчёт" },
    crossRefs: ["SP 63.13330.2018", "GOST 27751-2014"],
    sections: [
      { num: "5.1", title: { en: "Seismic loads", ru: "Сейсмические нагрузки" }, text: { en: "Design seismic intensity is determined by seismic zoning maps. For intensity 8-9, special structural measures are required.", ru: "Расчётная сейсмическая интенсивность определяется по картам сейсмического районирования. Для интенсивности 8-9 требуются специальные конструктивные мероприятия." } },
    ],
  },
  {
    code: "GOST 10180-2012", year: "2012", status: { en: "Active", ru: "Действует" },
    title: { en: "Concrete. Methods for strength determination by control samples", ru: "Бетоны. Методы определения прочности по контрольным образцам" },
    tags: ["strength", "samples", "testing", "прочность", "образцы"],
    category: { en: "Control", ru: "Контроль" },
    crossRefs: ["GOST 17624-2012", "GOST 22690.0-77"],
    sections: [
      { num: "4.1", title: { en: "Sample preparation", ru: "Подготовка образцов" }, text: { en: "Control samples: cubes 100×100×100 mm or 150×150×150 mm, cylinders Ø100×200 mm or Ø150×300 mm. Cured 28 days under standard conditions.", ru: "Контрольные образцы: кубы 100×100×100 мм или 150×150×150 мм, цилиндры Ø100×200 мм или Ø150×300 мм. Твердение 28 суток в стандартных условиях." } },
    ],
  },
  {
    code: "SP 50.13330.2012", year: "2012", status: { en: "Active", ru: "Действует" },
    title: { en: "Thermal protection of buildings", ru: "Тепловая защита зданий" },
    tags: ["thermal", "insulation", "energy", "теплоизоляция"],
    category: { en: "Thermal", ru: "Тепло" },
    crossRefs: ["SP 70.13330.2012"],
    sections: [
      { num: "5.1", title: { en: "Thermal resistance requirements", ru: "Требования к сопротивлению теплопередаче" }, text: { en: "Minimum thermal resistance of enclosing structures is determined by heating degree-days of the construction region.", ru: "Минимальное сопротивление теплопередаче ограждающих конструкций определяется по градусо-суткам отопительного периода региона строительства." } },
    ],
  },
  {
    code: "GOST 5686-2012", year: "2012", status: { en: "Active", ru: "Действует" },
    title: { en: "Soils. Field test methods by piles", ru: "Грунты. Методы полевых испытаний сваями" },
    tags: ["soils", "piles", "testing", "грунты", "сваи"],
    category: { en: "Foundations", ru: "Основания" },
    crossRefs: ["SP 22.13330.2016"],
    sections: [
      { num: "4.1", title: { en: "Static load test", ru: "Испытание статической нагрузкой" }, text: { en: "Static load test determines the bearing capacity of piles. Load is applied in stages until failure or specified displacement.", ru: "Испытание статической нагрузкой определяет несущую способность свай. Нагрузка прикладывается ступенями до отказа или заданного перемещения." } },
    ],
  },
  {
    code: "SP 22.13330.2016", year: "2016", status: { en: "Active", ru: "Действует" },
    title: { en: "Foundations of buildings and structures", ru: "Основания зданий и сооружений" },
    tags: ["foundations", "soils", "ground", "основания", "фундаменты"],
    category: { en: "Foundations", ru: "Основания" },
    crossRefs: ["GOST 5686-2012", "GOST 27751-2014"],
    sections: [
      { num: "5.6", title: { en: "Bearing capacity of soil", ru: "Несущая способность грунта" }, text: { en: "Bearing capacity is determined by calculation methods or field tests. Safety factor depends on soil type and construction class.", ru: "Несущая способность определяется расчётными методами или полевыми испытаниями. Коэффициент надёжности зависит от типа грунта и класса сооружения." } },
    ],
  },
  {
    code: "GOST 23615-79", year: "1979", status: { en: "Active", ru: "Действует" },
    title: { en: "System for ensuring geometric parameter accuracy in construction", ru: "Система обеспечения точности геометрических параметров в строительстве" },
    tags: ["accuracy", "geometry", "tolerances", "точность", "допуски"],
    category: { en: "Control", ru: "Контроль" },
    crossRefs: ["SP 70.13330.2012"],
    sections: [
      { num: "2.1", title: { en: "Tolerance system", ru: "Система допусков" }, text: { en: "Geometric accuracy is ensured by a system of tolerances for dimensions, shape, position and surface roughness of structural elements.", ru: "Геометрическая точность обеспечивается системой допусков на размеры, форму, положение и шероховатость поверхностей конструктивных элементов." } },
    ],
  },
  {
    code: "SP 16.13330.2017", year: "2017", status: { en: "Active", ru: "Действует" },
    title: { en: "Steel structures", ru: "Стальные конструкции" },
    tags: ["steel", "metal", "structures", "сталь", "металл"],
    category: { en: "Calculation", ru: "Расчёт" },
    crossRefs: ["GOST 27751-2014", "SP 70.13330.2012"],
    sections: [
      { num: "7.1", title: { en: "Strength calculation", ru: "Расчёт на прочность" }, text: { en: "Strength calculation: σ ≤ Ry·γc, where Ry is design strength of steel, γc is service conditions factor (0.8-1.4).", ru: "Расчёт на прочность: σ ≤ Ry·γc, где Ry — расчётное сопротивление стали, γc — коэффициент условий работы (0.8-1.4)." } },
    ],
  },
];

const faqItems = [
  { q: { en: "How to use the reference?", ru: "Как пользоваться справочником?" }, a: { en: "Use the search bar to search by code, title or tags. Filter by categories by clicking the corresponding buttons.", ru: "Используйте строку поиска для поиска по коду, названию или тегам. Фильтруйте по категориям, нажимая на соответствующие кнопки." } },
  { q: { en: "Which standards are included?", ru: "Какие нормативы включены?" }, a: { en: "The database contains key GOST, SP and STO standards for construction control: inspection, calculation, quality control, repair, installation and foundations.", ru: "База содержит основные ГОСТ, СП и СТО для строительного контроля: обследование, расчёт, контроль качества, ремонт, монтаж и основания." } },
  { q: { en: "Can I add my own document?", ru: "Можно ли добавить свой документ?" }, a: { en: "Yes, the database is constantly expanding. Contact us via EngAI Hub to add new normative documents.", ru: "Да, база постоянно расширяется. Свяжитесь с нами через EngAI Hub для добавления новых нормативных документов." } },
  { q: { en: "How often is the database updated?", ru: "Как часто обновляется база?" }, a: { en: "The database is updated when new editions of standards are released or changes in current documents occur.", ru: "База обновляется при выходе новых редакций нормативов или изменениях в действующих документах." } },
];

const relatedTools = [
  { name: "InspectAI", desc: { en: "AI structural inspection", ru: "AI-обследование конструкций" }, href: "https://inspectai-app-coral.vercel.app", icon: "🔍" },
  { name: "LoadBear", desc: { en: "Load-bearing capacity calculator", ru: "Расчёт несущей способности" }, href: "https://loadbear.vercel.app", icon: "🏗️" },
  { name: "RebarDesign", desc: { en: "Reinforcement section designer", ru: "Конструктор армирования" }, href: "https://rebardesign.vercel.app", icon: "🔧" },
  { name: "CrackCalc", desc: { en: "Crack assessment by GOST", ru: "Оценка трещин по ГОСТ" }, href: "https://crackcalc.vercel.app", icon: "📏" },
  { name: "ConcreteMix", desc: { en: "Concrete mix design", ru: "Подбор состава бетона" }, href: "https://concretemix.vercel.app", icon: "🧪" },
];

const tr = {
  en: {
    search: "Search", categories: "Categories", faq: "FAQ", tools: "Tools", find: "Find",
    searchPlaceholder: "Search by code, title or tag...",
    all: "All", notFound: "Nothing found. Try a different query.",
    faqTitle: "Frequently Asked Questions", toolsTitle: "Related Tools", open: "Open",
    heroBadge: `${norms.length} documents`,
    heroDesc: "Reference of normative documents for construction control: GOST, SP, STO. Full-text sections, cross-references, citation export. Search by code, title, tags and categories.",
    footerDesc: "AI-powered structural inspection of building structures",
    docs: "documents",
    sections: "Sections", crossRefs: "Cross-references", citation: "Citation", copyCitation: "Copy citation",
    copied: "Copied!", year: "Year", status: "Status", viewDoc: "View document", close: "Close",
    generateChecklist: "Generate inspection checklist", checklistTitle: "Inspection Checklist", printChecklist: "Print checklist", copyChecklist: "Copy checklist",
  },
  ru: {
    search: "Поиск", categories: "Категории", faq: "FAQ", tools: "Инструменты", find: "Найти",
    searchPlaceholder: "Поиск по коду, названию или тегу...",
    all: "Все", notFound: "Ничего не найдено. Попробуйте другой запрос.",
    faqTitle: "Частые вопросы", toolsTitle: "Связанные инструменты", open: "Открыть",
    heroBadge: `${norms.length} документов`,
    heroDesc: "Справочник нормативных документов для строительного контроля: ГОСТ, СП, СТО. Полнотекстовые разделы, перекрёстные ссылки, экспорт цитат. Поиск по коду, названию, тегам и категориям.",
    footerDesc: "Инженерное обследование строительных конструкций с применением AI",
    docs: "нормативов",
    sections: "Разделы", crossRefs: "Перекрёстные ссылки", citation: "Цитата", copyCitation: "Копировать цитату",
    copied: "Скопировано!", year: "Год", status: "Статус", viewDoc: "Открыть документ", close: "Закрыть",
    generateChecklist: "Сгенерировать чек-лист обследования", checklistTitle: "Чек-лист обследования", printChecklist: "Печать чек-листа", copyChecklist: "Копировать чек-лист",
  },
};

export default function Page() {
  const [lang, setLang] = useState<"en" | "ru">("en");
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedNorm, setSelectedNorm] = useState<Norm | null>(null);
  const [copied, setCopied] = useState(false);
  const [checklist, setChecklist] = useState<{ norm: string; num: string; text: string }[]>([]);
  const [showChecklist, setShowChecklist] = useState(false);

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
  const cats = Array.from(new Set(norms.map((n: Norm) => n.category[lang])));
  const filtered = norms.filter((n: Norm) => {
    const q = query.toLowerCase();
    const matchQ = !q || n.code.toLowerCase().includes(q) || n.title[lang].toLowerCase().includes(q) || n.tags.some((tg: string) => tg.includes(q));
    const matchCat = !activeCat || n.category[lang] === activeCat;
    return matchQ && matchCat;
  });

  const copyCitation = (n: Norm) => {
    const cite = `${n.code}-${n.year}. ${n.title[lang]}. ${lang === "en" ? "NormBase — EngAI" : "NormBase — EngAI"}.`;
    navigator.clipboard.writeText(cite);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateChecklist = () => {
    const items = filtered.flatMap((n) =>
      n.sections.map((s) => ({ norm: n.code, num: s.num, text: s.title[lang] }))
    );
    setChecklist(items);
    setShowChecklist(true);
  };

  const printChecklist = () => {
    const text = checklist.map((item, i) => `${i + 1}. [ ] ${item.norm} ${item.num}: ${item.text}`).join("\n");
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(`<html><head><title>${t.checklistTitle}</title><style>body{font-family:system-ui,sans-serif;padding:24px;color:#111;background:#fafafa}h1{font-size:18px}ol{line-height:1.6}</style></head><body><h1>${t.checklistTitle}</h1><ol>${checklist.map((item) => `<li>${item.norm} ${item.num}: ${item.text}</li>`).join("")}</ol></body></html>`);
      w.document.close();
      w.print();
    }
  };

  const copyChecklist = () => {
    const text = checklist.map((item, i) => `${i + 1}. [ ] ${item.norm} ${item.num}: ${item.text}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass py-3" : "py-5 bg-transparent"}`}>
        <div className="container-max flex items-center justify-between">
          <Link href="https://engai-hub.vercel.app" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center font-display font-bold text-on-primary text-lg group-hover:scale-105 transition-transform">E</div>
            <span className="font-display font-bold text-xl text-on-surface">Eng<span className="gradient-text">AI</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#search" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">{t.search}</a>
            <a href="#categories" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">{t.categories}</a>
            <a href="#faq" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">{t.faq}</a>
            <a href="#tools" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">{t.tools}</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => setLang(lang === "en" ? "ru" : "en")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:border-primary/40 hover:text-primary transition-all text-sm">
              <Globe className="w-3.5 h-3.5" /> {lang === "en" ? "RU" : "EN"}
            </button>
            <a href="#search" className="btn-primary text-sm">{t.find}</a>
          </div>
          <button className="md:hidden text-on-surface-variant p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden glass mt-3 mx-4 rounded-xl p-6 flex flex-col gap-4">
            <a href="#search" onClick={() => setMobileOpen(false)} className="text-on-surface-variant hover:text-primary">{t.search}</a>
            <a href="#categories" onClick={() => setMobileOpen(false)} className="text-on-surface-variant hover:text-primary">{t.categories}</a>
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
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-on-surface-variant">{t.heroBadge}</span>
          </div>
          <div className="inline-flex items-center gap-3 mb-4 animate-slide-up">
            <div className="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-on-surface">NormBase</h1>
          </div>
          <p className="text-on-surface-variant text-lg max-w-2xl mx-auto animate-slide-up">{t.heroDesc}</p>
        </div>
      </section>

      <section id="search" className="py-16">
        <div className="container-max max-w-4xl">
          <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-3 mb-6">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.searchPlaceholder} className="flex-1 px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none transition-colors" />
            <button className="btn-primary flex items-center justify-center gap-2"><Search className="w-4 h-4" /> {t.find}</button>
            <button onClick={generateChecklist} className="btn-ghost flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> {t.generateChecklist}</button>
          </div>

          <div id="categories" className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setActiveCat(null)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!activeCat ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-outline-variant/10"}`}>{t.all} ({norms.length})</button>
            {cats.map(c => (
              <button key={c} onClick={() => setActiveCat(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCat === c ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-outline-variant/10"}`}>{c}</button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map((n: Norm) => (
              <div key={n.code} onClick={() => setSelectedNorm(n)} className="glass rounded-xl p-4 hover:border-primary/30 transition-all card-hover cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                      <h3 className="font-display font-bold text-on-surface text-lg">{n.code}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary-container text-primary">{n.category[lang]}</span>
                      <span className="text-xs text-on-surface-variant">{n.year}</span>
                    </div>
                    <p className="text-sm text-on-surface-variant mt-1">{n.title[lang]}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {n.tags.slice(0, 4).map((tg: string) => <span key={tg} className="text-xs px-2 py-1 rounded-full bg-surface-container text-on-surface-variant flex items-center gap-1"><Tag className="w-2.5 h-2.5" />{tg}</span>)}
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs text-primary flex items-center gap-1"><BookOpen className="w-3 h-3" /> {n.sections.length} {t.sections}</span>
                      <span className="text-xs text-on-surface-variant flex items-center gap-1"><Link2 className="w-3 h-3" /> {n.crossRefs.length} {t.crossRefs}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <button onClick={(e) => { e.stopPropagation(); copyCitation(n); }} className="text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1">
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Quote className="w-3.5 h-3.5" />}
                      {copied ? t.copied : t.copyCitation}
                    </button>
                    <ExternalLink className="w-5 h-5 text-on-surface-variant flex-shrink-0" />
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="glass rounded-xl p-8 text-center text-on-surface-variant">{t.notFound}</div>}
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
            <span>{norms.length} {t.docs}</span>
            <span>·</span>
            <a href="https://engai-hub.vercel.app" className="hover:text-primary transition-colors">EngAI Hub</a>
            <span>·</span>
            <a href="https://inspectai-app-coral.vercel.app" className="hover:text-primary transition-colors">InspectAI</a>
            <span>·</span>
            <span>© 2025 EngAI</span>
          </div>
        </div>
      </footer>

      {selectedNorm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedNorm(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative glass rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedNorm(null)} className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors">
              <XIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="font-display text-2xl font-bold text-on-surface">{selectedNorm.code}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-container text-primary">{selectedNorm.category[lang]}</span>
            </div>
            <p className="text-sm text-on-surface-variant mb-4">{selectedNorm.title[lang]}</p>
            <div className="flex items-center gap-4 mb-6 text-xs text-on-surface-variant">
              <span>{t.year}: <span className="text-on-surface-variant">{selectedNorm.year}</span></span>
              <span>{t.status}: <span className="text-emerald-400">{selectedNorm.status[lang]}</span></span>
            </div>

            <h3 className="font-display text-lg font-bold text-on-surface mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> {t.sections}</h3>
            <div className="space-y-4 mb-6">
              {selectedNorm.sections.map((s: NormSection, i: number) => (
                <div key={i} className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary-container text-primary">§ {s.num}</span>
                    <h4 className="text-sm font-bold text-on-surface">{s.title[lang]}</h4>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{s.text[lang]}</p>
                  <button onClick={() => { navigator.clipboard.writeText(`[${selectedNorm.code}, §${s.num}] ${s.text[lang]}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="mt-2 text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1">
                    {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? t.copied : t.copyCitation}
                  </button>
                </div>
              ))}
            </div>

            {selectedNorm.crossRefs.length > 0 && (
              <>
                <h3 className="font-display text-lg font-bold text-on-surface mb-3 flex items-center gap-2"><Link2 className="w-4 h-4 text-primary" /> {t.crossRefs}</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedNorm.crossRefs.map((ref: string) => {
                    const refNorm = norms.find((n: Norm) => n.code === ref);
                    return (
                      <button key={ref} onClick={() => refNorm && setSelectedNorm(refNorm)} className="text-xs px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-primary-container hover:text-primary transition-colors flex items-center gap-1">
                        <Link2 className="w-3 h-3" /> {ref}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-bold text-on-surface mb-2 flex items-center gap-2"><Quote className="w-4 h-4 text-primary" /> {t.citation}</h3>
              <p className="text-xs text-on-surface-variant font-mono mb-2">{selectedNorm.code}-{selectedNorm.year}. {selectedNorm.title[lang]}. NormBase — EngAI.</p>
              <button onClick={() => copyCitation(selectedNorm)} className="text-xs text-primary hover:text-primary transition-colors flex items-center gap-1">
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t.copied : t.copyCitation}
              </button>
            </div>
          </div>
        </div>
      )}

      {showChecklist && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowChecklist(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative glass rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowChecklist(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors">
              <XIcon className="w-5 h-5" />
            </button>
            <h2 className="font-display text-2xl font-bold text-on-surface mb-4 flex items-center gap-2"><CheckCircle2 className="w-6 h-6 text-primary" /> {t.checklistTitle}</h2>
            <div className="space-y-2 mb-6">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-start gap-3 glass rounded-xl p-3">
                  <span className="text-sm text-on-surface-variant mt-0.5">{i + 1}.</span>
                  <div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary-container text-primary mb-1 inline-block">{item.norm} §{item.num}</span>
                    <p className="text-sm text-on-surface">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={printChecklist} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"><ExternalLink className="w-4 h-4" /> {t.printChecklist}</button>
              <button onClick={copyChecklist} className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm">{copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />} {copied ? t.copied : t.copyChecklist}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
