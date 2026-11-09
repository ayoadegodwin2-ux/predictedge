export const maxDuration = 60;

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { runWeekdayPredictionPipeline } from "@/lib/engine/prediction-engine";
import { pushDailyPickAlert } from "@/lib/telegram";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const secretParam = searchParams.get("secret");

    const expectedSecret = process.env.CRON_SECRET;

    // Security check: Only enforce secret if CRON_SECRET is configured
    if (expectedSecret && expectedSecret !== "generate_a_random_32_character_secret_here") {
      const isAuthorized =
        authHeader === `Bearer ${expectedSecret}` || secretParam === expectedSecret;
      if (!isAuthorized) {
        return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
      }
    }

    // 1. Run weekday prediction pipeline
    const pipelineResult = await runWeekdayPredictionPipeline();
    if (!pipelineResult.success || !pipelineResult.selectedPick) {
      return NextResponse.json({
        success: false,
        timestamp: new Date().toISOString(),
        message: pipelineResult.message || "No eligible live fixtures met criteria today.",
      });
    }
    const pick = pipelineResult.selectedPick;

    // 2. Push Telegram Alert
    const telegramResult = await pushDailyPickAlert({
      homeTeam: pick.fixture.homeTeam,
      awayTeam: pick.fixture.awayTeam,
      league: pick.fixture.leagueName,
      country: pick.fixture.country,
      market: pick.odd.market,
      odds: pick.odd.odds,
      confidence: pick.algorithm.confidenceScore,
    });

    // 3. Force cache clear across entire site layout for instant client update
    try {
      revalidatePath("/", "layout");
    } catch (revalErr) {
      console.warn("Daily cron cache revalidation warning:", revalErr);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      pick: {
        match: `${pick.fixture.homeTeam} vs ${pick.fixture.awayTeam}`,
        market: pick.odd.market,
        odds: pick.odd.odds,
        confidence: pick.algorithm.confidenceScore,
      },
      dbSaved: pipelineResult.dbSaved,
      telegramAlert: telegramResult,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Cron execution failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

