import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoadBear — Расчёт несущей способности ЖБК | EngAI",
  description: "Расчёт несущей способности железобетонных конструкций по СП 63.13330.2018. Учёт дефектов, потеря сечения, остаточная прочность.",
  keywords: ["несущая способность", "СП 63.13330", "ЖБК", "расчёт прочности", "дефекты бетона", "армирование"],
  openGraph: {
    title: "LoadBear — Расчёт несущей способности ЖБК",
    description: "Расчёт несущей способности железобетонных конструкций по СП 63.13330.2018.",
    type: "website",
    locale: "ru_RU",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-200 antialiased">{children}</body>
    </html>
  );
}
