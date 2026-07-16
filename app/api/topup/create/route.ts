import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { bridge, BridgeError } from '@/lib/bridge'
import { getFlags } from '@/lib/flags'

/**
 * Top-up creation goes through the BOT's bridge (`/api/bridge/topup`):
 * the bot creates the invoice (cryptobot / heleket) and later credits the
 * balance in its own DB idempotently via `topup-status` — including the
 * referral commission. This is the only flow the bridge supports: it has
 * no separate "credit" action, so invoices created with the site's own
 * keys could never reach the bot's balance.
 */
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const flags = await getFlags()
  if (!flags.topup) {
    return NextResponse.json({ error: flags.message }, { status: 503 })
  }

  let body: { provider?: string; amount?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
  }

  const provider = body.provider === 'cryptobot' ? 'cryptobot' : 'heleket'
  const amount = Number(body.amount)
  if (!Number.isFinite(amount) || amount < 1 || amount > 10000) {
    return NextResponse.json(
      { error: 'Сумма должна быть от $1 до $10 000' },
      { status: 400 },
    )
  }

  try {
    const res = (await bridge.topup(
      session.telegramId,
      provider,
      amount,
    )) as {
      topupId?: string | number
      payUrl?: string
      amount?: string | number
      payAmount?: string | number
      fee?: string | number
    }
    if (!res.topupId || !res.payUrl) {
      return NextResponse.json(
        { error: 'Бот не вернул ссылку на оплату' },
        { status: 502 },
      )
    }
    return NextResponse.json({
      provider,
      externalId: String(res.topupId),
      url: res.payUrl,
      amount: Number(res.amount ?? amount),
      payAmount: Number(res.payAmount ?? amount),
      fee: Number(res.fee ?? 0),
    })
  } catch (err) {
    if (err instanceof BridgeError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json(
      { error: 'Не удалось создать платёж' },
      { status: 500 },
    )
  }
}
