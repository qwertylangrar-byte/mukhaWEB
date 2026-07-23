import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import { bridge, BridgeError } from '@/lib/bridge'
import { gmt, GmtError } from '@/lib/getmytg'
import { assertFeatureEnabled } from '@/lib/flags'

/**
 * Authenticated API for the browser.
 *
 * ALL money operations (purchase, bulk, refund-safety, codes) go through
 * the BOT BRIDGE: the bot atomically debits the balance in its own DB
 * (402 when insufficient) and buys with its GetMyTG key. The site NEVER
 * buys accounts with its own key — that would bypass the user's balance.
 *
 * The catalog is read from GetMyTG (the bridge has no `countries`
 * endpoint) with the bot's markup applied, so displayed prices match
 * what the bot actually charges.
 */

type Handler = (
  telegramId: number,
  body: Record<string, unknown>,
) => Promise<unknown>

/** Tolerant mapper for purchases coming from the bot's local DB. */
function mapBridgePurchase(p: Record<string, unknown>) {
  const quantity = Number(p.quantity ?? 1) || 1
  const type =
    String(p.type ?? p.purchaseType ?? '').toLowerCase() === 'bulk' ||
    quantity > 1 ||
    Boolean(p.archiveUrl)
      ? 'bulk'
      : 'single'
  const bulkId =
    p.bulkPurchaseId ?? p.bulk_purchase_id ?? p.bulkId ?? p.bulk_id ?? null
  const rawArchive = typeof p.archiveUrl === 'string' ? p.archiveUrl : null
  return {
    id: p.id,
    phoneNumber: p.phoneNumber ?? p.phone_number ?? null,
    countryName: p.countryName ?? p.country_name ?? p.countryCode ?? '',
    countryCode: p.countryCode ?? p.country_code ?? '',
    price: p.chargedPrice ?? p.price ?? null,
    status: p.status ?? '',
    createdAt: p.createdAt ?? p.created_at ?? null,
    type,
    quantity,
    // Hide the upstream provider's domain behind our own download proxy.
    archiveUrl: rawArchive
      ? bulkId != null
        ? `/api/download/${bulkId}`
        : rawArchive
      : null,
    bulkPurchaseId:
      typeof bulkId === 'string' || typeof bulkId === 'number' ? bulkId : null,
    code: p.verificationCode ?? null,
  }
}

/** Bot markup so the site shows the same prices the bot charges. */
async function getMarkupPercent(): Promise<number> {
  try {
    const s = (await bridge.settings()) as { markupPercent?: unknown }
    const n = Number(s.markupPercent)
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

const handlers: Record<string, Handler> = {
  // ---- Catalog (GetMyTG read-only + bot markup) ----

  countries: async () => {
    const [items, markup] = await Promise.all([
      gmt.countries(),
      getMarkupPercent(),
    ])
    return {
      countries: items.map((c) => {
        const base = Number(c.price?.amount ?? 0)
        const price = (base * (1 + markup / 100)).toFixed(2)
        return {
          countryCode: c.country_code,
          name: c.display_name?.ru ?? c.country_code,
          price,
          available:
            typeof c.available_count === 'number'
              ? c.available_count
              : c.available
                ? 1
                : 0,
        }
      }),
    }
  },

  // ---- Purchases via the BOT (atomic balance debit in bot DB) ----

  purchase: async (telegramId, body) => {
    await assertFeatureEnabled('purchases')
    const res = (await bridge.purchase(
      telegramId,
      String(body.countryCode ?? ''),
    )) as { balance?: unknown; purchase?: Record<string, unknown> }
    return {
      balance: res.balance ?? null,
      purchase: res.purchase ? mapBridgePurchase(res.purchase) : null,
    }
  },

  'purchase-bulk': async (telegramId, body) => {
    await assertFeatureEnabled('bulk')
    const res = (await bridge.purchaseBulk(
      telegramId,
      String(body.countryCode ?? ''),
      clampInt(body.quantity, 1, 1000, 1),
    )) as {
      bulkPurchaseId?: string | number
      status?: string
      archiveUrl?: string | null
      balance?: unknown
    }
    return {
      bulkPurchaseId: res.bulkPurchaseId,
      status: res.status,
      archiveUrl:
        res.archiveUrl && res.bulkPurchaseId != null
          ? `/api/download/${res.bulkPurchaseId}`
          : (res.archiveUrl ?? null),
      balance: res.balance ?? null,
    }
  },

  'bulk-status': async (telegramId, body) => {
    const bulkId = asId(body.bulkPurchaseId)
    const res = (await bridge.bulkStatus(telegramId, bulkId)) as {
      status?: string
      archiveUrl?: string | null
    }
    return {
      status: res.status,
      archiveUrl: res.archiveUrl ? `/api/download/${bulkId}` : null,
    }
  },

  history: async (telegramId) => {
    const res = (await bridge.history(telegramId, 100)) as {
      purchases?: Array<Record<string, unknown>>
    }
    return {
      purchases: (res.purchases ?? []).map(mapBridgePurchase),
    }
  },

  /**
   * Login-code retrieval via the bot (local purchase id). The bot returns
   * the cached code instantly if it already arrived; otherwise the client
   * polls every 5–10 s while GetMyTG waits for the code.
   */
  'request-code': async (telegramId, body) => {
    await assertFeatureEnabled('codes')
    const res = (await bridge.requestCode(
      telegramId,
      asId(body.purchaseId),
    )) as { code?: string | null; status?: string; message?: string | null }
    return {
      code: res.code ?? null,
      status: res.status ?? (res.code ? 'SUCCESS' : 'PENDING'),
    }
  },

  // ---- Bot bridge (bot's local DB) ----

  settings: () => bridge.settings(),
  referral: (telegramId) => bridge.referral(telegramId),
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
    // Feature-block errors carry a status (503) and an admin-defined message
    if (err instanceof Error && 'status' in err) {
      return NextResponse.json(
        { error: err.message },
        { status: Number((err as { status?: number }).status) || 500 },
      )
    }
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
