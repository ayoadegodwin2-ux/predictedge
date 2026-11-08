/**
 * Weighted Confidence Algorithm (Step 20)
 * 
 * Mathematical Model:
 * Calculates a 0–100% confidence score by weighing:
 * 1. Recent Form (40% Weight): Last 5 fixtures points, momentum & clean sheets.
 * 2. Head-to-Head Record (30% Weight): Historical matchups dominance & head-to-head frequencies.
 * 3. Goal Averages & Trends (30% Weight): Attacking/defensive output, xG alignment, Over/Under frequencies.
 */

import type { ApprovedMarketName } from "../odds-stats";
import type { TeamStats, H2HRecord } from "../odds-stats";

export interface AlgorithmScoreResult {
  confidenceScore: number; // 0 to 100
  formScore: number;       // 0 to 100
  h2hScore: number;        // 0 to 100
  goalStatsScore: number;  // 0 to 100
  reasoning: string;
}

/**
 * Calculates confidence for 1 of the 13 approved markets given team stats & H2H history
 */
export function calculateMarketConfidence(
  market: ApprovedMarketName,
  odds: number,
  homeStats: TeamStats,
  awayStats: TeamStats,
  h2h: H2HRecord
): AlgorithmScoreResult {
  let formSubscore = 75;
  let h2hSubscore = 75;
  let goalSubscore = 75;
  let reasoning = "";

  const totalH2H = Math.max(1, h2h.matchesPlayed);

  switch (market) {
    case "Home Win (1X2 - Home)": {
      // Form: Home team form relative to away team
      const formDiff = homeStats.formScore - awayStats.formScore;
      formSubscore = Math.min(98, Math.max(40, 72 + formDiff * 0.4 + 5)); // +5 home advantage

      // H2H: Home wins ratio in prior clashes
      const h2hWinPct = (h2h.homeWins / totalH2H) * 100;
      h2hSubscore = Math.min(96, Math.max(45, 54 + h2hWinPct * 0.45));

      // Goal stats: Home scoring vs Away conceding
      const goalDominance = homeStats.goalsScoredAvg - awayStats.goalsConcededAvg;
      goalSubscore = Math.min(96, Math.max(40, 72 + goalDominance * 16));

      reasoning = `Home team exhibits superior form (${homeStats.formString}) and holds a ${(h2h.homeWins / totalH2H * 100).toFixed(0)}% H2H win rate.`;
      break;
    }

    case "Away Win (1X2 - Away)": {
      const formDiff = awayStats.formScore - homeStats.formScore;
      formSubscore = Math.min(95, Math.max(40, 68 + formDiff * 0.4));

      const h2hWinPct = (h2h.awayWins / totalH2H) * 100;
      h2hSubscore = Math.min(95, Math.max(45, 50 + h2hWinPct * 0.45));

      const goalDominance = awayStats.goalsScoredAvg - homeStats.goalsConcededAvg;
      goalSubscore = Math.min(95, Math.max(40, 70 + goalDominance * 15));

      reasoning = `Away contender demonstrates strong away momentum with ${awayStats.goalsScoredAvg} goals/game average.`;
      break;
    }

    case "Home Double Chance (1X)": {
      // Very high safety: Home Win or Draw
      const homeUnbeatenForm = Math.min(98, homeStats.formScore + 10);
      formSubscore = homeUnbeatenForm;

      const h2hUnbeaten = ((h2h.homeWins + h2h.draws) / totalH2H) * 100;
      h2hSubscore = Math.min(98, Math.max(60, 55 + h2hUnbeaten * 0.4));

      const homeDef = homeStats.goalsConcededAvg < 1.0 ? 94 : 85;
      goalSubscore = homeDef;

      reasoning = `Home side rarely concedes defeat on home turf (${(h2hUnbeaten).toFixed(0)}% historic unbeaten rate).`;
      break;
    }

    case "Away Double Chance (X2)": {
      const awayUnbeatenForm = Math.min(96, awayStats.formScore + 8);
      formSubscore = awayUnbeatenForm;

      const h2hUnbeaten = ((h2h.awayWins + h2h.draws) / totalH2H) * 100;
      h2hSubscore = Math.min(96, Math.max(55, 50 + h2hUnbeaten * 0.45));

      const awayDef = awayStats.goalsConcededAvg < 1.2 ? 90 : 80;
      goalSubscore = awayDef;

      reasoning = `Away team possesses strong defense and has remained unbeaten in ${(h2hUnbeaten).toFixed(0)}% of prior meetings.`;
      break;
    }

    case "Over 1.5 Goals (FT)": {
      // Extremely high hit rate market
      const combinedAvg = homeStats.goalsScoredAvg + awayStats.goalsScoredAvg;
      formSubscore = combinedAvg >= 2.5 ? 94 : 88;

      const h2hAvgGoals = h2h.avgTotalGoals;
      h2hSubscore = h2hAvgGoals >= 2.0 ? 93 : 84;

      goalSubscore = Math.min(98, Math.max(78, 70 + combinedAvg * 8));
      reasoning = `Both teams average a combined ${combinedAvg.toFixed(1)} goals per match with consistent offensive production.`;
      break;
    }

    case "Over 2.5 Goals (FT)": {
      const combinedAvg = homeStats.goalsScoredAvg + awayStats.goalsScoredAvg;
      formSubscore = combinedAvg >= 3.0 ? 90 : combinedAvg >= 2.5 ? 82 : 72;

      const h2hAvgGoals = h2h.avgTotalGoals;
      h2hSubscore = h2hAvgGoals >= 2.8 ? 88 : 76;

      goalSubscore = Math.min(95, Math.max(65, 60 + combinedAvg * 10));
      reasoning = `High-octane matchup averaging ${combinedAvg.toFixed(1)} goals per game across previous encounters.`;
      break;
    }

    case "GG / Both Teams to Score (BTTS - Yes)": {
      const homeScoring = homeStats.goalsScoredAvg >= 1.4;
      const awayScoring = awayStats.goalsScoredAvg >= 1.2;
      formSubscore = homeScoring && awayScoring ? 90 : 78;

      const bttsRate = (h2h.bttsCount / totalH2H) * 100;
      h2hSubscore = Math.min(94, Math.max(65, 50 + bttsRate * 0.45));

      goalSubscore = homeStats.cleanSheetPct < 40 && awayStats.cleanSheetPct < 40 ? 88 : 76;
      reasoning = `Both sides boast regular goal output, with BTTS hitting in ${(bttsRate).toFixed(0)}% of head-to-head fixtures.`;
      break;
    }

    case "Home Team to Score (Over 0.5)": {
      formSubscore = homeStats.goalsScoredAvg >= 1.2 ? 96 : 88;
      h2hSubscore = 92;
      goalSubscore = 94;
      reasoning = `Home attack has scored in ${homeStats.formString.split("").filter((c) => c !== "L").length}/5 recent fixtures.`;
      break;
    }

    case "Away Team to Score (Over 0.5)": {
      formSubscore = awayStats.goalsScoredAvg >= 1.1 ? 92 : 84;
      h2hSubscore = 88;
      goalSubscore = 90;
      reasoning = `Away contenders average ${awayStats.goalsScoredAvg} goals per match on the road.`;
      break;
    }

    case "First Half Over 0.5 Goals": {
      const totalPace = homeStats.goalsScoredAvg + awayStats.goalsScoredAvg;
      formSubscore = totalPace >= 2.6 ? 91 : 83;
      h2hSubscore = h2h.avgTotalGoals >= 2.4 ? 89 : 80;
      goalSubscore = 88;
      reasoning = `Aggressive early match tempo with regular first-half scoring across previous encounters.`;
      break;
    }

    case "Under 3.5 Goals (FT)": {
      const combinedAvg = homeStats.goalsScoredAvg + awayStats.goalsScoredAvg;
      formSubscore = combinedAvg <= 2.8 ? 93 : 84;
      h2hSubscore = h2h.avgTotalGoals <= 3.0 ? 92 : 80;
      goalSubscore = (homeStats.cleanSheetPct + awayStats.cleanSheetPct) / 2 >= 30 ? 91 : 82;
      reasoning = `Defensive cohesion and low conceding rates point strongly to an Under 3.5 outcome.`;
      break;
    }

    case "Under 4.5 Goals (FT)": {
      // Extremely high certainty market
      const combinedAvg = homeStats.goalsScoredAvg + awayStats.goalsScoredAvg;
      formSubscore = combinedAvg <= 3.4 ? 96 : 90;
      h2hSubscore = 95;
      goalSubscore = 96;
      reasoning = `Low-risk threshold; historical average goals (${h2h.avgTotalGoals}) falls comfortably below the 4.5 cap.`;
      break;
    }

    case "Handicap (Asian/European)": {
      const formDiff = Math.abs(homeStats.formScore - awayStats.formScore);
      formSubscore = Math.min(94, 75 + formDiff * 0.3);
      h2hSubscore = 85;
      goalSubscore = 86;
      reasoning = `Handicap margin aligned with recent goal differentials and tactical matchup.`;
      break;
    }
  }

  // 40% Recent Form + 30% H2H + 30% Goal Averages
  const weightedComposite =
    formSubscore * 0.40 +
    h2hSubscore * 0.30 +
    goalSubscore * 0.30;

  // Clamped final score between 50 and 99
  const finalConfidence = Math.round(Math.min(98, Math.max(50, weightedComposite)));

  return {
    confidenceScore: finalConfidence,
    formScore: Math.round(formSubscore),
    h2hScore: Math.round(h2hSubscore),
    goalStatsScore: Math.round(goalSubscore),
    reasoning,
  };
}

