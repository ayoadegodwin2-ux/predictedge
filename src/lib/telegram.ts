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
    console.error("[TELEGRAM BROADCAST ERROR] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing or unconfigured in environment variables.");
    return {
      success: false,
      error: "Telegram credentials missing from .env.local. Alert was generated but not sent.",
    };
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second safety timeout to prevent Vercel execution lock

    let res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    let json = await res.json();

    // Fallback if Markdown entity parsing failed due to special characters in team/league names
    if (!res.ok && json.description && json.description.includes("can't parse entities")) {
      console.warn("[TELEGRAM BROADCAST WARNING] Markdown entity parsing failed. Retrying in plain text...");
      const plainRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.replace(/[*_`\[\]()]/g, ""),
          disable_web_page_preview: false,
        }),
      });
      json = await plainRes.json();
      res = plainRes;
    }

    if (!res.ok || !json.ok) {
      const errorMsg = json.description || `HTTP ${res.status}: Failed to deliver Telegram message`;
      console.error("[TELEGRAM BROADCAST ERROR]", errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }

    console.log("[TELEGRAM BROADCAST SUCCESS] Alert sent successfully. Message ID:", json.result?.message_id);
    return {
      success: true,
      messageId: json.result?.message_id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    console.error("[TELEGRAM BROADCAST EXCEPTION]", message);
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

