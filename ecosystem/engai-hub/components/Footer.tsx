import Link from "next/link";
import { ScanLine, Calculator, Layers, FlaskConical, Ruler, BookOpen } from "lucide-react";

const ecosystemLinks = [
  { icon: ScanLine, name: "InspectAI", href: "https://inspectai-app-coral.vercel.app" },
  { icon: Calculator, name: "CrackCalc", href: "https://crackcalc.vercel.app" },
  { icon: Layers, name: "LoadBear", href: "https://loadbear.vercel.app" },
  { icon: FlaskConical, name: "ConcreteMix", href: "https://concretemix.vercel.app" },
  { icon: Ruler, name: "RebarDesign", href: "https://rebardesign.vercel.app" },
  { icon: BookOpen, name: "NormBase", href: "https://normbase.vercel.app" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-20">
      <div className="container-max py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-eng-700 flex items-center justify-center font-display font-bold text-white text-lg">
                E
              </div>
              <span className="font-display font-bold text-xl text-white">
                Eng<span className="gradient-text">AI</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">
              Инженерное обследование строительных конструкций с применением искусственного интеллекта.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4 text-sm">Услуги</h4>
            <ul className="space-y-2">
              {["Визуальное обследование", "Расчёт несущей способности", "Проектирование ремонта", "Инженерные отчёты", "Обследование фасадов"].map((s) => (
                <li key={s}>
                  <Link href="/#services" className="text-sm text-slate-500 hover:text-accent transition-colors">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ecosystem */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4 text-sm">Экосистема</h4>
            <ul className="space-y-2">
              {ecosystemLinks.map((tool) => {
                const Icon = tool.icon;
                return (
                  <li key={tool.name}>
                    <a
                      href={tool.href}
                      target={tool.href.startsWith("http") ? "_blank" : undefined}
                      rel={tool.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="text-sm text-slate-500 hover:text-accent transition-colors flex items-center gap-2"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tool.name}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4 text-sm">Контакты</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>+7 (700) 000-00-00</li>
              <li>info@engai.kz</li>
              <li>Алматы, Казахстан</li>
              <li className="pt-2">
                <Link href="/#contact" className="text-accent hover:text-accent-light transition-colors">
                  Оставить заявку →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            © 2026 EngAI. Все права защищены. Работаем по ГОСТ 31937-2011.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span>Политика конфиденциальности</span>
            <span>·</span>
            <span>Условия использования</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
