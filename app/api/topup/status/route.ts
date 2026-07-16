import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { heleketStatus, cryptobotStatus, PaymentError } from '@/lib/payments'
import { bridge } from '@/lib/bridge'

/**
 * Checks invoice status at the PROVIDER (amount is never taken from the
 * client) and, when paid, credits the user's balance in the bot DB.
 * Crediting is idempotent via externalId — the bot ignores duplicates,
 * so webhook + polling can both fire safely.
 */
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  let body: { provider?: string; externalId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
  }
  const externalId = String(body.externalId ?? '')
  if (!externalId) {
    return NextResponse.json({ error: 'Нет идентификатора счёта' }, { status: 400 })
  }

  try {
    const status =
      body.provider === 'cryptobot'
        ? await cryptobotStatus(externalId)
        : await heleketStatus(externalId)

    // The invoice must belong to the logged-in user.
    if (status.telegramId !== null && status.telegramId !== session.telegramId) {
      return NextResponse.json({ error: 'Чужой счёт' }, { status: 403 })
    }

    let credited = false
    if (status.paid && status.amountUsd > 0) {
      await bridge.credit(
        session.telegramId,
        status.amountUsd,
        body.provider === 'cryptobot' ? 'cryptobot' : 'heleket',
        externalId,
      )
      credited = true
    }

    return NextResponse.json({
      status: status.paid ? 'PAID' : status.final ? 'FAILED' : 'WAITING',
      credited,
      amount: status.amountUsd,
    })
  } catch (err) {
    if (err instanceof PaymentError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    const message = err instanceof Error ? err.message : 'Ошибка проверки платежа'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
