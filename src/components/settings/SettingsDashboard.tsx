"use client";

import { useState } from "react";
import type { MarketConfig, CountryConfig } from "@/lib/types";
import {
  SlidersHorizontal,
  CheckCircle2,
  Globe2,
  ShieldCheck,
  RotateCcw,
  Save,
  Search,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsDashboardProps {
  initialMarkets: MarketConfig[];
  initialCountries: CountryConfig[];
}

export function SettingsDashboard({
  initialMarkets,
  initialCountries,
}: SettingsDashboardProps) {
  const [markets, setMarkets] = useState<MarketConfig[]>(initialMarkets);
  const [countries, setCountries] = useState<CountryConfig[]>(initialCountries);
  const [activeTab, setActiveTab] = useState<"markets" | "countries" | "thresholds">("markets");
  const [countryFilterTier, setCountryFilterTier] = useState<"all" | 1 | 2>("all");
  const [countrySearch, setCountrySearch] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toggle single market
  const toggleMarket = (id: number) => {
    setMarkets((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  // Toggle single country
  const toggleCountry = (name: string) => {
    setCountries((prev) =>
      prev.map((c) => (c.name === name ? { ...c, enabled: !c.enabled } : c))
    );
  };

  // Bulk actions for markets
  const setAllMarkets = (enabled: boolean) => {
    setMarkets((prev) => prev.map((m) => ({ ...m, enabled })));
  };

  // Bulk actions for countries
  const setAllCountries = (tier: "all" | 1 | 2, enabled: boolean) => {
    setCountries((prev) =>
      prev.map((c) => {
        if (tier === "all" || c.tier === tier) {
          return { ...c, enabled };
        }
        return c;
      })
    );
  };

  // Filtered countries
  const filteredCountries = countries.filter((c) => {
    const matchesTier = countryFilterTier === "all" || c.tier === countryFilterTier;
    const matchesSearch = c.name.toLowerCase().includes(countrySearch.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const enabledMarketsCount = markets.filter((m) => m.enabled).length;
  const enabledCountriesCount = countries.filter((c) => c.enabled).length;

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = () => {
    showNotification("Settings successfully saved and applied to algorithm.");
  };

  const handleReset = () => {
    setMarkets(initialMarkets);
    setCountries(initialCountries);
    showNotification("Settings restored to factory defaults.");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-slate-900/95 px-5 py-3.5 text-sm font-semibold text-emerald-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Controls & Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <h2 className="font-heading text-lg sm:text-xl font-bold text-white">
              Algorithm Filtering Engine
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Active constraints: <span className="font-semibold text-gold-400">{enabledMarketsCount}/13 markets</span>,{" "}
            <span className="font-semibold text-green-400">{enabledCountriesCount}/54 countries</span> whitelisted.
          </p>
        </div>

        {/* Global Save / Reset buttons (>=44px touch targets) */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleReset}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 min-h-[44px] rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-smooth cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 min-h-[44px] rounded-xl bg-gold-500 hover:bg-gold-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md transition-smooth cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Save Rules</span>
          </button>
        </div>
      </div>

      {/* Section Navigation Tabs (Native-app responsive touch targets min-h 44px) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("markets")}
          className={cn(
            "flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold transition-smooth shrink-0 cursor-pointer",
            activeTab === "markets"
              ? "bg-gold-500/10 text-gold-400 border border-gold-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Betting Markets ({enabledMarketsCount}/13)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("countries")}
          className={cn(
            "flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold transition-smooth shrink-0 cursor-pointer",
            activeTab === "countries"
              ? "bg-green-500/10 text-green-400 border border-green-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          )}
        >
          <Globe2 className="h-4 w-4" />
          <span>Countries &amp; Leagues ({enabledCountriesCount}/54)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("thresholds")}
          className={cn(
            "flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold transition-smooth shrink-0 cursor-pointer",
            activeTab === "thresholds"
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          )}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Odds &amp; Logic Thresholds</span>
        </button>
      </div>

      {/* TAB 1: BETTING MARKETS (13 Approved Markets) */}
      {activeTab === "markets" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div>
              <h3 className="font-heading text-base font-bold text-white">
                13 Approved Betting Markets
              </h3>
              <p className="text-xs text-slate-400">
                The prediction engine strictly discards any market outside this approved list.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAllMarkets(true)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-smooth cursor-pointer"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => setAllMarkets(false)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-smooth cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {markets.map((market) => (
              <div
                key={market.id}
                onClick={() => toggleMarket(market.id)}
                className={cn(
                  "flex items-center justify-between gap-3 min-h-[58px] p-4 rounded-2xl border transition-smooth cursor-pointer select-none",
                  market.enabled
                    ? "border-gold-500/40 bg-slate-900/90 shadow-sm"
                    : "border-slate-800/80 bg-slate-950/60 opacity-60 hover:opacity-80"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-[11px] font-bold text-slate-400">
                    {market.id}
                  </span>
                  <span
                    className={cn(
                      "text-xs sm:text-sm font-semibold transition-smooth",
                      market.enabled ? "text-slate-100" : "text-slate-400"
                    )}
                  >
                    {market.name}
                  </span>
                </div>

                {/* Custom Toggle Switch (>= 44px touch target) */}
                <div
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out",
                    market.enabled ? "bg-gold-500" : "bg-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow-md transition-transform duration-200 ease-in-out",
                      market.enabled ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: COUNTRIES (54 Countries across Tier 1 & Tier 2) */}
      {activeTab === "countries" && (
        <div className="space-y-4">
          {/* Tier and Search Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search 54 whitelisted countries..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-green-400 focus:outline-none transition-smooth"
              />
            </div>

            {/* Tier Filters with >= 44px touch targets */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setCountryFilterTier("all")}
                className={cn(
                  "min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-smooth shrink-0 cursor-pointer",
                  countryFilterTier === "all"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                All (54)
              </button>
              <button
                type="button"
                onClick={() => setCountryFilterTier(1)}
                className={cn(
                  "min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-smooth shrink-0 cursor-pointer",
                  countryFilterTier === 1
                    ? "bg-gold-500/20 text-gold-300 border border-gold-500/30"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Tier 1 (27 Top)
              </button>
              <button
                type="button"
                onClick={() => setCountryFilterTier(2)}
                className={cn(
                  "min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-smooth shrink-0 cursor-pointer",
                  countryFilterTier === 2
                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Tier 2 (27 Regional)
              </button>
            </div>

            {/* Quick Bulk toggle */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setAllCountries(countryFilterTier, true)}
                className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-smooth cursor-pointer"
              >
                Enable All
              </button>
              <button
                type="button"
                onClick={() => setAllCountries(countryFilterTier, false)}
                className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-smooth cursor-pointer"
              >
                Disable All
              </button>
            </div>
          </div>

          {/* Countries Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {filteredCountries.map((c) => (
              <div
                key={c.name}
                onClick={() => toggleCountry(c.name)}
                className={cn(
                  "flex items-center justify-between gap-2 min-h-[48px] px-3.5 py-2.5 rounded-xl border transition-smooth cursor-pointer select-none",
                  c.enabled
                    ? c.tier === 1
                      ? "border-gold-500/30 bg-slate-900/90 text-slate-100"
                      : "border-green-500/30 bg-slate-900/90 text-slate-100"
                    : "border-slate-800/60 bg-slate-950/40 opacity-50 hover:opacity-80 text-slate-400"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-base shrink-0">{c.flag}</span>
                  <span className="text-xs font-semibold truncate">{c.name}</span>
                </div>

                <div
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-md border",
                    c.enabled
                      ? c.tier === 1
                        ? "border-gold-400 bg-gold-400 text-slate-950"
                        : "border-green-400 bg-green-400 text-slate-950"
                      : "border-slate-700 bg-slate-800"
                  )}
                >
                  {c.enabled && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: THRESHOLDS & ALGORITHM CONSTRAINTS */}
      {activeTab === "thresholds" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gold-400">
                Weekday Odds Window
              </span>
              <span className="rounded-md bg-gold-500/10 px-2 py-0.5 text-xs font-bold text-gold-300">
                Mon – Fri
              </span>
            </div>
            <div className="font-heading text-2xl font-black text-white">
              1.30 – 1.50
            </div>
            <p className="text-xs text-slate-400">
              Only high-safety, conservative odds are permitted for the daily single pick.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-green-400">
                Weekend Odds Window
              </span>
              <span className="rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-bold text-green-300">
                Sat – Sun
              </span>
            </div>
            <div className="font-heading text-2xl font-black text-white">
              1.20 – 1.80
            </div>
            <p className="text-xs text-slate-400">
              Balanced range to ensure 50 distinct value opportunities without excessive risk.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Dispatch Schedule
              </span>
              <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-300">
                Cron Automation
              </span>
            </div>
            <div className="font-heading text-2xl font-black text-white">
              8:00 AM Daily
            </div>
            <p className="text-xs text-slate-400">
              Automated trigger dispatches Telegram alerts &amp; publishes verified predictions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

