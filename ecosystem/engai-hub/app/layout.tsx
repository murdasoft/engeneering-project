import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EngAI — Инженерная компания | AI-обследование конструкций",
  description: "Инженерное обследование строительных конструкций с применением искусственного интеллекта. Расчёт несущей способности, проектирование усиления, ремонт бетона.",
  keywords: ["инженерное обследование", "дефекты бетона", "ГОСТ 31937", "InspectAI", "несущая способность", "ремонт железобетона"],
  openGraph: {
    title: "EngAI — Инженерная компания",
    description: "AI-обследование строительных конструкций. Полный инженерный цикл — от диагностики до ремонта.",
    type: "website",
    locale: "ru_RU",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body className="bg-bg-900 text-slate-200 antialiased">{children}</body>
    </html>
  );
}
