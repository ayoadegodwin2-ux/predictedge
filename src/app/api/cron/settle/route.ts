export const maxDuration = 60;

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
      try {
        telegramAlert = await pushSettlementAlert({
          totalSettled: settlementSummary.settledCount,
          wonCount: settlementSummary.wonCount,
          lostCount: settlementSummary.lostCount,
          winRatePct: settlementSummary.winRatePct,
        });
        if (telegramAlert && !telegramAlert.success) {
          console.error("[CRON SETTLE TELEGRAM ERROR] Dispatch returned failure:", telegramAlert.error);
        }
      } catch (tgErr) {
        console.error("[CRON SETTLE TELEGRAM EXCEPTION] Failed to dispatch alert:", tgErr);
      }
    }

    // 3. Force cache clear across entire site layout for instant client update
    try {
      revalidatePath("/", "layout");
    } catch (revalErr) {
      console.warn("Settlement cron cache revalidation warning:", revalErr);
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

