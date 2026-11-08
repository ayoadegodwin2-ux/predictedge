/** Shared types for the prediction platform */

export interface Prediction {
  id: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  country: string;
  countryFlag: string;
  kickoff: string;
  market: string;
  odds: number;
  confidence: number;
  isWeekendPick: boolean;
  finalScore?: string;
  result?: "WON" | "LOST" | "PENDING";
}

export interface MarketConfig {
  id: number;
  name: string;
  enabled: boolean;
}

export interface CountryConfig {
  name: string;
  flag: string;
  tier: 1 | 2;
  enabled: boolean;
}

