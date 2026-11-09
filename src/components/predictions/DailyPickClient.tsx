"use client";

import { useState, useEffect } from "react";
import { DailyPickHero } from "@/components/predictions/DailyPickHero";
import { DailyPickSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Prediction } from "@/lib/types";
import {
  getLast14Days,
  getCalibrated14DayHistory,
  type HistoricalPredictionItem,
} from "@/lib/engine/history-shared";
import Link from "next/link";
import {
  TrendingUp,
  Calendar,
  History,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyPickClientProps {
  initialPick: Prediction | null;
}

export function DailyPickClient({ initialPick }: DailyPickClientProps) {
  const [formattedDate, setFormattedDate] = useState("");
  const [viewMode, setViewMode] = useState<"live" | "skeleton" | "empty">("live");
  const [selectedDateIdx, setSelectedDateIdx] = useState(0); // 0 is today
  const [daysList, setDaysList] = useState<
    Array<{
      dateStr: string;
      displayLabel: string;
      dayOfWeek: string;
      isToday: boolean;
    }>
  >([]);
  const [historicalPicks, setHistoricalPicks] = useState<HistoricalPredictionItem[]>([]);
  const [dailyPick, setDailyPick] = useState<Prediction | null>(initialPick);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFormattedDate(
        new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      );
      setDaysList(getLast14Days());
      setHistoricalPicks(getCalibrated14DayHistory());

      // Bypass fetch cache: fetch fresh daily pick with { cache: 'no-store' }
      fetch("/api/predictions/daily", { cache: "no-store" })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setDailyPick(json.data);
          }
        })
        .catch((err) => {
          console.warn("Client fetch /api/predictions/daily fallback:", err);
        });

      // Also refresh 14-day history from DB if available
      fetch("/api/predictions/history", { cache: "no-store" })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data?.history && json.data.history.length > 0) {
            setHistoricalPicks(json.data.history);
          }
        })
        .catch(() => {
          // Calibrated fallback active
        });
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Determine current active pick based on selected date
  const activeHistorical = historicalPicks[selectedDateIdx] || historicalPicks[0];
  const isViewingToday = selectedDateIdx === 0;

  const currentDisplayPick = isViewingToday
    ? dailyPick
    : activeHistorical
    ? {
        id: activeHistorical.id,
        homeTeam: activeHistorical.homeTeam,
        awayTeam: activeHistorical.awayTeam,
        league: activeHistorical.leagueName,
        country: activeHistorical.country,
        countryFlag: activeHistorical.countryFlag,
        kickoff: activeHistorical.kickoffTime,
        market: activeHistorical.market,
        odds: activeHistorical.odds,
        confidence: activeHistorical.confidenceScore,
        isWeekendPick: activeHistorical.isWeekendPick,
      }
    : null;

  return (
    <div className="min-h-[calc(100vh-8rem)] pb-16">
      {/* Page Header */}
      <section className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-500/10">
                  <TrendingUp className="h-4 w-4 text-gold-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-gold-400">
                  Weekday Algorithm Slate
                </span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                Daily Pick of the Day
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                Single highest-confidence prediction filtered through 13 strict safety criteria.
              </p>
            </div>

            {/* Date & State Switcher (for interactive review) */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-gold-400" />
                <span>{formattedDate || "Today"}</span>
              </div>

              <Link
                href="/history"
                className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition-smooth"
              >
                <History className="h-3.5 w-3.5" />
                <span>14-Day History</span>
                <ArrowRight className="h-3 w-3" />
              </Link>

              {/* View Switcher for review */}
              <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/90 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("live")}
                  className={cn(
                    "min-h-[32px] px-3 rounded-lg text-xs font-semibold transition-smooth cursor-pointer",
                    viewMode === "live"
                      ? "bg-gold-500 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  Live Card
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("skeleton")}
                  className={cn(
                    "min-h-[32px] px-3 rounded-lg text-xs font-semibold transition-smooth cursor-pointer",
                    viewMode === "skeleton"
                      ? "bg-slate-700 text-white"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  Skeleton
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("empty")}
                  className={cn(
                    "min-h-[32px] px-3 rounded-lg text-xs font-semibold transition-smooth cursor-pointer",
                    viewMode === "empty"
                      ? "bg-slate-700 text-white"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  Empty
                </button>
              </div>
            </div>
          </div>

          {/* 14-Day Date Selector Pill Carousel */}
          <div className="mt-6 border-t border-slate-800/80 pt-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
              <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gold-400" />
                <span>Explore Last 14 Days Archive:</span>
              </span>
              <span className="text-slate-500 hidden sm:inline">
                Click any day to inspect historical selection &amp; outcome
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {daysList.map((day, idx) => {
                const isSelected = selectedDateIdx === idx;
                const pastItem = historicalPicks[idx];

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => setSelectedDateIdx(idx)}
                    className={cn(
                      "flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-smooth shrink-0 cursor-pointer",
                      isSelected
                        ? "bg-gold-500 text-slate-950 shadow-md font-bold"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    )}
                  >
                    <span>{day.displayLabel}</span>

                    {/* Result pill */}
                    {idx === 0 ? (
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                          isSelected ? "bg-slate-950 text-gold-400" : "bg-emerald-500/20 text-emerald-300"
                        )}
                      >
                        Today
                      </span>
                    ) : pastItem?.result === "WON" ? (
                      <span
                        className={cn(
                          "rounded px-1 py-0.5 text-[10px] font-bold",
                          isSelected ? "bg-emerald-950 text-emerald-300" : "bg-emerald-500/20 text-emerald-400"
                        )}
                      >
                        ✓ WON
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "rounded px-1 py-0.5 text-[10px] font-bold",
                          isSelected ? "bg-red-950 text-red-300" : "bg-red-500/20 text-red-400"
                        )}
                      >
                        LOST
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8">
        {!isViewingToday && (
          <div className="mb-6 mx-auto max-w-4xl flex items-center justify-between rounded-2xl border border-purple-500/30 bg-purple-500/10 px-5 py-3 text-xs sm:text-sm text-purple-200">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-purple-400" />
              <span>
                Viewing Archive Selection for <strong>{daysList[selectedDateIdx]?.displayLabel || "Archive"} ({daysList[selectedDateIdx]?.dateStr || ""})</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              <span>Result:</span>
              {activeHistorical.result === "WON" ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> WON
                </span>
              ) : (
                <span className="text-red-400 flex items-center gap-1">
                  <XCircle className="h-4 w-4" /> LOST
                </span>
              )}
            </div>
          </div>
        )}

        {viewMode === "live" && (
          currentDisplayPick ? (
            <>
              <DailyPickHero prediction={currentDisplayPick} />

              {/* Telegram Community Callout */}
              <div className="mt-8 mx-auto max-w-4xl rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-900 p-5 sm:p-6 backdrop-blur-md shadow-xl shadow-sky-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                      <Send className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                      Live Broadcast Community
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white">
                    Join our Telegram Group
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Get real-time 8:00 AM algorithm alerts, odds drops, and weekend slips delivered directly to your device.
                  </p>
                </div>

                <a
                  href={process.env.NEXT_PUBLIC_TELEGRAM_GROUP_LINK || "https://t.me/predictedge"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 px-6 py-3 font-heading text-xs font-extrabold text-white shadow-lg shadow-sky-500/25 transition-smooth cursor-pointer shrink-0"
                >
                  <Send className="h-4 w-4" />
                  <span>Join our Telegram Group</span>
                </a>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-8">
              <EmptyState variant="daily" />
            </div>
          )
        )}

        {viewMode === "skeleton" && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-4">
            <DailyPickSkeleton />
          </div>
        )}

        {viewMode === "empty" && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-8">
            <EmptyState variant="daily" />
          </div>
        )}
      </section>
    </div>
  );
}

