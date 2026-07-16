import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { bridge } from '@/lib/bridge'
import { gmt } from '@/lib/getmytg'

/**
 * Session + balance. Balance comes directly from the GetMyTG profile
 * (site's own API key). The bot bridge `user` call keeps the bot DB in
 * sync but is non-fatal if the tunnel is down.
 */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const base = {
    authenticated: true,
    session: {
      telegramId: session.telegramId,
      username: session.username,
      firstName: session.firstName,
    },
  }

  // Sync the user into the bot's DB (non-fatal).
  let bridgeUser: Record<string, unknown> | null = null
  try {
    const data = (await bridge.user(
      session.telegramId,
      session.username,
      session.firstName,
    )) as { user?: Record<string, unknown> }
    bridgeUser = data.user ?? null
  } catch {
    // tunnel down — ignore, GMT profile is the source of truth for balance
  }

  try {
    const profile = await gmt.profile()
    return NextResponse.json({
      ...base,
      user: {
        telegramId: session.telegramId,
        balance: profile.balance?.amount ?? '0',
        referralBalance: profile.referral?.balance?.amount ?? '0',
        totalPurchases: profile.statistics?.total_purchases ?? 0,
        discountLevel: profile.discount?.level ?? 'none',
        discountPercent: profile.discount?.percent ?? 0,
      },
    })
  } catch (err) {
    // GMT unavailable — fall back to the bot DB balance if we have it
    if (bridgeUser) {
      return NextResponse.json({ ...base, user: bridgeUser })
    }
    const message = err instanceof Error ? err.message : 'Ошибка'
    return NextResponse.json({ ...base, user: null, error: message })
  }
}
