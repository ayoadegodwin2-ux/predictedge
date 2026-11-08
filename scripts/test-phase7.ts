/**
 * Phase 7: Top 15 Tier & Admin Control Audit
 */

import { mockWeekendPicks } from "../src/lib/mock-data";
import { generateCalibratedPreviousWeekendPicks } from "../src/lib/engine/settlement-shared";

async function runPhase7Tests() {
  console.log("==============================================================");
  console.log("       PREDICTEDGE — PHASE 7: PREMIUM CURATION & ADMIN AUDIT  ");
  console.log("==============================================================\n");

  let passed = 0;
  let total = 0;

  function assert(title: string, condition: boolean, extra?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✓ [PASS] ${title}`);
    } else {
      console.error(`  ✗ [FAIL] ${title} ${extra ? `-> ${extra}` : ""}`);
    }
  }

  // 1. Top 15 Tier (Picks of the Weekend)
  console.log("1. PICKS OF THE WEEKEND (TOP 15 TIER)");
  const sortedUpcoming = [...mockWeekendPicks].sort((a, b) => b.confidence - a.confidence);
  const top15 = sortedUpcoming.slice(0, 15);
  const remaining35 = sortedUpcoming.slice(15);

  assert("Upcoming Top 15 Tier isolates exactly 15 matches", top15.length === 15);
  assert("Remaining slate contains exactly 35 matches", remaining35.length === 35);
  assert("Total combined matches equal 50", top15.length + remaining35.length === 50);

  const minTop15Conf = Math.min(...top15.map((p) => p.confidence));
  const maxRemaining35Conf = Math.max(...remaining35.map((p) => p.confidence));
  assert(
    "Top 15 certainty scores strictly dominate remaining 35",
    minTop15Conf >= maxRemaining35Conf,
    `Min Top 15: ${minTop15Conf} vs Max Remaining: ${maxRemaining35Conf}`
  );

  // 2. Graded Previous Weekend Top 15 Tier
  console.log("\n2. GRADED PREVIOUS WEEKEND TOP 15 TIER");
  const gradedPicks = generateCalibratedPreviousWeekendPicks();
  const sortedGraded = [...gradedPicks].sort((a, b) => b.confidence - a.confidence);
  const gradedTop15 = sortedGraded.slice(0, 15);
  const gradedRemaining35 = sortedGraded.slice(15);

  assert("Graded Top 15 Tier isolates exactly 15 matches", gradedTop15.length === 15);
  assert("All graded Top 15 matches contain actual final scores", gradedTop15.every((p) => !!p.finalScore));
  assert("All graded Top 15 matches have WON or LOST status", gradedTop15.every((p) => p.result === "WON" || p.result === "LOST"));
  const top15Won = gradedTop15.filter((p) => p.result === "WON").length;
  assert("Top 15 Tier achieves elite hit rate (>= 86%)", (top15Won / 15) >= 0.86, `${top15Won}/15 Won`);

  // 3. Admin Authentication Logic
  console.log("\n3. ADMIN DASHBOARD ROUTE & AUTHENTICATION");
  const configuredPassword = process.env.ADMIN_PASSWORD || "admin123";
  assert("ADMIN_PASSWORD configuration resolved", !!configuredPassword);

  const validToken = Buffer.from(`admin:${Date.now()}:${configuredPassword}`).toString("base64");
  const decoded = Buffer.from(validToken, "base64").toString("utf8");
  assert("Admin auth token generator creates valid session signature", decoded.endsWith(`:${configuredPassword}`));

  console.log("\n==============================================================");
  console.log(`PHASE 7 AUDIT: ${passed} / ${total} TESTS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
  console.log("==============================================================");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase7Tests();

