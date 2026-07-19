import 'server-only'

import crypto from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { apiWebhook } from '@/lib/db/schema'

async function deliver(url: string, secret: string | null, body: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (secret) {
    headers['x-signature'] = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
      cache: 'no-store',
    })
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Send an event to every active webhook of a client. Each endpoint gets up to
 * 3 attempts (5s timeout each) with a short backoff. Fire-and-forget.
 */
export async function dispatchWebhook(
  userId: string,
  event: string,
  data: Record<string, unknown>,
): Promise<void> {
  const hooks = await db
    .select()
    .from(apiWebhook)
    .where(and(eq(apiWebhook.userId, userId), eq(apiWebhook.active, true)))

  if (hooks.length === 0) return

  const body = JSON.stringify({
    event,
    data,
    sent_at: new Date().toISOString(),
  })

  await Promise.all(
    hooks.map(async (hook) => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        const ok = await deliver(hook.url, hook.secret, body)
        if (ok) return
        await new Promise((r) => setTimeout(r, attempt * 500))
      }
    }),
  )
}
