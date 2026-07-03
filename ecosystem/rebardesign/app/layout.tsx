import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RebarDesign — Конструктор армирования сечения | EngAI",
  description: "Визуальный конструктор армирования железобетонных сечений. Подбор диаметра и количества стержней, расчёт процента армирования.",
  keywords: ["армирование", "арматура", "конструктор сечения", "ЖБК", "процент армирования", "диаметр стержней"],
  openGraph: {
    title: "RebarDesign — Конструктор армирования сечения",
    description: "Визуальный конструктор армирования железобетонных сечений.",
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
