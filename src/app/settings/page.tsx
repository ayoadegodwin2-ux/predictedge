"use client";

import Link from "next/link";
import { Lock, ShieldAlert, ArrowRight } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-center backdrop-blur-xl shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 mb-4 shadow-lg shadow-purple-500/10">
          <Lock className="h-7 w-7" />
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase text-purple-400 mb-2">
          <ShieldAlert className="h-4 w-4" />
          <span>Restricted Admin Area</span>
        </div>
        <h1 className="font-heading text-2xl font-black text-white">
          Settings Access Restricted
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
          The 13-market and 54-country engine configuration controls have been moved strictly into the password-protected Super Admin Dashboard.
        </p>

        <div className="mt-6">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500 hover:bg-purple-400 px-5 py-3 font-heading text-xs font-bold text-white shadow-lg shadow-purple-500/20 transition-smooth"
          >
            <span>Proceed to Admin Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
