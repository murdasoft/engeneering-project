"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone, company, position }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Account created but login failed. Please sign in.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: Visual Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 technical-grid" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-on-primary">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-on-primary text-primary flex items-center justify-center font-bold text-xl rounded">
                I
              </div>
              <span className="font-bold text-2xl tracking-tight">InspectAI</span>
            </div>
            <p className="font-label-caps text-label-caps text-primary-fixed-dim mt-1">ENGINEERING HUB</p>
          </div>

          <div className="space-y-6">
            <h1 className="font-display-lg text-display-lg leading-tight">
              Join the platform<br />built for engineers.
            </h1>
            <p className="font-body-md text-body-md text-primary-fixed-dim max-w-md">
              Create projects, upload inspection photos, run AI-powered defect detection,
              and generate professional engineering reports.
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-md pt-4">
              {[
                { icon: "dashboard", label: "Project Dashboard" },
                { icon: "psychology", label: "AI Defect Detection" },
                { icon: "fact_check", label: "Human-in-the-loop Review" },
                { icon: "description", label: "PDF Reports" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 text-primary-fixed-dim">
                  <span className="material-symbols-outlined text-[20px]">{f.icon}</span>
                  <span className="font-label-caps text-label-caps">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="font-label-caps text-[10px] text-primary-fixed-dim opacity-60">
            © 2025 InspectAI. Engineering Precision Guaranteed.
          </p>
        </div>
      </div>

      {/* Right: Register Form */}
      <div className="flex-1 flex items-center justify-center bg-surface p-8">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary text-on-primary flex items-center justify-center font-bold text-xl rounded">
              I
            </div>
            <span className="font-bold text-2xl tracking-tight text-primary">InspectAI</span>
          </div>

          <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Create account</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-8">
            Start your engineering journey with InspectAI.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                FULL NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-md py-md bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none transition-colors"
                placeholder="John Engineer"
              />
            </div>

            <div>
              <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-md py-md bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none transition-colors"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={ 8 }
                className="w-full px-md py-md bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none transition-colors"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={ 8 }
                className="w-full px-md py-md bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none transition-colors"
                placeholder="Repeat your password"
              />
            </div>

            <div>
              <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                PHONE (OPTIONAL)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-md py-md bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none transition-colors"
                placeholder="+7 777 123 45 67"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                  COMPANY (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-md py-md bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none transition-colors"
                  placeholder="LLC Engineering"
                />
              </div>
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                  POSITION (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-md py-md bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none transition-colors"
                  placeholder="Structural Engineer"
                />
              </div>
            </div>

            {error && (
              <div className="p-sm bg-error-container text-on-error-container rounded-lg font-body-sm text-body-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-md bg-primary text-on-primary font-label-caps text-label-caps rounded-lg hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  CREATING...
                </>
              ) : (
                "CREATE ACCOUNT"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-outline-variant">
            <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
