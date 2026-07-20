"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/dashboard/projects", icon: "folder", label: "Projects" },
  { href: "/dashboard/upload", icon: "cloud_upload", label: "Upload Assets" },
  { href: "/dashboard/analysis", icon: "psychology", label: "Analysis Engine" },
  { href: "/dashboard/review", icon: "fact_check", label: "Review Queue" },
  { href: "/dashboard/reports", icon: "description", label: "Final Reports" },
  { href: "/dashboard/tools", icon: "construction", label: "Engineering Tools" },
  { href: "/dashboard/knowledge", icon: "menu_book", label: "Knowledge Base" },
];

const toolItems = [
  { href: "/dashboard/tools/crackcalc", icon: "show_chart", label: "CrackCalc" },
  { href: "/dashboard/tools/loadbear", icon: "foundation", label: "LoadBear" },
  { href: "/dashboard/tools/concretemix", icon: "science", label: "ConcreteMix" },
  { href: "/dashboard/tools/rebardesign", icon: "grid_4x4", label: "RebarDesign" },
  { href: "/dashboard/tools/normbase", icon: "gavel", label: "NormBase" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router, mounted]);

  if (!mounted || status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <span className="material-symbols-outlined text-primary text-[48px] animate-spin">progress_activity</span>
      </div>
    );
  }

  const userName = session.user?.name ?? session.user?.email?.split("@")[0] ?? "User";

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container flex flex-col py-lg border-r border-outline-variant z-50">
        <div className="px-gutter mb-xl">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary text-on-primary flex items-center justify-center font-bold text-lg rounded">
              I
            </div>
            <span className="font-headline-md text-headline-md font-bold text-primary">InspectAI</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-sm overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-md px-gutter py-md font-label-caps text-label-caps transition-all ${
                  active
                    ? "bg-primary-container text-on-primary-container border-l-4 border-primary font-bold"
                    : "text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={active ? { fontVariationSettings: "'FILL' 1, 'wght' 400" } : undefined}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}

          <div className="pt-lg pb-xs">
            <p className="px-gutter font-label-caps text-[10px] text-outline uppercase tracking-wider">Engineering Tools</p>
          </div>
          {toolItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-md px-gutter py-md font-label-caps text-label-caps transition-all ${
                  active
                    ? "bg-primary-container text-on-primary-container border-l-4 border-primary font-bold"
                    : "text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={active ? { fontVariationSettings: "'FILL' 1, 'wght' 400" } : undefined}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-gutter pt-lg border-t border-outline-variant">
          <Link
            href="/dashboard/upload"
            className="w-full mb-lg py-sm bg-primary text-on-primary font-label-caps text-label-caps rounded-lg flex items-center justify-center gap-xs hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            NEW INSPECTION
          </Link>
          <div className="space-y-1">
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-md py-sm text-on-surface-variant hover:text-primary font-label-caps text-label-caps transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              Settings
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-md py-sm text-on-surface-variant hover:text-error font-label-caps text-label-caps transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen relative">
        {/* Top Bar */}
        <header className="h-16 sticky top-0 bg-surface/90 backdrop-blur-sm border-b border-outline-variant z-40 flex items-center justify-between px-margin-desktop">
          <div className="flex items-center gap-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant">ENGINEERING CONSOLE</span>
          </div>
          <div className="flex items-center gap-md">
            <div className="flex items-center gap-xs text-primary font-label-caps text-[11px]">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              LIVE
            </div>
            <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs">
              {userName[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-margin-desktop">{children}</div>
      </main>
    </div>
  );
}
