export const metadata = {
  title: "InspectAI — Defect Detection",
  description: "AI-powered structural defect analysis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "'Inter', system-ui, sans-serif", background: "#f8f9fa", color: "#1a1a2e" }}>
        {children}
      </body>
    </html>
  );
}
