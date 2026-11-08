import { NextResponse } from "next/server";
import { get14DayHistoryFromDb, calculateAccuracy, getLast14Days } from "@/lib/engine/history";

export async function GET() {
  try {
    const historyData = await get14DayHistoryFromDb();
    const daysList = getLast14Days();
    const accuracy = calculateAccuracy(historyData);

    return NextResponse.json({
      success: true,
      data: {
        history: historyData,
        days: daysList,
        accuracy,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
