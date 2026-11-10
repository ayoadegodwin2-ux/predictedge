export const dynamic = "force-dynamic";
export const revalidate = 0;

import { History, ShieldCheck } from "lucide-react";
import { get14DayHistoryFromDb, calculateAccuracy, getLast14Days } from "@/lib/engine/history";
import { HistoryClientWrapper } from "@/components/history/HistoryClientWrapper";

export default async function HistoryPage() {
  const [dbHistory, daysList] = await Promise.all([
    get14DayHistoryFromDb(),
    Promise.resolve(getLast14Days()),
  ]);

  const accuracy = calculateAccuracy(dbHistory);

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
        <HistoryClientWrapper
          initialHistory={dbHistory}
          daysList={daysList}
          initialAccuracy={accuracy}
        />
      </section>
    </div>
  );
}
