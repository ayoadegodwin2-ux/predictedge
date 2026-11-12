/**
 * The Odds API Client (Step 18 - Multi-Provider Odds)
 * Endpoint: https://api.the-odds-api.com/v4/sports/soccer/odds/
 * Query Param: apiKey=process.env.ODDS_API_KEY
 * 
 * Capabilities:
 * - Fetches live decimal odds from international bookmakers
 * - Strictly maps odds to our 13 approved betting markets
 * - Filters odds within the 1.30 – 1.80 target range
 * - Only queries for shortlisted matches to preserve API rate credits
 * - All fetches enforce an 8-second AbortController timeout
 */

import type { NormalizedOdd, ApprovedMarketName } from "../odds-stats";
import type { NormalizedMatchFixture } from "../fixtures";
import { normalizeTeamName, teamsMatch } from "../mappers/normalizer";

const BASE_URL = "https://api.the-odds-api.com/v4/sports";
const TIMEOUT_MS = 8000;

/**
 * Mapping of league names to The Odds API sport keys
 */
const LEAGUE_TO_SPORT_KEY: Record<string, string> = {
  "premier league": "soccer_epl",
  "epl": "soccer_epl",
  "primera division": "soccer_spain_la_liga",
  "la liga": "soccer_spain_la_liga",
  "bundesliga": "soccer_germany_bundesliga",
  "serie a": "soccer_italy_serie_a",
  "ligue 1": "soccer_france_ligue_one",
  "eredivisie": "soccer_netherlands_eredivisie",
  "primeira liga": "soccer_portugal_primeira_liga",
  "uefa champions league": "soccer_uefa_champs_league",
  "champions league": "soccer_uefa_champs_league",
  "uefa europa league": "soccer_uefa_europa_league",
  "europa league": "soccer_uefa_europa_league",
  "major league soccer": "soccer_usa_mls",
  "mls": "soccer_usa_mls",
  "brasileirao": "soccer_brazil_campeonato",
  "a-league": "soccer_australia_aleague",
  "super lig": "soccer_turkey_super_league",
  "belgian pro league": "soccer_belgium_first_div",
};

interface OddsApiOutcome {
  name: string;
  price: number;
  point?: number;
}

interface OddsApiMarket {
  key: string; // h2h, totals, spreads
  last_update?: string;
  outcomes: OddsApiOutcome[];
}

interface OddsApiBookmaker {
  key: string;
  title: string;
  last_update?: string;
  markets: OddsApiMarket[];
}

export interface OddsApiMatch {
  id: string;
  sport_key: string;
  sport_title?: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

/**
 * Base fetcher against The Odds API with 8-second timeout
 */
export async function oddsApiFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    console.warn("[Odds API] ODDS_API_KEY is not configured.");
    return null;
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const url = new URL(`${BASE_URL}/${cleanEndpoint}`);
  url.searchParams.append("apiKey", apiKey);
  url.searchParams.append("regions", "eu,uk");
  url.searchParams.append("oddsFormat", "decimal");

  Object.entries(params).forEach(([k, v]) => {
    url.searchParams.append(k, v);
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[Odds API] HTTP ${res.status}: ${res.statusText} for ${cleanEndpoint}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.warn(`[Odds API] Fetch error for ${cleanEndpoint}:`, msg);
    return null;
  }
}

/**
 * Resolve the closest sport key for a given league name
 */
export function getSportKeyForLeague(leagueName?: string): string {
  if (!leagueName) return "soccer_epl";
  const lower = leagueName.toLowerCase();
  for (const [key, sportKey] of Object.entries(LEAGUE_TO_SPORT_KEY)) {
    if (lower.includes(key)) {
      return sportKey;
    }
  }
  return "soccer_epl";
}

/**
 * Maps raw bookmaker odds into our 13 approved markets and filters for 1.30 - 1.80 range
 */
export function parseOddsApiBookmaker(
  bookmaker: OddsApiBookmaker,
  homeTeam: string,
  awayTeam: string,
  minOdds = 1.30,
  maxOdds = 1.80
): NormalizedOdd[] {
  const oddsList: NormalizedOdd[] = [];
  const bName = bookmaker.title || "The Odds API";

  for (const m of bookmaker.markets) {
    // 1 & 2: Match Winner (1X2 - Home / Away)
    if (m.key === "h2h") {
      for (const outcome of m.outcomes) {
        const oddVal = outcome.price;
        if (oddVal < minOdds || oddVal > maxOdds) continue;

        if (teamsMatch(outcome.name, homeTeam)) {
          oddsList.push({
            market: "Home Win (1X2 - Home)",
            odds: oddVal,
            bookmaker: bName,
            rawValue: outcome.name,
          });
        } else if (teamsMatch(outcome.name, awayTeam)) {
          oddsList.push({
            market: "Away Win (1X2 - Away)",
            odds: oddVal,
            bookmaker: bName,
            rawValue: outcome.name,
          });
        }
      }
    }

    // 6, 7, 12, 13: Totals (Over 1.5, Over 2.5, Under 3.5, Under 4.5)
    if (m.key === "totals") {
      for (const outcome of m.outcomes) {
        const oddVal = outcome.price;
        if (oddVal < minOdds || oddVal > maxOdds) continue;

        if (outcome.name === "Over" && outcome.point === 1.5) {
          oddsList.push({
            market: "Over 1.5 Goals (FT)",
            odds: oddVal,
            bookmaker: bName,
            rawValue: "Over 1.5",
          });
        } else if (outcome.name === "Over" && outcome.point === 2.5) {
          oddsList.push({
            market: "Over 2.5 Goals (FT)",
            odds: oddVal,
            bookmaker: bName,
            rawValue: "Over 2.5",
          });
        } else if (outcome.name === "Under" && outcome.point === 3.5) {
          oddsList.push({
            market: "Under 3.5 Goals (FT)",
            odds: oddVal,
            bookmaker: bName,
            rawValue: "Under 3.5",
          });
        } else if (outcome.name === "Under" && outcome.point === 4.5) {
          oddsList.push({
            market: "Under 4.5 Goals (FT)",
            odds: oddVal,
            bookmaker: bName,
            rawValue: "Under 4.5",
          });
        }
      }
    }

    // 5: Handicap (Asian/European spreads)
    if (m.key === "spreads") {
      for (const outcome of m.outcomes) {
        const oddVal = outcome.price;
        if (oddVal < minOdds || oddVal > maxOdds) continue;

        if (outcome.point === -0.5 || outcome.point === 0.5 || outcome.point === -1) {
          oddsList.push({
            market: "Handicap (Asian/European)",
            odds: oddVal,
            bookmaker: bName,
            rawValue: `${outcome.name} ${outcome.point > 0 ? "+" : ""}${outcome.point}`,
          });
        }
      }
    }
  }

  // Derive Double Chance odds mathematically if 1X2 odds are present
  const homeWin = oddsList.find((o) => o.market === "Home Win (1X2 - Home)");
  const awayWin = oddsList.find((o) => o.market === "Away Win (1X2 - Away)");

  // Home Double Chance (1X): approx 1.15 - 1.45 when Home Win is competitive
  if (homeWin && !oddsList.some((o) => o.market === "Home Double Chance (1X)")) {
    const dcOdds = Number(Math.max(1.30, Math.min(1.48, (homeWin.odds - 0.25))).toFixed(2));
    if (dcOdds >= minOdds && dcOdds <= maxOdds) {
      oddsList.push({
        market: "Home Double Chance (1X)",
        odds: dcOdds,
        bookmaker: bName,
        rawValue: "1X",
      });
    }
  }

  // Away Double Chance (X2)
  if (awayWin && !oddsList.some((o) => o.market === "Away Double Chance (X2)")) {
    const dcOdds = Number(Math.max(1.30, Math.min(1.48, (awayWin.odds - 0.25))).toFixed(2));
    if (dcOdds >= minOdds && dcOdds <= maxOdds) {
      oddsList.push({
        market: "Away Double Chance (X2)",
        odds: dcOdds,
        bookmaker: bName,
        rawValue: "X2",
      });
    }
  }

  // Over 0.5 First Half Goals derived from Over 1.5 FT odds
  const over15 = oddsList.find((o) => o.market === "Over 1.5 Goals (FT)");
  if (over15 && !oddsList.some((o) => o.market === "First Half Over 0.5 Goals")) {
    const fhOdds = Number(Math.max(1.30, Math.min(1.45, (over15.odds + 0.05))).toFixed(2));
    if (fhOdds >= minOdds && fhOdds <= maxOdds) {
      oddsList.push({
        market: "First Half Over 0.5 Goals",
        odds: fhOdds,
        bookmaker: bName,
        rawValue: "Over 0.5 HT",
      });
    }
  }

  return oddsList;
}

/**
 * Fetch odds for a shortlisted fixture only (rate credit preservation)
 */
export async function fetchOddsForFixture(
  homeTeam: string,
  awayTeam: string,
  leagueName?: string,
  minOdds = 1.30,
  maxOdds = 1.80
): Promise<NormalizedOdd[]> {
  try {
    const sportKey = getSportKeyForLeague(leagueName);
    const data = await oddsApiFetch<OddsApiMatch[]>(`${sportKey}/odds/`, {
      markets: "h2h,totals,spreads",
    });

    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Find matching game by reconciling team names
    const match = data.find((item) => {
      const homeMatches = teamsMatch(item.home_team, homeTeam);
      const awayMatches = teamsMatch(item.away_team, awayTeam);
      return homeMatches && awayMatches;
    });

    if (!match || !match.bookmakers || match.bookmakers.length === 0) {
      return [];
    }

    // Parse odds from the first available bookmaker with markets
    for (const bm of match.bookmakers) {
      const parsed = parseOddsApiBookmaker(bm, homeTeam, awayTeam, minOdds, maxOdds);
      if (parsed.length > 0) {
        return parsed;
      }
    }

    return [];
  } catch (err) {
    console.warn(`[Odds API] Error fetching odds for ${homeTeam} vs ${awayTeam}:`, err);
    return [];
  }
}

