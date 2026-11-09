/**
 * Fixture Fetcher (Step 17)
 * Pulls upcoming fixtures for Daily (Mon-Fri) or Weekend (Sat-Sun) slates,
 * strictly filtering out unapproved leagues.
 */

import { sportsApiFetch } from "./client";
import { isLeagueAllowed, getLeagueInfo } from "./leagues";
import type { RawApiFixture, NormalizedFixture } from "./types";

/** Formats a Date object to YYYY-MM-DD */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** Computes upcoming Saturday and Sunday dates */
export function getUpcomingWeekendDates(): { saturday: string; sunday: string } {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 is Sunday, 6 is Saturday

  let daysUntilSaturday = 6 - dayOfWeek;
  if (dayOfWeek === 6) {
    daysUntilSaturday = 0; // Today is Saturday
  } else if (dayOfWeek === 0) {
    daysUntilSaturday = -1; // Yesterday was Saturday
  }

  const saturday = new Date(now);
  saturday.setUTCDate(now.getUTCDate() + daysUntilSaturday);

  const sunday = new Date(saturday);
  sunday.setUTCDate(saturday.getUTCDate() + 1);

  return {
    saturday: formatDate(saturday),
    sunday: formatDate(sunday),
  };
}

/** Computes the target weekday date (Mon-Fri) */
export function getTargetWeekdayDate(): string {
  const now = new Date();
  const day = now.getUTCDay();

  // If Saturday (6), pick next Monday (+2)
  if (day === 6) {
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() + 2);
    return formatDate(monday);
  }
  // If Sunday (0), pick next Monday (+1)
  if (day === 0) {
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() + 1);
    return formatDate(monday);
  }

  return formatDate(now);
}

/** Normalizes raw API-Football fixture and filters by allowed leagues */
export function normalizeApiFixtures(rawList: RawApiFixture[]): NormalizedFixture[] {
  return rawList
    .filter((item) => {
      // Step 16 Filter: Strict whitelist of 54 countries + Int. Clubs
      return item.league && isLeagueAllowed(item.league.id);
    })
    .map((item) => {
      const leagueInfo = getLeagueInfo(item.league.id);
      return {
        apiFixtureId: item.fixture.id,
        homeTeamId: item.teams.home.id,
        homeTeam: item.teams.home.name,
        awayTeamId: item.teams.away.id,
        awayTeam: item.teams.away.name,
        leagueId: item.league.id,
        leagueName: leagueInfo?.leagueName || item.league.name,
        country: leagueInfo?.country || item.league.country,
        countryFlag: leagueInfo?.flag,
        kickoffTime: item.fixture.date,
        status: item.fixture.status.short,
      };
    });
}

/**
 * Fetch Daily Weekday Fixtures (Mon - Fri)
 */
export async function fetchDailyFixtures(
  targetDate?: string
): Promise<{ fixtures: NormalizedFixture[]; source: "live_api" | "fallback" }> {
  const date = targetDate || getTargetWeekdayDate();

  const apiResult = await sportsApiFetch<RawApiFixture[]>("fixtures", {
    params: { date },
    revalidateSeconds: 600, // 10 minutes cache
  });

  if (apiResult.success && apiResult.data && apiResult.data.length > 0) {
    const normalized = normalizeApiFixtures(apiResult.data);
    if (normalized.length > 0) {
      return { fixtures: normalized, source: "live_api" };
    }
  }

  return { fixtures: [], source: "live_api" };
}

/**
 * Fetch Weekend Fixtures (Sat - Sun)
 */
export async function fetchWeekendFixtures(
  startDate?: string,
  endDate?: string
): Promise<{ fixtures: NormalizedFixture[]; source: "live_api" | "fallback" }> {
  const { saturday, sunday } = getUpcomingWeekendDates();
  const from = startDate || saturday;
  const to = endDate || sunday;

  const apiResult = await sportsApiFetch<RawApiFixture[]>("fixtures", {
    params: { from, to },
    revalidateSeconds: 1800, // 30 minutes cache
  });

  if (apiResult.success && apiResult.data && apiResult.data.length > 0) {
    const normalized = normalizeApiFixtures(apiResult.data);
    if (normalized.length >= 10) {
      return { fixtures: normalized, source: "live_api" };
    }
  }

  return { fixtures: [], source: "live_api" };
}

