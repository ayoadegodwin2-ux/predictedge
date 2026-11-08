/**
 * Market & Odds Filter (Step 19)
 * 
 * Target Odds Constraints:
 * - Weekday window: 1.30 – 1.50 (for Daily Pick)
 * - Weekend window: 1.20 – 1.80 (for Weekend 50)
 * 
 * Strictly filtered across the 13 Approved Markets.
 */

import { APPROVED_MARKETS, type ApprovedMarketName, type NormalizedOdd } from "../odds-stats";

export const WEEKDAY_ODDS_MIN = 1.30;
export const WEEKDAY_ODDS_MAX = 1.50;

export const WEEKEND_ODDS_MIN = 1.20;
export const WEEKEND_ODDS_MAX = 1.80;

/**
 * Checks if a given market is in the approved 13 markets
 */
export function isApprovedMarket(marketName: string): marketName is ApprovedMarketName {
  return APPROVED_MARKETS.includes(marketName as ApprovedMarketName);
}

/**
 * Validates weekday target odds window (1.30 – 1.50)
 */
export function isWithinWeekdayWindow(odds: number): boolean {
  return odds >= WEEKDAY_ODDS_MIN && odds <= WEEKDAY_ODDS_MAX;
}

/**
 * Validates weekend target odds window (1.20 – 1.80)
 */
export function isWithinWeekendWindow(odds: number): boolean {
  return odds >= WEEKEND_ODDS_MIN && odds <= WEEKEND_ODDS_MAX;
}

/**
 * Filters odds according to the day's constraints (1.30-1.50 for weekdays, 1.20-1.80 for weekends)
 * and verifies they belong to the 13 approved markets.
 */
export function filterMarketOdds(
  oddsList: NormalizedOdd[],
  isWeekend: boolean
): NormalizedOdd[] {
  return oddsList.filter((odd) => {
    // 1. Verify market is one of 13 approved
    if (!isApprovedMarket(odd.market)) {
      return false;
    }

    // 2. Verify target odds window
    if (isWeekend) {
      return isWithinWeekendWindow(odd.odds);
    } else {
      return isWithinWeekdayWindow(odd.odds);
    }
  });
}

