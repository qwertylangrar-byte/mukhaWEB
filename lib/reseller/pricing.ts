import 'server-only'

/**
 * Reseller pricing engine.
 *
 * We buy from the upstream provider at `cost` (their price with our platform
 * key) and resell to API clients with a markup. A hard floor guarantees we
 * always keep at least +9% over cost, even after loyalty discounts.
 */

export const DEFAULT_MARKUP_PERCENT = 40
export const MIN_MARGIN_PERCENT = 9

export interface Tier {
  id: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum'
  name: string
  /** discount applied to our sell price, in percent */
  discountPercent: number
  /** cumulative spend (USD) required to reach this tier */
  threshold: number
}

export const TIERS: Tier[] = [
  { id: 'none', name: 'Base', discountPercent: 0, threshold: 0 },
  { id: 'bronze', name: 'Bronze', discountPercent: 2.5, threshold: 50 },
  { id: 'silver', name: 'Silver', discountPercent: 5, threshold: 200 },
  { id: 'gold', name: 'Gold', discountPercent: 7.5, threshold: 500 },
  { id: 'platinum', name: 'Platinum', discountPercent: 10, threshold: 2000 },
]

export function tierForSpend(totalSpent: number): Tier {
  let current = TIERS[0]
  for (const tier of TIERS) {
    if (totalSpent >= tier.threshold) current = tier
  }
  return current
}

export function tierById(id: string): Tier {
  return TIERS.find((t) => t.id === id) ?? TIERS[0]
}

/** Round to cents, half-up. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export interface PriceBreakdown {
  cost: number
  base: number
  floor: number
  discountPercent: number
  final: number
}

/**
 * Compute the sell price for a single account.
 * - base   = cost * (1 + markup%)
 * - floor  = cost * (1 + 9%)
 * - final  = max(base * (1 - discount%), floor)
 */
export function computePrice(
  cost: number,
  markupPercent: number,
  discountPercent: number,
): PriceBreakdown {
  const base = cost * (1 + markupPercent / 100)
  const floor = cost * (1 + MIN_MARGIN_PERCENT / 100)
  const discounted = base * (1 - discountPercent / 100)
  const final = round2(Math.max(discounted, floor))
  return {
    cost: round2(cost),
    base: round2(base),
    floor: round2(floor),
    discountPercent,
    final,
  }
}
