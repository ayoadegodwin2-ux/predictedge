/**
 * 14-Day (2 Weeks) Prediction History & Accuracy Database Access (Server Only)
 */

import { db } from "@/db";
import { matches, predictions } from "@/db/schema";
import { desc, gte, eq } from "drizzle-orm";
import { getCountryFlag } from "../leagues";
import {
  type HistoricalPredictionItem,
  getCalibrated14DayHistory,
} from "./history-shared";

export * from "./history-shared";

/**
 * Fetches the 14-day history from Supabase (falling back gracefully to calibrated history if table has few rows)
 */
export async function get14DayHistoryFromDb(): Promise<HistoricalPredictionItem[]> {
  try {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 14);

    const rows = await db
      .select({
        id: predictions.id,
        matchId: predictions.matchId,
        market: predictions.market,
        odds: predictions.odds,
        confidenceScore: predictions.confidenceScore,
        isWeekendPick: predictions.isWeekendPick,
        predictionDate: predictions.predictionDate,
        result: predictions.result,
        finalScore: predictions.finalScore,
        createdAt: predictions.createdAt,
        homeTeam: matches.homeTeam,
        awayTeam: matches.awayTeam,
        leagueName: matches.leagueName,
        country: matches.country,
        kickoffTime: matches.kickoffTime,
      })
      .from(predictions)
      .innerJoin(matches, eq(predictions.matchId, matches.id))
      .where(gte(predictions.createdAt, fourteenDaysAgo))
      .orderBy(desc(predictions.createdAt));

    if (rows) {
      return rows.map((r) => ({
        id: r.id,
        matchId: r.matchId,
        homeTeam: r.homeTeam,
        awayTeam: r.awayTeam,
        leagueName: r.leagueName || "League",
        country: r.country,
        countryFlag: getCountryFlag(r.country),
        kickoffTime: r.kickoffTime.toISOString(),
        market: r.market,
        odds: parseFloat(r.odds),
        confidenceScore: r.confidenceScore,
        isWeekendPick: r.isWeekendPick,
        predictionDate: r.predictionDate || r.createdAt.toISOString().split("T")[0],
        result: (r.result as "WON" | "LOST" | "PENDING") || "PENDING",
        finalScore: r.finalScore || undefined,
        createdAt: r.createdAt.toISOString(),
      }));
    }
  } catch (err) {
    console.warn("Could not query DB for history:", err);
  }

  return [];
}
