export const maxDuration = 60;

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { runWeekendPredictionPipeline } from "@/lib/engine/prediction-engine";
import { pushWeekend50Alert } from "@/lib/telegram";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const secretParam = searchParams.get("secret");

    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && expectedSecret !== "generate_a_random_32_character_secret_here") {
      const isAuthorized =
        authHeader === `Bearer ${expectedSecret}` || secretParam === expectedSecret;
      if (!isAuthorized) {
        return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
      }
    }

    // 1. Run weekend prediction pipeline (50 deduplicated games)
    const pipelineResult = await runWeekendPredictionPipeline();
    const picks = pipelineResult.picks;

    // Calculate slate summary
    const totalOdds = picks.reduce((sum, p) => sum + p.odd.odds, 0);
    const avgOdds = picks.length > 0 ? (totalOdds / picks.length).toFixed(2) : "1.45";
    const topLeagues = Array.from(new Set(picks.map((p) => p.fixture.leagueName)));

    // 2. Push Telegram Alert
    const telegramResult = await pushWeekend50Alert({
      totalMatches: picks.length,
      topLeagues,
      averageOdds: avgOdds,
    });

    // 3. Force cache clear across entire site layout for instant client update
    try {
      revalidatePath("/", "layout");
    } catch (revalErr) {
      console.warn("Weekend cron cache revalidation warning:", revalErr);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      picksCount: picks.length,
      dbSavedCount: pipelineResult.dbSavedCount,
      averageOdds: avgOdds,
      telegramAlert: telegramResult,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Weekend cron execution failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

