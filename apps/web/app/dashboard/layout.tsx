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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const NavLink = ({
    item,
    onClick,
    isTool,
  }: {
    item: { href: string; icon: string; label: string };
    onClick?: () => void;
    isTool?: boolean;
  }) => {
    const active = isTool ? pathname.startsWith(item.href) : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
    return (
      <Link
        href={item.href}
        onClick={onClick}
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
  };

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      <nav className="flex-1 space-y-1 px-sm overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={onItemClick} />
        ))}

        <div className="pt-lg pb-xs">
          <p className="px-gutter font-label-caps text-[10px] text-outline uppercase tracking-wider">Engineering Tools</p>
        </div>
        {toolItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={onItemClick} isTool />
        ))}
      </nav>

      <div className="mt-auto px-gutter pt-lg border-t border-outline-variant">
        <Link
          href="/dashboard/upload"
          onClick={onItemClick}
          className="w-full mb-lg py-sm bg-primary text-on-primary font-label-caps text-label-caps rounded-lg flex items-center justify-center gap-xs hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          NEW INSPECTION
        </Link>
        <div className="space-y-1">
          <Link
            href="/dashboard/settings"
            onClick={onItemClick}
            className="flex items-center gap-md py-sm text-on-surface-variant hover:text-primary font-label-caps text-label-caps transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            Settings
          </Link>
          <button
            onClick={() => {
              onItemClick?.();
              signOut({ callbackUrl: "/login" });
            }}
            className="w-full flex items-center gap-md py-sm text-on-surface-variant hover:text-error font-label-caps text-label-caps transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );

  const Logo = () => (
    <Link href="/dashboard" className="flex items-center gap-2">
      <div className="w-9 h-9 bg-primary text-on-primary flex items-center justify-center font-bold text-lg rounded">I</div>
      <span className="font-headline-md text-headline-md font-bold text-primary">InspectAI</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:h-screen md:w-64 md:fixed md:left-0 md:top-0 bg-surface-container flex-col py-lg border-r border-outline-variant z-50">
        <div className="px-gutter mb-xl">
          <Logo />
        </div>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 w-64 max-w-[80vw] bg-surface-container flex flex-col py-lg border-r border-outline-variant z-50 md:hidden">
            <div className="px-gutter mb-xl flex items-center justify-between">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="text-on-surface-variant p-1">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <SidebarContent onItemClick={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-screen md:ml-64 relative">
        {/* Top Bar */}
        <header className="h-16 sticky top-0 bg-surface/90 backdrop-blur-sm border-b border-outline-variant z-40 flex items-center justify-between px-margin-mobile md:px-margin-desktop">
          <div className="flex items-center gap-sm min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden -ml-2 p-2 text-on-surface-variant"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="font-label-caps text-label-caps text-on-surface-variant hidden sm:inline">ENGINEERING CONSOLE</span>
          </div>
          <div className="flex items-center gap-md shrink-0">
            <div className="flex items-center gap-xs text-primary font-label-caps text-[11px]">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              LIVE
            </div>
            <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs">
              {userName[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-margin-mobile md:p-margin-desktop">{children}</div>
      </main>
    </div>
  );
}
