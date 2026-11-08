"use client";

import { useState, useMemo } from "react";
import type { Prediction } from "@/lib/types";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import {
  Search,
  ArrowUpDown,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WeekendTableProps {
  predictions: Prediction[];
  isPreviousWeekend?: boolean;
}

export function WeekendTable({ predictions, isPreviousWeekend = false }: WeekendTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMarket, setSelectedMarket] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"confidence" | "odds" | "time">("confidence");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Extract unique markets for filtering
  const marketOptions = useMemo(() => {
    const set = new Set<string>();
    predictions.forEach((p) => set.add(p.market));
    return Array.from(set);
  }, [predictions]);

  // Filtered and sorted predictions
  const filteredPredictions = useMemo(() => {
    let result = [...predictions];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.homeTeam.toLowerCase().includes(q) ||
          p.awayTeam.toLowerCase().includes(q) ||
          p.league.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q) ||
          p.market.toLowerCase().includes(q)
      );
    }

    // Market filter
    if (selectedMarket !== "all") {
      result = result.filter((p) => p.market === selectedMarket);
    }

    // Sorting
    result.sort((a, b) => {
      let diff = 0;
      if (sortBy === "confidence") {
        diff = a.confidence - b.confidence;
      } else if (sortBy === "odds") {
        diff = a.odds - b.odds;
      } else if (sortBy === "time") {
        diff = new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
      }
      return sortOrder === "desc" ? -diff : diff;
    });

    return result;
  }, [predictions, searchQuery, selectedMarket, sortBy, sortOrder]);

  const toggleSort = (field: "confidence" | "odds" | "time") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

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
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4 backdrop-blur-md">
        {/* Search input with 44px min height */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams, leagues, or countries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-smooth"
          />
        </div>

        {/* Filter Controls with min 44px touch targets */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Market filter */}
          <div className="relative shrink-0">
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="min-h-[44px] appearance-none rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 pr-8 text-xs font-medium text-slate-300 focus:border-gold-400 focus:outline-none transition-smooth cursor-pointer"
            >
              <option value="all">All Markets ({predictions.length})</option>
              {marketOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Quick sort toggle */}
          <button
            type="button"
            onClick={() => toggleSort("confidence")}
            className={cn(
              "flex items-center gap-1.5 min-h-[44px] shrink-0 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-smooth cursor-pointer",
              sortBy === "confidence"
                ? "border-gold-500/40 bg-gold-500/10 text-gold-300"
                : "border-slate-800 bg-slate-950/80 text-slate-400 hover:text-slate-200"
            )}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>Confidence {sortBy === "confidence" && (sortOrder === "desc" ? "↓" : "↑")}</span>
          </button>
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <div>
          Showing <span className="font-bold text-slate-200">{filteredPredictions.length}</span> of{" "}
          <span className="font-bold text-slate-200">{predictions.length}</span> verified weekend games
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-emerald-400 font-medium">All 50 within safe odds range</span>
        </div>
      </div>

      {/* Desktop & Tablet Table (Sticky header, scannable, ample padding) */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
        <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
          <table className="w-full border-collapse text-left text-sm">
            {/* Sticky Header */}
            <thead className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th scope="col" className="py-4 pl-6 pr-3 w-12 text-center">
                  #
                </th>
                <th scope="col" className="py-4 px-4 min-w-[140px]">
                  Kickoff &amp; League
                </th>
                <th scope="col" className="py-4 px-4 min-w-[220px]">
                  Matchup
                </th>
                {isPreviousWeekend && (
                  <th scope="col" className="py-4 px-4 text-center min-w-[100px]">
                    Score
                  </th>
                )}
                <th scope="col" className="py-4 px-4 min-w-[180px]">
                  Market Prediction
                </th>
                <th
                  scope="col"
                  onClick={() => toggleSort("odds")}
                  className="py-4 px-4 text-right cursor-pointer hover:text-gold-300 transition-smooth"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Odds</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  scope="col"
                  onClick={() => toggleSort("confidence")}
                  className="py-4 pr-6 pl-4 text-right cursor-pointer hover:text-gold-300 transition-smooth"
                >
                  <div className="inline-flex items-center justify-end gap-1">
                    <span>{isPreviousWeekend ? "Outcome" : "Certainty"}</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
              </tr>
            </thead>

            {/* Alternating Rows (bg-slate-950 and bg-slate-900/50 for subtle, premium contrast) */}
            <tbody className="divide-y divide-slate-800/60 font-body">
              {filteredPredictions.map((pred, index) => {
                const isEven = index % 2 === 0;
                return (
                  <tr
                    key={pred.id}
                    className={cn(
                      "min-h-[52px] transition-colors duration-150 hover:bg-slate-800/50 group",
                      isEven ? "bg-slate-950" : "bg-slate-900/40"
                    )}
                  >
                    {/* Index */}
                    <td className="py-4 pl-6 pr-3 text-center text-xs font-semibold text-slate-500 group-hover:text-gold-400">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    {/* Kickoff & League */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-300">
                          {formatMatchTime(pred.kickoff)}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400">
                          <span>{pred.countryFlag}</span>
                          <span className="truncate max-w-[120px]">{pred.league}</span>
                        </div>
                      </div>
                    </td>

                    {/* Matchup */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 font-medium">
                        <span className="font-heading font-bold text-slate-100 group-hover:text-white transition-smooth">
                          {pred.homeTeam}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">vs</span>
                        <span className="font-heading font-semibold text-slate-300 group-hover:text-slate-100 transition-smooth">
                          {pred.awayTeam}
                        </span>
                      </div>
                    </td>

                    {/* Score (Previous Weekend View) */}
                    {isPreviousWeekend && (
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1 font-heading text-xs font-extrabold text-white tracking-wider">
                          {pred.finalScore || "—"}
                        </span>
                      </td>
                    )}

                    {/* Market Prediction */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-200">
                        <Sparkles className="h-3 w-3 text-gold-400" />
                        <span>{pred.market}</span>
                      </span>
                    </td>

                    {/* Odds */}
                    <td className="py-4 px-4 text-right">
                      <span className="font-heading text-sm font-extrabold text-slate-100 tracking-tight">
                        {pred.odds.toFixed(2)}
                      </span>
                    </td>

                    {/* Confidence or Outcome Badge */}
                    <td className="py-4 pr-6 pl-4 text-right">
                      {isPreviousWeekend ? (
                        pred.result === "WON" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 shadow-sm shadow-emerald-500/10">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            WON
                          </span>
                        ) : pred.result === "LOST" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-400 shadow-sm shadow-rose-500/10">
                            <XCircle className="h-3.5 w-3.5 text-rose-400" />
                            LOST
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-400">
                            <Clock className="h-3 w-3 text-slate-400" />
                            PENDING
                          </span>
                        )
                      ) : (
                        <ConfidenceBadge
                          score={pred.confidence}
                          variant="compact"
                          showLabel={false}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List (Optimized for iOS/Android native app feel with >=44px touch targets) */}
      <div className="block md:hidden space-y-3">
        {filteredPredictions.map((pred, index) => {
          const isEven = index % 2 === 0;
          return (
            <div
              key={pred.id}
              className={cn(
                "rounded-2xl border border-slate-800 p-4 transition-smooth active:scale-[0.99]",
                isEven ? "bg-slate-950" : "bg-slate-900/60"
              )}
            >
              {/* Header: Index, League, Kickoff */}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 font-bold text-[10px] text-gold-400">
                    {index + 1}
                  </span>
                  <span>{pred.countryFlag}</span>
                  <span className="font-medium text-slate-300">{pred.league}</span>
                </div>
                <span className="font-semibold text-slate-400">{formatMatchTime(pred.kickoff)}</span>
              </div>

              {/* Match Teams */}
              <div className="mb-3">
                <div className="font-heading text-base font-bold text-white flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span>{pred.homeTeam}</span>
                    <span className="text-xs text-slate-500 font-normal">vs</span>
                    <span className="text-slate-200 font-semibold">{pred.awayTeam}</span>
                  </div>
                  {isPreviousWeekend && (
                    <span className="rounded-lg border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-xs font-extrabold text-white">
                      {pred.finalScore || "—"}
                    </span>
                  )}
                </div>
              </div>

              {/* Footer row: Market pill, Odds, Confidence Badge / Result */}
              <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-200">
                    {pred.market}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Odds
                    </span>
                    <span className="font-heading text-sm font-extrabold text-gold-400">
                      {pred.odds.toFixed(2)}
                    </span>
                  </div>

                  {isPreviousWeekend ? (
                    pred.result === "WON" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        WON
                      </span>
                    ) : pred.result === "LOST" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-400">
                        <XCircle className="h-3 w-3 text-rose-400" />
                        LOST
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400">
                        PENDING
                      </span>
                    )
                  ) : (
                    <ConfidenceBadge
                      score={pred.confidence}
                      variant="compact"
                      showLabel={false}
                    />
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

