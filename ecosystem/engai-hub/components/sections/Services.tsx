import { Search, Calculator, Wrench, FileCheck, Building2, Microscope } from "lucide-react";

const services = [
  {
    icon: Search,
    title: "Визуальное обследование",
    desc: "AI-детекция дефектов по фото: трещины, сколы, отслоения, коррозия. Оценка размеров и критичности.",
    features: ["YOLOv8 детекция", "Оценка ширины/длины", "Категория по ГОСТ"],
  },
  {
    icon: Calculator,
    title: "Расчёт несущей способности",
    desc: "Определение остаточной несущей способности ЖБК с учётом выявленных дефектов и потери сечения.",
    features: ["СП 63.13330.2018", "Учёт дефектов", "Рекомендации по усилению"],
  },
  {
    icon: Wrench,
    title: "Проектирование ремонта",
    desc: "Подбор ремонтных составов, расчёт усиления арматурой, обоймами, углеволокном.",
    features: ["СТО НОСТРОЙ 2.7.64", "Подбор состава", "Спецификация материалов"],
  },
  {
    icon: FileCheck,
    title: "Инженерные отчёты",
    desc: "Полные PDF-отчёты (20+ страниц): титульный лист, содержание, фото, анализ, нормативы, выводы.",
    features: ["21 страница PDF", "8+ ГОСТ и СП", "Фото с разметкой"],
  },
  {
    icon: Building2,
    title: "Обследование фасадов",
    desc: "Диагностика состояния фасадных систем, HPL-панелей, керамогранита, облицовки.",
    features: ["ГОСТ 31937-2011", "СП 13-102-2003", "Оценка адгезии"],
  },
  {
    icon: Microscope,
    title: "Инструментальный контроль",
    desc: "Неразрушающие методы: ультразвук, молоток Шмидта, штангенциркуль, измерение защитного слоя.",
    features: ["ГОСТ 17624-2012", "ГОСТ 22690-2015", "Протокол испытаний"],
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="section-padding relative">
      <div className="container-max">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-4">
            <span className="text-sm text-slate-400">Что мы делаем</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Услуги инженерного обследования
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            От диагностики до ремонта — полный цикл работ по обследованию строительных конструкций
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="glass-hover rounded-2xl p-6 group">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-3">{s.title}</h3>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">{s.desc}</p>
                <ul className="space-y-2">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
