/**
 * API Data Pipeline Types
 * Supports both API-Football / Sportsmonks format and normalized internal pipeline types
 */

export interface ApiLeague {
  id: number;
  name: string;
  country: string;
  logo?: string;
  flag?: string;
  season?: number;
}

export interface ApiTeam {
  id: number;
  name: string;
  logo?: string;
}

export interface ApiFixtureItem {
  id: number;
  referee?: string;
  timezone: string;
  date: string;
  timestamp: number;
  status: {
    long: string;
    short: string;
    elapsed?: number;
  };
}

export interface RawApiFixture {
  fixture: ApiFixtureItem;
  league: ApiLeague;
  teams: {
    home: ApiTeam;
    away: ApiTeam;
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
}

export interface NormalizedFixture {
  apiFixtureId: number;
  homeTeamId: number;
  homeTeam: string;
  awayTeamId: number;
  awayTeam: string;
  leagueId: number;
  leagueName: string;
  country: string;
  countryFlag?: string;
  kickoffTime: string;
  status: string;
}

/** 13 Approved Markets Data Structure */
export interface MarketOddItem {
  marketName: string; // Must match one of 13 approved markets
  odds: number;       // Decimal odds, e.g. 1.45
  bookmaker: string;  // e.g. "Bet365"
  value: string;      // raw value e.g. "Over 1.5", "Home"
}

export interface FixtureOddsData {
  fixtureId: number;
  updateTime: string;
  markets: MarketOddItem[];
}

export interface TeamStatsSummary {
  teamId: number;
  formScore: number;       // 0 - 100 based on last 5 matches
  goalsScoredAvg: number;  // Avg goals scored per match
  goalsConcededAvg: number;// Avg goals conceded per match
  cleanSheetPct: number;   // Clean sheet %
  over15GoalsPct: number;  // % of games with over 1.5 goals
  over25GoalsPct: number;  // % of games with over 2.5 goals
  bttsPct: number;         // Both teams to score %
}

export interface HeadToHeadSummary {
  totalMatches: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  avgTotalGoals: number;
  recentResults: Array<"W" | "D" | "L">;
}

export interface MatchAnalysisContext {
  fixture: NormalizedFixture;
  odds: MarketOddItem[];
  homeStats: TeamStatsSummary;
  awayStats: TeamStatsSummary;
  h2h: HeadToHeadSummary;
}

