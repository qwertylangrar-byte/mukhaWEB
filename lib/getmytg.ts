import 'server-only'

/**
 * Direct server-side client for the GetMyTG API (https://docs.getmytg.com).
 * The site calls api.getmytg.com with its OWN API key (x-api-key header).
 * The bot bridge is only used for user auth / balance DB sync — never for
 * catalog, purchases or verification codes.
 *
 * Env:
 *  - GETMYTG_API_KEY   API key issued by the GetMyTG Telegram bot
 */

const API_BASE = 'https://api.getmytg.com/v1'

export class GmtError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function getApiKey(): string {
  const key = process.env.GETMYTG_API_KEY
  if (!key) {
    throw new GmtError(
      503,
      'GetMyTG API не настроен. Добавьте переменную окружения GETMYTG_API_KEY.',
    )
  }
  return key
}

export interface Money {
  amount: string
  currency_code: string
}

export interface GmtCountry {
  country_code: string
  emoji: string
  display_name: { ru: string; en: string }
  price: Money
  available: boolean
  tags: string[]
  available_count?: number | null
}

export interface GmtVerification {
  code: string
  password: string
  received_at: string
}

export interface GmtPurchase {
  id: number
  country_code: string
  display_name: { ru: string; en: string }
  phone_number: string | null
  price: Money
  status: 'PENDING' | 'SUCCESS' | 'ERROR' | 'REFUND'
  purchase_type: 'SINGLE' | 'BULK' | 'ADMIN'
  verification: GmtVerification | null
  created_at: string
}

export interface GmtBulkPurchase {
  bulk_purchase_id: number
  country_code: string
  quantity: number
  total_price: Money
  price_per_account: Money
  item: {
    export_id: string
    archive_url: string
    quantity: number
    status: string
    created_at: string
  } | null
  status: 'PENDING' | 'SUCCESS' | 'ERROR' | 'REFUND'
  created_at: string
  updated_at: string
}

export interface GmtProfile {
  id: string
  telegram_id: string | null
  telegram_username: string | null
  login: string | null
  balance: Money
  statistics: { total_purchases: number }
  discount: { level: string; percent: number }
  referral: {
    level: string
    percent: number
    referrals_count: number
    balance: Money
    profit: Money
  }
  created_at: string
}

async function gmtFetch<T>(
  path: string,
  init: { method?: 'GET' | 'POST'; body?: Record<string, unknown> } = {},
  timeoutMs = 30000,
): Promise<T> {
  const key = getApiKey()
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        'x-api-key': key,
        ...(init.body ? { 'content-type': 'application/json' } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
      signal: controller.signal,
    })
  } catch (e) {
    // Surface the real cause instead of masking every failure with one message.
    if (timedOut) {
      throw new GmtError(
        504,
        `GetMyTG API не ответил за ${Math.round(timeoutMs / 1000)} с (${init.method ?? 'GET'} ${path}).`,
      )
    }
    const detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
    throw new GmtError(503, `Не удалось связаться с GetMyTG API (${detail}).`)
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
      `Ошибка GetMyTG API (${res.status})`
    throw new GmtError(res.status, message)
  }

  return data as T
}

export const gmt = {
  /** Catalog with personal pricing. */
  countries: async (): Promise<GmtCountry[]> => {
    const items: GmtCountry[] = []
    let page = 1
    for (;;) {
      const data = await gmtFetch<{
        items: GmtCountry[]
        pagination: { has_next: boolean }
      }>(`/accounts/?sort=name_asc&page=${page}&page_size=150`)
      items.push(...(data.items ?? []))
      if (!data.pagination?.has_next || page >= 5) break
      page += 1
    }
    return items
  },

  profile: () => gmtFetch<GmtProfile>('/profile/'),

  createPurchase: (countryCode: string) =>
    gmtFetch<GmtPurchase>(
      '/purchases/',
      {
        method: 'POST',
        body: { country_code: countryCode.toUpperCase() },
      },
      // Reserving an account from the provider is slower than a catalog read.
      90000,
    ),

  purchase: (purchaseId: number | string) =>
    gmtFetch<GmtPurchase>(`/purchases/${purchaseId}`),

  history: (page = 1, pageSize = 50) =>
    gmtFetch<{
      items: GmtPurchase[]
      pagination: { has_next: boolean }
    }>(`/purchases/?page=${page}&page_size=${Math.min(pageSize, 150)}`),

  requestCode: (purchaseId: number | string) =>
    gmtFetch<{
      purchase: GmtPurchase
      code_request: {
        status: 'not_requested' | 'pending' | 'success' | 'failed'
        attempt: number
        max_attempts: number
        retry_after: number | null
      }
    }>(`/purchases/${purchaseId}/request-code`, { method: 'POST', body: {} }),

  refund: (purchaseId: number | string) =>
    gmtFetch<Record<string, unknown>>(`/purchases/${purchaseId}/refund`, {
      method: 'POST',
      body: {},
    }),

  createBulk: (countryCode: string, quantity: number) =>
    gmtFetch<GmtBulkPurchase>(
      '/purchases/bulk',
      {
        method: 'POST',
        body: { country_code: countryCode.toUpperCase(), quantity },
      },
      90000,
    ),

  bulkStatus: (bulkPurchaseId: number | string) =>
    gmtFetch<GmtBulkPurchase>(`/purchases/bulk/${bulkPurchaseId}`),

  /** Streams the ZIP archive of a bulk purchase. */
  downloadBulk: async (bulkPurchaseId: number | string): Promise<Response> => {
    const key = getApiKey()
    const res = await fetch(
      `${API_BASE}/purchases/bulk/${bulkPurchaseId}/download`,
      { headers: { 'x-api-key': key }, cache: 'no-store' },
    )
    if (!res.ok) {
      throw new GmtError(res.status, `Не удалось скачать архив (${res.status})`)
    }
    return res
  },
}
