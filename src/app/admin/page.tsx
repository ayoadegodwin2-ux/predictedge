"use client";

import { useState, useEffect } from "react";
import {
  ShieldAlert,
  Lock,
  Unlock,
  Play,
  RotateCw,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  LogOut,
  AlertTriangle,
  X,
  Save,
  Activity,
  Settings as SettingsIcon,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsDashboard } from "@/components/settings/SettingsDashboard";
import { mockMarkets, mockCountries } from "@/lib/mock-data";

interface AdminPrediction {
  id: number;
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  leagueName: string;
  country: string;
  countryFlag: string;
  kickoffTime: string;
  market: string;
  odds: number;
  confidenceScore: number;
  isWeekendPick: boolean;
  predictionDate: string;
  result: "WON" | "LOST" | "PENDING";
  finalScore: string | null;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [authToken, setAuthToken] = useState<string>("");
  const [adminTab, setAdminTab] = useState<"overview" | "settings">("overview");

  // Traffic analytics state
  const [trafficStats, setTrafficStats] = useState<{
    todayVisits: number;
    totalVisits: number;
  }>({ todayVisits: 0, totalVisits: 0 });

  // Predictions state
  const [predictionsList, setPredictionsList] = useState<AdminPrediction[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "daily" | "weekend" | "won" | "lost" | "pending">("all");

  // Trigger states
  const [activeTrigger, setActiveTrigger] = useState<string | null>(null);
  const [triggerStatus, setTriggerStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Edit modal state
  const [editingItem, setEditingItem] = useState<AdminPrediction | null>(null);
  const [editMarket, setEditMarket] = useState("");
  const [editOdds, setEditOdds] = useState("");
  const [editResult, setEditResult] = useState<"WON" | "LOST" | "PENDING">("PENDING");
  const [editScore, setEditScore] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchTraffic = async () => {
    try {
      const res = await fetch("/api/analytics/visit");
      const json = await res.json();
      if (json.success) {
        setTrafficStats({
          todayVisits: json.todayVisits || 0,
          totalVisits: json.totalVisits || 0,
        });
      }
    } catch {
      // Fallback
    }
  };

  const fetchPredictions = async (token: string) => {
    setIsLoadingPredictions(true);
    try {
      const res = await fetch("/api/admin/predictions", {
        headers: { "x-admin-token": token },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPredictionsList(json.data);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingPredictions(false);
    }
  };

  // Check existing session token on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTraffic();
      const savedToken = sessionStorage.getItem("predictedge_admin_token");
      if (savedToken) {
        setAuthToken(savedToken);
        setIsAuthenticated(true);
        fetchPredictions(savedToken);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setAuthError(json.error || "Invalid master password");
        return;
      }

      setAuthToken(json.token);
      setIsAuthenticated(true);
      sessionStorage.setItem("predictedge_admin_token", json.token);
      fetchPredictions(json.token);
    } catch {
      setAuthError("Failed to authenticate. Check server connection.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("predictedge_admin_token");
    setAuthToken("");
    setIsAuthenticated(false);
    setPassword("");
  };

  const handleTriggerCron = async (job: "daily" | "weekend" | "settle") => {
    setActiveTrigger(job);
    setTriggerStatus({ type: null, message: "" });

    try {
      const res = await fetch("/api/admin/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": authToken,
        },
        body: JSON.stringify({ job }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setTriggerStatus({
          type: "error",
          message: json.error || `Failed to trigger ${job} pipeline`,
        });
      } else {
        setTriggerStatus({
          type: "success",
          message: json.message || `${job.toUpperCase()} triggered successfully!`,
        });
        // Refresh list to show newly generated predictions
        fetchPredictions(authToken);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setTriggerStatus({ type: "error", message: `Trigger failed: ${msg}` });
    } finally {
      setActiveTrigger(null);
    }
  };

  const handleDeletePrediction = async (id: number) => {
    if (!confirm(`Are you sure you want to permanently delete Prediction #${id}?`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/predictions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": authToken,
        },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();

      if (json.success) {
        setPredictionsList((prev) => prev.filter((p) => p.id !== id));
        setTriggerStatus({
          type: "success",
          message: `Prediction #${id} permanently deleted.`,
        });
      } else {
        alert(json.error || "Failed to delete prediction");
      }
    } catch {
      alert("Network error while deleting");
    }
  };

  const handleStartEdit = (pred: AdminPrediction) => {
    setEditingItem(pred);
    setEditMarket(pred.market);
    setEditOdds(String(pred.odds));
    setEditResult(pred.result);
    setEditScore(pred.finalScore || "");
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSavingEdit(true);

    try {
      const res = await fetch("/api/admin/predictions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": authToken,
        },
        body: JSON.stringify({
          id: editingItem.id,
          market: editMarket,
          odds: parseFloat(editOdds),
          result: editResult,
          finalScore: editScore || null,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setPredictionsList((prev) =>
          prev.map((p) =>
            p.id === editingItem.id
              ? {
                  ...p,
                  market: editMarket,
                  odds: parseFloat(editOdds),
                  result: editResult,
                  finalScore: editScore || null,
                }
              : p
          )
        );
        setEditingItem(null);
        setTriggerStatus({
          type: "success",
          message: `Prediction #${editingItem.id} updated successfully.`,
        });
      } else {
        alert(json.error || "Failed to save edits");
      }
    } catch {
      alert("Network error while saving edits");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Filtered predictions
  const filteredPredictions = predictionsList.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.homeTeam.toLowerCase().includes(q) ||
        p.awayTeam.toLowerCase().includes(q) ||
        p.leagueName.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.market.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filterType === "daily") return !p.isWeekendPick;
    if (filterType === "weekend") return p.isWeekendPick;
    if (filterType === "won") return p.result === "WON";
    if (filterType === "lost") return p.result === "LOST";
    if (filterType === "pending") return p.result === "PENDING";

    return true;
  });

  /* ─────────────────────────────────────────────
     1. PASSWORD LOCK SCREEN
     ───────────────────────────────────────────── */
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-purple-500/5">
          <div className="text-center mb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 mb-4 shadow-lg shadow-purple-500/10">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="font-heading text-2xl font-black text-white">
              Super Admin Gate
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Enter your master password to access system controls and engine triggers.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Master Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter ADMIN_PASSWORD..."
                className="w-full min-h-[48px] rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-smooth"
                required
              />
            </div>

            {authError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-3 font-heading text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:from-purple-400 hover:to-indigo-500 transition-smooth cursor-pointer flex items-center justify-center gap-2"
            >
              <Unlock className="h-4 w-4" />
              <span>Unlock Control Panel</span>
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-4 text-center">
            <span className="text-[11px] text-slate-500">
              Configure key: <code className="text-purple-400">ADMIN_PASSWORD</code> in <code className="text-slate-400">.env.local</code>
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────
     2. ADMIN CONTROL PANEL
     ───────────────────────────────────────────── */
  return (
    <div className="min-h-[calc(100vh-8rem)] pb-16">
      {/* Header */}
      <section className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-400">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Owner Authority Active
                </span>
                <span className="text-xs text-slate-400">Hidden Route</span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                Super Admin Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Full command over prediction overrides, live database records, and automated cron triggers.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  fetchPredictions(authToken);
                  fetchTraffic();
                }}
                disabled={isLoadingPredictions}
                className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-smooth cursor-pointer"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isLoadingPredictions && "animate-spin")} />
                <span>Refresh Data</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-smooth cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Lock &amp; Exit</span>
              </button>
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-4">
            <button
              type="button"
              onClick={() => setAdminTab("overview")}
              className={cn(
                "min-h-[38px] px-4 rounded-xl text-xs sm:text-sm font-semibold transition-smooth flex items-center gap-2 cursor-pointer",
                adminTab === "overview"
                  ? "bg-purple-500 text-white shadow-md font-bold"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Control Center &amp; Overrides</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab("settings")}
              className={cn(
                "min-h-[38px] px-4 rounded-xl text-xs sm:text-sm font-semibold transition-smooth flex items-center gap-2 cursor-pointer",
                adminTab === "settings"
                  ? "bg-purple-500 text-white shadow-md font-bold"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <SettingsIcon className="h-4 w-4" />
              <span>Engine Settings (13 Markets &amp; 54 Countries)</span>
              <span className="rounded-full bg-purple-400/20 text-purple-300 text-[10px] px-2 py-0.5 font-bold">
                Restricted
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Panel Content */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {adminTab === "settings" && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
                <SettingsIcon className="h-4 w-4" />
                <span>Owner Configuration Gate</span>
              </div>
              <h2 className="font-heading text-xl font-bold text-white">
                Proprietary Market &amp; League Whitelists
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle approved betting markets and whitelisted football nations for the prediction algorithms.
              </p>
            </div>
            <SettingsDashboard
              initialMarkets={mockMarkets}
              initialCountries={mockCountries}
            />
          </div>
        )}

        {adminTab === "overview" && (
          <>
            {/* Daily Traffic Analytics Bar */}
            <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 p-6 backdrop-blur-md shadow-xl shadow-purple-500/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                      <Activity className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                      Live Traffic Analytics
                    </span>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <h2 className="font-heading text-xl sm:text-2xl font-black text-white">
                    Platform Visitor Tracking
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time telemetry recording daily site visitors via Supabase daily_visits table.
                  </p>
                </div>

                {/* Big Bold Daily Visits Counters */}
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-purple-500/40 bg-purple-500/10 px-5 py-3 text-center shadow-lg shadow-purple-500/10">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                      Daily Visits (Today)
                    </div>
                    <div className="font-heading text-3xl sm:text-4xl font-black text-white tracking-tight">
                      {trafficStats.todayVisits}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      All-Time Visits
                    </div>
                    <div className="font-heading text-2xl font-extrabold text-slate-200">
                      {trafficStats.totalVisits}
                    </div>
                  </div>
                </div>
              </div>
            </div>
        {/* Trigger Status Alert */}
        {triggerStatus.type && (
          <div
            className={cn(
              "rounded-2xl border p-4 backdrop-blur-md flex items-start justify-between gap-3 shadow-lg",
              triggerStatus.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            )}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {triggerStatus.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
              )}
              <span>{triggerStatus.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setTriggerStatus({ type: null, message: "" })}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* SECTION 1: MANUAL CRON TRIGGERS */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <Play className="h-4 w-4 text-purple-400" />
            <h2 className="font-heading text-lg font-bold text-white">
              Instant Manual Cron Triggers
            </h2>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Bypass scheduled clock timers and execute backend math and Telegram alerts right now on demand.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Trigger 1: Daily Pick */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="rounded-lg bg-gold-400/10 border border-gold-400/30 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-300">
                    Daily Pick (Mon-Fri)
                  </span>
                  <span className="text-[11px] text-slate-500">Scheduled: 8:00 AM</span>
                </div>
                <h3 className="font-heading text-base font-bold text-white">
                  Generate Daily Pick
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Runs weekday pipeline (1.30–1.50 odds), saves top pick to Supabase, and fires Telegram alert.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleTriggerCron("daily")}
                disabled={activeTrigger !== null}
                className="mt-4 min-h-[42px] w-full rounded-xl bg-gold-500 hover:bg-gold-400 font-heading text-xs font-bold text-slate-950 transition-smooth cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {activeTrigger === "daily" ? (
                  <RotateCw className="h-4 w-4 animate-spin text-slate-950" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span>Trigger Daily Pick Now</span>
              </button>
            </div>

            {/* Trigger 2: Weekend 15 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="rounded-lg bg-green-400/10 border border-green-400/30 px-2 py-0.5 text-[10px] font-bold uppercase text-green-300">
                    Weekend 15 (Sat)
                  </span>
                  <span className="text-[11px] text-slate-500">Scheduled: 8:00 AM</span>
                </div>
                <h3 className="font-heading text-base font-bold text-white">
                  Generate Weekend 15
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Isolates 15 unique games (1.20–1.80 odds), commits to Supabase, and broadcasts Telegram summary.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleTriggerCron("weekend")}
                disabled={activeTrigger !== null}
                className="mt-4 min-h-[42px] w-full rounded-xl bg-green-500 hover:bg-green-400 font-heading text-xs font-bold text-slate-950 transition-smooth cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {activeTrigger === "weekend" ? (
                  <RotateCw className="h-4 w-4 animate-spin text-slate-950" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span>Trigger Weekend 15 Now</span>
              </button>
            </div>

            {/* Trigger 3: Settlement Engine */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="rounded-lg bg-purple-400/10 border border-purple-400/30 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-300">
                    Settlement (Mon)
                  </span>
                  <span className="text-[11px] text-slate-500">Scheduled: 9:00 AM</span>
                </div>
                <h3 className="font-heading text-base font-bold text-white">
                  Grade Pending Matches
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Fetches live final scores, grades outcomes (WON/LOST) across all 13 markets, and pushes report.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleTriggerCron("settle")}
                disabled={activeTrigger !== null}
                className="mt-4 min-h-[42px] w-full rounded-xl bg-purple-500 hover:bg-purple-400 font-heading text-xs font-bold text-white transition-smooth cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {activeTrigger === "settle" ? (
                  <RotateCw className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <RotateCw className="h-4 w-4" />
                )}
                <span>Run Settlement Audit Now</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: PREDICTION MANAGEMENT & OVERRIDES */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-gold-400" />
                <h2 className="font-heading text-lg font-bold text-white">
                  Prediction Control &amp; Overrides
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manually edit, correct, or delete any prediction stored in Supabase.
              </p>
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Showing {filteredPredictions.length} of {predictionsList.length} records
            </span>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by team, league, country, or market..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-gold-400 focus:outline-none transition-smooth"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs font-semibold">
              {(["all", "daily", "weekend", "won", "lost", "pending"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterType(tab)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg capitalize transition-smooth cursor-pointer",
                    filterType === tab
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-md">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Matchup &amp; Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Market</th>
                  <th className="py-3 px-4 text-right">Odds</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-body">
                {filteredPredictions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No predictions match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredPredictions.map((pred) => (
                    <tr key={pred.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500">#{pred.id}</td>

                      <td className="py-3 px-4">
                        <div className="font-heading font-bold text-white">
                          {pred.homeTeam} vs {pred.awayTeam}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>{pred.countryFlag}</span>
                          <span>{pred.leagueName}</span>
                          <span>•</span>
                          <span>{pred.predictionDate}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                            pred.isWeekendPick
                              ? "bg-green-500/10 text-green-400 border border-green-500/30"
                              : "bg-gold-500/10 text-gold-400 border border-gold-500/30"
                          )}
                        >
                          {pred.isWeekendPick ? "Weekend" : "Daily"}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-200">
                        {pred.market}
                      </td>

                      <td className="py-3 px-4 text-right font-heading font-bold text-gold-400">
                        {pred.odds.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-slate-300">
                          {pred.finalScore || "—"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {pred.result === "WON" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-400 text-[10px]">
                            <CheckCircle2 className="h-3 w-3" />
                            WON
                          </span>
                        ) : pred.result === "LOST" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-bold text-rose-400 text-[10px]">
                            <XCircle className="h-3 w-3" />
                            LOST
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 font-medium text-slate-400 text-[10px]">
                            <Clock className="h-3 w-3" />
                            PENDING
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(pred)}
                            title="Edit prediction"
                            className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-300 hover:border-gold-400 hover:text-gold-400 transition-smooth cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePrediction(pred.id)}
                            title="Delete prediction"
                            className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:border-rose-500/50 hover:text-rose-400 transition-smooth cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
      </section>

      {/* 3. OVERRIDE / EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  Override Prediction #{editingItem.id}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingItem.homeTeam} vs {editingItem.awayTeam} ({editingItem.leagueName})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Market Name
                </label>
                <input
                  type="text"
                  value={editMarket}
                  onChange={(e) => setEditMarket(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Decimal Odds
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editOdds}
                    onChange={(e) => setEditOdds(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Actual Score (e.g. 2 - 1)
                  </label>
                  <input
                    type="text"
                    value={editScore}
                    onChange={(e) => setEditScore(e.target.value)}
                    placeholder="e.g. 2 - 1"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Settlement Outcome
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["PENDING", "WON", "LOST"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setEditResult(status)}
                      className={cn(
                        "rounded-xl border py-2 text-xs font-bold transition-smooth cursor-pointer",
                        editResult === status
                          ? status === "WON"
                            ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                            : status === "LOST"
                            ? "border-rose-500 bg-rose-500/20 text-rose-400"
                            : "border-slate-500 bg-slate-800 text-white"
                          : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="flex items-center gap-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 px-4 py-2 font-heading text-xs font-bold text-white shadow-md transition-smooth cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSavingEdit ? "Saving..." : "Commit Overrides"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
