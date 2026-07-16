import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { bridge, BridgeError } from '@/lib/bridge'

/**
 * Checks the top-up at the BOT (`/api/bridge/topup-status`). The bot talks
 * to the payment provider itself and credits the balance in its DB
 * idempotently — polling this endpoint repeatedly is safe.
 */
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  let body: { externalId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
  }
  const topupId = String(body.externalId ?? '')
  if (!topupId) {
    return NextResponse.json({ error: 'Нет идентификатора счёта' }, { status: 400 })
  }

  try {
    const res = (await bridge.topupStatus(session.telegramId, topupId)) as {
      status?: string
      balance?: string | number
      amount?: string | number
    }
    const paid = String(res.status ?? '').toLowerCase() === 'paid'
    return NextResponse.json({
      status: paid ? 'PAID' : 'WAITING',
      credited: paid,
      amount: Number(res.amount ?? 0),
      balance: res.balance != null ? Number(res.balance) : null,
    })
  } catch (err) {
    if (err instanceof BridgeError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Ошибка проверки платежа' }, { status: 502 })
  }
}
