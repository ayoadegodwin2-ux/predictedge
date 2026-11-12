/**
 * European Football Provider Client (Football-Data.org)
 * Base URL: https://api.football-data.org/v4/
 * Header: X-Auth-Token: process.env.FOOTBALL_DATA_API_KEY
 * Use for major European league fixtures and historical match data.
 * All fetches strictly enforce an 8-second AbortController timeout.
 */

import { getCountryFlag } from "../leagues";
import type { NormalizedMatchFixture } from "../fixtures";
import type { H2HRecord, TeamStats } from "../odds-stats";

const BASE_URL = "https://api.football-data.org/v4";
const TIMEOUT_MS = 8000;

interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string; // TIMED, SCHEDULED, IN_PLAY, PAUSED, FINISHED, POSTPONED, SUSPENDED, CANCELLED
  matchday?: number;
  stage?: string;
  competition: {
    id: number;
    name: string;
    code: string;
    type?: string;
    emblem?: string;
  };
  area: {
    id: number;
    name: string;
    code?: string;
    flag?: string;
  };
  homeTeam: {
    id: number;
    name: string;
    shortName?: string;
    tla?: string;
    crest?: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName?: string;
    tla?: string;
    crest?: string;
  };
  score?: {
    winner?: string | null;
    duration?: string;
    fullTime?: { home?: number | null; away?: number | null };
    halfTime?: { home?: number | null; away?: number | null };
  };
}

interface FootballDataMatchesResponse {
  filters?: Record<string, string>;
  resultSet?: { count: number; competitions: string };
  matches?: FootballDataMatch[];
  message?: string;
  errorCode?: number;
}

interface FootballDataH2HResponse {
  aggregates?: {
    numberOfMatches: number;
    totalGoals: number;
    homeTeam: { id: number; name: string; wins: number; draws: number; losses: number };
    awayTeam: { id: number; name: string; wins: number; draws: number; losses: number };
  };
  matches?: FootballDataMatch[];
}

interface FootballDataTeamMatchesResponse {
  matches?: FootballDataMatch[];
}

/**
 * Base fetcher for Football-Data.org with 8-second timeout
 */
export async function footballDataFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    console.warn("[Football-Data] FOOTBALL_DATA_API_KEY is not configured.");
    return null;
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const url = new URL(`${BASE_URL}/${cleanEndpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-Auth-Token": apiKey,
        "Accept": "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[Football-Data] HTTP ${res.status}: ${res.statusText}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.warn(`[Football-Data] Fetch error on ${cleanEndpoint}:`, msg);
    return null;
  }
}

/**
 * Normalizes a Football-Data.org match into our system's NormalizedMatchFixture
 */
export function normalizeFootballDataMatch(m: FootballDataMatch): NormalizedMatchFixture {
  // Map Football-Data unplayed statuses to "NS" (Not Started)
  const isNotStarted = m.status === "TIMED" || m.status === "SCHEDULED";
  const mappedStatus = isNotStarted ? "NS" : m.status;

  const country = m.area?.name || "Europe";
  return {
    apiFixtureId: m.id,
    homeTeamId: m.homeTeam.id,
    homeTeam: m.homeTeam.name,
    awayTeamId: m.awayTeam.id,
    awayTeam: m.awayTeam.name,
    leagueId: m.competition.id,
    leagueName: m.competition.name,
    country,
    countryFlag: getCountryFlag(country),
    kickoffTime: m.utcDate,
    status: mappedStatus,
  };
}

/**
 * Fetches upcoming matches for a specific date (YYYY-MM-DD).
 * Uses dateTo = next day because Football-Data.org API requires a non-zero interval.
 */
export async function fetchFootballDataFixturesForDate(dateStr: string): Promise<NormalizedMatchFixture[]> {
  try {
    const d = new Date(dateStr);
    d.setUTCDate(d.getUTCDate() + 1);
    const nextDateStr = d.toISOString().split("T")[0];

    const data = await footballDataFetch<FootballDataMatchesResponse>("matches", {
      dateFrom: dateStr,
      dateTo: nextDateStr,
    });

    if (!data?.matches || !Array.isArray(data.matches)) {
      return [];
    }

    // Filter to matches on the requested calendar date
    const onDate = data.matches.filter((m) => m.utcDate.startsWith(dateStr));
    return onDate.map(normalizeFootballDataMatch);
  } catch (err) {
    console.warn("[Football-Data] Error fetching matches for date:", err);
    return [];
  }
}

/**
 * Fetches upcoming matches across a date range (e.g. weekend).
 * Extends dateTo by 1 day to make the end date inclusive in Football-Data.org.
 */
export async function fetchFootballDataFixturesRange(
  dateFrom: string,
  dateTo: string
): Promise<NormalizedMatchFixture[]> {
  try {
    const d = new Date(dateTo);
    d.setUTCDate(d.getUTCDate() + 1);
    const nextDateStr = d.toISOString().split("T")[0];

    const data = await footballDataFetch<FootballDataMatchesResponse>("matches", {
      dateFrom,
      dateTo: nextDateStr,
    });

    if (!data?.matches || !Array.isArray(data.matches)) {
      return [];
    }

    return data.matches.map(normalizeFootballDataMatch);
  } catch (err) {
    console.warn("[Football-Data] Error fetching range:", err);
    return [];
  }
}

/**
 * Fetches Head-to-Head data for a specific match from Football-Data.org
 */
export async function fetchFootballDataH2H(
  matchId: number,
  homeTeamId: number,
  awayTeamId: number
): Promise<H2HRecord | null> {
  try {
    const data = await footballDataFetch<FootballDataH2HResponse>(`matches/${matchId}/head2head`, {
      limit: "15",
    });

    if (!data?.matches || data.matches.length === 0) {
      return null;
    }

    const completed = data.matches.filter((m) => m.status === "FINISHED");
    if (completed.length === 0) return null;

    let homeWins = 0;
    let draws = 0;
    let awayWins = 0;
    let totalGoals = 0;
    let bttsCount = 0;
    let over15Count = 0;
    let over25Count = 0;
    let recentHomeWins = 0;
    let recentAwayWins = 0;
    let recentDraws = 0;
    let homeCleanSheets = 0;
    let awayCleanSheets = 0;
    const last15Scores: string[] = [];

    completed.forEach((m, idx) => {
      const hG = m.score?.fullTime?.home ?? 0;
      const aG = m.score?.fullTime?.away ?? 0;
      totalGoals += hG + aG;
      last15Scores.push(`${hG}-${aG}`);

      if (hG > 0 && aG > 0) bttsCount++;
      if (hG + aG >= 2) over15Count++;
      if (hG + aG >= 3) over25Count++;

      const isHomeWin = (m.homeTeam.id === homeTeamId && hG > aG) || (m.awayTeam.id === homeTeamId && aG > hG);
      const isAwayWin = (m.homeTeam.id === awayTeamId && hG > aG) || (m.awayTeam.id === awayTeamId && aG > hG);

      if (hG === aG) {
        draws++;
        if (idx < 5) recentDraws++;
      } else if (isHomeWin) {
        homeWins++;
        if (idx < 5) recentHomeWins++;
      } else if (isAwayWin) {
        awayWins++;
        if (idx < 5) recentAwayWins++;
      }

      if (m.homeTeam.id === homeTeamId && aG === 0) homeCleanSheets++;
      if (m.awayTeam.id === homeTeamId && hG === 0) homeCleanSheets++;
      if (m.homeTeam.id === awayTeamId && aG === 0) awayCleanSheets++;
      if (m.awayTeam.id === awayTeamId && hG === 0) awayCleanSheets++;
    });

    return {
      matchesPlayed: completed.length,
      homeWins,
      draws,
      awayWins,
      avgTotalGoals: Number((totalGoals / completed.length).toFixed(1)),
      bttsCount,
      over15Count,
      over25Count,
      recentHomeWins,
      recentAwayWins,
      recentDraws,
      homeCleanSheets,
      awayCleanSheets,
      last15Scores,
    };
  } catch {
    return null;
  }
}

/**
 * Fetches recent 10 matches for a team from Football-Data.org
 */
export async function fetchFootballDataTeamForm(
  teamId: number,
  isHome: boolean
): Promise<Partial<TeamStats> | null> {
  try {
    const data = await footballDataFetch<FootballDataTeamMatchesResponse>(`teams/${teamId}/matches`, {
      status: "FINISHED",
      limit: "10",
    });

    if (!data?.matches || data.matches.length === 0) return null;

    const list = data.matches.slice(0, 10);
    let points = 0;
    let formChars = "";
    let scored = 0;
    let conceded = 0;
    let cleanSheets = 0;
    let failedToScore = 0;
    let over15 = 0;
    let over25 = 0;
    let btts = 0;
    let venueWins = 0;
    let venueMatches = 0;

    for (const m of list) {
      const isTeamHome = m.homeTeam.id === teamId;
      const myGoals = (isTeamHome ? m.score?.fullTime?.home : m.score?.fullTime?.away) ?? 0;
      const oppGoals = (isTeamHome ? m.score?.fullTime?.away : m.score?.fullTime?.home) ?? 0;

      scored += myGoals;
      conceded += oppGoals;

      if (myGoals > oppGoals) {
        points += 3;
        formChars += "W";
      } else if (myGoals === oppGoals) {
        points += 1;
        formChars += "D";
      } else {
        formChars += "L";
      }

      if (oppGoals === 0) cleanSheets++;
      if (myGoals === 0) failedToScore++;
      if (myGoals + oppGoals >= 2) over15++;
      if (myGoals + oppGoals >= 3) over25++;
      if (myGoals > 0 && oppGoals > 0) btts++;

      if (isTeamHome === isHome) {
        venueMatches++;
        if (myGoals > oppGoals) venueWins++;
      }
    }

    const count = list.length;
    const formScore = Math.round((points / (count * 3)) * 100);

    return {
      teamId,
      formPoints: points,
      formScore,
      formString: formChars,
      last5FormString: formChars.slice(-5),
      goalsScoredAvg: Number((scored / count).toFixed(2)),
      goalsConcededAvg: Number((conceded / count).toFixed(2)),
      cleanSheetPct: Math.round((cleanSheets / count) * 100),
      failedToScorePct: Math.round((failedToScore / count) * 100),
      over15Rate: Math.round((over15 / count) * 100),
      over25Rate: Math.round((over25 / count) * 100),
      bttsRate: Math.round((btts / count) * 100),
      venueWinRate: venueMatches > 0 ? Math.round((venueWins / venueMatches) * 100) : 60,
    };
  } catch {
    return null;
  }
}

