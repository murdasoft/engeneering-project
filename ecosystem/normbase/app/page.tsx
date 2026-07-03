"use client";

import { useState, useEffect } from "react";
import { BookOpen, Search, ExternalLink, FileText, Tag, ChevronDown, Menu, X, ArrowRight, Layers, Globe } from "lucide-react";
import Link from "next/link";

const norms = [
  { code: "GOST 31937-2011", title: { en: "Buildings and structures. Rules for inspection and monitoring of technical condition", ru: "Здания и сооружения. Правила обследования и мониторинга технического состояния" }, tags: ["inspection", "defects", "assessment", "monitoring", "обследование", "дефекты"], category: { en: "Inspection", ru: "Обследование" } },
  { code: "SP 63.13330.2018", title: { en: "Concrete and reinforced concrete structures. General provisions", ru: "Бетонные и железобетонные конструкции. Основные положения" }, tags: ["concrete", "reinforcement", "calculation", "RCS", "бетон", "армирование"], category: { en: "Calculation", ru: "Расчёт" } },
  { code: "GOST 17624-2012", title: { en: "Concrete. Ultrasonic method for strength determination", ru: "Бетоны. Ультразвуковой метод определения прочности" }, tags: ["ultrasonic", "strength", "control", "non-destructive", "ультразвук"], category: { en: "Control", ru: "Контроль" } },
  { code: "GOST 22690.0-77", title: { en: "Concrete. Strength determination by mechanical non-destructive methods", ru: "Бетоны. Определение прочности механическими методами неразрушающего контроля" }, tags: ["Schmidt hammer", "strength", "non-destructive", "молоток Шмидта"], category: { en: "Control", ru: "Контроль" } },
  { code: "SP 70.13330.2012", title: { en: "Load-bearing and enclosing structures", ru: "Несущие и ограждающие конструкции" }, tags: ["structures", "installation", "requirements", "конструкции", "монтаж"], category: { en: "Installation", ru: "Монтаж" } },
  { code: "STO NOSTROY 2.7.64", title: { en: "Repair and strengthening of reinforced concrete structures", ru: "Ремонт и усиление железобетонных конструкций" }, tags: ["repair", "strengthening", "mixes", "ремонт", "усиление"], category: { en: "Repair", ru: "Ремонт" } },
  { code: "SP 13-102-2003", title: { en: "Rules for inspection of load-bearing building structures", ru: "Правила обследования несущих строительных конструкций" }, tags: ["inspection", "structures", "load-bearing", "обследование", "несущие"], category: { en: "Inspection", ru: "Обследование" } },
  { code: "GOST 27751-2014", title: { en: "Reliability of building structures and foundations", ru: "Надёжность строительных конструкций и оснований" }, tags: ["reliability", "strength", "stability", "надёжность", "прочность"], category: { en: "Calculation", ru: "Расчёт" } },
  { code: "GOST 27006-2019", title: { en: "Concrete. Rules for mix design", ru: "Бетоны. Правила подбора составов" }, tags: ["concrete", "mix", "design", "recipe", "бетон", "состав"], category: { en: "Materials", ru: "Материалы" } },
  { code: "SP 14.13330.2014", title: { en: "Construction in seismic regions", ru: "Строительство в сейсмических районах" }, tags: ["seismic", "calculation", "strengthening", "сейсмичность"], category: { en: "Calculation", ru: "Расчёт" } },
  { code: "GOST 10180-2012", title: { en: "Concrete. Methods for strength determination by control samples", ru: "Бетоны. Методы определения прочности по контрольным образцам" }, tags: ["strength", "samples", "testing", "прочность", "образцы"], category: { en: "Control", ru: "Контроль" } },
  { code: "SP 50.13330.2012", title: { en: "Thermal protection of buildings", ru: "Тепловая защита зданий" }, tags: ["thermal", "insulation", "energy", "теплоизоляция"], category: { en: "Thermal", ru: "Тепло" } },
  { code: "GOST 5686-2012", title: { en: "Soils. Field test methods by piles", ru: "Грунты. Методы полевых испытаний сваями" }, tags: ["soils", "piles", "testing", "грунты", "сваи"], category: { en: "Foundations", ru: "Основания" } },
  { code: "SP 22.13330.2016", title: { en: "Foundations of buildings and structures", ru: "Основания зданий и сооружений" }, tags: ["foundations", "soils", "ground", "основания", "фундаменты"], category: { en: "Foundations", ru: "Основания" } },
  { code: "GOST 23615-79", title: { en: "System for ensuring geometric parameter accuracy in construction", ru: "Система обеспечения точности геометрических параметров в строительстве" }, tags: ["accuracy", "geometry", "tolerances", "точность", "допуски"], category: { en: "Control", ru: "Контроль" } },
  { code: "SP 16.13330.2017", title: { en: "Steel structures", ru: "Стальные конструкции" }, tags: ["steel", "metal", "structures", "сталь", "металл"], category: { en: "Calculation", ru: "Расчёт" } },
];

const faqItems = [
  { q: { en: "How to use the reference?", ru: "Как пользоваться справочником?" }, a: { en: "Use the search bar to search by code, title or tags. Filter by categories by clicking the corresponding buttons.", ru: "Используйте строку поиска для поиска по коду, названию или тегам. Фильтруйте по категориям, нажимая на соответствующие кнопки." } },
  { q: { en: "Which standards are included?", ru: "Какие нормативы включены?" }, a: { en: "The database contains key GOST, SP and STO standards for construction control: inspection, calculation, quality control, repair, installation and foundations.", ru: "База содержит основные ГОСТ, СП и СТО для строительного контроля: обследование, расчёт, контроль качества, ремонт, монтаж и основания." } },
  { q: { en: "Can I add my own document?", ru: "Можно ли добавить свой документ?" }, a: { en: "Yes, the database is constantly expanding. Contact us via EngAI Hub to add new normative documents.", ru: "Да, база постоянно расширяется. Свяжитесь с нами через EngAI Hub для добавления новых нормативных документов." } },
  { q: { en: "How often is the database updated?", ru: "Как часто обновляется база?" }, a: { en: "The database is updated when new editions of standards are released or changes in current documents occur.", ru: "База обновляется при выходе новых редакций нормативов или изменениях в действующих документах." } },
];

const relatedTools = [
  { name: "InspectAI", desc: { en: "AI structural inspection", ru: "AI-обследование конструкций" }, href: "https://inspectai-app-coral.vercel.app", icon: "🔍" },
  { name: "CrackCalc", desc: { en: "Crack assessment by GOST", ru: "Оценка трещин по ГОСТ" }, href: "https://crackcalc.vercel.app", icon: "📏" },
  { name: "LoadBear", desc: { en: "Load-bearing capacity calculator", ru: "Расчёт несущей способности" }, href: "https://loadbear.vercel.app", icon: "🏗️" },
];

const tr = {
  en: {
    search: "Search", categories: "Categories", faq: "FAQ", tools: "Tools", find: "Find",
    searchPlaceholder: "Search by code, title or tag...",
    all: "All", notFound: "Nothing found. Try a different query.",
    faqTitle: "Frequently Asked Questions", toolsTitle: "Related Tools", open: "Open",
    heroBadge: `${norms.length} documents`,
    heroDesc: "Reference of normative documents for construction control: GOST, SP, STO. Search by code, title, tags and categories.",
    footerDesc: "AI-powered structural inspection of building structures",
    docs: "documents",
  },
  ru: {
    search: "Поиск", categories: "Категории", faq: "FAQ", tools: "Инструменты", find: "Найти",
    searchPlaceholder: "Поиск по коду, названию или тегу...",
    all: "Все", notFound: "Ничего не найдено. Попробуйте другой запрос.",
    faqTitle: "Частые вопросы", toolsTitle: "Связанные инструменты", open: "Открыть",
    heroBadge: `${norms.length} документов`,
    heroDesc: "Справочник нормативных документов для строительного контроля: ГОСТ, СП, СТО. Поиск по коду, названию, тегам и категориям.",
    footerDesc: "Инженерное обследование строительных конструкций с применением AI",
    docs: "нормативов",
  },
};

export default function Page() {
  const [lang, setLang] = useState<"en" | "ru">("en");
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
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
  const cats = Array.from(new Set(norms.map(n => n.category[lang])));
  const filtered = norms.filter(n => {
    const q = query.toLowerCase();
    const matchQ = !q || n.code.toLowerCase().includes(q) || n.title[lang].toLowerCase().includes(q) || n.tags.some(tg => tg.includes(q));
    const matchCat = !activeCat || n.category[lang] === activeCat;
    return matchQ && matchCat;
  });

  return (
    <div className="min-h-screen">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass py-3" : "py-5 bg-transparent"}`}>
        <div className="container-max flex items-center justify-between">
          <Link href="https://engai-hub.vercel.app" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-eng-700 flex items-center justify-center font-display font-bold text-white text-lg group-hover:scale-105 transition-transform">E</div>
            <span className="font-display font-bold text-xl text-white">Eng<span className="gradient-text">AI</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#search" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{t.search}</a>
            <a href="#categories" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{t.categories}</a>
            <a href="#faq" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{t.faq}</a>
            <a href="#tools" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{t.tools}</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => setLang(lang === "en" ? "ru" : "en")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:border-accent/40 hover:text-white transition-all text-sm">
              <Globe className="w-3.5 h-3.5" /> {lang === "en" ? "RU" : "EN"}
            </button>
            <a href="#search" className="btn-primary text-sm">{t.find}</a>
          </div>
          <button className="md:hidden text-slate-300 p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden glass mt-3 mx-4 rounded-xl p-6 flex flex-col gap-4">
            <a href="#search" onClick={() => setMobileOpen(false)} className="text-slate-300 hover:text-white">{t.search}</a>
            <a href="#categories" onClick={() => setMobileOpen(false)} className="text-slate-300 hover:text-white">{t.categories}</a>
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
            <Layers className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs text-slate-400">{t.heroBadge}</span>
          </div>
          <div className="inline-flex items-center gap-3 mb-4 animate-slide-up">
            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-accent" />
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-white">NormBase</h1>
          </div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto animate-slide-up">{t.heroDesc}</p>
        </div>
      </section>

      <section id="search" className="py-16">
        <div className="container-max max-w-4xl">
          <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-3 mb-6">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.searchPlaceholder} className="flex-1 px-4 py-3 rounded-xl bg-bg-700 border border-white/10 text-white placeholder:text-slate-500 focus:border-accent focus:outline-none transition-colors" />
            <button className="btn-primary flex items-center justify-center gap-2"><Search className="w-4 h-4" /> {t.find}</button>
          </div>

          <div id="categories" className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setActiveCat(null)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!activeCat ? "bg-accent text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>{t.all} ({norms.length})</button>
            {cats.map(c => (
              <button key={c} onClick={() => setActiveCat(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCat === c ? "bg-accent text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>{c}</button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map((n) => (
              <div key={n.code} className="glass rounded-xl p-4 hover:border-accent/30 transition-all card-hover">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-accent flex-shrink-0" />
                      <h3 className="font-display font-bold text-white text-lg">{n.code}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">{n.category[lang]}</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{n.title[lang]}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {n.tags.slice(0, 4).map(tg => <span key={tg} className="text-xs px-2 py-1 rounded-full bg-white/5 text-slate-500 flex items-center gap-1"><Tag className="w-2.5 h-2.5" />{tg}</span>)}
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-slate-600 flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="glass rounded-xl p-8 text-center text-slate-500">{t.notFound}</div>}
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
            <span>{norms.length} {t.docs}</span>
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
