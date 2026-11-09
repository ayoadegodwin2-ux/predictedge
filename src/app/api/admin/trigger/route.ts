export const maxDuration = 60;

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { runWeekdayPredictionPipeline, runWeekendPredictionPipeline } from "@/lib/engine/prediction-engine";
import { settlePendingPredictions } from "@/lib/engine/settlement";
import { pushDailyPickAlert, pushWeekend50Alert, pushSettlementAlert } from "@/lib/telegram";

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("x-admin-token");
  if (!authHeader) return false;
  try {
    const decoded = Buffer.from(authHeader, "base64").toString("utf8");
    const configuredPassword = process.env.ADMIN_PASSWORD || "admin123";
    return decoded.endsWith(`:${configuredPassword}`);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { job } = await request.json();

    if (job === "daily") {
      const result = await runWeekdayPredictionPipeline();
      if (!result.success || !result.selectedPick) {
        return NextResponse.json({
          success: false,
          job: "daily",
          error: result.message || "No eligible live fixtures found meeting mathematical criteria and odds (1.30–1.50) today.",
        }, { status: 404 });
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
      } catch {
        // Continue even if Telegram key is unconfigured
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
          error: result.message || "No eligible live weekend fixtures found meeting mathematical criteria.",
        }, { status: 404 });
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
      } catch {
        // Continue
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
        } catch {
          // Continue
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Trigger execution failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

