"use client";

import { useState } from "react";
import type { Prediction } from "@/lib/types";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import {
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Send,
  Flame,
} from "lucide-react";

interface DailyPickHeroProps {
  prediction: Prediction;
}

export function DailyPickHero({ prediction }: DailyPickHeroProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `🔥 Daily Pick: ${prediction.homeTeam} vs ${prediction.awayTeam}\n🏆 Market: ${prediction.market} @ ${prediction.odds.toFixed(2)}\n🎯 Algorithm Certainty: ${prediction.confidence}%\n📅 Kickoff: 20:00 UTC`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
      {/* Subtle background glow */}
      <div className="absolute -top-12 left-1/2 -z-10 h-72 w-full max-w-2xl -translate-x-1/2 rounded-full bg-gradient-to-r from-gold-500/10 via-green-500/15 to-gold-500/10 blur-3xl" />

      {/* Hero Container */}
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
        {/* Top Announcement Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/70 px-6 py-3.5 sm:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-green-400">
              Verified Daily Selection
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-xs text-slate-400">
              8:00 AM Automated Algorithm Slate
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Clock className="h-3.5 w-3.5 text-gold-400" />
            <span>Kickoff: 20:00 UTC</span>
          </div>
        </div>

        {/* Main Card Body */}
        <div className="p-6 sm:p-8 lg:p-10">
          {/* League & Meta Pill */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-800/60 px-3.5 py-1.5 text-xs font-medium text-slate-300">
              <span className="text-base">{prediction.countryFlag}</span>
              <span className="font-semibold text-slate-200">{prediction.league}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{prediction.country}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-300">
              <Flame className="h-3.5 w-3.5 text-gold-400" />
              <span>#1 Weekday Pick</span>
            </div>
          </div>

          {/* Teams Matchup Showcase */}
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            {/* Left Col: Match & Teams */}
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Featured Matchup
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  {/* Home Team */}
                  <div className="flex items-center gap-3.5 flex-1 min-h-[44px]">
                    <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/80 shadow-md">
                      <span className="font-heading text-lg font-extrabold text-slate-100">
                        RM
                      </span>
                    </div>
                    <div>
                      <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                        {prediction.homeTeam}
                      </h2>
                      <p className="text-xs font-medium text-slate-400">Home Advantage</p>
                    </div>
                  </div>

                  {/* VS badge */}
                  <div className="flex items-center justify-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-950 font-heading text-xs font-bold text-gold-400 shadow-inner">
                      VS
                    </span>
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center gap-3.5 flex-1 min-h-[44px]">
                    <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/80 shadow-md">
                      <span className="font-heading text-lg font-extrabold text-slate-100">
                        FCB
                      </span>
                    </div>
                    <div>
                      <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                        {prediction.awayTeam}
                      </h2>
                      <p className="text-xs font-medium text-slate-400">Away Contender</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean White/Light Panels for Market and Odds (Human Design System) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Specific Market Panel */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-lg transition-smooth hover:shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Approved Market
                    </span>
                    <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Market #6
                    </span>
                  </div>
                  <div className="font-heading text-2xl font-black text-slate-900 tracking-tight">
                    {prediction.market}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 font-medium">
                    Strict mathematical model: Full Time goal threshold
                  </p>
                </div>

                {/* Odds Panel */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-lg transition-smooth hover:shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Target Odds
                    </span>
                    <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      1.30 – 1.50 Window
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading text-3xl font-black text-slate-900 tracking-tight">
                      {prediction.odds.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Decimal Odds
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 font-medium">
                    High expected value within safety constraints
                  </p>
                </div>
              </div>
            </div>

            {/* Right Col: Confidence Progress Ring */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/60 p-6 sm:p-8 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                Algorithm Certainty
              </span>

              {/* Circular Progress Ring */}
              <ConfidenceBadge
                score={prediction.confidence}
                variant="ring"
                size="lg"
                showLabel={true}
              />

              {/* Sub-breakdown metrics */}
              <div className="mt-6 w-full space-y-2.5 border-t border-slate-800/80 pt-5 text-left text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Recent Form (5 Matches)</span>
                  <span className="font-bold text-green-400">96 / 100</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Head-to-Head Trend</span>
                  <span className="font-bold text-gold-400">92 / 100</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">xG Goal Average</span>
                  <span className="font-bold text-slate-100">3.2 per match</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row & Native-App Touch Target Controls */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80 pt-6">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
              <span>Passed all 13 proprietary safety filters &amp; league restrictions</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopy}
                className="flex w-full sm:w-auto items-center justify-center gap-2 min-h-[46px] rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-700 hover:text-white transition-smooth focus-visible:ring-2 focus-visible:ring-gold-400 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-400" />
                    <span>Copied Pick!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-slate-400" />
                    <span>Copy Selection</span>
                  </>
                )}
              </button>

              <a
                href={process.env.NEXT_PUBLIC_TELEGRAM_GROUP_LINK || "https://t.me/predictedge"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full sm:w-auto items-center justify-center gap-2 min-h-[46px] rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition-smooth cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>Join our Telegram Group</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

