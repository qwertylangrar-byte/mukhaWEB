import 'server-only'

import crypto from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { apiKey } from '@/lib/db/schema'

const PREFIX = 'sk_live_'

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const raw = crypto.randomBytes(24).toString('hex')
  const key = `${PREFIX}${raw}`
  return {
    key,
    prefix: key.slice(0, 12),
    hash: hashApiKey(key),
  }
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export interface AuthedClient {
  userId: string
  keyId: string
}

/**
 * Resolve an incoming `x-api-key` / `Authorization: Bearer` header to a client.
 * Returns null when the key is missing, unknown or revoked.
 */
export async function authenticateApiKey(
  headerValue: string | null,
): Promise<AuthedClient | null> {
  if (!headerValue) return null
  const key = headerValue.replace(/^Bearer\s+/i, '').trim()
  if (!key) return null

  const hash = hashApiKey(key)
  const [row] = await db
    .select()
    .from(apiKey)
    .where(and(eq(apiKey.keyHash, hash), eq(apiKey.status, 'active')))
    .limit(1)

  if (!row) return null

  // best-effort last-used timestamp
  db.update(apiKey)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKey.id, row.id))
    .catch(() => {})

  return { userId: row.userId, keyId: row.id }
}
