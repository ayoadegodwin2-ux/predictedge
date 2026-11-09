export const dynamic = "force-dynamic";
export const revalidate = 0;

import { db } from "@/db";
import { predictions, matches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCountryFlag } from "@/lib/leagues";
import { mockDailyPick } from "@/lib/mock-data";
import { DailyPickClient } from "@/components/predictions/DailyPickClient";
import type { Prediction } from "@/lib/types";

/**
 * Server query for the homepage Hero section:
 * Strictly avoids fragile date-string matching across UTC/WAT timezones.
 * Simply fetches the latest single daily pick by sorting by created_at descending with limit 1.
 */
async function getLatestDailyPick(): Promise<Prediction> {
  try {
    const rows = await db
      .select({
        id: predictions.id,
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
      .where(eq(predictions.isWeekendPick, false))
      .orderBy(desc(predictions.createdAt))
      .limit(1);

    if (rows && rows.length > 0) {
      const r = rows[0];
      return {
        id: r.id,
        homeTeam: r.homeTeam,
        awayTeam: r.awayTeam,
        league: r.leagueName || "League",
        country: r.country,
        countryFlag: getCountryFlag(r.country),
        kickoff: r.kickoffTime.toISOString(),
        market: r.market,
        odds: parseFloat(r.odds),
        confidence: r.confidenceScore,
        isWeekendPick: false,
      };
    }
  } catch (err) {
    console.warn("Homepage server query fallback to mockDailyPick:", err);
  }

  return mockDailyPick;
}

export default async function DailyPickPage() {
  const latestPick = await getLatestDailyPick();

  return <DailyPickClient initialPick={latestPick} />;
}
