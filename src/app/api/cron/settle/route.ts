import { NextResponse } from "next/server";
import { settlePendingPredictions } from "@/lib/engine/settlement";
import { pushSettlementAlert } from "@/lib/telegram";

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

    // 1. Run the settlement engine
    const settlementSummary = await settlePendingPredictions();

    // 2. Dispatch Telegram alert if matches were settled
    let telegramAlert;
    if (settlementSummary.settledCount > 0) {
      telegramAlert = await pushSettlementAlert({
        totalSettled: settlementSummary.settledCount,
        wonCount: settlementSummary.wonCount,
        lostCount: settlementSummary.lostCount,
        winRatePct: settlementSummary.winRatePct,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: settlementSummary,
      telegramAlert,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Settlement cron execution failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

