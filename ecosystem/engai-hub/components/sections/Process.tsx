import { Camera, Cpu, FileText, Wrench } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Camera,
    title: "Загрузка фото",
    desc: "Фотография конструкции загружается в InspectAI. AI мгновенно находит дефекты: трещины, сколы, отслоения.",
    time: "< 30 сек",
  },
  {
    num: "02",
    icon: Cpu,
    title: "AI-анализ",
    desc: "Нейросеть YOLOv8 оценивает тип, размеры, критичность. Инженерная логика определяет нормативные пределы.",
    time: "< 10 сек",
  },
  {
    num: "03",
    icon: FileText,
    title: "Отчёт PDF",
    desc: "Генерируется полный инженерный отчёт: 21 страница, титульный лист, содержание, фото, анализ, нормативы.",
    time: "< 5 сек",
  },
  {
    num: "04",
    icon: Wrench,
    title: "Решение",
    desc: "Рекомендации по ремонту, подбор состава бетона, расчёт усиления — всё в экосистеме EngAI.",
    time: "На инструментах",
  },
];

export default function ProcessSection() {
  return (
    <section id="process" className="section-padding relative">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="container-max relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-4">
            <span className="text-sm text-slate-400">Как это работает</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            От фото до инженерного отчёта
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            4 шага — менее чем за минуту
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0" />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="relative">
                <div className="glass rounded-2xl p-6 text-center group hover:border-accent/30 transition-all">
                  <div className="relative inline-flex mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-accent" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-400 mb-3">{step.desc}</p>
                  <span className="inline-block text-xs px-3 py-1 rounded-full bg-accent/10 text-accent font-mono">
                    {step.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
