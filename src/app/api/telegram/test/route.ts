import { NextResponse } from "next/server";
import { pushDailyPickAlert, sendTelegramMessage } from "@/lib/telegram";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customMessage = searchParams.get("message");

    if (customMessage) {
      const result = await sendTelegramMessage(customMessage);
      return NextResponse.json({ success: result.success, result });
    }

    // Default test notification
    const testResult = await pushDailyPickAlert({
      homeTeam: "Real Madrid",
      awayTeam: "Barcelona",
      league: "La Liga",
      country: "Spain",
      market: "Over 1.5 Goals (FT)",
      odds: 1.45,
      confidence: 95,
      siteUrl: "http://localhost:3000",
    });

    return NextResponse.json({
      success: testResult.success,
      result: testResult,
      note: testResult.success
        ? "Alert sent successfully to your Telegram!"
        : "Alert could not be sent. Please check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env.local",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Telegram test failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

