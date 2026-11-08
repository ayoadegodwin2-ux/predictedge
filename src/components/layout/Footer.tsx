"use client";

import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";

export function Footer() {
  const [currentYear, setCurrentYear] = useState("2026");

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentYear(String(new Date().getFullYear()));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gold-500/10">
              <TrendingUp className="h-3.5 w-3.5 text-gold-400" />
            </div>
            <span className="font-heading text-sm font-semibold text-slate-300">
              Predict<span className="text-gold-400">Edge</span>
            </span>
          </div>

          {/* Tagline */}
          <p className="text-sm text-slate-500 text-center">
            Data-driven predictions, delivered daily.
          </p>

          {/* Copyright */}
          <p className="text-xs text-slate-600">
            &copy; {currentYear} PredictEdge
          </p>
        </div>
      </div>
    </footer>
  );
}
