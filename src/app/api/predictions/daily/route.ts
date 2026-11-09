export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { db } from "@/db";
import { predictions, matches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCountryFlag } from "@/lib/leagues";
import { mockDailyPick } from "@/lib/mock-data";

/**
 * GET /api/predictions/daily
 * Fetches the latest single daily pick from Supabase.
 * Strictly avoids fragile date-string matching across UTC/WAT boundaries;
 * simply queries the most recent weekday prediction by createdAt descending.
 */
export async function GET() {
  try {
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
      .where(eq(predictions.isWeekendPick, false))
      .orderBy(desc(predictions.createdAt))
      .limit(1);

    if (rows && rows.length > 0) {
      const r = rows[0];
      const dailyPick = {
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
        result: r.result as "WON" | "LOST" | "PENDING",
        finalScore: r.finalScore || undefined,
        createdAt: r.createdAt.toISOString(),
      };

      return NextResponse.json(
        { success: true, data: dailyPick },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "CDN-Cache-Control": "no-store",
            "Vercel-CDN-Cache-Control": "no-store",
          },
        }
      );
    }

    // Fallback if no records found yet
    return NextResponse.json(
      { success: true, data: mockDailyPick },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load daily pick";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
