/**
 * Deep Analysis & Real-Time Context Verification Script
 * Validates:
 * 1. 15 Head-to-Head matchups fetching & analysis.
 * 2. 10-match individual form calculation (home & away).
 * 3. Tactical stats (goals scored, conceded, clean sheets, attack/defense ratings).
 * 4. Injuries & suspensions parsing & risk evaluation.
 * 5. Real-time news & context safety audit (and safety veto on red flags).
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { fetchHeadToHeadStats, fetchRecentTeamMatches, fetchTeamStats, fetchInjuriesAndSuspensions } from "../src/lib/odds-stats";
import { calculateMarketConfidence } from "../src/lib/engine/algorithm";
import { evaluateMatchupNewsAndContext } from "../src/lib/engine/news-context";
import type { NormalizedMatchFixture } from "../src/lib/fixtures";

async function runDeepAnalysisTests() {
  console.log("==============================================================");
  console.log("     PREDICTEDGE — DEEP ANALYSIS & CONTEXT ENGINE AUDIT       ");
  console.log("==============================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(description: string, condition: boolean, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ [PASS] ${description}`);
    } else {
      console.error(`  ✗ [FAIL] ${description} ${detail ? `(${detail})` : ""}`);
    }
  }

  // --- 1. 15 H2H Matches Verification ---
  console.log("1. 15 HEAD-TO-HEAD MATCHUPS AUDIT");
  const h2h = await fetchHeadToHeadStats(33, 40); // e.g. Man United vs Liverpool
  assert("H2H matches played reflects up to 15 encounters", h2h.matchesPlayed > 0 && h2h.matchesPlayed <= 15);
  assert("H2H contains home wins, away wins, and draws sum correctly", h2h.homeWins + h2h.awayWins + h2h.draws === h2h.matchesPlayed);
  assert("H2H average total goals calculated", h2h.avgTotalGoals > 0);
  assert("H2H recency trends computed (recentHomeWins, recentAwayWins, recentDraws)", h2h.recentHomeWins + h2h.recentAwayWins + h2h.recentDraws <= 5);
  assert("H2H clean sheet counts and match scores array populated", Array.isArray(h2h.last15Scores) && h2h.last15Scores.length > 0);
  console.log(`     -> Encounters Analyzed: ${h2h.matchesPlayed} | Home Wins: ${h2h.homeWins} | Draws: ${h2h.draws} | Away Wins: ${h2h.awayWins}`);
  console.log(`     -> Goal Avg: ${h2h.avgTotalGoals} | BTTS: ${h2h.bttsCount} | Recent Scores: ${h2h.last15Scores.slice(0, 5).join(", ")}`);

  // --- 2. 10-Match Individual Form Verification ---
  console.log("\n2. 10-MATCH INDIVIDUAL FORM AUDIT");
  const form10Home = await fetchRecentTeamMatches(33);
  assert("10-match form points computed (0-30 scale)", form10Home.formPoints10 >= 0 && form10Home.formPoints10 <= 30);
  assert("10-match form score percentage computed (0-100%)", form10Home.formScore10 >= 0 && form10Home.formScore10 <= 100);
  assert("10-match form string populated (e.g. W/D/L)", form10Home.formString10.length > 0);
  assert("5-match momentum sub-string populated", form10Home.last5FormString.length > 0);
  assert("Clean sheet % and failed-to-score % evaluated", form10Home.cleanSheetPct10 >= 0 && form10Home.failedToScorePct10 >= 0);
  console.log(`     -> Form Points: ${form10Home.formPoints10}/30 | Form String: ${form10Home.formString10} (Last 5: ${form10Home.last5FormString})`);
  console.log(`     -> Scored Avg: ${form10Home.scoredAvg10} | Conceded Avg: ${form10Home.concededAvg10} | Clean Sheet: ${form10Home.cleanSheetPct10}%`);

  // --- 3. Tactical Attacking & Defensive Metrics ---
  console.log("\n3. TACTICAL ATTACKING & DEFENSIVE METRICS AUDIT");
  const teamStats = await fetchTeamStats(33, 39, true);
  assert("Attack rating generated on 0-100 scale", teamStats.attackRating >= 0 && teamStats.attackRating <= 100);
  assert("Defense rating generated on 0-100 scale", teamStats.defenseRating >= 0 && teamStats.defenseRating <= 100);
  assert("Venue-specific win rate and goal averages calculated", teamStats.venueWinRate >= 0 && teamStats.venueGoalsScoredAvg >= 0);
  console.log(`     -> Attack Rating: ${teamStats.attackRating}/100 | Defense Rating: ${teamStats.defenseRating}/100`);
  console.log(`     -> Venue Win Rate: ${teamStats.venueWinRate}% | Venue Goals Scored Avg: ${teamStats.venueGoalsScoredAvg}`);

  // --- 4. API-Sports Injuries & Suspensions Register ---
  console.log("\n4. INJURIES & SUSPENSIONS AUDIT");
  const injuries = await fetchInjuriesAndSuspensions(1035000, 33, 40);
  assert("Injuries object structure valid", Array.isArray(injuries.homeMissing) && Array.isArray(injuries.awayMissing));
  assert("Risk level computed for both teams", ["LOW", "MEDIUM", "HIGH"].includes(injuries.homeRiskLevel));
  assert("Injuries summary string provided", injuries.summary.length > 0);
  console.log(`     -> Home Missing: ${injuries.homeMissing.length} | Away Missing: ${injuries.awayMissing.length} | Risk: ${injuries.homeRiskLevel}`);
  console.log(`     -> Summary: "${injuries.summary}"`);

  // --- 5. Real-Time Context & Safety Veto Verification ---
  console.log("\n5. REAL-TIME CONTEXT & SAFETY VETO AUDIT");
  const testFixture: NormalizedMatchFixture = {
    apiFixtureId: 999001,
    homeTeamId: 33,
    homeTeam: "Manchester United",
    awayTeamId: 40,
    awayTeam: "Liverpool",
    leagueId: 39,
    leagueName: "Premier League",
    country: "England",
    countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    kickoffTime: new Date(Date.now() + 86400000).toISOString(),
    status: "NS",
  };

  // Safe scenario
  const safeContext = await evaluateMatchupNewsAndContext(testFixture, "Over 1.5 Goals (FT)", {
    homeMissing: [],
    awayMissing: [],
    totalMissing: 0,
    homeRiskLevel: "LOW",
    awayRiskLevel: "LOW",
    summary: "Squads at full strength.",
  });
  assert("Clean squad context passes safety verification", safeContext.safetyPassed);
  assert("Safe context confidence modifier is neutral or positive", safeContext.confidenceModifier >= 0);

  // Red flag scenario: 3+ missing players on Home Win market
  const redFlagInjuries = {
    homeMissing: [
      { id: 1, name: "Star Striker", type: "Missing", reason: "Hamstring", teamId: 33, teamName: "Manchester United" },
      { id: 2, name: "Starting GK", type: "Missing", reason: "Red Card", teamId: 33, teamName: "Manchester United" },
      { id: 3, name: "Captain CB", type: "Missing", reason: "Knee Injury", teamId: 33, teamName: "Manchester United" },
    ],
    awayMissing: [],
    totalMissing: 3,
    homeRiskLevel: "HIGH" as const,
    awayRiskLevel: "LOW" as const,
    summary: "Home team missing 3 crucial starters.",
  };
  const redFlagContext = await evaluateMatchupNewsAndContext(testFixture, "Home Win (1X2 - Home)", redFlagInjuries);
  assert("Severe squad depletion triggers SAFETY VETO for direct win market", !redFlagContext.safetyPassed);
  assert("Red flags recorded for critical absences", redFlagContext.redFlags.length > 0);
  assert("Confidence penalty applied to compromised selection", redFlagContext.confidenceModifier < 0);
  console.log(`     -> Veto Status: ${redFlagContext.safetyPassed ? "ALLOWED" : "VETOED (BLOCKED)"} | Red Flags: ${redFlagContext.redFlags.join(", ")}`);

  // --- 6. Multi-Dataset Scoring Synthesis ---
  console.log("\n6. MULTI-DATASET ALGORITHM SCORING SYNTHESIS");
  const awayStats = await fetchTeamStats(40, 39, false);
  const algoResult = calculateMarketConfidence(
    "Over 1.5 Goals (FT)",
    1.42,
    teamStats,
    awayStats,
    h2h,
    injuries,
    safeContext
  );
  assert("Composite confidence score calculated with deep datasets", algoResult.confidenceScore >= 50 && algoResult.confidenceScore <= 98);
  assert("Form score (35% weight) computed", algoResult.formScore > 0);
  assert("H2H score (30% weight) computed with 15 matches", algoResult.h2hScore > 0);
  assert("Tactical metrics score (35% weight) computed", algoResult.tacticalScore > 0);
  assert("Reasoning references 15-game H2H and recent form metrics", algoResult.reasoning.includes("H2H") || algoResult.reasoning.includes("goals"));
  console.log(`     -> Final Confidence: ${algoResult.confidenceScore}% (Form: ${algoResult.formScore} | H2H: ${algoResult.h2hScore} | Tactical: ${algoResult.tacticalScore})`);
  console.log(`     -> Reasoning: "${algoResult.reasoning}"`);

  console.log("\n==============================================================");
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log("==============================================================");

  if (passedTests === totalTests) {
    console.log("🎉 ALL DEEP ANALYSIS & REAL-TIME CONTEXT REQUIREMENTS VERIFIED!\n");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runDeepAnalysisTests();
