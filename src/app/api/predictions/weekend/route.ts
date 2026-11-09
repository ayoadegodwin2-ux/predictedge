export const maxDuration = 60;

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { runWeekendPredictionPipeline } from "@/lib/engine/prediction-engine";
import { db } from "@/db";
import { predictions, matches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCountryFlag } from "@/lib/leagues";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    const saturday = searchParams.get("saturday") || undefined;
    const sunday = searchParams.get("sunday") || undefined;

    // Check database first unless forced
    if (!force) {
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
        .where(eq(predictions.isWeekendPick, true))
        .orderBy(desc(predictions.confidenceScore))
        .limit(15);

      if (rows && rows.length > 0) {
        const dbPicks = rows.map((r) => ({
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
          count: dbPicks.length,
          data: dbPicks,
          source: "database",
        });
      }
    }

    const result = await runWeekendPredictionPipeline(saturday, sunday);

    try {
      revalidatePath("/", "layout");
    } catch (revalErr) {
      console.warn("Weekend predictions cache revalidation warning:", revalErr);
    }

    const mappedPicks = result.picks.map((p) => ({
      id: p.fixture.apiFixtureId,
      homeTeam: p.fixture.homeTeam,
      awayTeam: p.fixture.awayTeam,
      league: p.fixture.leagueName,
      country: p.fixture.country,
      countryFlag: p.fixture.countryFlag,
      kickoff: p.fixture.kickoffTime,
      market: p.odd.market,
      odds: p.odd.odds,
      confidence: p.algorithm.confidenceScore,
      isWeekendPick: true,
      result: "PENDING" as const,
    }));

    return NextResponse.json({
      success: result.success,
      count: mappedPicks.length,
      data: mappedPicks,
      source: "pipeline",
      meta: {
        totalEvaluated: result.totalEvaluated,
        dbSavedCount: result.dbSavedCount,
        deduplicatedMatches: mappedPicks.length,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal engine error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
