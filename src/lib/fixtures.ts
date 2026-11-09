/**
 * Fixture Fetcher (Step 17)
 * Fetches upcoming fixtures from API-Sports for a given date,
 * strictly filtering so only matches from our 54 approved countries (ALL leagues)
 * and International Club competitions are returned.
 */

import { apiSportsFetch } from "./api-sports";
import { isWhitelistedLeague, getCountryFlag } from "./leagues";

export interface NormalizedMatchFixture {
  apiFixtureId: number;
  homeTeamId: number;
  homeTeam: string;
  awayTeamId: number;
  awayTeam: string;
  leagueId: number;
  leagueName: string;
  country: string;
  countryFlag: string;
  kickoffTime: string;
  status: string;
}

interface RawApiFixturePayload {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    status: { short: string; long: string };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo?: string;
    flag?: string;
  };
  teams: {
    home: { id: number; name: string; logo?: string };
    away: { id: number; name: string; logo?: string };
  };
}

/** Formats date as YYYY-MM-DD */
export function toApiDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Fetches upcoming matches for a given date (YYYY-MM-DD),
 * strictly filtering out any fixture not belonging to the 54 approved countries
 * or International Club competitions.
 */
export async function fetchFixturesForDate(
  date: string
): Promise<{ fixtures: NormalizedMatchFixture[]; totalRaw: number; filteredCount: number; isMock: boolean; error?: string }> {
  const result = await apiSportsFetch<RawApiFixturePayload[]>("fixtures", {
    params: { date },
    revalidateSeconds: 600, // Cache for 10 minutes
  });

  if (result.success && result.data && Array.isArray(result.data)) {
    const rawMatches = result.data;
    const nowMs = Date.now();

    // Apply Step 16 Whitelist Filter AND Strict Future-Games Filter:
    // 1. ALL leagues in the 54 approved countries + Int. Clubs
    // 2. Strictly enforce status.short === 'NS' (Not Started)
    // 3. Strictly ignore games that have already kicked off (kickoffTime in the future)
    const filtered = rawMatches.filter((item) => {
      if (!isWhitelistedLeague(item.league)) return false;
      if (item.fixture?.status?.short !== "NS") return false;

      const kickoffMs = new Date(item.fixture.date).getTime();
      if (!isNaN(kickoffMs) && kickoffMs <= nowMs) {
        return false;
      }

      return true;
    });

    const normalized: NormalizedMatchFixture[] = filtered.map((item) => ({
      apiFixtureId: item.fixture.id,
      homeTeamId: item.teams.home.id,
      homeTeam: item.teams.home.name,
      awayTeamId: item.teams.away.id,
      awayTeam: item.teams.away.name,
      leagueId: item.league.id,
      leagueName: item.league.name,
      country: item.league.country,
      countryFlag: getCountryFlag(item.league.country),
      kickoffTime: item.fixture.date,
      status: item.fixture.status.short,
    }));

    return {
      fixtures: normalized,
      totalRaw: rawMatches.length,
      filteredCount: normalized.length,
      isMock: false,
    };
  }

  // Strict live data only: return empty array if no live fixtures available from API-Sports
  return {
    fixtures: [],
    totalRaw: 0,
    filteredCount: 0,
    isMock: false,
    error: result.error || "No fixtures returned from API-Sports",
  };
}

/**
 * Fetches matches across upcoming Saturday and Sunday
 */
export async function fetchWeekendFixturesPool(
  startDate?: string,
  endDate?: string
): Promise<{ fixtures: NormalizedMatchFixture[]; isMock: boolean; error?: string }> {
  // If dates are provided, fetch them; otherwise default to upcoming weekend
  const now = new Date();
  const day = now.getUTCDay();
  const satOffset = (6 - day + 7) % 7;
  const sat = new Date(now);
  sat.setUTCDate(now.getUTCDate() + satOffset);
  const sun = new Date(sat);
  sun.setUTCDate(sat.getUTCDate() + 1);

  const fromDate = startDate || toApiDate(sat);
  const toDate = endDate || toApiDate(sun);

  const [satResults, sunResults] = await Promise.all([
    fetchFixturesForDate(fromDate),
    fetchFixturesForDate(toDate),
  ]);

  const combined = [...satResults.fixtures, ...sunResults.fixtures];

  return {
    fixtures: combined,
    isMock: false,
    error: combined.length === 0 ? (satResults.error || sunResults.error || "No weekend fixtures found") : undefined,
  };
}

