import { NextResponse } from 'next/server'
import {
  heleketVerifyWebhook,
  telegramIdFromOrderId,
} from '@/lib/payments'
import { bridge } from '@/lib/bridge'

const PAID = new Set(['paid', 'paid_over'])

/**
 * Heleket payment webhook (url_callback). Signature is verified with the
 * payment API key: sign = md5(base64(body_without_sign) + key).
 * On "paid" — credit the user's balance in the bot DB (idempotent by uuid).
 */
export async function POST(request: Request) {
  let payload: Record<string, unknown>
  try {
    payload = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 })
  }

  try {
    if (!heleketVerifyWebhook(payload)) {
      return NextResponse.json({ error: 'bad signature' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: 'not configured' }, { status: 503 })
  }

  const status = String(payload.status ?? payload.payment_status ?? '').toLowerCase()
  const orderId = String(payload.order_id ?? '')
  const uuid = String(payload.uuid ?? '')
  const telegramId = telegramIdFromOrderId(orderId)

  if (PAID.has(status) && telegramId && uuid) {
    const amount =
      Number(payload.payment_amount_usd ?? 0) || Number(payload.amount ?? 0)
    if (amount > 0) {
      try {
        await bridge.credit(telegramId, amount, 'heleket', uuid)
      } catch {
        // Bot tunnel down — polling from the client will retry crediting.
      }
    }
  }

  return NextResponse.json({ ok: true })
}
