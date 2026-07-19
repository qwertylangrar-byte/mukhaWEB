import { NextResponse } from 'next/server'
import { bridge } from '@/lib/bridge'
import { gmt, GmtError } from '@/lib/getmytg'

/**
 * PUBLIC, read-only catalog for the marketing homepage.
 *
 * This is intentionally unauthenticated: it only exposes the country list
 * and display prices (GetMyTG catalog + the bot's markup). No balance,
 * no purchases, no user data. All money operations still require a session
 * and go through /api/bot/*.
 */
async function getMarkupPercent(): Promise<number> {
  try {
    const s = (await bridge.settings()) as { markupPercent?: unknown }
    const n = Number(s.markupPercent)
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    // Bot bridge unavailable — show base prices rather than failing.
    return 0
  }
}

export async function GET() {
  try {
    const [items, markup] = await Promise.all([
      gmt.countries(),
      getMarkupPercent(),
    ])
    return NextResponse.json({
      countries: items.map((c) => {
        const base = Number(c.price?.amount ?? 0)
        const price = (base * (1 + markup / 100)).toFixed(2)
        return {
          countryCode: c.country_code,
          name: c.display_name?.ru ?? c.country_code,
          price,
          available:
            typeof c.available_count === 'number'
              ? c.available_count
              : c.available
                ? 1
                : 0,
        }
      }),
    })
  } catch (err) {
    if (err instanceof GmtError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json(
      { error: 'Каталог временно недоступен' },
      { status: 500 },
    )
  }
}
