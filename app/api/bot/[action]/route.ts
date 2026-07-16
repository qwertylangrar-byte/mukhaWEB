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

  /**
   * Purchase flow: the account is bought with the SITE's GetMyTG key, but
   * the money is debited from the user's balance in the BOT database
   * (the same balance the user sees in Telegram).
   */
  purchase: async (telegramId, body) => {
    const countryCode = String(body.countryCode ?? '')
    const country = (await gmt.countries()).find(
      (c) => c.country_code === countryCode,
    )
    const price = Number(country?.price?.amount ?? 0)
    if (!country || price <= 0) {
      throw new GmtError(404, 'Страна недоступна для покупки')
    }

    // 1. Debit the bot balance first (fails with 402 if insufficient).
    const debitId = `buy_${telegramId}_${Date.now()}`
    await bridge.debit(telegramId, price, `Покупка ${countryCode}`, debitId)

    // 2. Buy via GetMyTG; on failure — refund the debit.
    try {
      const purchase = await gmt.createPurchase(countryCode)
      return { purchase: mapPurchase(purchase) }
    } catch (err) {
      await bridge
        .credit(telegramId, price, 'refund', `revert_${debitId}`)
        .catch(() => {})
      throw err
    }
  },

  history: async () => {
    const data = await gmt.history(1, 100)
    return { purchases: (data.items ?? []).map(mapPurchase) }
  },

  /**
   * Two-phase code retrieval so PENDING is never shown to the user:
   *  - body.trigger === true  → fire the code request at GetMyTG ONCE
   *  - body.trigger === false → only check whether the code has arrived
   * The client calls trigger once, then polls status for up to 120s.
   */
  'request-code': async (_telegramId, body) => {
    const id = asId(body.purchaseId)
    const trigger = body.trigger === true

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

    // 2. Trigger code retrieval exactly once (first client call).
    //    409/429 mean a request is already in progress — that's fine.
    if (trigger) {
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
        if (!(err instanceof GmtError && (err.status === 409 || err.status === 429))) {
          throw err
        }
      }
    }

    // 3. Still pending — the client keeps polling for up to 120s.
    return { code: null, status: 'PENDING' }
  },

  /** Refund at GetMyTG, then return the money to the bot balance. */
  refund: async (telegramId, body) => {
    const id = asId(body.purchaseId)
    const purchase = await gmt.purchase(id)
    const price = Number(purchase.price?.amount ?? 0)
    const result = await gmt.refund(id)
    if (price > 0) {
      await bridge
        .credit(telegramId, price, 'refund', `refund_${id}`)
        .catch(() => {})
    }
    return result
  },

  'purchase-bulk': async (telegramId, body) => {
    const countryCode = String(body.countryCode ?? '')
    const quantity = clampInt(body.quantity, 1, 1000, 1)
    const country = (await gmt.countries()).find(
      (c) => c.country_code === countryCode,
    )
    const price = Number(country?.price?.amount ?? 0)
    if (!country || price <= 0) {
      throw new GmtError(404, 'Страна недоступна для покупки')
    }
    const total = Number((price * quantity).toFixed(2))

    const debitId = `bulk_${telegramId}_${Date.now()}`
    await bridge.debit(
      telegramId,
      total,
      `Опт ${countryCode} x${quantity}`,
      debitId,
    )

    try {
      const bulk = await gmt.createBulk(countryCode, quantity)
      return {
        bulkPurchaseId: bulk.bulk_purchase_id,
        status: bulk.status,
        archiveUrl:
          bulk.status === 'SUCCESS'
            ? `/api/download/${bulk.bulk_purchase_id}`
            : null,
      }
    } catch (err) {
      await bridge
        .credit(telegramId, total, 'refund', `revert_${debitId}`)
        .catch(() => {})
      throw err
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
  // Top-up creation/status now live in /api/topup/* (site's own Heleket &
  // CryptoBot keys). The bridge only serves the top-up history from bot DB.
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
