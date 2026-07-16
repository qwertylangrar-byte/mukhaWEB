import 'server-only'

import crypto from 'node:crypto'

/**
 * Payment providers used by the SITE with its own API keys:
 *  - Heleket  (https://doc.heleket.com)  — crypto invoices
 *  - CryptoBot Crypto Pay API (https://help.send.tg/en/articles/10279948) — Telegram crypto payments
 *
 * Env:
 *  - HELEKET_MERCHANT_UUID
 *  - HELEKET_PAYMENT_API_KEY
 *  - CRYPTOBOT_API_TOKEN
 */

export class PaymentError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export interface CreatedInvoice {
  provider: 'heleket' | 'cryptobot'
  /** provider-side invoice id (uuid for heleket, invoice_id for cryptobot) */
  externalId: string
  /** our order id (contains telegramId) */
  orderId: string
  url: string
}

export interface InvoiceStatus {
  paid: boolean
  final: boolean
  /** USD amount actually credited-worthy, taken from the PROVIDER (never from the client) */
  amountUsd: number
  telegramId: number | null
  raw?: Record<string, unknown>
}

/** order_id format: mukha_<telegramId>_<random> (alpha_dash only) */
export function makeOrderId(telegramId: number): string {
  return `mukha_${telegramId}_${crypto.randomBytes(6).toString('hex')}`
}

export function telegramIdFromOrderId(orderId: string): number | null {
  const m = /^mukha_(\d+)_/.exec(orderId)
  return m ? Number(m[1]) : null
}

/* ---------------------------------- Heleket --------------------------------- */

function heleketConfig() {
  const merchant = process.env.HELEKET_MERCHANT_UUID
  const key = process.env.HELEKET_PAYMENT_API_KEY
  if (!merchant || !key) {
    throw new PaymentError(
      503,
      'Heleket не настроен. Добавьте HELEKET_MERCHANT_UUID и HELEKET_PAYMENT_API_KEY.',
    )
  }
  return { merchant, key }
}

export function heleketSign(jsonBody: string, key: string): string {
  return crypto
    .createHash('md5')
    .update(Buffer.from(jsonBody).toString('base64') + key)
    .digest('hex')
}

async function heleketFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { merchant, key } = heleketConfig()
  const json = JSON.stringify(body)
  const res = await fetch(`https://api.heleket.com/v1${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      merchant,
      sign: heleketSign(json, key),
    },
    body: json,
    cache: 'no-store',
  })
  const data = (await res.json().catch(() => ({}))) as {
    state?: number
    result?: T
    message?: string
    errors?: unknown
  }
  if (!res.ok || data.state !== 0 || !data.result) {
    throw new PaymentError(
      res.status === 401 ? 401 : 502,
      data.message || `Heleket: ошибка запроса (${res.status})`,
    )
  }
  return data.result
}

interface HeleketInvoice {
  uuid: string
  order_id: string
  url: string
  payment_status: string
  status?: string
  is_final: boolean
  payment_amount_usd?: string | number | null
  amount?: string | null
}

export async function heleketCreate(
  telegramId: number,
  amountUsd: number,
  origin: string,
): Promise<CreatedInvoice> {
  const orderId = makeOrderId(telegramId)
  const inv = await heleketFetch<HeleketInvoice>('/payment', {
    amount: amountUsd.toFixed(2),
    currency: 'USD',
    order_id: orderId,
    lifetime: 3600,
    url_success: `${origin}/topup?status=success`,
    url_return: `${origin}/topup`,
    url_callback: `${origin}/api/webhooks/heleket`,
    theme: 'dark',
  })
  return { provider: 'heleket', externalId: inv.uuid, orderId, url: inv.url }
}

const HELEKET_PAID = new Set(['paid', 'paid_over'])
const HELEKET_FINAL_FAIL = new Set(['cancel', 'fail', 'wrong_amount', 'system_fail'])

export async function heleketStatus(uuid: string): Promise<InvoiceStatus> {
  const inv = await heleketFetch<HeleketInvoice>('/payment/info', { uuid })
  const status = String(inv.payment_status ?? inv.status ?? '').toLowerCase()
  const paid = HELEKET_PAID.has(status)
  return {
    paid,
    final: Boolean(inv.is_final) || paid || HELEKET_FINAL_FAIL.has(status),
    amountUsd: paid
      ? Number(inv.payment_amount_usd ?? inv.amount ?? 0) || Number(inv.amount ?? 0)
      : 0,
    telegramId: telegramIdFromOrderId(inv.order_id ?? ''),
    raw: inv as unknown as Record<string, unknown>,
  }
}

/** Verify a Heleket webhook body: sign = md5(base64(json_without_sign) + key) */
export function heleketVerifyWebhook(payload: Record<string, unknown>): boolean {
  const { key } = heleketConfig()
  const sign = payload.sign
  if (typeof sign !== 'string') return false
  const clone: Record<string, unknown> = { ...payload }
  delete clone.sign
  const expected = heleketSign(JSON.stringify(clone), key)
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sign))
}

/* --------------------------------- CryptoBot -------------------------------- */

function cryptobotToken(): string {
  const token = process.env.CRYPTOBOT_API_TOKEN
  if (!token) {
    throw new PaymentError(503, 'CryptoBot не настроен. Добавьте CRYPTOBOT_API_TOKEN.')
  }
  return token
}

async function cryptobotFetch<T>(method: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://pay.crypt.bot/api/${method}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Crypto-Pay-API-Token': cryptobotToken(),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean
    result?: T
    error?: { name?: string }
  }
  if (!res.ok || !data.ok || data.result == null) {
    throw new PaymentError(
      res.status === 401 ? 401 : 502,
      `CryptoBot: ${data.error?.name || `ошибка запроса (${res.status})`}`,
    )
  }
  return data.result
}

interface CryptobotInvoice {
  invoice_id: number
  status: string
  amount: string
  payload?: string
  bot_invoice_url?: string
  mini_app_invoice_url?: string
  pay_url?: string
}

export async function cryptobotCreate(
  telegramId: number,
  amountUsd: number,
): Promise<CreatedInvoice> {
  const orderId = makeOrderId(telegramId)
  const inv = await cryptobotFetch<CryptobotInvoice>('createInvoice', {
    currency_type: 'fiat',
    fiat: 'USD',
    amount: amountUsd.toFixed(2),
    accepted_assets: 'USDT,TON,BTC,ETH',
    payload: orderId,
    description: `Пополнение баланса MukhaTG на $${amountUsd.toFixed(2)}`,
    expires_in: 3600,
  })
  const url = inv.bot_invoice_url ?? inv.mini_app_invoice_url ?? inv.pay_url
  if (!url) throw new PaymentError(502, 'CryptoBot: не получили ссылку на оплату')
  return {
    provider: 'cryptobot',
    externalId: String(inv.invoice_id),
    orderId,
    url,
  }
}

export async function cryptobotStatus(invoiceId: string): Promise<InvoiceStatus> {
  const res = await cryptobotFetch<{ items?: CryptobotInvoice[] }>('getInvoices', {
    invoice_ids: invoiceId,
  })
  const inv = res.items?.[0]
  if (!inv) throw new PaymentError(404, 'CryptoBot: счёт не найден')
  const paid = inv.status === 'paid'
  return {
    paid,
    final: paid || inv.status === 'expired',
    amountUsd: paid ? Number(inv.amount) || 0 : 0,
    telegramId: telegramIdFromOrderId(inv.payload ?? ''),
    raw: inv as unknown as Record<string, unknown>,
  }
}
