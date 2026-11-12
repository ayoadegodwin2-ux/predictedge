export const maxDuration = 60;

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { runWeekdayPredictionPipeline, runWeekendPredictionPipeline } from "@/lib/engine/prediction-engine";
import { settlePendingPredictions } from "@/lib/engine/settlement";
import { pushDailyPickAlert, pushWeekend50Alert, pushSettlementAlert } from "@/lib/telegram";
import { isRequestAdminAuthorized } from "@/lib/admin-auth";

/**
 * Executes the requested pipeline job
 */
async function executeJob(job: string) {
  if (job === "daily") {
    const result = await runWeekdayPredictionPipeline();
    if (!result.success || !result.selectedPick) {
      return NextResponse.json({
        success: false,
        job: "daily",
        message: result.message || "No eligible live fixtures found meeting mathematical criteria and odds (1.30–1.50) today.",
      }, { status: 200 }); // Status 200 so HTTP clients do not misinterpret as a missing route 404
    }
    const pick = result.selectedPick;

    let telegramAlert;
    try {
      telegramAlert = await pushDailyPickAlert({
        homeTeam: pick.fixture.homeTeam,
        awayTeam: pick.fixture.awayTeam,
        league: pick.fixture.leagueName,
        country: pick.fixture.country,
        market: pick.odd.market,
        odds: pick.odd.odds,
        confidence: pick.algorithm.confidenceScore,
      });
      if (telegramAlert && !telegramAlert.success) {
        console.error("[TRIGGER TELEGRAM ERROR] Daily pick dispatch returned failure:", telegramAlert.error);
      }
    } catch (tgErr) {
      console.error("[TRIGGER TELEGRAM EXCEPTION] Failed to dispatch daily pick alert:", tgErr);
    }

    // Force cache clear
    try {
      revalidatePath("/", "layout");
    } catch (revalErr) {
      console.warn("Trigger cache revalidation warning:", revalErr);
    }

    return NextResponse.json({
      success: true,
      job: "daily",
      message: `Daily Pick successfully generated: ${pick.fixture.homeTeam} vs ${pick.fixture.awayTeam} (${pick.odd.market} @ ${pick.odd.odds})`,
      data: {
        match: `${pick.fixture.homeTeam} vs ${pick.fixture.awayTeam}`,
        market: pick.odd.market,
        odds: pick.odd.odds,
        confidence: pick.algorithm.confidenceScore,
        dbSaved: result.dbSaved,
        telegramAlert,
      },
    });
  }

  if (job === "weekend") {
    const result = await runWeekendPredictionPipeline();
    if (!result.success || result.picks.length === 0) {
      return NextResponse.json({
        success: false,
        job: "weekend",
        message: result.message || "No eligible live weekend fixtures found meeting mathematical criteria.",
      }, { status: 200 });
    }
    const picks = result.picks;
    const totalOdds = picks.reduce((s, p) => s + p.odd.odds, 0);
    const avgOdds = picks.length > 0 ? (totalOdds / picks.length).toFixed(2) : "1.45";

    let telegramAlert;
    try {
      telegramAlert = await pushWeekend50Alert({
        totalMatches: picks.length,
        topLeagues: Array.from(new Set(picks.map((p) => p.fixture.leagueName))),
        averageOdds: avgOdds,
      });
      if (telegramAlert && !telegramAlert.success) {
        console.error("[TRIGGER TELEGRAM ERROR] Weekend alert dispatch returned failure:", telegramAlert.error);
      }
    } catch (tgErr) {
      console.error("[TRIGGER TELEGRAM EXCEPTION] Failed to dispatch weekend alert:", tgErr);
    }

    // Force cache clear
    try {
      revalidatePath("/", "layout");
    } catch (revalErr) {
      console.warn("Trigger cache revalidation warning:", revalErr);
    }

    return NextResponse.json({
      success: true,
      job: "weekend",
      message: `Weekend 15 Slate generated: ${picks.length} matches analyzed and persisted.`,
      data: {
        count: picks.length,
        dbSavedCount: result.dbSavedCount,
        averageOdds: avgOdds,
        telegramAlert,
      },
    });
  }

  if (job === "settle") {
    const result = await settlePendingPredictions();

    let telegramAlert;
    if (result.settledCount > 0) {
      try {
        telegramAlert = await pushSettlementAlert({
          totalSettled: result.settledCount,
          wonCount: result.wonCount,
          lostCount: result.lostCount,
          winRatePct: result.winRatePct,
        });
        if (telegramAlert && !telegramAlert.success) {
          console.error("[TRIGGER TELEGRAM ERROR] Settlement alert dispatch returned failure:", telegramAlert.error);
        }
      } catch (tgErr) {
        console.error("[TRIGGER TELEGRAM EXCEPTION] Failed to dispatch settlement alert:", tgErr);
      }
    }

    // Force cache clear
    try {
      revalidatePath("/", "layout");
    } catch (revalErr) {
      console.warn("Trigger cache revalidation warning:", revalErr);
    }

    return NextResponse.json({
      success: true,
      job: "settle",
      message: `Settlement audit complete: ${result.settledCount} matches graded (${result.wonCount} Won, ${result.lostCount} Lost). Win rate: ${result.winRatePct}%.`,
      data: {
        settledCount: result.settledCount,
        wonCount: result.wonCount,
        lostCount: result.lostCount,
        winRatePct: result.winRatePct,
        stillPending: result.stillPendingCount,
        telegramAlert,
      },
    });
  }

  return NextResponse.json({ success: false, error: "Invalid job name. Must be 'daily', 'weekend', or 'settle'." }, { status: 400 });
}

/**
 * GET /api/admin/trigger
 * Allows status probing or simple browser/curl trigger verification
 */
export async function GET(request: Request) {
  if (!isRequestAdminAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized. Provide x-admin-token header, Authorization: Bearer <password>, or ?password=... in URL.",
      },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const job = searchParams.get("job") || "status";

  if (job === "status") {
    return NextResponse.json({
      success: true,
      status: "online",
      message: "Trigger API endpoint is online and responsive. Send POST with {'job': 'daily' | 'weekend' | 'settle'} or GET with ?job=...",
      availableJobs: ["daily", "weekend", "settle"],
    });
  }

  try {
    return await executeJob(job);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Trigger execution failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/trigger
 * Main trigger execution endpoint for admin dashboard and automation scripts
 */
export async function POST(request: Request) {
  let body: { job?: string; password?: string; token?: string; adminPassword?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (!isRequestAdminAuthorized(request, body)) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized. Provide x-admin-token header, Authorization: Bearer <token/password>, or 'password' in JSON body.",
      },
      { status: 401 }
    );
  }

  try {
    const job = body.job || "daily";
    return await executeJob(job);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Trigger execution failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
