import { NextResponse } from "next/server";
import { runWeekdayPredictionPipeline } from "@/lib/engine/prediction-engine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || undefined;

    const result = await runWeekdayPredictionPipeline(date);

    return NextResponse.json({
      success: true,
      data: result.selectedPick,
      meta: {
        totalEvaluated: result.totalEvaluated,
        dbSaved: result.dbSaved,
        engineVersion: "1.0-weighted",
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
