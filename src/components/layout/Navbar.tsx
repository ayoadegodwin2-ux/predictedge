"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, TrendingUp, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Daily Pick" },
  { href: "/top-15", label: "Top 15 Picks" },
  { href: "/weekend-50", label: "Weekend 15" },
  { href: "/history", label: "History & Accuracy" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/10 group-hover:bg-gold-500/20 transition-smooth">
            <TrendingUp className="h-4.5 w-4.5 text-gold-400" />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight text-slate-50">
            Predict<span className="text-gold-400">Edge</span>
          </span>
        </Link>

        {/* Desktop nav & Telegram */}
        <div className="hidden md:flex items-center gap-3">
          <ul className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "relative px-3.5 py-2 text-sm font-medium rounded-lg transition-smooth",
                      isActive
                        ? "text-gold-400 bg-gold-500/10"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-gold-400" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <a
            href={process.env.NEXT_PUBLIC_TELEGRAM_GROUP_LINK || "https://t.me/predictedge"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 px-4 py-2 font-heading text-xs font-bold text-white shadow-md shadow-sky-500/20 transition-smooth cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Join our Telegram Group</span>
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex items-center justify-center h-10 w-10 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-smooth"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl">
          <ul className="flex flex-col px-4 py-4 gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block px-4 py-3 text-base font-medium rounded-lg transition-smooth",
                      isActive
                        ? "text-gold-400 bg-gold-500/10"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="px-4 pb-4">
            <a
              href={process.env.NEXT_PUBLIC_TELEGRAM_GROUP_LINK || "https://t.me/predictedge"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 font-heading text-sm font-bold text-white shadow-md shadow-sky-500/20"
            >
              <Send className="h-4 w-4" />
              <span>Join our Telegram Group</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
