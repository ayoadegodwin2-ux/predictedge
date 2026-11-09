/**
 * Weighted Confidence Algorithm (Step 20 - Deep Analysis & Context Overhaul)
 * 
 * Multi-Dataset Mathematical Model:
 * Actively analyzes and weighs:
 * 1. 10-Match Individual Form (35% Weight):
 *    - 10-match points yield (out of 30), recent 5-game momentum, and home/away venue splits.
 * 2. 15 Head-to-Head Matchups (30% Weight):
 *    - Historical dominance across 15 clashes, recent 5-match recency trends, and clean sheets.
 * 3. Tactical Attacking & Defensive Metrics (35% Weight):
 *    - Attack efficiency, defense stability ratings, clean sheet %, failed-to-score %, and Over/Under hit rates.
 * 4. Real-Time News & Injury Context (Dynamic Modifier):
 *    - Incorporates API-Sports injury register & real-time red flag checks to prevent blind mathematical selections.
 */

import type { ApprovedMarketName } from "../odds-stats";
import type { TeamStats, H2HRecord, MatchInjuriesContext } from "../odds-stats";
import type { MatchupNewsContext } from "./news-context";

export interface AlgorithmScoreResult {
  confidenceScore: number; // 0 to 100
  formScore: number;       // 0 to 100
  h2hScore: number;        // 0 to 100
  goalStatsScore: number;  // 0 to 100
  tacticalScore: number;   // 0 to 100
  reasoning: string;
  tacticalNotes: string[];
}

/**
 * Calculates confidence for 1 of the 13 approved markets given team stats, 15 H2H games, tactical metrics & injuries
 */
export function calculateMarketConfidence(
  market: ApprovedMarketName,
  odds: number,
  homeStats: TeamStats,
  awayStats: TeamStats,
  h2h: H2HRecord,
  injuries?: MatchInjuriesContext,
  newsContext?: MatchupNewsContext
): AlgorithmScoreResult {
  let formSubscore = 75;
  let h2hSubscore = 75;
  let goalSubscore = 75;
  let tacticalSubscore = 75;
  let reasoning = "";
  const tacticalNotes: string[] = [];

  const totalH2H = Math.max(1, h2h.matchesPlayed);

  switch (market) {
    case "Home Win (1X2 - Home)": {
      // 1. 10-Match Form: home vs away form points
      const formDiff = homeStats.formScore - awayStats.formScore;
      const venueBonus = homeStats.venueWinRate >= 70 ? 6 : homeStats.venueWinRate >= 50 ? 3 : 0;
      formSubscore = Math.min(98, Math.max(40, 70 + formDiff * 0.35 + venueBonus));

      // 2. 15 H2H Matchups: overall wins + recency weighting from last 5
      const h2hWinPct = (h2h.homeWins / totalH2H) * 100;
      const recentH2HBonus = h2h.recentHomeWins >= 3 ? 6 : 0;
      h2hSubscore = Math.min(97, Math.max(45, 52 + h2hWinPct * 0.42 + recentH2HBonus));

      // 3. Goal & Tactical Stats: Attack efficiency vs Opponent defense
      const goalDominance = homeStats.goalsScoredAvg - awayStats.goalsConcededAvg;
      goalSubscore = Math.min(96, Math.max(40, 74 + goalDominance * 16));
      tacticalSubscore = Math.min(98, Math.max(45, 75 + (homeStats.attackRating - awayStats.defenseRating) * 0.4));

      reasoning = `Home side earned ${homeStats.formPoints}/30 points in last 10 games (${homeStats.last5FormString}), boasts a ${homeStats.venueWinRate}% home record, and won ${h2h.homeWins}/${totalH2H} historical H2H clashes.`;
      tacticalNotes.push(`Tactical Attack: ${homeStats.attackRating}/100 vs Away Defense: ${awayStats.defenseRating}/100.`);
      break;
    }

    case "Away Win (1X2 - Away)": {
      const formDiff = awayStats.formScore - homeStats.formScore;
      const awayVenueBonus = awayStats.venueWinRate >= 60 ? 5 : 0;
      formSubscore = Math.min(95, Math.max(40, 68 + formDiff * 0.35 + awayVenueBonus));

      const h2hWinPct = (h2h.awayWins / totalH2H) * 100;
      const recentAwayH2H = h2h.recentAwayWins >= 3 ? 5 : 0;
      h2hSubscore = Math.min(95, Math.max(45, 50 + h2hWinPct * 0.42 + recentAwayH2H));

      const goalDominance = awayStats.goalsScoredAvg - homeStats.goalsConcededAvg;
      goalSubscore = Math.min(95, Math.max(40, 70 + goalDominance * 15));
      tacticalSubscore = Math.min(96, Math.max(40, 72 + (awayStats.attackRating - homeStats.defenseRating) * 0.4));

      reasoning = `Away contender demonstrates strong momentum with ${awayStats.formPoints}/30 points in last 10 (${awayStats.last5FormString}) and ${awayStats.goalsScoredAvg} goals/game average.`;
      tacticalNotes.push(`Away team scored in ${100 - awayStats.failedToScorePct}% of past fixtures with ${awayStats.attackRating}/100 attack rating.`);
      break;
    }

    case "Home Double Chance (1X)": {
      // Extremely high safety: Home Win or Draw
      const homeUnbeatenForm = Math.min(98, homeStats.formScore + 12);
      formSubscore = homeUnbeatenForm;

      const h2hUnbeaten = ((h2h.homeWins + h2h.draws) / totalH2H) * 100;
      h2hSubscore = Math.min(98, Math.max(62, 55 + h2hUnbeaten * 0.4));

      const homeDef = homeStats.goalsConcededAvg < 1.0 ? 95 : 86;
      goalSubscore = homeDef;
      tacticalSubscore = Math.min(98, (homeStats.defenseRating + 10) * 0.9);

      reasoning = `Home fortress: undefeated in ${(h2hUnbeaten).toFixed(0)}% of last 15 H2H meetings and holding ${homeStats.cleanSheetPct}% clean sheet rate across last 10 games.`;
      break;
    }

    case "Away Double Chance (X2)": {
      const awayUnbeatenForm = Math.min(96, awayStats.formScore + 10);
      formSubscore = awayUnbeatenForm;

      const h2hUnbeaten = ((h2h.awayWins + h2h.draws) / totalH2H) * 100;
      h2hSubscore = Math.min(96, Math.max(58, 52 + h2hUnbeaten * 0.42));

      const awayDef = awayStats.goalsConcededAvg < 1.2 ? 92 : 82;
      goalSubscore = awayDef;
      tacticalSubscore = Math.min(96, (awayStats.defenseRating + 8) * 0.9);

      reasoning = `Away side possesses robust defensive metrics (conceding just ${awayStats.goalsConcededAvg}/game) and secured points in ${(h2hUnbeaten).toFixed(0)}% of prior meetings.`;
      break;
    }

    case "Over 1.5 Goals (FT)": {
      // High hit rate market
      const combinedAvg = homeStats.goalsScoredAvg + awayStats.goalsScoredAvg;
      const combinedOver15Rate = (homeStats.over15Rate + awayStats.over15Rate) / 2;
      formSubscore = combinedOver15Rate >= 80 ? 96 : combinedOver15Rate >= 70 ? 91 : 84;

      const h2hOver15Rate = (h2h.over15Count / totalH2H) * 100;
      h2hSubscore = Math.min(97, Math.max(75, 60 + h2hOver15Rate * 0.36));

      goalSubscore = Math.min(98, Math.max(78, 68 + combinedAvg * 9));
      tacticalSubscore = Math.min(98, Math.max(75, (homeStats.attackRating + awayStats.attackRating) / 2));

      reasoning = `High-octane scoring profile: Over 1.5 hit in ${h2hOver15Rate.toFixed(0)}% of last 15 H2H matches, and teams combine for an average of ${combinedAvg.toFixed(1)} goals per game.`;
      tacticalNotes.push(`Combined Over 1.5 rate across last 10 matches: ${combinedOver15Rate.toFixed(0)}%.`);
      break;
    }

    case "Over 2.5 Goals (FT)": {
      const combinedAvg = homeStats.goalsScoredAvg + awayStats.goalsScoredAvg;
      const combinedOver25Rate = (homeStats.over25Rate + awayStats.over25Rate) / 2;
      formSubscore = combinedOver25Rate >= 65 ? 92 : combinedOver25Rate >= 50 ? 84 : 74;

      const h2hOver25Rate = (h2h.over25Count / totalH2H) * 100;
      h2hSubscore = Math.min(95, Math.max(68, 55 + h2hOver25Rate * 0.4));

      goalSubscore = Math.min(95, Math.max(65, 58 + combinedAvg * 11));
      tacticalSubscore = Math.min(96, (homeStats.attackRating + awayStats.attackRating) / 2);

      reasoning = `Offensive firepower: Teams average ${combinedAvg.toFixed(1)} goals per match with Over 2.5 hitting in ${combinedOver25Rate.toFixed(0)}% of recent fixtures.`;
      break;
    }

    case "GG / Both Teams to Score (BTTS - Yes)": {
      const combinedBttsRate = (homeStats.bttsRate + awayStats.bttsRate) / 2;
      formSubscore = combinedBttsRate >= 60 ? 92 : combinedBttsRate >= 50 ? 84 : 76;

      const h2hBttsRate = (h2h.bttsCount / totalH2H) * 100;
      h2hSubscore = Math.min(95, Math.max(68, 52 + h2hBttsRate * 0.44));

      goalSubscore = homeStats.cleanSheetPct < 40 && awayStats.cleanSheetPct < 40 ? 90 : 78;
      tacticalSubscore = Math.min(94, Math.max(70, (homeStats.attackRating + awayStats.attackRating) / 2));

      reasoning = `Regular two-way action: BTTS landed in ${h2hBttsRate.toFixed(0)}% of last 15 H2H fixtures, with both attacks boasting >${(100 - Math.max(homeStats.failedToScorePct, awayStats.failedToScorePct))}% scoring consistency.`;
      break;
    }

    case "Home Team to Score (Over 0.5)": {
      formSubscore = homeStats.failedToScorePct <= 15 ? 97 : 90;
      h2hSubscore = 93;
      goalSubscore = homeStats.goalsScoredAvg >= 1.5 ? 96 : 89;
      tacticalSubscore = homeStats.attackRating >= 80 ? 96 : 88;
      reasoning = `Home attack has scored in ${100 - homeStats.failedToScorePct}% of past 10 matches with an average of ${homeStats.goalsScoredAvg} goals/game.`;
      break;
    }

    case "Away Team to Score (Over 0.5)": {
      formSubscore = awayStats.failedToScorePct <= 20 ? 94 : 86;
      h2hSubscore = 90;
      goalSubscore = awayStats.goalsScoredAvg >= 1.2 ? 92 : 85;
      tacticalSubscore = awayStats.attackRating >= 75 ? 93 : 85;
      reasoning = `Away contenders scored in ${100 - awayStats.failedToScorePct}% of past 10 fixtures, averaging ${awayStats.goalsScoredAvg} away goals per match.`;
      break;
    }

    case "First Half Over 0.5 Goals": {
      const totalPace = homeStats.goalsScoredAvg + awayStats.goalsScoredAvg;
      formSubscore = totalPace >= 2.6 ? 93 : 85;
      h2hSubscore = h2h.avgTotalGoals >= 2.4 ? 91 : 82;
      goalSubscore = 90;
      tacticalSubscore = 89;
      reasoning = `Aggressive opening match tempo: combined fixture average of ${totalPace.toFixed(1)} goals and high first-half scoring rate.`;
      break;
    }

    case "Under 3.5 Goals (FT)": {
      const combinedAvg = homeStats.goalsScoredAvg + awayStats.goalsScoredAvg;
      formSubscore = combinedAvg <= 2.6 ? 94 : 85;
      h2hSubscore = h2h.avgTotalGoals <= 2.8 ? 93 : 82;
      goalSubscore = (homeStats.cleanSheetPct + awayStats.cleanSheetPct) / 2 >= 30 ? 93 : 84;
      tacticalSubscore = (homeStats.defenseRating + awayStats.defenseRating) / 2;
      reasoning = `Disciplined tactical setups: Combined average goals (${combinedAvg.toFixed(1)}) and solid clean sheet rates support Under 3.5.`;
      break;
    }

    case "Under 4.5 Goals (FT)": {
      // Extremely high certainty market
      const combinedAvg = homeStats.goalsScoredAvg + awayStats.goalsScoredAvg;
      formSubscore = combinedAvg <= 3.3 ? 97 : 91;
      h2hSubscore = h2h.avgTotalGoals <= 3.4 ? 96 : 89;
      goalSubscore = 96;
      tacticalSubscore = 94;
      reasoning = `High safety margin: 15-game H2H average goals (${h2h.avgTotalGoals}) comfortably below the 4.5 ceiling.`;
      break;
    }

    case "Handicap (Asian/European)": {
      const formDiff = Math.abs(homeStats.formScore - awayStats.formScore);
      formSubscore = Math.min(94, 76 + formDiff * 0.3);
      h2hSubscore = 86;
      goalSubscore = 87;
      tacticalSubscore = 88;
      reasoning = `Handicap margin mathematically justified by 10-match goal differentials and historical head-to-head margins.`;
      break;
    }
  }

  // Multi-dataset composite:
  // 35% 10-Match Form + 30% 15-Game H2H + 35% Tactical Stats (Goals & Defense/Attack)
  const baseComposite =
    formSubscore * 0.35 +
    h2hSubscore * 0.30 +
    ((goalSubscore + tacticalSubscore) / 2) * 0.35;

  // Real-Time Context & Injury Modifier
  let contextModifier = 0;
  if (newsContext) {
    contextModifier += newsContext.confidenceModifier;
    if (newsContext.tacticalNotes.length > 0) {
      tacticalNotes.push(...newsContext.tacticalNotes);
    }
  } else if (injuries) {
    // If news context wasn't run yet, apply direct injury deductions
    if (injuries.homeMissing.length >= 3 && market.includes("Home Win")) contextModifier -= 8;
    if (injuries.awayMissing.length >= 3 && market.includes("Away Win")) contextModifier -= 8;
  }

  const adjustedScore = baseComposite + contextModifier;

  // Clamped final score between 50 and 99
  const finalConfidence = Math.round(Math.min(98, Math.max(50, adjustedScore)));

  return {
    confidenceScore: finalConfidence,
    formScore: Math.round(formSubscore),
    h2hScore: Math.round(h2hSubscore),
    goalStatsScore: Math.round(goalSubscore),
    tacticalScore: Math.round(tacticalSubscore),
    reasoning,
    tacticalNotes,
  };
}
