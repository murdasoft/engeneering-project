"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/#services", label: "Услуги" },
  { href: "/#tools", label: "Инструменты" },
  { href: "/#process", label: "Как мы работаем" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/#projects", label: "Проекты" },
  { href: "/#contact", label: "Контакты" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "glass py-3" : "py-5 bg-transparent"
      )}
    >
      <div className="container-max flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-eng-700 flex items-center justify-center font-display font-bold text-white text-lg group-hover:scale-105 transition-transform">
            E
          </div>
          <span className="font-display font-bold text-xl text-white">
            Eng<span className="gradient-text">AI</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-slate-400 hover:text-white transition-colors font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href="https://inspectai-app-coral.vercel.app" target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm">
            InspectAI
          </a>
          <Link href="/#contact" className="btn-primary text-sm">
            Оставить заявку
          </Link>
        </div>

        <button
          className="md:hidden text-slate-300 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass mt-3 mx-4 rounded-xl p-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-slate-300 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <a href="https://inspectai-app-coral.vercel.app" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="btn-ghost text-sm text-center">
            InspectAI
          </a>
          <Link href="/#contact" onClick={() => setMobileOpen(false)} className="btn-primary text-sm text-center">
            Оставить заявку
          </Link>
        </div>
      )}
    </header>
  );
}
