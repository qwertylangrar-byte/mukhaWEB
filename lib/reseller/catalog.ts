import 'server-only'

import { gmt, type GmtCountry } from '@/lib/getmytg'
import { computePrice } from './pricing'
import { getDefaultMarkup } from './store'

export interface CatalogItem {
  country_code: string
  name: string
  emoji: string
  price: number
  currency: 'USD'
  available: boolean
  available_count: number | null
}

function displayName(c: GmtCountry): string {
  return c.display_name?.en || c.display_name?.ru || c.country_code
}

/**
 * Client-facing catalog. Applies our markup + the client's tier discount to
 * the upstream cost and strips every upstream-specific field.
 */
export async function getCatalog(discountPercent = 0): Promise<{
  items: CatalogItem[]
  markupPercent: number
}> {
  const [countries, markupPercent] = await Promise.all([
    gmt.countries(),
    getDefaultMarkup(),
  ])

  const items = countries.map((c) => {
    const cost = Number(c.price?.amount ?? 0)
    const { final } = computePrice(cost, markupPercent, discountPercent)
    return {
      country_code: c.country_code,
      name: displayName(c),
      emoji: c.emoji,
      price: final,
      currency: 'USD' as const,
      available: c.available,
      available_count: c.available_count ?? null,
    }
  })

  return { items, markupPercent }
}

/** Look up the upstream cost + our sell price for one country. */
export async function priceForCountry(
  countryCode: string,
  discountPercent = 0,
): Promise<{ cost: number; price: number; name: string; available: boolean } | null> {
  const [countries, markupPercent] = await Promise.all([
    gmt.countries(),
    getDefaultMarkup(),
  ])
  const c = countries.find(
    (x) => x.country_code.toUpperCase() === countryCode.toUpperCase(),
  )
  if (!c) return null
  const cost = Number(c.price?.amount ?? 0)
  const { final } = computePrice(cost, markupPercent, discountPercent)
  return { cost, price: final, name: displayName(c), available: c.available }
}
