/**
 * Odds & Stats Fetcher (Step 18 - Upgraded Deep Analysis)
 * 
 * Deep Analysis Capabilities:
 * 1. Bookmaker Odds: Strictly filters for the 13 approved markets within target windows.
 * 2. 15 Head-to-Head Matchups: Fetches and calculates deep H2H dominance, goal trends, and recency weighting.
 * 3. 10-Match Individual Form: Fetches past 10 matches separately for Home and Away teams.
 * 4. Tactical Stats: Evaluates attacking power, defensive stability, clean sheet %, and venue splits.
 * 5. Real-Time Injuries & Suspensions: Scans API-Sports /injuries endpoint for key squad absences.
 */

import { apiSportsFetch } from "./api-sports";
import type { NormalizedMatchFixture } from "./fixtures";
import { fetchOddsForFixture } from "./api/odds-client";
import { fetchFootballDataH2H } from "./api/football-data";

/**
 * The 13 Strictly Approved Betting Markets
 */
export const APPROVED_MARKETS = [
  "Home Win (1X2 - Home)",
  "Away Win (1X2 - Away)",
  "Home Double Chance (1X)",
  "Away Double Chance (X2)",
  "Handicap (Asian/European)",
  "Over 1.5 Goals (FT)",
  "Over 2.5 Goals (FT)",
  "GG / Both Teams to Score (BTTS - Yes)",
  "Home Team to Score (Over 0.5)",
  "Away Team to Score (Over 0.5)",
  "First Half Over 0.5 Goals",
  "Under 3.5 Goals (FT)",
  "Under 4.5 Goals (FT)",
] as const;

export type ApprovedMarketName = (typeof APPROVED_MARKETS)[number];

export interface NormalizedOdd {
  market: ApprovedMarketName;
  odds: number;
  bookmaker: string;
  rawValue: string;
}

export interface TeamStats {
  teamId: number;
  // 10-match individual form metrics
  formPoints: number;        // out of 30 (from last 10 matches)
  formScore: number;         // 0 - 100 percentage
  formString: string;        // 10-match string e.g. "WWDWWLDWWW"
  last5FormString: string;   // 5-match string e.g. "LDWWW"
  // Attacking & Defensive tactical metrics
  goalsScoredAvg: number;    // per game across 10 matches & season
  goalsConcededAvg: number;  // per game across 10 matches & season
  cleanSheetPct: number;     // clean sheet %
  failedToScorePct: number;  // failed to score %
  over15Rate: number;        // % of matches with > 1.5 goals
  over25Rate: number;        // % of matches with > 2.5 goals
  bttsRate: number;          // % of matches where both teams scored
  venueWinRate: number;      // Home win % at home / Away win % away
  venueGoalsScoredAvg: number;
  venueGoalsConcededAvg: number;
  attackRating: number;      // 0 - 100 normalized attacking efficiency
  defenseRating: number;     // 0 - 100 normalized defensive stability
}

export interface H2HRecord {
  matchesPlayed: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  avgTotalGoals: number;
  bttsCount: number;
  over15Count: number;
  over25Count: number;
  recentHomeWins: number; // Last 5 matches
  recentAwayWins: number; // Last 5 matches
  recentDraws: number;    // Last 5 matches
  homeCleanSheets: number;
  awayCleanSheets: number;
  last15Scores: string[]; // e.g. ["2-1", "1-0", "0-0", ...]
}

export interface MissingPlayer {
  id: number;
  name: string;
  type: string;   // "Missing Fixture", "Questionable", "Suspended"
  reason: string; // e.g. "Hamstring", "Red Card", "Cruciate Ligament"
  teamId: number;
  teamName: string;
}

export interface MatchInjuriesContext {
  homeMissing: MissingPlayer[];
  awayMissing: MissingPlayer[];
  totalMissing: number;
  homeRiskLevel: "LOW" | "MEDIUM" | "HIGH";
  awayRiskLevel: "LOW" | "MEDIUM" | "HIGH";
  summary: string;
}

export interface FixtureEnrichedContext {
  fixture: NormalizedMatchFixture;
  odds: NormalizedOdd[];
  homeStats: TeamStats;
  awayStats: TeamStats;
  h2h: H2HRecord;
  injuries: MatchInjuriesContext;
}

interface RawBetValue {
  value: string;
  odd: string | number;
}

interface RawBet {
  id: number;
  name: string;
  values: RawBetValue[];
}

interface RawBookmaker {
  id: number;
  name: string;
  bets: RawBet[];
}

interface RawOddsResponse {
  bookmakers: RawBookmaker[];
}

interface RawH2HMatch {
  fixture?: { id: number; date: string; status: { short: string } };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: { home: number | null; away: number | null };
}

interface RawRecentFixture {
  fixture: { id: number; date: string; status: { short: string } };
  league: { id: number; name: string };
  teams: {
    home: { id: number; name: string; winner: boolean | null };
    away: { id: number; name: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
}

interface RawTeamStats {
  form?: string;
  goals?: {
    for?: { average?: { total: string; home?: string; away?: string } };
    against?: { average?: { total: string; home?: string; away?: string } };
  };
  clean_sheet?: { total: number; home?: number; away?: number };
  failed_to_score?: { total: number; home?: number; away?: number };
  fixtures?: { played?: { total: number; home?: number; away?: number }; wins?: { home?: number; away?: number } };
}

interface RawInjuryItem {
  player: { id: number; name: string; type: string; reason: string };
  team: { id: number; name: string };
  fixture: { id: number };
  league: { id: number; name: string; country: string };
}

/**
 * Filter and map raw bookmaker bets to the 13 approved markets only
 */
function extractApprovedMarketOdds(bookmaker: RawBookmaker): NormalizedOdd[] {
  const result: NormalizedOdd[] = [];
  const bName = bookmaker.name || "Main Bookmaker";

  for (const bet of bookmaker.bets) {
    // 1 & 2: Match Winner (1X2)
    if (bet.id === 1 || bet.name === "Match Winner") {
      for (const v of bet.values) {
        const odd = parseFloat(String(v.odd));
        if (v.value === "Home") {
          result.push({ market: "Home Win (1X2 - Home)", odds: odd, bookmaker: bName, rawValue: "Home" });
        } else if (v.value === "Away") {
          result.push({ market: "Away Win (1X2 - Away)", odds: odd, bookmaker: bName, rawValue: "Away" });
        }
      }
    }

    // 3 & 4: Double Chance (1X / X2)
    if (bet.id === 12 || bet.name === "Double Chance") {
      for (const v of bet.values) {
        const odd = parseFloat(String(v.odd));
        if (v.value === "Home/Draw" || v.value === "1X") {
          result.push({ market: "Home Double Chance (1X)", odds: odd, bookmaker: bName, rawValue: "1X" });
        } else if (v.value === "Draw/Away" || v.value === "X2") {
          result.push({ market: "Away Double Chance (X2)", odds: odd, bookmaker: bName, rawValue: "X2" });
        }
      }
    }

    // 6, 7, 12, 13: Goals Over/Under (FT)
    if (bet.id === 5 || bet.name === "Goals Over/Under") {
      for (const v of bet.values) {
        const odd = parseFloat(String(v.odd));
        if (v.value === "Over 1.5") {
          result.push({ market: "Over 1.5 Goals (FT)", odds: odd, bookmaker: bName, rawValue: "Over 1.5" });
        } else if (v.value === "Over 2.5") {
          result.push({ market: "Over 2.5 Goals (FT)", odds: odd, bookmaker: bName, rawValue: "Over 2.5" });
        } else if (v.value === "Under 3.5") {
          result.push({ market: "Under 3.5 Goals (FT)", odds: odd, bookmaker: bName, rawValue: "Under 3.5" });
        } else if (v.value === "Under 4.5") {
          result.push({ market: "Under 4.5 Goals (FT)", odds: odd, bookmaker: bName, rawValue: "Under 4.5" });
        }
      }
    }

    // 8: Both Teams Score (BTTS - Yes)
    if (bet.id === 8 || bet.name === "Both Teams Score") {
      for (const v of bet.values) {
        const odd = parseFloat(String(v.odd));
        if (v.value === "Yes") {
          result.push({ market: "GG / Both Teams to Score (BTTS - Yes)", odds: odd, bookmaker: bName, rawValue: "Yes" });
        }
      }
    }

    // 11: First Half Over 0.5 Goals
    if (bet.id === 6 || bet.name === "Goals Over/Under First Half") {
      for (const v of bet.values) {
        const odd = parseFloat(String(v.odd));
        if (v.value === "Over 0.5") {
          result.push({ market: "First Half Over 0.5 Goals", odds: odd, bookmaker: bName, rawValue: "Over 0.5" });
        }
      }
    }

    // 9 & 10: Home/Away Team Over 0.5 Goals
    if (bet.name?.includes("Home Team Goals") || bet.name?.includes("Total - Home")) {
      for (const v of bet.values) {
        const odd = parseFloat(String(v.odd));
        if (v.value === "Over 0.5") {
          result.push({ market: "Home Team to Score (Over 0.5)", odds: odd, bookmaker: bName, rawValue: "Over 0.5" });
        }
      }
    }
    if (bet.name?.includes("Away Team Goals") || bet.name?.includes("Total - Away")) {
      for (const v of bet.values) {
        const odd = parseFloat(String(v.odd));
        if (v.value === "Over 0.5") {
          result.push({ market: "Away Team to Score (Over 0.5)", odds: odd, bookmaker: bName, rawValue: "Over 0.5" });
        }
      }
    }

    // 5: Handicap (Asian/European)
    if (bet.id === 4 || bet.name === "Asian Handicap") {
      for (const v of bet.values) {
        const odd = parseFloat(String(v.odd));
        if (v.value.includes("-0.5") || v.value.includes("+0.5") || v.value.includes("-1")) {
          result.push({ market: "Handicap (Asian/European)", odds: odd, bookmaker: bName, rawValue: v.value });
        }
      }
    }
  }

  return result;
}

/**
 * Fetches pre-match odds for a fixture, strictly mapped to the 13 approved markets.
 * Prioritizes The Odds API, with graceful fallback to API-Sports.
 */
export async function fetchPreMatchOdds(
  fixtureId: number,
  homeTeam?: string,
  awayTeam?: string,
  leagueName?: string
): Promise<NormalizedOdd[]> {
  // 1. Primary: The Odds API for live decimal odds
  if (homeTeam && awayTeam) {
    try {
      const oddsApiResult = await fetchOddsForFixture(homeTeam, awayTeam, leagueName);
      if (oddsApiResult.length > 0) {
        return oddsApiResult;
      }
    } catch (oddsErr) {
      console.warn("[Odds-Stats] The Odds API query failed, checking fallback:", oddsErr);
    }
  }

  // 2. Secondary fallback: API-Sports
  const res = await apiSportsFetch<RawOddsResponse[]>("odds", {
    params: { fixture: fixtureId },
    revalidateSeconds: 600,
  });

  if (res.success && res.data && res.data.length > 0) {
    const bookmakers = res.data[0].bookmakers;
    if (bookmakers && bookmakers.length > 0) {
      const parsed = extractApprovedMarketOdds(bookmakers[0]);
      if (parsed.length > 0) {
        return parsed;
      }
    }
  }

  // No live odds returned from bookmakers
  return [];
}

/**
 * Fetches historical Head-to-Head record between two teams (Last 15 matchups)
 */
export async function fetchHeadToHeadStats(homeId: number, awayId: number): Promise<H2HRecord> {
  const res = await apiSportsFetch<RawH2HMatch[]>("fixtures/headtohead", {
    params: { h2h: `${homeId}-${awayId}` },
    revalidateSeconds: 3600,
  });

  if (res.success && res.data && res.data.length > 0) {
    const matches = res.data
      .filter((m) => !m.fixture?.status?.short || ["FT", "AET", "PEN"].includes(m.fixture.status.short))
      .sort((a, b) => {
        const timeA = a.fixture?.date ? new Date(a.fixture.date).getTime() : 0;
        const timeB = b.fixture?.date ? new Date(b.fixture.date).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 15);

    if (matches.length > 0) {
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

      matches.forEach((m, idx) => {
        const hG = m.goals.home ?? 0;
        const aG = m.goals.away ?? 0;
        totalGoals += hG + aG;
        last15Scores.push(`${hG}-${aG}`);

        if (hG > 0 && aG > 0) bttsCount++;
        if (hG + aG >= 2) over15Count++;
        if (hG + aG >= 3) over25Count++;

        const isHomeTeamWinner = (m.teams.home.id === homeId && hG > aG) || (m.teams.away.id === homeId && aG > hG);
        const isAwayTeamWinner = (m.teams.home.id === awayId && hG > aG) || (m.teams.away.id === awayId && aG > hG);

        if (hG === aG) {
          draws++;
          if (idx < 5) recentDraws++;
        } else if (isHomeTeamWinner) {
          homeWins++;
          if (idx < 5) recentHomeWins++;
        } else if (isAwayTeamWinner) {
          awayWins++;
          if (idx < 5) recentAwayWins++;
        }

        if (m.teams.home.id === homeId && aG === 0) homeCleanSheets++;
        if (m.teams.away.id === homeId && hG === 0) homeCleanSheets++;
        if (m.teams.home.id === awayId && aG === 0) awayCleanSheets++;
        if (m.teams.away.id === awayId && hG === 0) awayCleanSheets++;
      });

      return {
        matchesPlayed: matches.length,
        homeWins,
        draws,
        awayWins,
        avgTotalGoals: matches.length > 0 ? Number((totalGoals / matches.length).toFixed(1)) : 2.6,
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
    }
  }

  // No head to head history available
  return {
    matchesPlayed: 0,
    homeWins: 0,
    draws: 0,
    awayWins: 0,
    avgTotalGoals: 0,
    bttsCount: 0,
    over15Count: 0,
    over25Count: 0,
    recentHomeWins: 0,
    recentAwayWins: 0,
    recentDraws: 0,
    homeCleanSheets: 0,
    awayCleanSheets: 0,
    last15Scores: [],
  };
}

/**
 * Fetches the last 10 individual matches for a specific team
 */
export async function fetchRecentTeamMatches(teamId: number): Promise<{
  formPoints10: number;
  formScore10: number;
  formString10: string;
  last5FormString: string;
  scoredAvg10: number;
  concededAvg10: number;
  cleanSheetCount10: number;
  cleanSheetPct10: number;
  failedToScoreCount10: number;
  failedToScorePct10: number;
  over15Rate10: number;
  over25Rate10: number;
  bttsRate10: number;
  venueWins: number;
  venueMatches: number;
  venueWinPct: number;
}> {
  const currentYear = new Date().getFullYear();
  // Free plan permits seasons up to 2024
  const targetSeason = Math.min(currentYear, 2024);

  let res = await apiSportsFetch<RawRecentFixture[]>("fixtures", {
    params: { team: teamId, season: targetSeason },
    revalidateSeconds: 1800,
  });

  if ((!res.success || !res.data || res.data.length === 0) && targetSeason > 2023) {
    res = await apiSportsFetch<RawRecentFixture[]>("fixtures", {
      params: { team: teamId, season: targetSeason - 1 },
      revalidateSeconds: 1800,
    });
  }

  if (res.success && res.data && res.data.length > 0) {
    const list = res.data
      .filter((m) => !m.fixture?.status?.short || ["FT", "AET", "PEN"].includes(m.fixture.status.short))
      .sort((a, b) => {
        const timeA = a.fixture?.date ? new Date(a.fixture.date).getTime() : 0;
        const timeB = b.fixture?.date ? new Date(b.fixture.date).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 10);

    if (list.length > 0) {
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

      for (const item of list) {
        const isHome = item.teams.home.id === teamId;
        const myGoals = (isHome ? item.goals.home : item.goals.away) ?? 0;
        const oppGoals = (isHome ? item.goals.away : item.goals.home) ?? 0;

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

        // Venue performance (home team at home, away team away)
        if (isHome) {
          venueMatches++;
          if (myGoals > oppGoals) venueWins++;
        }
      }

      const count = list.length;
      const formScore10 = Math.round((points / (count * 3)) * 100);
      const last5Str = formChars.slice(-5);

      return {
        formPoints10: points,
        formScore10,
        formString10: formChars,
        last5FormString: last5Str,
        scoredAvg10: Number((scored / count).toFixed(2)),
        concededAvg10: Number((conceded / count).toFixed(2)),
        cleanSheetCount10: cleanSheets,
        cleanSheetPct10: Math.round((cleanSheets / count) * 100),
        failedToScoreCount10: failedToScore,
        failedToScorePct10: Math.round((failedToScore / count) * 100),
        over15Rate10: Math.round((over15 / count) * 100),
        over25Rate10: Math.round((over25 / count) * 100),
        bttsRate10: Math.round((btts / count) * 100),
        venueWins,
        venueMatches,
        venueWinPct: venueMatches > 0 ? Math.round((venueWins / venueMatches) * 100) : 60,
      };
    }
  }

  // No past matches recorded
  return {
    formPoints10: 0,
    formScore10: 0,
    formString10: "",
    last5FormString: "",
    scoredAvg10: 0,
    concededAvg10: 0,
    cleanSheetCount10: 0,
    cleanSheetPct10: 0,
    failedToScoreCount10: 0,
    failedToScorePct10: 0,
    over15Rate10: 0,
    over25Rate10: 0,
    bttsRate10: 0,
    venueWins: 0,
    venueMatches: 0,
    venueWinPct: 0,
  };
}

/**
 * Fetches comprehensive team performance & tactical stats
 */
export async function fetchTeamStats(teamId: number, leagueId: number, isHome: boolean): Promise<TeamStats> {
  const season = Math.min(new Date().getFullYear(), 2024);

  // Run team statistics & 10-match individual form in parallel
  const [statsRes, form10] = await Promise.all([
    apiSportsFetch<RawTeamStats>("teams/statistics", {
      params: { team: teamId, league: leagueId, season },
      revalidateSeconds: 3600,
    }),
    fetchRecentTeamMatches(teamId),
  ]);

  if (statsRes.success && statsRes.data) {
    const raw = statsRes.data;
    const scoredAvg = parseFloat(
      (isHome ? raw.goals?.for?.average?.home : raw.goals?.for?.average?.away) ||
      raw.goals?.for?.average?.total ||
      String(form10.scoredAvg10)
    );
    const concededAvg = parseFloat(
      (isHome ? raw.goals?.against?.average?.home : raw.goals?.against?.average?.away) ||
      raw.goals?.against?.average?.total ||
      String(form10.concededAvg10)
    );

    // Normalized attack rating: based on goals scored, failed to score %, and over rates
    const attackRating = Math.min(99, Math.max(40, Math.round(
      scoredAvg * 28 + (100 - form10.failedToScorePct10) * 0.3 + form10.over15Rate10 * 0.2
    )));

    // Normalized defense rating: based on clean sheet % and low concession rate
    const defenseRating = Math.min(99, Math.max(35, Math.round(
      (2.5 - Math.min(2.5, concededAvg)) * 25 + form10.cleanSheetPct10 * 0.4
    )));

    return {
      teamId,
      formPoints: form10.formPoints10,
      formScore: form10.formScore10,
      formString: form10.formString10,
      last5FormString: form10.last5FormString,
      goalsScoredAvg: Number(scoredAvg.toFixed(2)),
      goalsConcededAvg: Number(concededAvg.toFixed(2)),
      cleanSheetPct: form10.cleanSheetPct10,
      failedToScorePct: form10.failedToScorePct10,
      over15Rate: form10.over15Rate10,
      over25Rate: form10.over25Rate10,
      bttsRate: form10.bttsRate10,
      venueWinRate: form10.venueWinPct,
      venueGoalsScoredAvg: Number(scoredAvg.toFixed(2)),
      venueGoalsConcededAvg: Number(concededAvg.toFixed(2)),
      attackRating,
      defenseRating,
    };
  }

  // Fallback to computed values from 10-match individual form or baseline
  return {
    teamId,
    formPoints: form10.formPoints10,
    formScore: form10.formScore10,
    formString: form10.formString10,
    last5FormString: form10.last5FormString,
    goalsScoredAvg: form10.scoredAvg10,
    goalsConcededAvg: form10.concededAvg10,
    cleanSheetPct: form10.cleanSheetPct10,
    failedToScorePct: form10.failedToScorePct10,
    over15Rate: form10.over15Rate10,
    over25Rate: form10.over25Rate10,
    bttsRate: form10.bttsRate10,
    venueWinRate: form10.venueWinPct,
    venueGoalsScoredAvg: form10.scoredAvg10,
    venueGoalsConcededAvg: form10.concededAvg10,
    attackRating: Math.min(99, Math.max(30, Math.round(form10.scoredAvg10 * 25 + (100 - form10.failedToScorePct10) * 0.2))),
    defenseRating: Math.min(99, Math.max(30, Math.round((2.5 - Math.min(2.5, form10.concededAvg10)) * 25 + form10.cleanSheetPct10 * 0.3))),
  };
}

/**
 * Fetches injuries and suspensions for a specific fixture
 */
export async function fetchInjuriesAndSuspensions(
  fixtureId: number,
  homeTeamId: number,
  awayTeamId: number
): Promise<MatchInjuriesContext> {
  const res = await apiSportsFetch<RawInjuryItem[]>("injuries", {
    params: { fixture: fixtureId },
    revalidateSeconds: 1800,
  });

  const homeMissing: MissingPlayer[] = [];
  const awayMissing: MissingPlayer[] = [];

  if (res.success && res.data && res.data.length > 0) {
    for (const item of res.data) {
      const missing: MissingPlayer = {
        id: item.player.id,
        name: item.player.name,
        type: item.player.type || "Missing Fixture",
        reason: item.player.reason || "Injury",
        teamId: item.team.id,
        teamName: item.team.name,
      };

      if (item.team.id === homeTeamId) {
        homeMissing.push(missing);
      } else if (item.team.id === awayTeamId) {
        awayMissing.push(missing);
      }
    }
  }

  const homeRiskLevel = homeMissing.length >= 3 ? "HIGH" : homeMissing.length > 0 ? "MEDIUM" : "LOW";
  const awayRiskLevel = awayMissing.length >= 3 ? "HIGH" : awayMissing.length > 0 ? "MEDIUM" : "LOW";

  let summary = "Squads at full strength. No critical suspensions or injuries.";
  if (homeMissing.length > 0 || awayMissing.length > 0) {
    const homeNotes = homeMissing.length > 0 ? `Home missing ${homeMissing.length} players (${homeMissing.map((p) => p.name).slice(0, 2).join(", ")})` : "Home squad fully available";
    const awayNotes = awayMissing.length > 0 ? `Away missing ${awayMissing.length} players (${awayMissing.map((p) => p.name).slice(0, 2).join(", ")})` : "Away squad fully available";
    summary = `${homeNotes}. ${awayNotes}.`;
  }

  return {
    homeMissing,
    awayMissing,
    totalMissing: homeMissing.length + awayMissing.length,
    homeRiskLevel,
    awayRiskLevel,
    summary,
  };
}

/**
 * Composite function: Fetches odds, 15-game H2H, 10-match form, tactical stats, and injuries
 */
export async function fetchFixtureStatsAndOdds(
  fixture: NormalizedMatchFixture
): Promise<FixtureEnrichedContext> {
  const [odds, homeStats, awayStats, h2h, injuries] = await Promise.all([
    fetchPreMatchOdds(fixture.apiFixtureId, fixture.homeTeam, fixture.awayTeam, fixture.leagueName),
    fetchTeamStats(fixture.homeTeamId, fixture.leagueId, true),
    fetchTeamStats(fixture.awayTeamId, fixture.leagueId, false),
    fetchFootballDataH2H(fixture.apiFixtureId, fixture.homeTeamId, fixture.awayTeamId).then((data) =>
      data ? data : fetchHeadToHeadStats(fixture.homeTeamId, fixture.awayTeamId)
    ),
    fetchInjuriesAndSuspensions(fixture.apiFixtureId, fixture.homeTeamId, fixture.awayTeamId),
  ]);

  return {
    fixture,
    odds,
    homeStats,
    awayStats,
    h2h,
    injuries,
  };
}
