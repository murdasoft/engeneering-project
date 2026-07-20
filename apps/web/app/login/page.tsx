"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { InteractiveGrid } from "@/app/components/interactive-grid";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: Visual Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <InteractiveGrid className="z-0" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-on-primary pointer-events-none">
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
              Structural intelligence,<br />powered by AI.
            </h1>
            <p className="font-body-md text-body-md text-primary-fixed-dim max-w-md">
              Upload inspection photos, run AI-powered defect detection, review findings,
              and generate engineering reports — all in one platform.
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-md pt-4">
              {[
                { icon: "psychology", label: "AI Analysis" },
                { icon: "fact_check", label: "Review Queue" },
                { icon: "description", label: "PDF Reports" },
                { icon: "cloud_upload", label: "Batch Upload" },
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

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center bg-surface p-8">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary text-on-primary flex items-center justify-center font-bold text-xl rounded">
              I
            </div>
            <span className="font-bold text-2xl tracking-tight text-primary">InspectAI</span>
          </div>

          <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Welcome back</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-8">
            Sign in to your engineering console.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                placeholder="engineer@inspectai.dev"
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
                className="w-full px-md py-md bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none transition-colors"
                placeholder="••••••••"
              />
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
                  SIGNING IN...
                </>
              ) : (
                "SIGN IN"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-outline-variant">
            <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
              No account?{" "}
              <Link href="/register" className="text-primary font-bold hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
