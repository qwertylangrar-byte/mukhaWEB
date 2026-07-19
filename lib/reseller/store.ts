import 'server-only'

import crypto from 'node:crypto'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  apiBalance,
  apiTransaction,
  pricingSetting,
} from '@/lib/db/schema'
import { tierForSpend } from './pricing'

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(10).toString('hex')}`
}

export interface BalanceRow {
  userId: string
  balance: number
  totalSpent: number
  totalTopup: number
  tier: string
}

function toNum(v: string | number | null | undefined): number {
  return typeof v === 'number' ? v : Number(v ?? 0)
}

export async function getBalance(userId: string): Promise<BalanceRow> {
  const [row] = await db
    .select()
    .from(apiBalance)
    .where(eq(apiBalance.userId, userId))
    .limit(1)

  if (!row) {
    await db.insert(apiBalance).values({ userId }).onConflictDoNothing()
    return { userId, balance: 0, totalSpent: 0, totalTopup: 0, tier: 'none' }
  }

  return {
    userId,
    balance: toNum(row.balance),
    totalSpent: toNum(row.totalSpent),
    totalTopup: toNum(row.totalTopup),
    tier: row.tier,
  }
}

/** Credit the balance (top-up / refund). Returns the new balance. */
export async function credit(
  userId: string,
  amount: number,
  type: 'topup' | 'refund' | 'adjust',
  description: string,
  refId?: string,
): Promise<number> {
  return db.transaction(async (tx) => {
    await tx.insert(apiBalance).values({ userId }).onConflictDoNothing()
    const [bal] = await tx
      .select()
      .from(apiBalance)
      .where(eq(apiBalance.userId, userId))
      .for('update')
      .limit(1)

    const current = toNum(bal.balance)
    const next = Math.round((current + amount) * 100) / 100
    const totalTopup =
      type === 'topup'
        ? Math.round((toNum(bal.totalTopup) + amount) * 100) / 100
        : toNum(bal.totalTopup)

    await tx
      .update(apiBalance)
      .set({ balance: next.toFixed(2), totalTopup: totalTopup.toFixed(2), updatedAt: new Date() })
      .where(eq(apiBalance.userId, userId))

    await tx.insert(apiTransaction).values({
      id: newId('txn'),
      userId,
      type,
      amount: amount.toFixed(2),
      balanceAfter: next.toFixed(2),
      description,
      refId,
    })

    return next
  })
}

export class InsufficientFundsError extends Error {
  constructor() {
    super('Insufficient balance')
  }
}

/** Debit the balance for a purchase. Throws InsufficientFundsError. */
export async function debit(
  userId: string,
  amount: number,
  description: string,
  refId?: string,
): Promise<number> {
  return db.transaction(async (tx) => {
    await tx.insert(apiBalance).values({ userId }).onConflictDoNothing()
    const [bal] = await tx
      .select()
      .from(apiBalance)
      .where(eq(apiBalance.userId, userId))
      .for('update')
      .limit(1)

    const current = toNum(bal.balance)
    if (current + 1e-9 < amount) throw new InsufficientFundsError()

    const next = Math.round((current - amount) * 100) / 100
    const totalSpent = Math.round((toNum(bal.totalSpent) + amount) * 100) / 100
    const tier = tierForSpend(totalSpent).id

    await tx
      .update(apiBalance)
      .set({
        balance: next.toFixed(2),
        totalSpent: totalSpent.toFixed(2),
        tier,
        updatedAt: new Date(),
      })
      .where(eq(apiBalance.userId, userId))

    await tx.insert(apiTransaction).values({
      id: newId('txn'),
      userId,
      type: 'purchase',
      amount: (-amount).toFixed(2),
      balanceAfter: next.toFixed(2),
      description,
      refId,
    })

    return next
  })
}

export async function listTransactions(userId: string, limit = 50) {
  return db
    .select()
    .from(apiTransaction)
    .where(eq(apiTransaction.userId, userId))
    .orderBy(desc(apiTransaction.createdAt))
    .limit(limit)
}

/** Default markup percentage (from pricing_setting, scope=default). */
export async function getDefaultMarkup(): Promise<number> {
  const [row] = await db
    .select()
    .from(pricingSetting)
    .where(eq(pricingSetting.scope, 'default'))
    .limit(1)
  return row ? toNum(row.markupPercent) : 40
}
