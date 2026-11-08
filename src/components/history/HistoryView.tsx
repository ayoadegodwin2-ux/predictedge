"use client";

import { useState, useMemo } from "react";
import type { HistoricalPredictionItem, AccuracySummary } from "@/lib/engine/history-shared";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import {
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Percent,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryViewProps {
  initialHistory: HistoricalPredictionItem[];
  daysList: Array<{
    dateStr: string;
    displayLabel: string;
    dayOfWeek: string;
    isToday: boolean;
  }>;
  accuracy: AccuracySummary;
}

export function HistoryView({ initialHistory, daysList, accuracy }: HistoryViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [selectedResult, setSelectedResult] = useState<"all" | "WON" | "LOST" | "PENDING">("all");

  const filteredHistory = useMemo(() => {
    return initialHistory.filter((item) => {
      const matchDate = selectedDate === "all" || item.predictionDate === selectedDate;
      const matchResult = selectedResult === "all" || item.result === selectedResult;
      return matchDate && matchResult;
    });
  }, [initialHistory, selectedDate, selectedResult]);

  return (
    <div className="space-y-8">
      {/* 14-Day Accuracy & Verification Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Win Rate Card */}
        <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/80 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              14-Day Win Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Percent className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-3xl font-extrabold text-emerald-400">
              {accuracy.winRatePct}%
            </span>
            <span className="text-xs font-semibold text-slate-400">
              ({accuracy.wonCount}W – {accuracy.lostCount}L)
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Verified across all completed selections
          </p>
        </div>

        {/* Total Predictions Tracked */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Records Tracked
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/10">
              <Calendar className="h-4 w-4 text-gold-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-3xl font-extrabold text-white">
              {accuracy.totalPicks}
            </span>
            <span className="text-xs font-semibold text-gold-400">
              ({accuracy.pendingCount} Pending)
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Rolling 14-day transparent archive
          </p>
        </div>

        {/* Average Odds */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Average Odds
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-3xl font-extrabold text-white">
              {accuracy.averageOdds.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-400">Decimal</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Disciplined risk management window
          </p>
        </div>

        {/* Estimated ROI */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Estimated ROI
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
              <ArrowUpRight className="h-4 w-4 text-purple-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-3xl font-extrabold text-purple-400">
              +{accuracy.roiPct}%
            </span>
            <span className="text-xs font-semibold text-slate-400">Flat Stake</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Theoretical yield over 14 days
          </p>
        </div>
      </div>

      {/* 14-Day Date Selector & Result Filter Bar */}
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gold-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Select Date from Past 14 Days:
            </span>
          </div>

          {/* Result Filter Tabs (min 44px touch targets) */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(["all", "WON", "LOST", "PENDING"] as const).map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => setSelectedResult(res)}
                className={cn(
                  "min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-smooth shrink-0 cursor-pointer",
                  selectedResult === res
                    ? res === "WON"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : res === "LOST"
                      ? "bg-red-500/20 text-red-300 border border-red-500/40"
                      : res === "PENDING"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-slate-800 text-white border border-slate-700"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {res === "all" ? "All Results" : res}
              </button>
            ))}
          </div>
        </div>

        {/* Rolling 14-Day Date Pills (>=44px touch targets) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          <button
            type="button"
            onClick={() => setSelectedDate("all")}
            className={cn(
              "min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-smooth cursor-pointer",
              selectedDate === "all"
                ? "bg-gold-500 text-slate-950 shadow-sm"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            )}
          >
            All 14 Days
          </button>

          {daysList.map((day) => (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => setSelectedDate(day.dateStr)}
              className={cn(
                "min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-smooth cursor-pointer",
                selectedDate === day.dateStr
                  ? "bg-gold-500 text-slate-950 shadow-sm"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              )}
            >
              <span>{day.displayLabel}</span>
              {day.isToday && (
                <span className="ml-1.5 rounded-md bg-green-500/20 px-1.5 py-0.5 text-[10px] font-bold text-green-300">
                  Live
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* History Records Table / List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1 text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{filteredHistory.length}</strong> verified historical records
          </span>
          <span className="text-slate-500">Immutable algorithm logs</span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-900/80">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th scope="col" className="py-3.5 pl-6 pr-4">
                    Date &amp; Kickoff
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Matchup
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    League
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Market
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-right">
                    Odds
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-center">
                    Certainty
                  </th>
                  <th scope="col" className="py-3.5 pr-6 pl-4 text-right">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-body">
                {filteredHistory.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={cn(
                      "min-h-[52px] transition-colors hover:bg-slate-800/50",
                      idx % 2 === 0 ? "bg-slate-950" : "bg-slate-900/40"
                    )}
                  >
                    <td className="py-4 pl-6 pr-4 text-xs font-semibold text-slate-300">
                      <div>{item.predictionDate}</div>
                      <span className="text-[11px] text-slate-500">20:00 UTC</span>
                    </td>

                    <td className="py-4 px-4 font-medium">
                      <div className="flex items-center gap-2 font-heading font-bold text-slate-100">
                        <span>{item.homeTeam}</span>
                        <span className="text-xs text-slate-500 font-normal">vs</span>
                        <span>{item.awayTeam}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span>{item.countryFlag}</span>
                        <span>{item.leagueName}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-200">
                        {item.market}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right font-heading text-sm font-extrabold text-white">
                      {item.odds.toFixed(2)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <ConfidenceBadge
                        score={item.confidenceScore}
                        variant="compact"
                        showLabel={false}
                      />
                    </td>

                    <td className="py-4 pr-6 pl-4 text-right">
                      {item.result === "WON" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>WON</span>
                        </span>
                      )}
                      {item.result === "LOST" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>LOST</span>
                        </span>
                      )}
                      {item.result === "PENDING" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
                          <Clock className="h-3.5 w-3.5" />
                          <span>PENDING</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards View (>=44px touch targets) */}
        <div className="block md:hidden space-y-3">
          {filteredHistory.map((item, idx) => (
            <div
              key={item.id}
              className={cn(
                "rounded-2xl border border-slate-800 p-4 transition-smooth",
                idx % 2 === 0 ? "bg-slate-950" : "bg-slate-900/60"
              )}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>{item.predictionDate}</span>
                <div className="flex items-center gap-1.5">
                  <span>{item.countryFlag}</span>
                  <span className="font-semibold text-slate-300">{item.leagueName}</span>
                </div>
              </div>

              <div className="font-heading text-base font-bold text-white mb-2.5">
                {item.homeTeam} vs {item.awayTeam}
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                <span className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-200">
                  {item.market} @ {item.odds.toFixed(2)}
                </span>

                <div className="flex items-center gap-2">
                  <ConfidenceBadge
                    score={item.confidenceScore}
                    variant="compact"
                    showLabel={false}
                  />

                  {item.result === "WON" && (
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-400">
                      WON
                    </span>
                  )}
                  {item.result === "LOST" && (
                    <span className="rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-1 text-xs font-bold text-red-400">
                      LOST
                    </span>
                  )}
                  {item.result === "PENDING" && (
                    <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-xs font-bold text-amber-400">
                      PENDING
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
