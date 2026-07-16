import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import { bridge, BridgeError } from '@/lib/bridge'
import { gmt, GmtError, type GmtPurchase } from '@/lib/getmytg'

/**
 * Authenticated API for the browser.
 *
 * Catalog, purchases, verification codes, refunds and bulk orders go
 * DIRECTLY to the GetMyTG API with the site's own key (lib/getmytg.ts).
 * The bot bridge is only used for what lives in the bot's local DB:
 * top-ups and the referral program.
 */

type Handler = (
  telegramId: number,
  body: Record<string, unknown>,
) => Promise<unknown>

function mapPurchase(p: GmtPurchase) {
  const isBulk = p.purchase_type === 'BULK'
  return {
    id: p.id,
    phoneNumber: p.phone_number,
    countryName: p.display_name?.ru ?? p.country_code,
    countryCode: p.country_code,
    price: p.price?.amount ?? null,
    status: p.status,
    createdAt: p.created_at,
    type: isBulk ? 'bulk' : 'single',
    archiveUrl: isBulk && p.status === 'SUCCESS' ? `/api/download/${p.id}` : null,
    code: p.verification?.code ?? null,
    password: p.verification?.password ?? null,
  }
}

const handlers: Record<string, Handler> = {
  // ---- GetMyTG API (site's own key) ----

  countries: async () => {
    const items = await gmt.countries()
    return {
      countries: items.map((c) => ({
        countryCode: c.country_code,
        name: c.display_name?.ru ?? c.country_code,
        price: c.price?.amount ?? '0',
        available:
          typeof c.available_count === 'number'
            ? c.available_count
            : c.available
              ? 1
              : 0,
      })),
    }
  },

  purchase: async (_telegramId, body) => {
    const purchase = await gmt.createPurchase(String(body.countryCode ?? ''))
    return { purchase: mapPurchase(purchase) }
  },

  history: async () => {
    const data = await gmt.history(1, 100)
    return { purchases: (data.items ?? []).map(mapPurchase) }
  },

  'request-code': async (_telegramId, body) => {
    const id = asId(body.purchaseId)
    // 1. If the code is already stored, return it immediately.
    const existing = await gmt.purchase(id)
    if (existing.verification?.code) {
      return {
        code: existing.verification.code,
        password: existing.verification.password ?? null,
        status: 'SUCCESS',
      }
    }
    if (existing.status === 'REFUND' || existing.status === 'ERROR') {
      return { code: null, status: existing.status }
    }
    // 2. Trigger code retrieval. A 409 means it's already in progress.
    try {
      const res = await gmt.requestCode(id)
      if (res.purchase?.verification?.code) {
        return {
          code: res.purchase.verification.code,
          password: res.purchase.verification.password ?? null,
          status: 'SUCCESS',
        }
      }
    } catch (err) {
      if (!(err instanceof GmtError && err.status === 409)) throw err
    }
    // 3. Still pending — the client keeps polling for up to 120s.
    return { code: null, status: 'PENDING' }
  },

  refund: async (_telegramId, body) => {
    return await gmt.refund(asId(body.purchaseId))
  },

  'purchase-bulk': async (_telegramId, body) => {
    const bulk = await gmt.createBulk(
      String(body.countryCode ?? ''),
      clampInt(body.quantity, 1, 1000, 1),
    )
    return {
      bulkPurchaseId: bulk.bulk_purchase_id,
      status: bulk.status,
      archiveUrl:
        bulk.status === 'SUCCESS'
          ? `/api/download/${bulk.bulk_purchase_id}`
          : null,
    }
  },

  'bulk-status': async (_telegramId, body) => {
    const id = asId(body.bulkPurchaseId)
    const bulk = await gmt.bulkStatus(id)
    return {
      status: bulk.status,
      archiveUrl:
        bulk.status === 'SUCCESS' ? `/api/download/${bulk.bulk_purchase_id}` : null,
    }
  },

  // ---- Bot bridge (bot's local DB only) ----

  settings: () => bridge.settings(),
  referral: (telegramId) => bridge.referral(telegramId),
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
    if (err instanceof GmtError || err instanceof BridgeError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
