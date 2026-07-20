"use client";

import Link from "next/link";

const tools = [
  {
    href: "/dashboard/tools/crackcalc",
    icon: "show_chart",
    name: "CrackCalc",
    desc: "Расчёт ширины раскрытия трещин, прогноз роста, мультистандарты (ГОСТ, Еврокод, ACI)",
    color: "text-error",
  },
  {
    href: "/dashboard/tools/loadbear",
    icon: "foundation",
    name: "LoadBear",
    desc: "Несущая способность ж/б сечений: момент, поперечная сила, M-N взаимодействие",
    color: "text-primary",
  },
  {
    href: "/dashboard/tools/concretemix",
    icon: "science",
    name: "ConcreteMix",
    desc: "Подбор состава бетона, расчёт стоимости, гранулометрия, прогноз прочности",
    color: "text-secondary",
  },
  {
    href: "/dashboard/tools/rebardesign",
    icon: "grid_4x4",
    name: "RebarDesign",
    desc: "Конструирование армированных сечений: прямоугольник, тавр, круг, хомуты, анкеровка",
    color: "text-tertiary",
  },
  {
    href: "/dashboard/tools/normbase",
    icon: "gavel",
    name: "NormBase",
    desc: "Нормативная база: ГОСТ, СП, СНиП — полнотекстовый поиск, кросс-ссылки, цитирование",
    color: "text-on-surface-variant",
  },
];

export default function ToolsIndexPage() {
  return (
    <div className="animate-fade-in">
      <header className="mb-xl">
        <p className="font-label-caps text-label-caps text-secondary mb-xs">ENGINEERING TOOLS</p>
        <h2 className="font-display-lg text-display-lg">Engineering Toolkit</h2>
        <p className="font-body-md text-on-surface-variant mt-xs">
          Integrated calculation tools for structural analysis, mix design, and normative references.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="bg-surface-container-lowest border border-outline-variant p-lg hover:border-primary transition-colors group"
          >
            <div className="flex items-start gap-md mb-md">
              <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center">
                <span className={`material-symbols-outlined ${tool.color} text-[28px]`}>{tool.icon}</span>
              </div>
              <div>
                <h3 className="font-title-sm text-title-sm group-hover:text-primary transition-colors">{tool.name}</h3>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{tool.desc}</p>
            <div className="mt-md pt-sm border-t border-outline-variant flex justify-end items-center gap-xs text-primary font-label-caps text-[11px]">
              OPEN
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
