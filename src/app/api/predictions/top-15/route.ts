import { NextResponse } from "next/server";
import { db } from "@/db";
import { predictions, matches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCountryFlag } from "@/lib/leagues";
import { mockWeekendPicks } from "@/lib/mock-data";

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
      .where(eq(predictions.isWeekendPick, true))
      .orderBy(desc(predictions.confidenceScore))
      .limit(15);

    if (rows && rows.length >= 10) {
      const top15 = rows.map((r) => ({
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
        isWeekendPick: true,
        finalScore: r.finalScore || undefined,
        result: r.result as "WON" | "LOST" | "PENDING",
      }));

      return NextResponse.json({
        success: true,
        source: "database",
        count: top15.length,
        data: top15,
      });
    }

    // High-confidence fallback sorted descending
    const fallbackTop15 = [...mockWeekendPicks]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 15);

    return NextResponse.json({
      success: true,
      source: "curated_fallback",
      count: fallbackTop15.length,
      data: fallbackTop15,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch top 15 picks";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

