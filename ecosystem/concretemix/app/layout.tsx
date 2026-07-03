import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConcreteMix — Подбор состава ремонтного бетона | EngAI",
  description: "Подбор состава ремонтного бетона по ГОСТ 27006-2019. Расчёт цемента, песка, щебня, воды и добавок для марок B15–B40.",
  keywords: ["состав бетона", "ГОСТ 27006", "ремонтный бетон", "подбор бетона", "цемент", "B15", "B25", "B40"],
  openGraph: {
    title: "ConcreteMix — Подбор состава ремонтного бетона",
    description: "Расчёт состава бетона по ГОСТ 27006-2019 для марок B15–B40.",
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
