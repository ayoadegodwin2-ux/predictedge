/**
 * Global Football Provider Client (API-Ninjas)
 * Endpoint: https://api.api-ninjas.com/v1/soccermatches
 * Header: X-Api-Key: process.env.API_NINJAS_KEY
 * Use for global and calendar-year leagues (MLS, Brasileirao, J-League, A-League, etc.).
 * All fetches strictly enforce an 8-second AbortController timeout.
 */

import { getCountryFlag } from "../leagues";
import type { NormalizedMatchFixture } from "../fixtures";

const ENDPOINT = "https://api.api-ninjas.com/v1/soccermatches";
const TIMEOUT_MS = 8000;

/**
 * Key calendar-year and non-European leagues supported by API-Ninjas
 */
export const API_NINJAS_GLOBAL_LEAGUES = [
  { code: "mls", name: "Major League Soccer", country: "USA" },
  { code: "brasileirao", name: "Serie A (Brasileirao)", country: "Brazil" },
  { code: "j1league", name: "J1 League", country: "Japan" },
  { code: "aleague", name: "A-League", country: "Australia" },
  { code: "saudiproleague", name: "Saudi Pro League", country: "Saudi Arabia" },
  { code: "ligamx", name: "Liga MX", country: "Mexico" },
  { code: "csl", name: "Chinese Super League", country: "China" },
  { code: "allsvenskan", name: "Allsvenskan", country: "Sweden" },
  { code: "eliteserien", name: "Eliteserien", country: "Norway" },
] as const;

export interface ApiNinjasMatch {
  date?: string;
  datetime?: string;
  home_team?: string;
  away_team?: string;
  home_score?: number | null;
  away_score?: number | null;
  league?: string;
  country?: string;
  status?: string;
}

/**
 * Generate a consistent numeric ID from string (for fixtures that don't supply a numeric ID)
 */
function hashStringToId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || Math.floor(Math.random() * 1000000);
}

/**
 * Fetch matches for a specific league from API-Ninjas
 */
export async function fetchApiNinjasMatches(
  leagueCode: string,
  dateStr?: string
): Promise<ApiNinjasMatch[]> {
  const apiKey = process.env.API_NINJAS_KEY;
  if (!apiKey) {
    console.warn("[API-Ninjas] API_NINJAS_KEY is not configured.");
    return [];
  }

  const url = new URL(ENDPOINT);
  url.searchParams.append("league", leagueCode);
  if (dateStr) {
    url.searchParams.append("date", dateStr);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-Api-Key": apiKey,
        "Accept": "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[API-Ninjas] HTTP ${res.status}: ${res.statusText} for league ${leagueCode}`);
      return [];
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err: unknown) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.warn(`[API-Ninjas] Fetch error for league ${leagueCode}:`, msg);
    return [];
  }
}

/**
 * Normalizes an API-Ninjas match to our NormalizedMatchFixture
 */
export function normalizeApiNinjasMatch(
  m: ApiNinjasMatch,
  defaultLeagueName?: string,
  defaultCountry?: string
): NormalizedMatchFixture | null {
  const homeTeam = m.home_team?.trim();
  const awayTeam = m.away_team?.trim();
  if (!homeTeam || !awayTeam) return null;

  const dateRaw = m.date || m.datetime || new Date().toISOString();
  const country = m.country || defaultCountry || "Global";
  const leagueName = m.league || defaultLeagueName || "Global League";

  // Check status: if scores are null or status indicates scheduled, mark "NS"
  const isFinished = m.home_score !== null && m.home_score !== undefined && m.away_score !== null && m.away_score !== undefined;
  const status = isFinished ? "FT" : "NS";

  const fixtureHash = `${homeTeam}-${awayTeam}-${dateRaw}`;

  return {
    apiFixtureId: hashStringToId(fixtureHash),
    homeTeamId: hashStringToId(homeTeam),
    homeTeam,
    awayTeamId: hashStringToId(awayTeam),
    awayTeam,
    leagueId: hashStringToId(leagueName),
    leagueName,
    country,
    countryFlag: getCountryFlag(country),
    kickoffTime: new Date(dateRaw).toISOString(),
    status,
  };
}

/**
 * Fetches upcoming fixtures from global / calendar-year leagues
 */
export async function fetchGlobalFixtures(dateStr?: string): Promise<NormalizedMatchFixture[]> {
  try {
    // Query global leagues in parallel with error isolation
    const promises = API_NINJAS_GLOBAL_LEAGUES.map(async (league) => {
      try {
        const matches = await fetchApiNinjasMatches(league.code, dateStr);
        return matches
          .map((m) => normalizeApiNinjasMatch(m, league.name, league.country))
          .filter((fix): fix is NormalizedMatchFixture => fix !== null);
      } catch {
        return [];
      }
    });

    const results = await Promise.all(promises);
    return results.flat();
  } catch (err) {
    console.warn("[API-Ninjas] Error fetching global fixtures:", err);
    return [];
  }
}

