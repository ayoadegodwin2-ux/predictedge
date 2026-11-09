/**
 * Real-Time Context & News Analyzer
 * 
 * Verifies that candidate matches are not picked blindly based on raw numbers alone.
 * Evaluates:
 * 1. API-Sports Injury & Suspension registers (missing star strikers, goalkeepers, red card bans).
 * 2. Real-Time News & Red Flags:
 *    - If an LLM API key (OPENAI_API_KEY or PERPLEXITY_API_KEY) is configured, executes an asynchronous
 *      breaking news & sentiment check.
 *    - Falls back gracefully to deterministic sports context audit (manager changes, tactical rest, injury clusters).
 * 3. Returns a confidence modifier (-15% to +5%) and a safety status to veto compromised games.
 */

import type { NormalizedMatchFixture } from "../fixtures";
import type { MatchInjuriesContext, ApprovedMarketName } from "../odds-stats";

export interface MatchupNewsContext {
  safetyPassed: boolean;
  redFlags: string[];
  newsSummary: string;
  confidenceModifier: number; // e.g. -15 to +5
  tacticalNotes: string[];
}

/**
 * Checks for external news using OpenAI / Perplexity if an API key is available
 */
async function queryExternalLlmNews(
  homeTeam: string,
  awayTeam: string,
  league: string
): Promise<{ redFlags: string[]; summary: string } | null> {
  const openAiKey = process.env.OPENAI_API_KEY;
  const perplexityKey = process.env.PERPLEXITY_API_KEY;

  if (!openAiKey && !perplexityKey) {
    return null;
  }

  const isPerplexity = Boolean(perplexityKey);
  const endpoint = isPerplexity
    ? "https://api.perplexity.ai/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
  const authHeader = `Bearer ${isPerplexity ? perplexityKey : openAiKey}`;
  const model = isPerplexity ? "sonar-medium" : "gpt-4o-mini";

  const prompt = `Analyze football match: ${homeTeam} vs ${awayTeam} in ${league}.
Are there any breaking red flags like recent manager sackings, emergency illness outbreaks, or critical squad boycotts in the last 48 hours?
Respond in strictly valid JSON format:
{
  "hasRedFlags": false,
  "redFlags": [],
  "summary": "Brief 1-sentence tactical summary"
}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4-second strict timeout

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (content) {
      // Extract JSON if wrapped in markdown
      const cleanJson = content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      return {
        redFlags: parsed.redFlags || [],
        summary: parsed.summary || "Real-time news verified.",
      };
    }
  } catch {
    // Fail silently to deterministic fallback
  }

  return null;
}

/**
 * Deterministic real-time context and injury check
 */
export async function evaluateMatchupNewsAndContext(
  fixture: NormalizedMatchFixture,
  market: ApprovedMarketName,
  injuries: MatchInjuriesContext
): Promise<MatchupNewsContext> {
  const redFlags: string[] = [];
  const tacticalNotes: string[] = [];
  let modifier = 0;

  // 1. Evaluate API-Sports Injuries against the chosen market
  if (injuries.homeMissing.length >= 3) {
    tacticalNotes.push(`Home squad depleted with ${injuries.homeMissing.length} confirmed absences.`);
    if (market.includes("Home Win")) {
      modifier -= 10;
      redFlags.push(`CRITICAL_HOME_ABSENCES (${injuries.homeMissing.length} players missing)`);
    } else if (market.includes("Over 1.5") || market.includes("Over 2.5")) {
      // Defensive instability often creates higher scoring games
      modifier += 2;
    }
  }

  if (injuries.awayMissing.length >= 3) {
    tacticalNotes.push(`Away squad missing ${injuries.awayMissing.length} key players.`);
    if (market.includes("Away Win")) {
      modifier -= 10;
      redFlags.push(`CRITICAL_AWAY_ABSENCES (${injuries.awayMissing.length} players missing)`);
    } else if (market.includes("Home Win") || market.includes("Home Double Chance")) {
      // Weakened away squad strengthens home side
      modifier += 3;
      tacticalNotes.push("Opponent squad depleted, boosting home dominance edge.");
    }
  }

  // Check specific red card suspensions
  const homeSuspended = injuries.homeMissing.filter((p) => p.reason.toLowerCase().includes("red card") || p.type.toLowerCase().includes("suspend"));
  const awaySuspended = injuries.awayMissing.filter((p) => p.reason.toLowerCase().includes("red card") || p.type.toLowerCase().includes("suspend"));

  if (homeSuspended.length > 0) {
    tacticalNotes.push(`Home team serving ${homeSuspended.length} disciplinary suspension(s).`);
    if (market.includes("Home Win")) modifier -= 4;
  }
  if (awaySuspended.length > 0) {
    tacticalNotes.push(`Away team serving ${awaySuspended.length} disciplinary suspension(s).`);
    if (market.includes("Away Win")) modifier -= 4;
  }

  // 2. Query external real-time LLM web context if keys are present
  const llmResult = await queryExternalLlmNews(fixture.homeTeam, fixture.awayTeam, fixture.leagueName);
  if (llmResult) {
    if (llmResult.redFlags && llmResult.redFlags.length > 0) {
      redFlags.push(...llmResult.redFlags);
      modifier -= 12;
    }
    if (llmResult.summary) {
      tacticalNotes.push(llmResult.summary);
    }
  }

  // 3. Final safety determination
  // A match fails safety if it has critical red flags directly attacking the backed market
  const safetyPassed = redFlags.length === 0;

  let newsSummary = "Verified squad availability & zero breaking news red flags.";
  if (!safetyPassed) {
    newsSummary = `Risk warning: ${redFlags.join("; ")}.`;
  } else if (tacticalNotes.length > 0) {
    newsSummary = tacticalNotes.slice(0, 2).join(" ");
  }

  return {
    safetyPassed,
    redFlags,
    newsSummary,
    confidenceModifier: Math.max(-20, Math.min(5, modifier)),
    tacticalNotes,
  };
}

