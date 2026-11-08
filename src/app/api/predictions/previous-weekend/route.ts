import { NextResponse } from "next/server";
import { getPreviousWeekendGradedPicks } from "@/lib/engine/settlement";

export async function GET() {
  try {
    const data = await getPreviousWeekendGradedPicks();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch previous weekend results";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

