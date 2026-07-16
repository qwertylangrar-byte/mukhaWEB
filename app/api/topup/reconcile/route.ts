import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { cryptobotRecentPaid, PaymentError } from '@/lib/payments'
import { bridge } from '@/lib/bridge'

/**
 * Recovery endpoint: finds recently PAID CryptoBot invoices for the current
 * user and credits any that were missed (e.g. the user paid in Telegram and
 * never returned to the /topup page, so polling stopped).
 *
 * Crediting is idempotent via externalId (provider invoice id) — the bot
 * ignores duplicates, so calling this repeatedly is safe.
 */
export async function POST() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  try {
    const paid = await cryptobotRecentPaid(session.telegramId)
    let credited = 0
    for (const inv of paid) {
      try {
        await bridge.credit(
          session.telegramId,
          inv.amountUsd,
          'cryptobot',
          inv.externalId,
        )
        credited++
      } catch {
        // Bridge unavailable or duplicate rejected — skip, retry next time.
      }
    }
    return NextResponse.json({ checked: paid.length, credited })
  } catch (err) {
    if (err instanceof PaymentError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Ошибка сверки платежей' }, { status: 502 })
  }
}
