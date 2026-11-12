export const maxDuration = 60;

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { predictions, matches } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCountryFlag } from "@/lib/leagues";
import { isRequestAdminAuthorized } from "@/lib/admin-auth";

/**
 * GET /api/admin/predictions - Fetch all predictions with match metadata
 */
export async function GET(request: Request) {
  if (!isRequestAdminAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await db
      .select({
        id: predictions.id,
        matchId: predictions.matchId,
        market: predictions.market,
        odds: predictions.odds,
        confidenceScore: predictions.confidenceScore,
        isWeekendPick: predictions.isWeekendPick,
        predictionDate: predictions.predictionDate,
        result: predictions.result,
        finalScore: predictions.finalScore,
        createdAt: predictions.createdAt,
        homeTeam: matches.homeTeam,
        awayTeam: matches.awayTeam,
        leagueName: matches.leagueName,
        country: matches.country,
        kickoffTime: matches.kickoffTime,
      })
      .from(predictions)
      .innerJoin(matches, eq(predictions.matchId, matches.id))
      .orderBy(desc(predictions.createdAt))
      .limit(100);

    const formatted = rows.map((r) => ({
      id: r.id,
      matchId: r.matchId,
      homeTeam: r.homeTeam,
      awayTeam: r.awayTeam,
      leagueName: r.leagueName || "League",
      country: r.country,
      countryFlag: getCountryFlag(r.country),
      kickoffTime: r.kickoffTime.toISOString(),
      market: r.market,
      odds: parseFloat(r.odds),
      confidenceScore: r.confidenceScore,
      isWeekendPick: r.isWeekendPick,
      predictionDate: r.predictionDate || r.createdAt.toISOString().split("T")[0],
      result: r.result,
      finalScore: r.finalScore || null,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, count: formatted.length, data: formatted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load predictions";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/predictions - Manually delete a prediction
 */
export async function DELETE(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  if (!isRequestAdminAuthorized(request, body)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id || typeof id !== "number") {
      return NextResponse.json({ success: false, error: "Valid prediction ID required" }, { status: 400 });
    }

    await db.delete(predictions).where(eq(predictions.id, id));

    try {
      revalidatePath("/", "layout");
    } catch (revalErr) {
      console.warn("Delete cache revalidation warning:", revalErr);
    }

    return NextResponse.json({
      success: true,
      message: `Prediction #${id} deleted successfully from Supabase`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete prediction";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/predictions - Manually override / edit a prediction
 */
export async function PATCH(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  if (!isRequestAdminAuthorized(request, body)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, market, odds, confidenceScore, result, finalScore } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json({ success: false, error: "Valid prediction ID required" }, { status: 400 });
    }

    const updates: Record<string, string | number | null> = {};
    if (market !== undefined) updates.market = market;
    if (odds !== undefined) updates.odds = String(odds);
    if (confidenceScore !== undefined) updates.confidenceScore = Number(confidenceScore);
    if (result !== undefined) updates.result = result;
    if (finalScore !== undefined) updates.finalScore = finalScore;

    await db.update(predictions).set(updates).where(eq(predictions.id, id));

    try {
      revalidatePath("/", "layout");
    } catch (revalErr) {
      console.warn("Patch cache revalidation warning:", revalErr);
    }

    return NextResponse.json({
      success: true,
      message: `Prediction #${id} updated successfully in Supabase`,
      updated: updates,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update prediction";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
