import { NextResponse } from "next/server";
import { db } from "@/db";
import { dailyVisits } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function POST() {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Atomically upsert today's visit count
    await db
      .insert(dailyVisits)
      .values({
        visitDate: today,
        visitCount: 1,
      })
      .onConflictDoUpdate({
        target: dailyVisits.visitDate,
        set: {
          visitCount: sql`${dailyVisits.visitCount} + 1`,
          updatedAt: new Date(),
        },
      });

    const [record] = await db
      .select({ count: dailyVisits.visitCount })
      .from(dailyVisits)
      .where(eq(dailyVisits.visitDate, today))
      .limit(1);

    return NextResponse.json({
      success: true,
      today,
      todayVisits: record?.count ?? 1,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Visit tracking failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const allRows = await db
      .select({
        date: dailyVisits.visitDate,
        count: dailyVisits.visitCount,
      })
      .from(dailyVisits)
      .orderBy(desc(dailyVisits.visitDate));

    const todayRecord = allRows.find((r) => r.date === today);
    const todayVisits = todayRecord ? todayRecord.count : 0;
    const totalVisits = allRows.reduce((sum, r) => sum + r.count, 0);

    return NextResponse.json({
      success: true,
      today,
      todayVisits,
      totalVisits,
      history: allRows.slice(0, 14),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load visit analytics";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

