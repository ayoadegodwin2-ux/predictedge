import { NextResponse } from "next/server";
import { runWeekendPredictionPipeline } from "@/lib/engine/prediction-engine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const saturday = searchParams.get("saturday") || undefined;
    const sunday = searchParams.get("sunday") || undefined;

    const result = await runWeekendPredictionPipeline(saturday, sunday);

    return NextResponse.json({
      success: true,
      count: result.picks.length,
      data: result.picks,
      meta: {
        totalEvaluated: result.totalEvaluated,
        dbSavedCount: result.dbSavedCount,
        deduplicatedMatches: result.picks.length,
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
