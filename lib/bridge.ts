import 'server-only'

/**
 * Server-side client for the bot bridge API.
 * The site NEVER calls the bridge from the browser — only from route handlers.
 *
 * Env:
 *  - BOT_BRIDGE_URL   e.g. https://xxx.trycloudflare.com
 *  - BRIDGE_SECRET    shared secret, same value as on the bot
 */

export class BridgeError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function getConfig() {
  const url = process.env.BOT_BRIDGE_URL
  const secret = process.env.BRIDGE_SECRET
  if (!url || !secret) {
    throw new BridgeError(
      503,
      'Мост с ботом не настроен. Добавьте переменные окружения BOT_BRIDGE_URL и BRIDGE_SECRET.',
    )
  }
  return { url: url.replace(/\/+$/, ''), secret }
}

export async function bridgeFetch<T = Record<string, unknown>>(
  endpoint: string,
  body: Record<string, unknown> = {},
  timeoutMs = 15000,
): Promise<T> {
  const { url, secret } = getConfig()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let res: Response
  try {
    res = await fetch(`${url}/api/bridge/${endpoint}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-bridge-secret': secret,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: controller.signal,
    })
  } catch {
    throw new BridgeError(
      503,
      'Сервис временно недоступен: не удалось связаться с ботом.',
    )
  } finally {
    clearTimeout(timer)
  }

  let data: Record<string, unknown> = {}
  try {
    data = (await res.json()) as Record<string, unknown>
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    const message =
      (typeof data.error === 'string' && data.error) ||
      (typeof data.message === 'string' && data.message) ||
      `Ошибка моста (${res.status})`
    throw new BridgeError(res.status, message)
  }

  return data as T
}

export const bridge = {
  user: (telegramId: number, username?: string, firstName?: string) =>
    bridgeFetch('user', { telegramId, username, firstName }),
  settings: () => bridgeFetch('settings'),
  countries: () => bridgeFetch('countries'),
  referral: (telegramId: number) => bridgeFetch('referral', { telegramId }),
  history: (telegramId: number, limit = 50) =>
    bridgeFetch('history', { telegramId, limit }),
  purchase: (telegramId: number, countryCode: string) =>
    bridgeFetch('purchase', { telegramId, countryCode }, 30000),
  purchaseBulk: (telegramId: number, countryCode: string, quantity: number) =>
    bridgeFetch('purchase-bulk', { telegramId, countryCode, quantity }, 60000),
  bulkStatus: (telegramId: number, bulkPurchaseId: string | number) =>
    bridgeFetch('bulk-status', { telegramId, bulkPurchaseId }),
  requestCode: (telegramId: number, purchaseId: string | number) =>
    bridgeFetch('request-code', { telegramId, purchaseId }, 30000),
  refund: (telegramId: number, purchaseId: string | number) =>
    bridgeFetch('refund', { telegramId, purchaseId }),
  topup: (telegramId: number, provider: string, amount: number) =>
    bridgeFetch('topup', { telegramId, provider, amount }, 30000),
  topupStatus: (telegramId: number, topupId: string | number) =>
    bridgeFetch('topup-status', { telegramId, topupId }),
  topups: (telegramId: number, limit = 50) =>
    bridgeFetch('topups', { telegramId, limit }),
}
