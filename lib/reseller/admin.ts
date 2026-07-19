import 'server-only'

import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  apiBalance,
  apiKey,
  apiPurchase,
  apiTransaction,
  pricingSetting,
  user,
} from '@/lib/db/schema'
import { credit } from './store'
import { tierById } from './pricing'

/** List / search API clients with balance + tier + key count. */
export async function listApiClients(query: string, limit: number) {
  const where = query
    ? or(ilike(user.email, `%${query}%`), ilike(user.name, `%${query}%`))
    : undefined

  const rows = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      balance: apiBalance.balance,
      totalSpent: apiBalance.totalSpent,
      totalTopup: apiBalance.totalTopup,
      tier: apiBalance.tier,
    })
    .from(user)
    .leftJoin(apiBalance, eq(apiBalance.userId, user.id))
    .where(where)
    .orderBy(desc(user.createdAt))
    .limit(limit)

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    createdAt: r.createdAt.toISOString(),
    balance: Number(r.balance ?? 0),
    totalSpent: Number(r.totalSpent ?? 0),
    totalTopup: Number(r.totalTopup ?? 0),
    tier: tierById(r.tier ?? 'none').name,
  }))
}

/** Full detail for a single API client. */
export async function apiClientDetail(userId: string) {
  const [u] = await db.select().from(user).where(eq(user.id, userId)).limit(1)
  if (!u) throw new Error('Клиент не найден')

  const [bal] = await db
    .select()
    .from(apiBalance)
    .where(eq(apiBalance.userId, userId))
    .limit(1)

  const keys = await db
    .select()
    .from(apiKey)
    .where(eq(apiKey.userId, userId))
    .orderBy(desc(apiKey.createdAt))

  const purchases = await db
    .select()
    .from(apiPurchase)
    .where(eq(apiPurchase.userId, userId))
    .orderBy(desc(apiPurchase.createdAt))
    .limit(20)

  const txns = await db
    .select()
    .from(apiTransaction)
    .where(eq(apiTransaction.userId, userId))
    .orderBy(desc(apiTransaction.createdAt))
    .limit(20)

  const [spend] = await db
    .select({
      revenue: sql<string>`coalesce(sum(${apiPurchase.price}), 0)`,
      cost: sql<string>`coalesce(sum(${apiPurchase.cost}), 0)`,
      count: sql<string>`count(*)`,
    })
    .from(apiPurchase)
    .where(and(eq(apiPurchase.userId, userId), eq(apiPurchase.status, 'SUCCESS')))

  return {
    id: u.id,
    email: u.email,
    name: u.name,
    createdAt: u.createdAt.toISOString(),
    balance: Number(bal?.balance ?? 0),
    totalSpent: Number(bal?.totalSpent ?? 0),
    totalTopup: Number(bal?.totalTopup ?? 0),
    tier: tierById(bal?.tier ?? 'none').name,
    revenue: Number(spend?.revenue ?? 0),
    cost: Number(spend?.cost ?? 0),
    profit: Math.round((Number(spend?.revenue ?? 0) - Number(spend?.cost ?? 0)) * 100) / 100,
    successCount: Number(spend?.count ?? 0),
    keys: keys.map((k) => ({
      id: k.id,
      prefix: k.keyPrefix,
      name: k.name,
      status: k.status,
      createdAt: k.createdAt.toISOString(),
    })),
    purchases: purchases.map((p) => ({
      id: p.id,
      country: p.country,
      price: Number(p.price),
      status: p.status,
      mode: p.mode,
      createdAt: p.createdAt.toISOString(),
    })),
    transactions: txns.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      balanceAfter: Number(t.balanceAfter),
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    })),
  }
}

/** Adjust an API client's balance (admin credit/debit). */
export async function adjustApiClientBalance(
  userId: string,
  amount: number,
  reason: string,
) {
  const signed = Math.round(amount * 100) / 100
  const next = await credit(userId, signed, 'adjust', reason || 'Админ-корректировка')
  return { balance: next }
}

/** Revoke all keys for an API client (soft block). */
export async function blockApiClient(userId: string) {
  await db
    .update(apiKey)
    .set({ status: 'revoked' })
    .where(eq(apiKey.userId, userId))
  return { ok: true }
}

/** Read the default markup percentage. */
export async function getMarkup(): Promise<number> {
  const [row] = await db
    .select()
    .from(pricingSetting)
    .where(eq(pricingSetting.scope, 'default'))
    .limit(1)
  return row ? Number(row.markupPercent) : 40
}

/** Update the default markup percentage. */
export async function setMarkup(percent: number): Promise<number> {
  const clamped = Math.max(0, Math.min(500, Math.round(percent * 100) / 100))
  await db
    .insert(pricingSetting)
    .values({ scope: 'default', markupPercent: clamped.toFixed(2) })
    .onConflictDoUpdate({
      target: pricingSetting.scope,
      set: { markupPercent: clamped.toFixed(2), updatedAt: new Date() },
    })
  return clamped
}
