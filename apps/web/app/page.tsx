"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: "#f8f9fa", color: "#1a1a2e", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 64px", background: "#fff", borderBottom: "1px solid #e9ecef" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "#0d7377", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18 }}>I</div>
          <span style={{ fontWeight: 700, fontSize: 20, color: "#1a1a2e" }}>InspectAI</span>
        </div>
        <nav style={{ display: "flex", gap: 36, fontSize: 15, color: "#495057", fontWeight: 500 }}>
          <a href="#how" style={{ textDecoration: "none", color: "inherit" }}>How it works</a>
          <a href="#types" style={{ textDecoration: "none", color: "inherit" }}>Defect types</a>
          <a href="#cases" style={{ textDecoration: "none", color: "inherit" }}>Use cases</a>
          <a href="#faq" style={{ textDecoration: "none", color: "inherit" }}>FAQ</a>
        </nav>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/demo" style={{ padding: "8px 18px", fontSize: 15, textDecoration: "none", color: "#0d7377", fontWeight: 600 }}>Demo</Link>
          <button style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#0d7377", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Sign in</button>
        </div>
      </header>

      {/* Hero */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, padding: "100px 64px", maxWidth: 1300, margin: "0 auto", alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 999, background: "#e6f4f1", color: "#0d7377", fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
            <span>✦</span> AI Visual Inspection Platform
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, margin: "0 0 24px", letterSpacing: "-0.03em", color: "#1a1a2e" }}>
            Visual screening<br />
            <span style={{ color: "#0d7377" }}>of concrete defects</span><br />
            from a single photo
          </h1>
          <p style={{ fontSize: 18, color: "#495057", lineHeight: 1.7, margin: "0 0 36px", maxWidth: 480 }}>
            Upload a construction surface photo — AI detects cracks, spalling, and corrosion in seconds. A preliminary assessment you can verify and save into a report.
          </p>
          <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
            <Link href="/demo" style={{ padding: "16px 32px", borderRadius: 10, background: "#0d7377", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 16, display: "inline-flex", alignItems: "center", gap: 10, boxShadow: "0 4px 14px rgba(13,115,119,0.3)" }}>
              📷 Try the demo
            </Link>
            <a href="#how" style={{ padding: "16px 32px", borderRadius: 10, border: "1px solid #dee2e6", color: "#495057", textDecoration: "none", fontWeight: 600, fontSize: 16, display: "inline-flex", alignItems: "center", gap: 8, background: "#fff" }}>
              How it works →
            </a>
          </div>
          <p style={{ fontSize: 14, color: "#868e96" }}>No registration — just upload a photo</p>
        </div>

        <div style={{ position: "relative" }}>
          <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 30px 60px -15px rgba(0,0,0,0.2)", border: "1px solid #e9ecef", background: "#fff" }}>
            {/* Window chrome */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 20px", borderBottom: "1px solid #e9ecef", background: "#f8f9fa" }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }}></span>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }}></span>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }}></span>
              <span style={{ fontSize: 13, color: "#868e96", marginLeft: 12, fontWeight: 500 }}>Analysis Result</span>
            </div>
            {/* Demo image area */}
            <div style={{ position: "relative", background: "#d4d4d4", aspectRatio: "16/10", overflow: "hidden" }}>
              {/* Concrete texture background */}
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #c8c8c8 0%, #d8d8d8 50%, #c4c4c4 100%)", position: "relative" }}>
                {/* Speckles */}
                {Array.from({ length: 200 }).map((_, i) => (
                  <div key={i} style={{
                    position: "absolute",
                    width: Math.random() * 4 + 1,
                    height: Math.random() * 4 + 1,
                    borderRadius: "50%",
                    background: `rgba(100,100,100,${Math.random() * 0.3 + 0.1})`,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                  }} />
                ))}
                {/* Crack line */}
                <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
                  <path d="M 180 80 Q 220 150 200 220 T 240 350 T 280 450" fill="none" stroke="#2d2d2d" strokeWidth="2.5" />
                </svg>
                {/* Detection boxes */}
                <div style={{ position: "absolute", top: "12%", left: "8%", width: "35%", height: "45%", border: "2px solid #e03131", borderRadius: 4 }}>
                  <div style={{ position: "absolute", top: -10, left: 0, padding: "4px 10px", borderRadius: 4, background: "#e03131", color: "#fff", fontSize: 11, fontWeight: 700 }}>Crack · 94%</div>
                </div>
                <div style={{ position: "absolute", top: "30%", right: "18%", width: "22%", height: "30%", border: "2px solid #7950f2", borderRadius: 4 }}>
                  <div style={{ position: "absolute", top: -10, left: 0, padding: "4px 10px", borderRadius: 4, background: "#7950f2", color: "#fff", fontSize: 11, fontWeight: 700 }}>Corrosion · 87%</div>
                </div>
                <div style={{ position: "absolute", bottom: "15%", right: "8%", width: "28%", height: "35%", border: "2px solid #f08c00", borderRadius: 4 }}>
                  <div style={{ position: "absolute", bottom: -10, right: 0, padding: "4px 10px", borderRadius: 4, background: "#f08c00", color: "#fff", fontSize: 11, fontWeight: 700 }}>Spalling · 81%</div>
                </div>
              </div>
            </div>
            {/* Footer info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>3 defects found</div>
                <div style={{ fontSize: 13, color: "#868e96" }}>Model v1.0 · 1.2s</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ padding: "5px 12px", borderRadius: 999, background: "#fff0f0", color: "#e03131", fontSize: 12, fontWeight: 600 }}>High · 1</span>
                <span style={{ padding: "5px 12px", borderRadius: 999, background: "#fff8e6", color: "#f08c00", fontSize: 12, fontWeight: 600 }}>Medium · 1</span>
                <div style={{ textAlign: "right", marginLeft: 8 }}>
                  <div style={{ fontSize: 12, color: "#868e96" }}>Model accuracy</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0d7377" }}>94%</div>
                  <div style={{ fontSize: 11, color: "#adb5bd" }}>mAP50 · YOLOv8</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ padding: "80px 64px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>How it works</h2>
          <p style={{ fontSize: 18, color: "#495057", marginBottom: 60, maxWidth: 600, margin: "0 auto 60px" }}>
            Three simple steps from photo to engineering report
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
            {[
              { step: "01", title: "Upload photo", desc: "Take or upload a photo of concrete, masonry, or reinforced concrete surface." },
              { step: "02", title: "AI detection", desc: "YOLOv8 neural network detects cracks, spalling, corrosion and other defects." },
              { step: "03", title: "Get report", desc: "Receive detailed engineering analysis with dimensions, norms, and recommendations." },
            ].map((item) => (
              <div key={item.step} style={{ padding: 40, borderRadius: 16, border: "1px solid #e9ecef", textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0d7377", marginBottom: 16 }}>{item.step}</div>
                <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{item.title}</h3>
                <p style={{ fontSize: 15, color: "#495057", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Defect types */}
      <section id="types" style={{ padding: "80px 64px", background: "#f8f9fa" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>Detectable defect types</h2>
          <p style={{ fontSize: 18, color: "#495057", marginBottom: 60, maxWidth: 600, margin: "0 auto 60px" }}>
            Our AI model is trained to recognize the most common structural defects
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {[
              { name: "Cracks", color: "#e03131", desc: "Structural and non-structural cracks in concrete" },
              { name: "Spalling", color: "#f08c00", desc: "Concrete cover loss and surface spalling" },
              { name: "Corrosion", color: "#7950f2", desc: "Rebar corrosion and rust stains" },
              { name: "Scaling", color: "#1971c2", desc: "Surface scaling and peeling" },
            ].map((d) => (
              <div key={d.name} style={{ padding: 32, borderRadius: 16, background: "#fff", border: "1px solid #e9ecef", textAlign: "left" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: d.color + "15", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, fontSize: 24 }}>
                  {d.name === "Cracks" && "🧱"}
                  {d.name === "Spalling" && "🏗️"}
                  {d.name === "Corrosion" && "🔧"}
                  {d.name === "Scaling" && "📐"}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{d.name}</h3>
                <p style={{ fontSize: 14, color: "#495057", lineHeight: 1.5 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "100px 64px", textAlign: "center", background: "#0d7377" }}>
        <h2 style={{ fontSize: 44, fontWeight: 800, color: "#fff", marginBottom: 20 }}>Ready to inspect?</h2>
        <p style={{ fontSize: 18, color: "#e6f4f1", marginBottom: 36, maxWidth: 500, margin: "0 auto 36px" }}>
          Upload your first photo and get a detailed engineering analysis in seconds.
        </p>
        <Link href="/demo" style={{ padding: "18px 40px", borderRadius: 10, background: "#fff", color: "#0d7377", textDecoration: "none", fontWeight: 700, fontSize: 17, display: "inline-block" }}>
          Start inspection →
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: "40px 64px", background: "#1a1a2e", color: "#868e96", fontSize: 14 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, background: "#0d7377", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>I</div>
            <span style={{ fontWeight: 600, color: "#e9ecef" }}>InspectAI</span>
          </div>
          <div>Engineering defect detection powered by AI</div>
          <div>© 2026 InspectAI</div>
        </div>
      </footer>
    </div>
  );
}
