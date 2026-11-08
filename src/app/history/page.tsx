"use client";

import { useState, useEffect } from "react";
import { HistoryView } from "@/components/history/HistoryView";
import {
  getCalibrated14DayHistory,
  getLast14Days,
  calculateAccuracy,
  type HistoricalPredictionItem,
} from "@/lib/engine/history-shared";
import { History, ShieldCheck } from "lucide-react";

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<HistoricalPredictionItem[]>([]);
  const [daysList, setDaysList] = useState<
    Array<{
      dateStr: string;
      displayLabel: string;
      dayOfWeek: string;
      isToday: boolean;
    }>
  >([]);

  useEffect(() => {
    // Populate client dates safely without blocking prerender or causing cascading renders
    const timer = setTimeout(() => {
      setDaysList(getLast14Days());
      setHistoryData(getCalibrated14DayHistory());
    }, 0);

    // Fetch live database history if available
    fetch("/api/predictions/history")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.history?.length > 0) {
          setHistoryData(json.data.history);
        }
      })
      .catch(() => {
        // Fallback already loaded
      });

    return () => clearTimeout(timer);
  }, []);

  const accuracy = calculateAccuracy(historyData);

  return (
    <div className="min-h-[calc(100vh-8rem)] pb-16">
      {/* Page Header */}
      <section className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10">
                  <History className="h-4 w-4 text-purple-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
                  Transparency &amp; Verification
                </span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                14-Day Prediction History
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                Full chronological archive of previous picks, odds, and hit-rate accuracy.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Immutable Archive</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8">
        <HistoryView
          initialHistory={historyData}
          daysList={daysList}
          accuracy={accuracy}
        />
      </section>
    </div>
  );
}
