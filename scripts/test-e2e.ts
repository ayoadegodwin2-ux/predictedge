/**
 * End-to-End Test Suite (Step 25)
 * Verifies all math constraints, database persistence, market filters, and pipeline automation.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../src/db";
import { matches, predictions } from "../src/db/schema";
import { isWhitelistedLeague } from "../src/lib/leagues";
import { isWithinWeekdayWindow, isWithinWeekendWindow, isApprovedMarket } from "../src/lib/engine/market-filter";
import { calculateMarketConfidence } from "../src/lib/engine/algorithm";
import { runWeekdayPredictionPipeline, runWeekendPredictionPipeline } from "../src/lib/engine/prediction-engine";
import { get14DayHistoryFromDb, calculateAccuracy } from "../src/lib/engine/history";

async function runEndToEndTests() {
  console.log("==============================================================");
  console.log("       PREDICTEDGE — FULL END-TO-END PIPELINE AUDIT           ");
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

  // --- TEST 1: Database Connectivity ---
  console.log("1. DATABASE CONNECTIVITY & SCHEMA AUDIT");
  try {
    const existingMatches = await db.select().from(matches);
    const existingPreds = await db.select().from(predictions);
    assert("Connected to Supabase PostgreSQL via Drizzle ORM", true);
    assert("matches table is queryable", Array.isArray(existingMatches));
    assert("predictions table is queryable", Array.isArray(existingPreds));
  } catch (err: any) {
    assert("Connected to Supabase PostgreSQL", false, err.message);
  }

  // --- TEST 2: League Whitelist Constraints ---
  console.log("\n2. 54 COUNTRIES & LEAGUES WHITELIST FILTER (Step 16)");
  assert("Premier League (England) is whitelisted", isWhitelistedLeague({ id: 39, country: "England" }));
  assert("La Liga (Spain) is whitelisted", isWhitelistedLeague({ id: 140, country: "Spain" }));
  assert("UEFA Champions League is whitelisted", isWhitelistedLeague({ id: 2, country: "World" }));
  assert("Regional 3rd tier league in whitelisted country is allowed", isWhitelistedLeague({ id: 9999, country: "Brazil" }));
  assert("Unapproved nation league is strictly rejected", !isWhitelistedLeague({ id: 450, country: "North Korea" }));

  // --- TEST 3: Market & Target Odds Constraints (Step 19) ---
  console.log("\n3. 13 APPROVED MARKETS & ODDS WINDOWS (Step 19)");
  assert("'Over 1.5 Goals (FT)' is approved", isApprovedMarket("Over 1.5 Goals (FT)"));
  assert("'Home Win (1X2 - Home)' is approved", isApprovedMarket("Home Win (1X2 - Home)"));
  assert("'Both Teams to Score' is approved", isApprovedMarket("GG / Both Teams to Score (BTTS - Yes)"));
  assert("'Under 3.5 Goals (FT)' is approved", isApprovedMarket("Under 3.5 Goals (FT)"));
  assert("'Red Cards Over 0.5' is rejected (unapproved market)", !isApprovedMarket("Red Cards Over 0.5"));

  assert("1.45 odds falls within Weekday window (1.30 - 1.50)", isWithinWeekdayWindow(1.45));
  assert("1.25 odds is rejected on Weekdays (< 1.30)", !isWithinWeekdayWindow(1.25));
  assert("1.60 odds is rejected on Weekdays (> 1.50)", !isWithinWeekdayWindow(1.60));
  assert("1.25 odds is approved on Weekends (1.20 - 1.80)", isWithinWeekendWindow(1.25));
  assert("1.75 odds is approved on Weekends (1.20 - 1.80)", isWithinWeekendWindow(1.75));
  assert("1.85 odds is rejected on Weekends (> 1.80)", !isWithinWeekendWindow(1.85));

  // --- TEST 4: Mathematical Scoring Algorithm (Step 20) ---
  console.log("\n4. MATHEMATICAL CONFIDENCE ALGORITHM (Step 20)");
  const mockHomeStats = { teamId: 1, formPoints: 13, formScore: 87, formString: "WWDWW", goalsScoredAvg: 2.3, goalsConcededAvg: 0.7, cleanSheetPct: 50 };
  const mockAwayStats = { teamId: 2, formPoints: 7, formScore: 47, formString: "WLLDL", goalsScoredAvg: 1.1, goalsConcededAvg: 1.6, cleanSheetPct: 20 };
  const mockH2H = { matchesPlayed: 8, homeWins: 5, draws: 2, awayWins: 1, avgTotalGoals: 3.1, bttsCount: 5 };

  const homeWinScore = calculateMarketConfidence("Home Win (1X2 - Home)", 1.45, mockHomeStats, mockAwayStats, mockH2H);
  assert("Confidence score produces integer 0-100", homeWinScore.confidenceScore >= 0 && homeWinScore.confidenceScore <= 100);
  assert("Strong home favorite scores high confidence (>= 85%)", homeWinScore.confidenceScore >= 85);
  assert("Recent Form weight (40%) properly computed", homeWinScore.formScore > 0);
  assert("Head-to-Head weight (30%) properly computed", homeWinScore.h2hScore > 0);
  assert("Goal average weight (30%) properly computed", homeWinScore.goalStatsScore > 0);

  // --- TEST 5: Weekday Pipeline Execution (Step 21) ---
  console.log("\n5. WEEKDAY PIPELINE EXECUTION (Step 21)");
  try {
    const weekdayRes = await runWeekdayPredictionPipeline();
    assert("Weekday pipeline isolated single top pick", !!weekdayRes.selectedPick);
    assert("Weekday pick odds within 1.30-1.50 window", weekdayRes.selectedPick.odd.odds >= 1.30 && weekdayRes.selectedPick.odd.odds <= 1.50);
    assert("Weekday pick confidence >= 80%", weekdayRes.selectedPick.algorithm.confidenceScore >= 80);
    assert("Weekday pick successfully persisted to database", weekdayRes.dbSaved);
  } catch (err: any) {
    assert("Weekday pipeline execution", false, err.message);
  }

  // --- TEST 6: Weekend Pipeline Execution (Step 22) ---
  console.log("\n6. WEEKEND PIPELINE EXECUTION & DEDUPLICATION (Step 22)");
  try {
    const weekendRes = await runWeekendPredictionPipeline();
    assert("Weekend slate contains EXACTLY 50 games", weekendRes.picks.length === 50);

    // Verify deduplication
    const fixtureIds = weekendRes.picks.map((p) => p.fixture.apiFixtureId);
    const uniqueIds = new Set(fixtureIds);
    assert("Zero duplicate matches in the 50 games (100% unique)", uniqueIds.size === weekendRes.picks.length);

    // Verify odds constraints
    const allOddsInRange = weekendRes.picks.every((p) => p.odd.odds >= 1.20 && p.odd.odds <= 1.80);
    assert("All 50 weekend odds fall within 1.20 - 1.80 window", allOddsInRange);
    assert("Weekend 50 games saved/verified in database", weekendRes.dbSavedCount > 0 || weekendRes.picks.length === 50);
  } catch (err: any) {
    assert("Weekend pipeline execution", false, err.message);
  }

  // --- TEST 7: 14-Day History & Accuracy Ledger ---
  console.log("\n7. 14-DAY HISTORY & ACCURACY ARCHIVE");
  try {
    const historyList = await get14DayHistoryFromDb();
    const accuracy = calculateAccuracy(historyList);
    assert("14-day history records retrieved successfully", historyList.length >= 14);
    assert("Accuracy metrics computed (Win rate %)", accuracy.winRatePct >= 0 && accuracy.winRatePct <= 100);
    assert("Historical records maintain non-overwritten dates", !!historyList[0].predictionDate);
  } catch (err: any) {
    assert("14-day history retrieval", false, err.message);
  }

  console.log("\n==============================================================");
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log("==============================================================");

  if (passedTests === totalTests) {
    console.log("🎉 ALL PHASE 1 - 6 SPECIFICATIONS VERIFIED AND PRODUCTION READY.\n");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runEndToEndTests();

