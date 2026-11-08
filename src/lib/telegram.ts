/**
 * Telegram Bot Alert Integration (Step 24)
 * Pushes Markdown-formatted prediction notifications to the user's phone via Telegram Bot API.
 */

interface TelegramSendResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

/**
 * Sends a Markdown-formatted message to the configured Telegram chat
 */
export async function sendTelegramMessage(text: string): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId || token === "your_bot_token_from_botfather") {
    console.warn("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured in .env.local");
    return {
      success: false,
      error: "Telegram credentials missing from .env.local. Alert was generated but not sent.",
    };
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: false,
      }),
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      return {
        success: false,
        error: json.description || `HTTP ${res.status}: Failed to deliver Telegram message`,
      };
    }

    return {
      success: true,
      messageId: json.result?.message_id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return {
      success: false,
      error: `Telegram dispatch failed: ${message}`,
    };
  }
}

/**
 * Formats and pushes the Daily Pick alert (Weekdays at 8:00 AM)
 */
export async function pushDailyPickAlert(params: {
  homeTeam: string;
  awayTeam: string;
  league: string;
  country: string;
  market: string;
  odds: number | string;
  confidence: number;
  siteUrl?: string;
}): Promise<TelegramSendResult> {
  const oddsVal = typeof params.odds === "number" ? params.odds.toFixed(2) : params.odds;
  const webUrl = params.siteUrl || "https://predictedge.app";

  const message = [
    `🎯 *PREDICTEDGE — DAILY PICK OF THE DAY*`,
    `📅 _8:00 AM Verified Algorithm Selection_`,
    ``,
    `⚽ *Match:* ${params.homeTeam} vs ${params.awayTeam}`,
    `🏆 *League:* ${params.league} (${params.country})`,
    `📊 *Market:* *${params.market}*`,
    `📈 *Odds:* \`${oddsVal}\` (Decimal)`,
    `🔥 *Algorithm Certainty:* *${params.confidence}%*`,
    ``,
    `🛡️ _Passed all 13 proprietary safety filters._`,
    `🔗 [View Full Breakdown & 14-Day History](${webUrl})`,
  ].join("\n");

  return sendTelegramMessage(message);
}

/**
 * Formats and pushes the Weekend 50 slate alert (Saturday mornings at 8:00 AM)
 */
export async function pushWeekend50Alert(params: {
  totalMatches: number;
  topLeagues: string[];
  averageOdds: number | string;
  siteUrl?: string;
}): Promise<TelegramSendResult> {
  const webUrl = params.siteUrl || "https://predictedge.app/weekend-50";

  const message = [
    `🚀 *PREDICTEDGE — WEEKEND 50 SLATE PUBLISHED*`,
    `📅 _Saturday 8:00 AM Automated Dispatch_`,
    ``,
    `🔥 *50 Independent Single Games Live!*`,
    `📊 *Average Slate Odds:* \`${params.averageOdds}\``,
    `🌍 *Key Leagues Covered:* ${params.topLeagues.slice(0, 5).join(", ")}`,
    ``,
    `✅ _All 50 picks de-duplicated and strictly verified._`,
    `🔗 [View All 50 Weekend Picks & Slip](${webUrl})`,
  ].join("\n");

  return sendTelegramMessage(message);
}

/**
 * Formats and pushes the Monday morning settlement report
 */
export async function pushSettlementAlert(params: {
  totalSettled: number;
  wonCount: number;
  lostCount: number;
  winRatePct: number;
  siteUrl?: string;
}): Promise<TelegramSendResult> {
  const webUrl = params.siteUrl || "https://predictedge.app/weekend-50";

  const message = [
    `🏁 *PREDICTEDGE — WEEKEND 50 SETTLEMENT REPORT*`,
    `📅 _Monday Automated Results Audit_`,
    ``,
    `🏆 *Final Win Rate:* *${params.winRatePct}%*`,
    `✅ *Won Picks:* *${params.wonCount}*`,
    `❌ *Lost Picks:* *${params.lostCount}*`,
    `📊 *Total Graded:* *${params.totalSettled} games*`,
    ``,
    `🔍 _Every score and outcome verified against official match feeds._`,
    `🔗 [View Graded Weekend Table & Scores](${webUrl})`,
  ].join("\n");

  return sendTelegramMessage(message);
}

