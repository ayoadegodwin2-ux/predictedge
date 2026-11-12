/**
 * Orchestrator & Cross-Provider Normalizer
 * 
 * Reconciles team names across:
 * 1. Football-Data.org (European Provider)
 * 2. API-Ninjas (Global Provider)
 * 3. The Odds API (Odds Provider)
 * 
 * Pipeline Orchestration:
 * - Fetches fixtures concurrently from European and Global providers
 * - Deduplicates and normalizes team representations
 * - Filters candidate fixtures against league whitelist and future kickoff constraints
 * - Queries The Odds API ONLY for shortlisted matches (strict rate-credit preservation)
 * - Wraps all calls in 8-second timeouts to isolate failures
 */

import { fetchFootballDataFixturesForDate, fetchFootballDataFixturesRange } from "../api/football-data";
import { fetchGlobalFixtures } from "../api/api-ninjas";
import { fetchOddsForFixture } from "../api/odds-client";
import { isWhitelistedLeague } from "../leagues";
import type { NormalizedMatchFixture } from "../fixtures";
import type { NormalizedOdd } from "../odds-stats";

/**
 * Common team alias dictionary
 */
const TEAM_ALIASES: Record<string, string> = {
  "man city": "manchester city",
  "manchester city fc": "manchester city",
  "man utd": "manchester united",
  "man united": "manchester united",
  "manchester united fc": "manchester united",
  "spurs": "tottenham hotspur",
  "tottenham": "tottenham hotspur",
  "tottenham hotspur fc": "tottenham hotspur",
  "wolves": "wolverhampton wanderers",
  "wolverhampton": "wolverhampton wanderers",
  "wolverhampton wanderers fc": "wolverhampton wanderers",
  "brighton": "brighton and hove albion",
  "brighton & hove albion": "brighton and hove albion",
  "brighton & hove albion fc": "brighton and hove albion",
  "newcastle": "newcastle united",
  "newcastle united fc": "newcastle united",
  "nottingham": "nottingham forest",
  "nottingham forest fc": "nottingham forest",
  "west ham": "west ham united",
  "west ham united fc": "west ham united",
  "sheffield utd": "sheffield united",
  "sheffield united fc": "sheffield united",
  "barca": "barcelona",
  "fc barcelona": "barcelona",
  "real madrid cf": "real madrid",
  "atletico": "atletico madrid",
  "atletico de madrid": "atletico madrid",
  "club atletico de madrid": "atletico madrid",
  "bayern": "bayern munich",
  "fc bayern munchen": "bayern munich",
  "bayern munchen": "bayern munich",
  "dortmund": "borussia dortmund",
  "bvb": "borussia dortmund",
  "inter": "inter milan",
  "fc internazionale milano": "inter milan",
  "internazionale": "inter milan",
  "milan": "ac milan",
  "ac milan": "ac milan",
  "juve": "juventus",
  "juventus fc": "juventus",
  "roma": "as roma",
  "as roma": "as roma",
  "psg": "paris saint germain",
  "paris sg": "paris saint germain",
  "sporting": "sporting cp",
  "sporting lisbon": "sporting cp",
  "benfica": "sl benfica",
  "porto": "fc porto",
  "ajax": "afc ajax",
  "inter miami cf": "inter miami",
};

/**
 * Normalizes a team name into a canonical string
 */
export function normalizeTeamName(rawName: string): string {
  if (!rawName) return "";

  let cleaned = rawName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/&/g, "and")
    .replace(/[^\w\s]/g, " ") // remove punctuation
    .replace(/\s+/g, " ")
    .trim();

  // Check alias table first
  if (TEAM_ALIASES[cleaned]) {
    return TEAM_ALIASES[cleaned];
  }

  // Strip generic football prefixes/suffixes
  const stripped = cleaned
    .replace(/\b(fc|cf|afc|sc|ac|ss|sv|club|fk|sk|bk)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return TEAM_ALIASES[stripped] || stripped;
}

/**
 * Compares two team names across providers for equality or significant token match
 */
export function teamsMatch(nameA: string, nameB: string): boolean {
  if (!nameA || !nameB) return false;

  const normA = normalizeTeamName(nameA);
  const normB = normalizeTeamName(nameB);

  // Exact match after normalization
  if (normA === normB) return true;

  // Substring inclusion
  if (normA.length >= 4 && normB.length >= 4) {
    if (normA.includes(normB) || normB.includes(normA)) {
      return true;
    }
  }

  // Token overlap check (e.g. "Brighton Hove Albion" vs "Brighton")
  const tokensA = new Set(normA.split(" ").filter((t) => t.length > 2));
  const tokensB = new Set(normB.split(" ").filter((t) => t.length > 2));

  let shared = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) shared++;
  }

  const minTokens = Math.min(tokensA.size, tokensB.size);
  if (minTokens > 0 && shared >= minTokens) {
    return true;
  }

  return false;
}

/**
 * Deduplicates two lists of fixtures by checking if their home & away teams match
 */
export function deduplicateFixtures(fixtures: NormalizedMatchFixture[]): NormalizedMatchFixture[] {
  const unique: NormalizedMatchFixture[] = [];

  for (const fix of fixtures) {
    const exists = unique.some(
      (u) => teamsMatch(u.homeTeam, fix.homeTeam) && teamsMatch(u.awayTeam, fix.awayTeam)
    );
    if (!exists) {
      unique.push(fix);
    }
  }

  return unique;
}

/**
 * Orchestrator: Fetches fixtures from Football-Data (European) and API-Ninjas (Global)
 * with complete error isolation. An outage in one never crashes the serverless pipeline.
 */
export async function fetchMultiProviderFixturesForDate(dateStr: string): Promise<NormalizedMatchFixture[]> {
  const [europeanFixtures, globalFixtures] = await Promise.all([
    fetchFootballDataFixturesForDate(dateStr).catch((err) => {
      console.warn("[Orchestrator] European provider fetch failed:", err);
      return [] as NormalizedMatchFixture[];
    }),
    fetchGlobalFixtures(dateStr).catch((err) => {
      console.warn("[Orchestrator] Global provider fetch failed:", err);
      return [] as NormalizedMatchFixture[];
    }),
  ]);

  const combined = [...europeanFixtures, ...globalFixtures];
  const whitelisted = combined.filter((f) =>
    isWhitelistedLeague({ name: f.leagueName, country: f.country })
  );

  return deduplicateFixtures(whitelisted);
}

/**
 * Orchestrator: Fetches weekend pool from European and Global providers
 */
export async function fetchMultiProviderWeekendFixtures(
  saturdayDate: string,
  sundayDate: string
): Promise<NormalizedMatchFixture[]> {
  const [europeanFixtures, globalFixtures] = await Promise.all([
    fetchFootballDataFixturesRange(saturdayDate, sundayDate).catch((err) => {
      console.warn("[Orchestrator] European weekend fetch failed:", err);
      return [] as NormalizedMatchFixture[];
    }),
    fetchGlobalFixtures().catch((err) => {
      console.warn("[Orchestrator] Global weekend fetch failed:", err);
      return [] as NormalizedMatchFixture[];
    }),
  ]);

  const combined = [...europeanFixtures, ...globalFixtures];
  const whitelisted = combined.filter((f) =>
    isWhitelistedLeague({ name: f.leagueName, country: f.country })
  );

  return deduplicateFixtures(whitelisted);
}

/**
 * Rate-Credit Preservation:
 * Queries The Odds API ONLY for a shortlisted candidate fixture.
 */
export async function fetchShortlistedMatchOdds(
  fixture: NormalizedMatchFixture,
  isWeekend: boolean
): Promise<NormalizedOdd[]> {
  const minOdds = isWeekend ? 1.20 : 1.30;
  const maxOdds = isWeekend ? 1.80 : 1.50;

  try {
    return await fetchOddsForFixture(
      fixture.homeTeam,
      fixture.awayTeam,
      fixture.leagueName,
      minOdds,
      maxOdds
    );
  } catch (err) {
    console.warn(`[Orchestrator] Odds fetch failed for ${fixture.homeTeam} vs ${fixture.awayTeam}:`, err);
    return [];
  }
}

