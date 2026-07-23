import 'server-only'

import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { apiPurchase } from '@/lib/db/schema'
import { gmt, GmtError } from '@/lib/getmytg'
import { priceForCountry } from './catalog'
import { tierById } from './pricing'
import {
  credit,
  debit,
  getBalance,
  InsufficientFundsError,
  newId,
} from './store'
import { dispatchWebhook } from './webhooks'

const REFUND_WINDOW_MS = 20 * 60 * 1000

export interface PublicPurchase {
  id: string
  mode: 'single' | 'bulk'
  country: string
  country_code: string | null
  phone: string | null
  price: number
  quantity: number
  status: string
  code: string | null
  password: string | null
  archive_url: string | null
  created_at: string
  delivered_at: string | null
}

function toNum(v: string | number | null | undefined): number {
  return typeof v === 'number' ? v : Number(v ?? 0)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializePurchase(row: any): PublicPurchase {
  return {
    id: row.id,
    mode: row.mode,
    country: row.country,
    country_code: row.countryCode ?? null,
    phone: row.phone ?? null,
    price: toNum(row.price),
    quantity: row.quantity ?? 1,
    status: row.status,
    code: row.code ?? null,
    password: row.twoFaPassword ?? null,
    // Never expose the upstream provider's domain — always our own proxy.
    archive_url: row.archiveUrl ? `/api/v1/bulk/${row.id}/download` : null,
    created_at:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
    delivered_at:
      row.deliveredAt instanceof Date
        ? row.deliveredAt.toISOString()
        : row.deliveredAt
          ? String(row.deliveredAt)
          : null,
  }
}

async function clientDiscount(userId: string): Promise<number> {
  const bal = await getBalance(userId)
  return tierById(bal.tier).discountPercent
}

export class PurchaseError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

/**
 * Create a single-account purchase:
 *  1. price the country for this client (markup + tier discount)
 *  2. debit the client balance
 *  3. buy from upstream; on failure, refund the client
 *  4. persist our purchase row (never exposing upstream ids)
 */
export async function createSingle(
  userId: string,
  countryCode: string,
): Promise<PublicPurchase> {
  const discount = await clientDiscount(userId)
  const priced = await priceForCountry(countryCode, discount)
  if (!priced) throw new PurchaseError(404, 'country_not_found', 'Unknown country code.')
  if (!priced.available)
    throw new PurchaseError(409, 'out_of_stock', 'This country is out of stock.')

  const purchaseId = newId('pur')

  try {
    await debit(userId, priced.price, `Purchase ${priced.name}`, purchaseId)
  } catch (e) {
    if (e instanceof InsufficientFundsError)
      throw new PurchaseError(402, 'insufficient_balance', 'Not enough balance.')
    throw e
  }

  let upstream
  try {
    upstream = await gmt.createPurchase(countryCode)
  } catch (e) {
    // roll back the charge
    await credit(userId, priced.price, 'refund', `Refund ${priced.name} (upstream error)`, purchaseId)
    const msg = e instanceof GmtError ? e.message : 'Upstream purchase failed.'
    throw new PurchaseError(502, 'upstream_error', msg)
  }

  const [row] = await db
    .insert(apiPurchase)
    .values({
      id: purchaseId,
      userId,
      upstreamPurchaseId: String(upstream.id),
      mode: 'single',
      country: priced.name,
      countryCode: countryCode.toUpperCase(),
      phone: upstream.phone_number ?? null,
      price: priced.price.toFixed(2),
      cost: priced.cost.toFixed(2),
      quantity: 1,
      status: upstream.status ?? 'PENDING',
    })
    .returning()

  const pub = serializePurchase(row)
  dispatchWebhook(userId, 'purchase.created', pub as unknown as Record<string, unknown>)
  return pub
}

async function loadOwned(userId: string, purchaseId: string) {
  const [row] = await db
    .select()
    .from(apiPurchase)
    .where(and(eq(apiPurchase.id, purchaseId), eq(apiPurchase.userId, userId)))
    .limit(1)
  return row ?? null
}

export async function getPurchase(
  userId: string,
  purchaseId: string,
): Promise<PublicPurchase | null> {
  const row = await loadOwned(userId, purchaseId)
  return row ? serializePurchase(row) : null
}

export async function listPurchases(
  userId: string,
  opts: { page?: number; pageSize?: number; status?: string } = {},
): Promise<{ items: PublicPurchase[]; page: number; page_size: number; total: number }> {
  const page = Math.max(1, opts.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 20))
  const where = opts.status
    ? and(eq(apiPurchase.userId, userId), eq(apiPurchase.status, opts.status))
    : eq(apiPurchase.userId, userId)

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(apiPurchase)
      .where(where)
      .orderBy(desc(apiPurchase.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(apiPurchase)
      .where(where),
  ])

  return {
    items: rows.map(serializePurchase),
    page,
    page_size: pageSize,
    total: Number(count),
  }
}

async function persistDelivery(
  userId: string,
  purchaseId: string,
  code: string,
  password: string,
) {
  const [row] = await db
    .update(apiPurchase)
    .set({
      status: 'SUCCESS',
      code,
      twoFaPassword: password,
      deliveredAt: new Date(),
    })
    .where(and(eq(apiPurchase.id, purchaseId), eq(apiPurchase.userId, userId)))
    .returning()
  if (row) {
    const pub = serializePurchase(row)
    dispatchWebhook(userId, 'purchase.code_received', pub as unknown as Record<string, unknown>)
  }
}

/**
 * Long-poll for the login code. Keeps polling upstream for up to `timeoutMs`
 * (default 115s) and resolves as soon as the verification arrives. Returns
 * null if the code has not arrived within the window (client may retry).
 */
export async function waitForCode(
  userId: string,
  purchaseId: string,
  timeoutMs = 115000,
): Promise<
  | { received: true; purchase: PublicPurchase }
  | { received: false; retry_after: number }
> {
  const row = await loadOwned(userId, purchaseId)
  if (!row) throw new PurchaseError(404, 'not_found', 'Purchase not found.')
  const upstreamId = row.upstreamPurchaseId
  if (!upstreamId)
    throw new PurchaseError(409, 'no_upstream', 'Purchase has no upstream reference.')

  // already have it
  if (row.code) {
    return { received: true, purchase: serializePurchase(row) }
  }

  const deadline = Date.now() + timeoutMs
  let intervalMs = 2500

  // kick off the code request once
  try {
    await gmt.requestCode(upstreamId)
  } catch {
    // ignore — some accounts deliver without an explicit request
  }

  while (Date.now() < deadline) {
    try {
      const up = await gmt.purchase(upstreamId)
      const v = up.verification
      if (v && v.code) {
        await persistDelivery(userId, purchaseId, v.code, v.password ?? '')
        const fresh = await loadOwned(userId, purchaseId)
        return { received: true, purchase: serializePurchase(fresh) }
      }
      if (up.status === 'REFUND' || up.status === 'ERROR') {
        break
      }
    } catch {
      // transient upstream error — keep trying
    }
    const remaining = deadline - Date.now()
    if (remaining <= 0) break
    await new Promise((r) => setTimeout(r, Math.min(intervalMs, remaining)))
    intervalMs = Math.min(intervalMs + 500, 5000)
  }

  return { received: false, retry_after: 5 }
}

/**
 * Create a bulk (wholesale) purchase of `quantity` accounts for a country.
 * Bulk orders are non-refundable, so we charge the client, buy upstream and
 * on upstream failure roll the charge back.
 */
export async function createBulk(
  userId: string,
  countryCode: string,
  quantity: number,
): Promise<PublicPurchase> {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500)
    throw new PurchaseError(400, 'invalid_quantity', 'quantity must be 1-500.')

  const discount = await clientDiscount(userId)
  const priced = await priceForCountry(countryCode, discount)
  if (!priced) throw new PurchaseError(404, 'country_not_found', 'Unknown country code.')
  if (!priced.available)
    throw new PurchaseError(409, 'out_of_stock', 'This country is out of stock.')

  const total = Math.round(priced.price * quantity * 100) / 100
  const totalCost = Math.round(priced.cost * quantity * 100) / 100
  const purchaseId = newId('blk')

  try {
    await debit(userId, total, `Bulk ${quantity}x ${priced.name}`, purchaseId)
  } catch (e) {
    if (e instanceof InsufficientFundsError)
      throw new PurchaseError(402, 'insufficient_balance', 'Not enough balance.')
    throw e
  }

  let upstream
  try {
    upstream = await gmt.createBulk(countryCode, quantity)
  } catch (e) {
    await credit(userId, total, 'refund', `Refund bulk ${priced.name} (upstream error)`, purchaseId)
    const msg = e instanceof GmtError ? e.message : 'Upstream bulk purchase failed.'
    throw new PurchaseError(502, 'upstream_error', msg)
  }

  const [row] = await db
    .insert(apiPurchase)
    .values({
      id: purchaseId,
      userId,
      upstreamPurchaseId: String(upstream.bulk_purchase_id),
      mode: 'bulk',
      country: priced.name,
      countryCode: countryCode.toUpperCase(),
      price: total.toFixed(2),
      cost: totalCost.toFixed(2),
      quantity,
      status: upstream.status ?? 'PENDING',
      archiveUrl: upstream.item?.archive_url ?? null,
    })
    .returning()

  const pub = serializePurchase(row)
  dispatchWebhook(userId, 'bulk.created', pub as unknown as Record<string, unknown>)
  return pub
}

/** Poll upstream for a bulk order and sync status + archive URL locally. */
export async function syncBulk(
  userId: string,
  purchaseId: string,
): Promise<PublicPurchase> {
  const row = await loadOwned(userId, purchaseId)
  if (!row || row.mode !== 'bulk')
    throw new PurchaseError(404, 'not_found', 'Bulk purchase not found.')
  if (!row.upstreamPurchaseId) return serializePurchase(row)

  try {
    const up = await gmt.bulkStatus(row.upstreamPurchaseId)
    const archiveUrl = up.item?.archive_url ?? row.archiveUrl ?? null
    const status = up.status ?? row.status
    if (archiveUrl !== row.archiveUrl || status !== row.status) {
      const [updated] = await db
        .update(apiPurchase)
        .set({
          status,
          archiveUrl,
          deliveredAt: up.status === 'SUCCESS' ? new Date() : row.deliveredAt,
        })
        .where(and(eq(apiPurchase.id, purchaseId), eq(apiPurchase.userId, userId)))
        .returning()
      return serializePurchase(updated)
    }
  } catch {
    // return what we have on transient upstream errors
  }
  return serializePurchase(row)
}

/** Get the upstream download stream for a completed bulk order. */
export async function downloadBulk(
  userId: string,
  purchaseId: string,
): Promise<Response> {
  const row = await loadOwned(userId, purchaseId)
  if (!row || row.mode !== 'bulk')
    throw new PurchaseError(404, 'not_found', 'Bulk purchase not found.')
  if (!row.upstreamPurchaseId)
    throw new PurchaseError(409, 'not_ready', 'Archive is not ready yet.')
  return gmt.downloadBulk(row.upstreamPurchaseId)
}

/** Refund a purchase if it is within 20 minutes and no code was received. */
export async function refundPurchase(
  userId: string,
  purchaseId: string,
): Promise<PublicPurchase> {
  const row = await loadOwned(userId, purchaseId)
  if (!row) throw new PurchaseError(404, 'not_found', 'Purchase not found.')
  if (row.status === 'REFUND')
    throw new PurchaseError(409, 'already_refunded', 'Already refunded.')
  if (row.code)
    throw new PurchaseError(409, 'code_received', 'Code already received; not refundable.')

  const createdAt =
    row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt)
  if (Date.now() - createdAt.getTime() > REFUND_WINDOW_MS)
    throw new PurchaseError(409, 'window_closed', 'Refund window (20 min) has closed.')

  if (row.upstreamPurchaseId) {
    try {
      await gmt.refund(row.upstreamPurchaseId)
    } catch {
      // proceed with local refund even if upstream lags
    }
  }

  await credit(userId, toNum(row.price), 'refund', `Refund ${row.country}`, purchaseId)

  const [updated] = await db
    .update(apiPurchase)
    .set({ status: 'REFUND', refundedAt: new Date() })
    .where(and(eq(apiPurchase.id, purchaseId), eq(apiPurchase.userId, userId)))
    .returning()

  const pub = serializePurchase(updated)
  dispatchWebhook(userId, 'purchase.refunded', pub as unknown as Record<string, unknown>)
  return pub
}
