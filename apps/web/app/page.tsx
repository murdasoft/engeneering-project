"use client";

import Link from "next/link";
import { useState } from "react";

const speckles = [
  {w:3,h:3,a:0.18,t:"12%",l:"34%"},{w:2,h:2,a:0.25,t:"56%",l:"78%"},{w:4,h:2,a:0.15,t:"23%",l:"12%"},
  {w:2,h:4,a:0.22,t:"45%",l:"67%"},{w:3,h:2,a:0.19,t:"67%",l:"34%"},{w:4,h:3,a:0.16,t:"34%",l:"89%"},
];

const faqs = [
  { q: "What photo formats are supported?", a: "JPG, PNG, and WEBP up to 10 MB. Photos from phones, drones, and cameras all work." },
  { q: "Can I upload photos from my phone?", a: "Yes — the demo works in any mobile browser. Take a photo directly or upload from gallery." },
  { q: "How accurate is the analysis?", a: "Our ensemble of 3 YOLOv8 models achieves ~94% mAP50 on concrete surfaces. For infrastructure (bridges, roads), accuracy is ~88%." },
  { q: "Can I manually edit the results?", a: "Yes — this is a human-in-the-loop tool. AI suggests, you verify. Results are not final without your confirmation." },
  { q: "Does the system replace an engineer?", a: "No. This is a screening tool for preliminary visual assessment. Every report includes a disclaimer per GOST 31937-2011." },
  { q: "How is the report generated?", a: "A PDF report with annotated photos, defect list, dimensions, normative references, and recommended actions is generated automatically." },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif", background: "#f8f9fa", color: "#1a1a2e", minHeight: "100vh" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.7 } }
        .anim-1 { animation: slideUp 0.5s ease-out both }
        .anim-2 { animation: slideUp 0.6s ease-out both }
        .anim-3 { animation: slideUp 0.7s ease-out both }
        .anim-4 { animation: slideUp 0.8s ease-out both }
        .anim-float { animation: float 4s ease-in-out infinite }
        .card-hover { transition: transform 0.25s, box-shadow 0.25s }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.08) }
        .nav-link { position: relative }
        .nav-link::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 2px; background: #0d7377; transition: width 0.3s }
        .nav-link:hover::after { width: 100% }
        .btn-hover { transition: transform 0.2s, box-shadow 0.2s }
        .btn-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(13,115,119,0.35) }
      `}</style>

      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 64px", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #0d7377, #0a5c5f)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18, boxShadow: "0 4px 14px rgba(13,115,119,0.25)" }}>I</div>
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.5px" }}>InspectAI</span>
        </div>
        <nav style={{ display: "flex", gap: 36, fontSize: 15, color: "#495057", fontWeight: 600 }}>
          <a href="#how" className="nav-link" style={{ textDecoration: "none", color: "inherit" }}>How it works</a>
          <a href="#types" className="nav-link" style={{ textDecoration: "none", color: "inherit" }}>Defect types</a>
          <a href="#cases" className="nav-link" style={{ textDecoration: "none", color: "inherit" }}>Use cases</a>
          <a href="#faq" className="nav-link" style={{ textDecoration: "none", color: "inherit" }}>FAQ</a>
        </nav>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/demo" style={{ padding: "8px 18px", fontSize: 15, textDecoration: "none", color: "#0d7377", fontWeight: 700 }}>Demo</Link>
          <button className="btn-hover" style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #0d7377, #0a5c5f)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(13,115,119,0.25)" }}>Sign in</button>
        </div>
      </header>

      {/* Hero */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, padding: "100px 64px", maxWidth: 1300, margin: "0 auto", alignItems: "center" }}>
        <div className="anim-1">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 999, background: "linear-gradient(135deg, #e6f4f1, #d3f0ea)", color: "#0d7377", fontSize: 13, fontWeight: 700, marginBottom: 24, boxShadow: "0 2px 8px rgba(13,115,119,0.1)" }}>
            <span>✦</span> AI Visual Inspection Platform
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, margin: "0 0 24px", letterSpacing: "-0.03em" }}>
            Visual screening<br />
            <span style={{ background: "linear-gradient(135deg, #0d7377, #14a085)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>of concrete defects</span><br />
            from a single photo
          </h1>
          <p style={{ fontSize: 18, color: "#495057", lineHeight: 1.7, margin: "0 0 36px", maxWidth: 480 }}>
            Upload a construction surface photo — AI detects cracks, spalling, and corrosion in seconds. A preliminary assessment you can verify and save into a report.
          </p>
          <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
            <Link href="/demo" className="btn-hover" style={{ padding: "16px 32px", borderRadius: 12, background: "linear-gradient(135deg, #0d7377, #0a5c5f)", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 16, display: "inline-flex", alignItems: "center", gap: 10, boxShadow: "0 6px 20px rgba(13,115,119,0.3)" }}>
              📷 Try the demo
            </Link>
            <a href="#how" className="btn-hover" style={{ padding: "16px 32px", borderRadius: 12, border: "1px solid #dee2e6", color: "#495057", textDecoration: "none", fontWeight: 600, fontSize: 16, display: "inline-flex", alignItems: "center", gap: 8, background: "#fff" }}>
              How it works →
            </a>
          </div>
          <p style={{ fontSize: 14, color: "#868e96" }}>No registration — just upload a photo</p>
        </div>

        <div className="anim-2 anim-float" style={{ position: "relative" }}>
          <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 30px 60px -15px rgba(0,0,0,0.15)", border: "1px solid rgba(0,0,0,0.06)", background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 20px", borderBottom: "1px solid #e9ecef", background: "#f8f9fa" }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }}></span>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }}></span>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }}></span>
              <span style={{ fontSize: 13, color: "#868e96", marginLeft: 12, fontWeight: 500 }}>Analysis Result</span>
            </div>
            <div style={{ position: "relative", background: "#d4d4d4", aspectRatio: "16/10", overflow: "hidden" }}>
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #c8c8c8 0%, #d8d8d8 50%, #c4c4c4 100%)", position: "relative" }}>
                {speckles.map((s, i) => (
                  <div key={i} style={{ position: "absolute", width: s.w, height: s.h, borderRadius: "50%", background: `rgba(100,100,100,${s.a})`, top: s.t, left: s.l }} />
                ))}
                <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
                  <path d="M 180 80 Q 220 150 200 220 T 240 350 T 280 450" fill="none" stroke="#2d2d2d" strokeWidth="2.5" />
                </svg>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>3 defects found</div>
                <div style={{ fontSize: 13, color: "#868e96" }}>Ensemble v3.0 · 1.2s</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ padding: "5px 12px", borderRadius: 999, background: "#fff0f0", color: "#e03131", fontSize: 12, fontWeight: 700 }}>High · 1</span>
                <span style={{ padding: "5px 12px", borderRadius: 999, background: "#fff8e6", color: "#f08c00", fontSize: 12, fontWeight: 700 }}>Medium · 1</span>
                <div style={{ textAlign: "right", marginLeft: 8 }}>
                  <div style={{ fontSize: 12, color: "#868e96" }}>Accuracy</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0d7377" }}>94%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ padding: "80px 64px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <h2 className="anim-1" style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>How it works</h2>
          <p className="anim-2" style={{ fontSize: 18, color: "#495057", marginBottom: 60, maxWidth: 600, margin: "0 auto 60px" }}>Four steps from photo to engineering report</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {[
              { step: "01", icon: "📸", title: "Upload photo", desc: "Take or upload a photo of any construction surface — concrete, brick, masonry." },
              { step: "02", icon: "🤖", title: "AI detection", desc: "Ensemble of 3 YOLOv8 models detects cracks, spalling, corrosion across surfaces." },
              { step: "03", icon: "✅", title: "Verification", desc: "Confirm or adjust results — human-in-the-loop approach ensures quality." },
              { step: "04", icon: "📄", title: "Get report", desc: "PDF with annotated photos, defect list, dimensions, norms, and recommendations." },
            ].map((item, i) => (
              <div key={item.step} className={`card-hover anim-${i+1}`} style={{ padding: 32, borderRadius: 16, border: "1px solid #e9ecef", textAlign: "left", background: "#fff" }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{item.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0d7377", marginBottom: 12 }}>{item.step}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: "#495057", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Defect types */}
      <section id="types" style={{ padding: "80px 64px", background: "#f8f9fa" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <h2 className="anim-1" style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>Detectable defect types</h2>
          <p className="anim-2" style={{ fontSize: 18, color: "#495057", marginBottom: 60, maxWidth: 600, margin: "0 auto 60px" }}>Our AI ensemble is trained to recognize common structural defects across multiple surface types</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { name: "Cracks", ru: "Трещина", color: "#e03131", desc: "Structural and non-structural cracks in concrete, brick, masonry, and asphalt" },
              { name: "Spalling", ru: "Скол / выкрашивание", color: "#f08c00", desc: "Concrete cover loss, surface spalling, and delamination" },
              { name: "Corrosion", ru: "Коррозия", color: "#7950f2", desc: "Rebar corrosion, rust stains, and oxidation damage" },
              { name: "Scaling", ru: "Разрушение поверхности", color: "#1971c2", desc: "Surface scaling, peeling, and weathering damage" },
              { name: "Exposed rebar", ru: "Оголённая арматура", color: "#e8590c", desc: "Reinforcement bars exposed due to cover loss" },
              { name: "Efflorescence", ru: "Высолы", color: "#2b8a3e", desc: "White mineral deposits indicating moisture infiltration" },
            ].map((d, i) => (
              <div key={d.name} className={`card-hover anim-${i+1}`} style={{ padding: 28, borderRadius: 16, background: "#fff", border: "1px solid #e9ecef", textAlign: "left" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: d.color + "15", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, border: `1px solid ${d.color}30` }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: d.color }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{d.name}</h3>
                <p style={{ fontSize: 13, color: d.color, fontWeight: 600, marginBottom: 8 }}>{d.ru}</p>
                <p style={{ fontSize: 14, color: "#495057", lineHeight: 1.5 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: "80px 64px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 className="anim-1" style={{ textAlign: "center", fontSize: 40, fontWeight: 800, marginBottom: 16 }}>Why InspectAI</h2>
          <p className="anim-2" style={{ textAlign: "center", fontSize: 18, color: "#495057", marginBottom: 60 }}>Built for engineers, not to replace them</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {[
              { icon: "⚡", title: "Fast", desc: "Analysis result in 1–2 seconds on CPU. No waiting or queuing." },
              { icon: "📊", title: "Visual", desc: "Bounding boxes, confidence scores, and color-coded severity markers." },
              { icon: "🔍", title: "Reliable", desc: "Human-in-the-loop: AI suggests, humans verify. Not final without you." },
              { icon: "📱", title: "Convenient", desc: "Works from a phone: take a photo, upload, get result. No app install." },
            ].map((b, i) => (
              <div key={b.title} className={`card-hover anim-${i+1}`} style={{ padding: 28, borderRadius: 16, background: "linear-gradient(135deg, #f8f9fa, #fff)", border: "1px solid #e9ecef", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{b.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{b.title}</h3>
                <p style={{ fontSize: 14, color: "#495057", lineHeight: 1.5 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="cases" style={{ padding: "80px 64px", background: "#f8f9fa" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 className="anim-1" style={{ textAlign: "center", fontSize: 40, fontWeight: 800, marginBottom: 16 }}>Use cases</h2>
          <p className="anim-2" style={{ textAlign: "center", fontSize: 18, color: "#495057", marginBottom: 60 }}>From routine inspections to emergency assessment</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {[
              { icon: "🌉", title: "Bridge inspection", desc: "Routine visual screening of bridge decks, piers, and abutments for cracks and spalling." },
              { icon: "🏗️", title: "Building assessment", desc: "Pre-purchase or post-incident visual assessment of residential and commercial buildings." },
              { icon: "🛣️", title: "Road maintenance", desc: "Pavement crack detection for maintenance planning and budget allocation." },
              { icon: "🏭", title: "Industrial facilities", desc: "Inspection of concrete silos, retaining walls, and industrial structures." },
            ].map((c, i) => (
              <div key={c.title} className={`card-hover anim-${i+1}`} style={{ display: "flex", gap: 20, padding: 28, borderRadius: 16, background: "#fff", border: "1px solid #e9ecef" }}>
                <div style={{ fontSize: 40, flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{c.title}</h3>
                  <p style={{ fontSize: 14, color: "#495057", lineHeight: 1.6 }}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: "80px 64px", background: "#fff" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 className="anim-1" style={{ textAlign: "center", fontSize: 40, fontWeight: 800, marginBottom: 16 }}>FAQ</h2>
          <p className="anim-2" style={{ textAlign: "center", fontSize: 18, color: "#495057", marginBottom: 48 }}>Frequently asked questions</p>
          <div style={{ display: "grid", gap: 12 }}>
            {faqs.map((f, i) => (
              <div key={i} className="anim-3" style={{ borderRadius: 14, border: "1px solid #e9ecef", overflow: "hidden", background: "#fff" }}>
                <div onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ padding: "20px 24px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, fontSize: 16, transition: "background 0.2s", background: openFaq === i ? "#f8f9fa" : "#fff" }}>
                  {f.q}
                  <span style={{ fontSize: 20, color: "#0d7377", transition: "transform 0.3s", transform: openFaq === i ? "rotate(180deg)" : "none" }}>▾</span>
                </div>
                {openFaq === i && (
                  <div style={{ padding: "0 24px 20px", fontSize: 15, color: "#495057", lineHeight: 1.6, animation: "fadeIn 0.3s ease-out" }}>{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "100px 64px", textAlign: "center", background: "linear-gradient(135deg, #0d7377, #0a5c5f)" }}>
        <h2 className="anim-1" style={{ fontSize: 44, fontWeight: 800, color: "#fff", marginBottom: 20 }}>Ready to inspect?</h2>
        <p className="anim-2" style={{ fontSize: 18, color: "#e6f4f1", marginBottom: 36, maxWidth: 500, margin: "0 auto 36px" }}>Upload your first photo and get a detailed engineering analysis in seconds.</p>
        <Link href="/demo" className="btn-hover" style={{ padding: "18px 40px", borderRadius: 12, background: "#fff", color: "#0d7377", textDecoration: "none", fontWeight: 700, fontSize: 17, display: "inline-block", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>Start inspection →</Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: "40px 64px", background: "#1a1a2e", color: "#868e96", fontSize: 14 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, background: "#0d7377", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>I</div>
            <span style={{ fontWeight: 700, color: "#e9ecef" }}>InspectAI</span>
          </div>
          <div>AI-powered defect detection · Ensemble v3.0</div>
          <div>© 2026 InspectAI</div>
        </div>
      </footer>
    </div>
  );
}
