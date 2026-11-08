"use client";

import { Crown, Sparkles, Trophy, CheckCircle2, XCircle } from "lucide-react";
import type { Prediction } from "@/lib/types";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";

interface Top15PicksGridProps {
  picks: Prediction[];
  isPreviousWeekend?: boolean;
}

export function Top15PicksGrid({ picks, isPreviousWeekend = false }: Top15PicksGridProps) {
  const top15 = picks.slice(0, 15);

  const formatMatchTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const day = date.toLocaleDateString("en-US", { weekday: "short" });
      const time = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return `${day} ${time}`;
    } catch {
      return "Sat 15:00";
    }
  };

  return (
    <div className="mb-10 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gold-500/30 bg-gradient-to-r from-gold-500/10 via-slate-900/90 to-slate-900/90 p-4 sm:p-5 backdrop-blur-md shadow-lg shadow-gold-500/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-amber-600 text-slate-950 shadow-md shadow-gold-500/20">
            <Crown className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Picks of the Weekend
              </h2>
              <span className="rounded-full bg-gold-400/20 border border-gold-400/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-gold-300">
                Top 15 Tier
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              The 15 highest-confidence algorithm selections isolated from the 50-game slate.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 rounded-lg border border-gold-500/20 bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-gold-300">
            <Trophy className="h-3.5 w-3.5 text-gold-400" />
            <span>90%+ Win Certainty Tier</span>
          </div>
        </div>
      </div>

      {/* 15 Visual Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {top15.map((pick, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;

          return (
            <div
              key={pick.id || index}
              className={`relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-200 hover:translate-y-[-2px] ${
                isTop3
                  ? "border-gold-500/40 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 shadow-lg shadow-gold-500/5 hover:border-gold-400"
                  : "border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              {/* Card Header: Rank Pill, Country/League, Kickoff */}
              <div className="flex items-center justify-between text-xs mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-lg font-heading text-xs font-black ${
                      isTop3
                        ? "bg-gradient-to-br from-gold-400 to-amber-500 text-slate-950 shadow-sm"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    #{rank}
                  </span>
                  <span className="text-sm">{pick.countryFlag}</span>
                  <span className="truncate max-w-[120px] font-medium text-slate-400">
                    {pick.league}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  {formatMatchTime(pick.kickoff)}
                </span>
              </div>

              {/* Matchup */}
              <div className="my-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-heading text-base font-extrabold text-white truncate">
                    {pick.homeTeam}
                  </span>
                  {isPreviousWeekend && pick.finalScore && (
                    <span className="shrink-0 rounded-md border border-slate-700 bg-slate-950 px-2 py-0.5 font-heading text-xs font-bold text-white">
                      {pick.finalScore}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">vs</span>
                  <span className="font-heading text-sm font-semibold text-slate-300 truncate">
                    {pick.awayTeam}
                  </span>
                </div>
              </div>

              {/* Market Badge with Clean White Panel Styling */}
              <div className="mt-3 mb-4 rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                  <span>Selected Market</span>
                  <Sparkles className="h-3 w-3 text-gold-400" />
                </div>
                <div className="font-heading text-xs sm:text-sm font-bold text-slate-100 truncate">
                  {pick.market}
                </div>
              </div>

              {/* Card Footer: Odds + Confidence Ring or Graded Outcome */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Decimal Odds
                  </span>
                  <span className="font-heading text-lg font-black text-gold-400 tracking-tight">
                    {pick.odds.toFixed(2)}
                  </span>
                </div>

                <div>
                  {isPreviousWeekend ? (
                    pick.result === "WON" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-400 shadow-sm shadow-emerald-500/20">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        WON
                      </span>
                    ) : pick.result === "LOST" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-black text-rose-400 shadow-sm shadow-rose-500/20">
                        <XCircle className="h-4 w-4 text-rose-400" />
                        LOST
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400">
                        PENDING
                      </span>
                    )
                  ) : (
                    <div className="flex items-center gap-2">
                      <ConfidenceBadge
                        score={pick.confidence}
                        variant="compact"
                        showLabel={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

