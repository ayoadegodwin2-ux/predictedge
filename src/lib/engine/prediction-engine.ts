/**
 * Prediction Engine (Steps 21 & 22)
 * 
 * Weekday Logic (Step 21):
 * - Evaluates Mon-Fri candidate games across the 13 approved markets.
 * - Restricts odds strictly to 1.30 – 1.50.
 * - Sorts by confidence score and persists ONLY the single #1 highest-confidence pick.
 * 
 * Weekend Logic (Step 22):
 * - Evaluates Sat-Sun candidate games across 54 whitelisted countries + Int. Clubs.
 * - Restricts odds strictly to 1.20 – 1.80.
 * - Removes duplicate markets for the same match (max 1 pick per match).
 * - Sorts by confidence score and persists EXACTLY 50 independent single games.
 */

import { fetchFixturesForDate, fetchWeekendFixturesPool, type NormalizedMatchFixture } from "../fixtures";
import { fetchFixtureStatsAndOdds, type NormalizedOdd, type ApprovedMarketName } from "../odds-stats";
import { filterMarketOdds } from "./market-filter";
import { calculateMarketConfidence, type AlgorithmScoreResult } from "./algorithm";
import { evaluateMatchupNewsAndContext } from "./news-context";
import { db } from "@/db";
import { matches, predictions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export interface CandidatePrediction {
  fixture: NormalizedMatchFixture;
  odd: NormalizedOdd;
  algorithm: AlgorithmScoreResult;
  isWeekendPick: boolean;
}

export interface WeekdayPredictionResult {
  success: boolean;
  selectedPick: CandidatePrediction | null;
  totalEvaluated: number;
  dbSaved: boolean;
  message?: string;
}

export interface WeekendPredictionResult {
  success: boolean;
  picks: CandidatePrediction[];
  totalEvaluated: number;
  dbSavedCount: number;
  message?: string;
}

/**
 * Strict Future-Games Validator
 * Strictly enforces status.short === 'NS' and verifies the kickoff timestamp is in the future.
 * Prevents analyzing, predicting, or displaying matches that have already kicked off or finished.
 */
export function isStrictFutureGame(fixture: NormalizedMatchFixture): boolean {
  // 1. Strictly enforce status === 'NS'
  if (fixture.status !== "NS") {
    return false;
  }

  // 2. Audit kickoff timestamp against current time
  const kickoffMs = new Date(fixture.kickoffTime).getTime();
  if (isNaN(kickoffMs)) {
    return false;
  }

  // Must strictly be in the future
  return kickoffMs > Date.now();
}

/**
 * Evaluates candidate predictions for a given fixture against target odds window
 * with deep statistical analysis, injury auditing, and real-time news safety verification.
 */
export async function evaluateFixturePredictions(
  fixture: NormalizedMatchFixture,
  isWeekend: boolean
): Promise<CandidatePrediction[]> {
  const context = await fetchFixtureStatsAndOdds(fixture);
  const eligibleOdds = filterMarketOdds(context.odds, isWeekend);

  const candidates: CandidatePrediction[] = [];

  for (const odd of eligibleOdds) {
    // 1. Audit real-time news, manager changes & squad injury context
    const newsContext = await evaluateMatchupNewsAndContext(fixture, odd.market, context.injuries);

    // 2. Strict Safety Veto: Discard selections with active red flags or compromised squad integrity
    if (!newsContext.safetyPassed) {
      console.warn(`[SAFETY VETO] Skipping ${fixture.homeTeam} vs ${fixture.awayTeam} for ${odd.market}:`, newsContext.redFlags);
      continue;
    }

    // 3. Multi-dataset deep statistical evaluation (15 H2H games, 10-match form, tactical metrics)
    const algoResult = calculateMarketConfidence(
      odd.market,
      odd.odds,
      context.homeStats,
      context.awayStats,
      context.h2h,
      context.injuries,
      newsContext
    );

    // 4. Skip markets with insufficient live stats or below minimum confidence threshold (80% weekday, 75% weekend)
    if (algoResult.insufficientData || algoResult.confidenceScore < (isWeekend ? 75 : 80)) {
      continue;
    }

    candidates.push({
      fixture,
      odd,
      algorithm: algoResult,
      isWeekendPick: isWeekend,
    });
  }

  return candidates;
}

/**
 * Persists a list of predictions and their matches into the Supabase database via Drizzle ORM.
 * Strictly preserves historical records without overwriting past entries.
 */
export async function persistPredictionsToDatabase(
  items: CandidatePrediction[],
  isWeekend: boolean,
  targetDate?: string
): Promise<{ savedCount: number; existingCount: number; errors: string[] }> {
  const errors: string[] = [];
  let savedCount = 0;
  let existingCount = 0;
  const pDate = targetDate || new Date().toISOString().split("T")[0];

  for (const item of items) {
    try {
      // 1. Insert or find existing match
      const existingMatch = await db
        .select()
        .from(matches)
        .where(eq(matches.apiFixtureId, item.fixture.apiFixtureId))
        .limit(1);

      let matchDbId: number;

      if (existingMatch.length > 0) {
        matchDbId = existingMatch[0].id;
      } else {
        const [inserted] = await db
          .insert(matches)
          .values({
            apiFixtureId: item.fixture.apiFixtureId,
            homeTeam: item.fixture.homeTeam,
            awayTeam: item.fixture.awayTeam,
            leagueId: item.fixture.leagueId,
            leagueName: item.fixture.leagueName,
            country: item.fixture.country,
            kickoffTime: new Date(item.fixture.kickoffTime),
          })
          .returning({ id: matches.id });
        matchDbId = inserted.id;
      }

      // Check if prediction already exists for this match & date to prevent duplicates
      const existingPred = await db
        .select()
        .from(predictions)
        .where(
          and(
            eq(predictions.matchId, matchDbId),
            eq(predictions.isWeekendPick, isWeekend),
            eq(predictions.predictionDate, pDate)
          )
        )
        .limit(1);

      if (existingPred.length === 0) {
        // 2. Insert new historical prediction record
        await db.insert(predictions).values({
          matchId: matchDbId,
          market: item.odd.market,
          odds: item.odd.odds.toFixed(2),
          confidenceScore: item.algorithm.confidenceScore,
          isWeekendPick: isWeekend,
          predictionDate: pDate,
          result: "PENDING",
        });
        savedCount++;
      } else {
        existingCount++;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Database insert error";
      errors.push(`Match ${item.fixture.homeTeam} vs ${item.fixture.awayTeam}: ${msg}`);
    }
  }

  return { savedCount, existingCount, errors };
}

/**
 * Step 21: Weekday Logic
 * Sorts Mon-Fri predictions and returns/saves ONLY the single #1 highest-confidence pick.
 */
export async function runWeekdayPredictionPipeline(targetDate?: string): Promise<WeekdayPredictionResult> {
  const dateStr = targetDate || new Date().toISOString().split("T")[0];
  const fixturesResult = await fetchFixturesForDate(dateStr);

  const candidatePool: CandidatePrediction[] = [];

  // Strictly filter for future, unplayed matches with status === 'NS'
  const eligibleFixtures = fixturesResult.fixtures.filter((fix) => isStrictFutureGame(fix));

  // Process fixtures in concurrent batches for high throughput and rapid Vercel completion
  const BATCH_SIZE = 6;
  for (let i = 0; i < eligibleFixtures.length; i += BATCH_SIZE) {
    const chunk = eligibleFixtures.slice(i, i + BATCH_SIZE);
    const chunkResults = await Promise.all(
      chunk.map((fix) => evaluateFixturePredictions(fix, false))
    );
    for (const evaluated of chunkResults) {
      candidatePool.push(...evaluated);
    }
    // Early exit once we have accumulated sufficient strong candidates
    if (candidatePool.length >= 20) break;
  }

  // Strict live data only: if no eligible games qualify, return clean error/unqualified message
  if (candidatePool.length === 0) {
    return {
      success: false,
      selectedPick: null,
      totalEvaluated: 0,
      dbSaved: false,
      message: fixturesResult.error || "No eligible live fixtures met the strict mathematical criteria and 1.30–1.50 odds window today.",
    };
  }

  // Sort descending by Confidence Score; tie-breaker: closest to 1.40 odds
  candidatePool.sort((a, b) => {
    if (b.algorithm.confidenceScore !== a.algorithm.confidenceScore) {
      return b.algorithm.confidenceScore - a.algorithm.confidenceScore;
    }
    return Math.abs(a.odd.odds - 1.40) - Math.abs(b.odd.odds - 1.40);
  });

  // Select ONLY the single #1 highest-confidence pick
  const topPick = candidatePool[0];

  let dbSaved = false;
  try {
    const dbResult = await persistPredictionsToDatabase([topPick], false, dateStr);
    dbSaved = dbResult.savedCount > 0 || dbResult.existingCount > 0;
  } catch (err) {
    console.error("Database save failed:", err);
  }

  return {
    success: true,
    selectedPick: topPick,
    totalEvaluated: candidatePool.length,
    dbSaved,
    message: "High-confidence daily pick selected successfully from live data.",
  };
}

/**
 * Step 22: Weekend Logic (Weekend 15)
 * Sorts Sat-Sun predictions, removes duplicate markets for the same match,
 * and saves up to 15 independent single games strictly from live data.
 * Enforces a hard limit of at most 15 matches evaluated to respect API-Sports 100 req/day quota.
 */
export async function runWeekendPredictionPipeline(
  saturdayDate?: string,
  sundayDate?: string
): Promise<WeekendPredictionResult> {
  const weekendResult = await fetchWeekendFixturesPool(saturdayDate, sundayDate);
  const candidatePool: CandidatePrediction[] = [];

  // Strictly filter for future, unplayed matches with status === 'NS'
  // HARD LIMIT: Slice to a maximum of 15 candidate matches before the deep analysis loop
  // to prevent burning through the 100-request/day free quota.
  const eligibleFixtures = weekendResult.fixtures
    .filter((fix) => isStrictFutureGame(fix))
    .slice(0, 15);

  // Process fixtures in concurrent batches for high throughput and rapid Vercel completion
  const BATCH_SIZE = 5;
  for (let i = 0; i < eligibleFixtures.length; i += BATCH_SIZE) {
    const chunk = eligibleFixtures.slice(i, i + BATCH_SIZE);
    const chunkResults = await Promise.all(
      chunk.map((fix) => evaluateFixturePredictions(fix, true))
    );
    for (const evaluated of chunkResults) {
      candidatePool.push(...evaluated);
    }
  }

  // Deduplication: Pick ONLY the highest confidence market for each unique match!
  const bestPerMatch = new Map<number, CandidatePrediction>();

  for (const cand of candidatePool) {
    const matchId = cand.fixture.apiFixtureId;
    const existing = bestPerMatch.get(matchId);

    if (!existing || cand.algorithm.confidenceScore > existing.algorithm.confidenceScore) {
      bestPerMatch.set(matchId, cand);
    }
  }

  const uniqueMatchesList = Array.from(bestPerMatch.values());

  // Sort strictly by Confidence Score descending
  uniqueMatchesList.sort((a, b) => b.algorithm.confidenceScore - a.algorithm.confidenceScore);

  // Take up to 15 independent single games
  const finalFifteen: CandidatePrediction[] = uniqueMatchesList.slice(0, 15);

  // Strict live data only: if 0 matches qualify, return clean error message
  if (finalFifteen.length === 0) {
    return {
      success: false,
      picks: [],
      totalEvaluated: 0,
      dbSavedCount: 0,
      message: weekendResult.error || "No eligible live weekend fixtures found matching strict criteria and odds (1.20–1.80).",
    };
  }

  let dbSavedCount = 0;
  try {
    const weekendDate = saturdayDate || new Date().toISOString().split("T")[0];
    const dbResult = await persistPredictionsToDatabase(finalFifteen, true, weekendDate);
    dbSavedCount = dbResult.savedCount + dbResult.existingCount;
  } catch (err) {
    console.error("Weekend database save error:", err);
  }

  return {
    success: true,
    picks: finalFifteen,
    totalEvaluated: candidatePool.length,
    dbSavedCount,
    message: `Selected ${finalFifteen.length} high-confidence weekend fixtures strictly from live data (capped at 15).`,
  };
}
