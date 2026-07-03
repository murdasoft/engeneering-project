import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrackCalc — Оценка трещин по ГОСТ 31937-2011 | EngAI",
  description: "Классификация трещин в бетонных и железобетонных конструкциях по ГОСТ 31937-2011. Расчёт категории дефекта, скорости роста и объёма ремонта.",
  keywords: ["трещины", "ГОСТ 31937", "категория дефекта", "оценка трещин", "Н1 Н2 Н3 Н4", "обследование"],
  openGraph: {
    title: "CrackCalc — Оценка трещин по ГОСТ 31937-2011",
    description: "Классификация и оценка трещин в бетонных конструкциях.",
    type: "website",
    locale: "ru_RU",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg-900 text-slate-200 antialiased">{children}</body>
    </html>
  );
}
