import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { bridge } from '@/lib/bridge'
import { getFlags } from '@/lib/flags'

/**
 * Session + balance. Balance comes from the BOT database (same number the
 * user sees in Telegram) via the bridge — NOT from the GetMyTG API balance.
 * Also exposes feature flags (maintenance blocks).
 */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const flags = await getFlags()
  const base = {
    authenticated: true,
    flags,
    session: {
      telegramId: session.telegramId,
      username: session.username,
      firstName: session.firstName,
    },
  }

  try {
    const data = (await bridge.user(
      session.telegramId,
      session.username,
      session.firstName,
    )) as { user?: Record<string, unknown> }
    const u = data.user ?? {}
    return NextResponse.json({
      ...base,
      user: {
        telegramId: session.telegramId,
        balance: u.balance ?? u.balanceUsd ?? '0',
        referralBalance: u.referralBalance ?? u.refBalance ?? '0',
        totalPurchases: u.totalPurchases ?? u.purchases ?? 0,
        ...u,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка'
    return NextResponse.json({ ...base, user: null, error: message })
  }
}
