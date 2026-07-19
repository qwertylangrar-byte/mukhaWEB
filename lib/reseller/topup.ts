import 'server-only'

import crypto from 'node:crypto'
import { and, eq, ne } from 'drizzle-orm'
import { db } from '@/lib/db'
import { apiInvoice } from '@/lib/db/schema'
import { credit, newId } from './store'

/**
 * Heleket crypto top-ups for API clients. Invoices are keyed by our own
 * invoice id (order_id = apidev_<invoiceId>) and tracked in `api_invoice`.
 */

function heleketConfig() {
  const merchant =
    process.env.HELEKET_MERCHANT_ID ?? process.env.HELEKET_MERCHANT_UUID
  const key = process.env.HELEKET_API_KEY ?? process.env.HELEKET_PAYMENT_API_KEY
  if (!merchant || !key) return null
  return { merchant, key }
}

function sign(jsonBody: string, key: string): string {
  return crypto
    .createHash('md5')
    .update(Buffer.from(jsonBody).toString('base64') + key)
    .digest('hex')
}

async function heleketFetch<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T | null> {
  const cfg = heleketConfig()
  if (!cfg) return null
  const json = JSON.stringify(body)
  const res = await fetch(`https://api.heleket.com/v1${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      merchant: cfg.merchant,
      sign: sign(json, cfg.key),
    },
    body: json,
    cache: 'no-store',
  })
  const data = (await res.json().catch(() => ({}))) as {
    state?: number
    result?: T
  }
  if (!res.ok || data.state !== 0 || !data.result) return null
  return data.result
}

interface HeleketInvoice {
  uuid: string
  order_id: string
  url: string
  payment_status?: string
  status?: string
  is_final?: boolean
  payment_amount_usd?: string | number | null
  amount?: string | null
}

export function isHeleketConfigured(): boolean {
  return heleketConfig() !== null
}

export async function createTopup(
  userId: string,
  amountUsd: number,
  origin: string,
): Promise<{ id: string; url: string } | null> {
  const invoiceId = newId('inv')
  const orderId = `apidev_${invoiceId}`
  const inv = await heleketFetch<HeleketInvoice>('/payment', {
    amount: amountUsd.toFixed(2),
    currency: 'USD',
    order_id: orderId,
    lifetime: 3600,
    url_success: `${origin}/developers/dashboard?topup=success`,
    url_return: `${origin}/developers/dashboard`,
    url_callback: `${origin}/api/webhooks/heleket-api`,
    theme: 'dark',
  })
  if (!inv) return null

  await db.insert(apiInvoice).values({
    id: invoiceId,
    userId,
    provider: 'heleket',
    providerInvoiceId: inv.uuid,
    amount: amountUsd.toFixed(2),
    currency: 'USD',
    status: 'pending',
    payUrl: inv.url,
  })

  return { id: invoiceId, url: inv.url }
}

const PAID = new Set(['paid', 'paid_over'])

/**
 * Check an invoice against Heleket and, if newly paid, credit the balance
 * exactly once. Returns the resulting status.
 */
export async function reconcileInvoice(invoiceId: string): Promise<string> {
  const [row] = await db
    .select()
    .from(apiInvoice)
    .where(eq(apiInvoice.id, invoiceId))
    .limit(1)
  if (!row) return 'not_found'
  if (row.status === 'paid') return 'paid'

  const inv = await heleketFetch<HeleketInvoice>('/payment/info', {
    uuid: row.providerInvoiceId,
  })
  if (!inv) return row.status

  const status = String(inv.payment_status ?? inv.status ?? '').toLowerCase()
  if (!PAID.has(status)) return row.status

  // Flip to paid only if it is still pending; the row count tells us whether
  // THIS call performed the transition, so we credit exactly once.
  const updated = await db
    .update(apiInvoice)
    .set({ status: 'paid', paidAt: new Date() })
    .where(and(eq(apiInvoice.id, invoiceId), ne(apiInvoice.status, 'paid')))
    .returning()

  if (updated.length > 0) {
    const credited =
      Number(inv.payment_amount_usd ?? inv.amount ?? 0) || Number(row.amount)
    await credit(row.userId, credited, 'topup', 'Balance top-up (Heleket)', invoiceId)
  }
  return 'paid'
}

/** Resolve our invoice id from a Heleket order_id (apidev_<invoiceId>). */
export function invoiceIdFromOrderId(orderId: string): string | null {
  const m = /^apidev_(.+)$/.exec(orderId)
  return m ? m[1] : null
}
