import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NormBase — Справочник нормативных документов | EngAI",
  description: "База нормативных документов для строительного контроля: ГОСТ, СП, СТО. Поиск по коду, названию, тегам и категориям.",
  keywords: ["ГОСТ", "СП", "СТО", "нормативы", "строительный контроль", "обследование", "бетон", "ЖБК"],
  openGraph: {
    title: "NormBase — Справочник нормативных документов",
    description: "База ГОСТ, СП и СТО для строительного контроля.",
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
