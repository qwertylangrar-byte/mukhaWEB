'use server'

import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiInvoice, apiKey, apiWebhook } from '@/lib/db/schema'
import { generateApiKey } from '@/lib/reseller/apikey'
import { tierById, TIERS } from '@/lib/reseller/pricing'
import { getBalance, listTransactions, newId } from '@/lib/reseller/store'
import {
  createTopup as createTopupInvoice,
  isHeleketConfigured,
  reconcileInvoice,
} from '@/lib/reseller/topup'

async function getUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export interface Overview {
  balance: number
  totalSpent: number
  totalTopup: number
  tier: { id: string; name: string; discountPercent: number }
  nextTier: { name: string; spendNeeded: number } | null
  keys: Array<{
    id: string
    prefix: string
    name: string
    status: string
    lastUsedAt: string | null
    createdAt: string
  }>
  webhooks: Array<{ id: string; url: string; active: boolean }>
  transactions: Array<{
    id: string
    type: string
    amount: number
    balanceAfter: number
    description: string | null
    createdAt: string
  }>
  heleketReady: boolean
}

export async function getOverview(): Promise<Overview> {
  const userId = await getUserId()
  const [bal, keys, webhooks, txns] = await Promise.all([
    getBalance(userId),
    db.select().from(apiKey).where(eq(apiKey.userId, userId)).orderBy(desc(apiKey.createdAt)),
    db.select().from(apiWebhook).where(eq(apiWebhook.userId, userId)).orderBy(desc(apiWebhook.createdAt)),
    listTransactions(userId, 25),
  ])

  const tier = tierById(bal.tier)
  const next = TIERS.find((t) => t.threshold > bal.totalSpent)

  return {
    balance: bal.balance,
    totalSpent: bal.totalSpent,
    totalTopup: bal.totalTopup,
    tier: { id: tier.id, name: tier.name, discountPercent: tier.discountPercent },
    nextTier: next
      ? { name: next.name, spendNeeded: Math.round((next.threshold - bal.totalSpent) * 100) / 100 }
      : null,
    keys: keys.map((k) => ({
      id: k.id,
      prefix: k.keyPrefix,
      name: k.name,
      status: k.status,
      lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
      createdAt: k.createdAt.toISOString(),
    })),
    webhooks: webhooks.map((w) => ({ id: w.id, url: w.url, active: w.active })),
    transactions: txns.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      balanceAfter: Number(t.balanceAfter),
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    })),
    heleketReady: isHeleketConfigured(),
  }
}

/** Create a new API key. Returns the plaintext key ONCE. */
export async function createKey(name: string): Promise<{ key: string }> {
  const userId = await getUserId()
  const { key, prefix, hash } = generateApiKey()
  await db.insert(apiKey).values({
    id: newId('key'),
    userId,
    keyHash: hash,
    keyPrefix: prefix,
    name: name.trim() || 'Default',
  })
  revalidatePath('/developers/dashboard')
  return { key }
}

export async function revokeKey(keyId: string): Promise<void> {
  const userId = await getUserId()
  await db
    .update(apiKey)
    .set({ status: 'revoked' })
    .where(and(eq(apiKey.id, keyId), eq(apiKey.userId, userId)))
  revalidatePath('/developers/dashboard')
}

export async function addWebhook(url: string, secret: string): Promise<void> {
  const userId = await getUserId()
  const trimmed = url.trim()
  if (!/^https?:\/\//i.test(trimmed)) throw new Error('URL must start with http(s)://')
  await db.insert(apiWebhook).values({
    id: newId('wh'),
    userId,
    url: trimmed,
    secret: secret.trim() || null,
  })
  revalidatePath('/developers/dashboard')
}

export async function removeWebhook(id: string): Promise<void> {
  const userId = await getUserId()
  await db.delete(apiWebhook).where(and(eq(apiWebhook.id, id), eq(apiWebhook.userId, userId)))
  revalidatePath('/developers/dashboard')
}

export async function startTopup(amount: number): Promise<{ url: string | null; error?: string }> {
  const userId = await getUserId()
  if (!(amount >= 5)) return { url: null, error: 'Minimum top-up is $5.' }
  const h = await headers()
  const origin =
    h.get('origin') ??
    (h.get('host') ? `https://${h.get('host')}` : '')
  const created = await createTopupInvoice(userId, amount, origin)
  if (!created) return { url: null, error: 'Payment provider is not configured.' }
  return { url: created.url }
}

/** Poll all pending invoices for the user (called from dashboard on load). */
export async function reconcilePending(): Promise<void> {
  const userId = await getUserId()
  const pending = await db
    .select()
    .from(apiInvoice)
    .where(and(eq(apiInvoice.userId, userId), eq(apiInvoice.status, 'pending')))
  for (const inv of pending) {
    try {
      await reconcileInvoice(inv.id)
    } catch {
      // ignore
    }
  }
  revalidatePath('/developers/dashboard')
}
