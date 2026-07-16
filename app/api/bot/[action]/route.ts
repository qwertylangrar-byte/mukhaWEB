import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import { bridge, BridgeError } from '@/lib/bridge'

/**
 * Authenticated proxy between the browser and the bot bridge.
 * telegramId is always taken from the session cookie — never from the client.
 */

type Handler = (
  telegramId: number,
  body: Record<string, unknown>,
) => Promise<unknown>

const handlers: Record<string, Handler> = {
  settings: () => bridge.settings(),
  countries: () => bridge.countries(),
  referral: (telegramId) => bridge.referral(telegramId),
  history: (telegramId, body) =>
    bridge.history(telegramId, clampInt(body.limit, 1, 200, 50)),
  purchase: (telegramId, body) =>
    bridge.purchase(telegramId, String(body.countryCode ?? '')),
  'purchase-bulk': (telegramId, body) =>
    bridge.purchaseBulk(
      telegramId,
      String(body.countryCode ?? ''),
      clampInt(body.quantity, 1, 1000, 1),
    ),
  'bulk-status': (telegramId, body) =>
    bridge.bulkStatus(telegramId, asId(body.bulkPurchaseId)),
  'request-code': (telegramId, body) =>
    bridge.requestCode(telegramId, asId(body.purchaseId)),
  refund: (telegramId, body) =>
    bridge.refund(telegramId, asId(body.purchaseId)),
  topup: (telegramId, body) =>
    bridge.topup(
      telegramId,
      String(body.provider ?? ''),
      Number(body.amount ?? 0),
    ),
  'topup-status': (telegramId, body) =>
    bridge.topupStatus(telegramId, asId(body.topupId)),
  topups: (telegramId, body) =>
    bridge.topups(telegramId, clampInt(body.limit, 1, 200, 50)),
}

function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = Math.trunc(Number(value))
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function asId(value: unknown): string | number {
  if (typeof value === 'number') return value
  return String(value ?? '')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { action } = await params
  const handler = handlers[action]
  if (!handler) {
    return NextResponse.json({ error: 'Unknown action' }, { status: 404 })
  }

  let body: Record<string, unknown> = {}
  try {
    const text = await request.text()
    if (text) body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  try {
    const data = await handler(session.telegramId, body)
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof BridgeError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
