import { NextResponse } from 'next/server'
import {
  checkAdminCredentials,
  clearAdminCookie,
  isAdminAuthed,
  setAdminCookie,
} from '@/lib/admin'
import { bridge, bridgeFetch, BridgeError } from '@/lib/bridge'
import { getFlags, setFlags, type FeatureFlags } from '@/lib/flags'
import {
  adjustApiClientBalance,
  apiClientDetail,
  blockApiClient,
  getMarkup,
  listApiClients,
  setMarkup,
} from '@/lib/reseller/admin'

export const runtime = 'nodejs'

/**
 * Admin API. Auth: login/password (ADMIN_LOGIN / ADMIN_PASSWORD env vars)
 * exchanged for a signed cookie. Data operations go through the bot bridge,
 * so the bot database remains the single source of truth.
 *
 * Bridge actions used (must exist on the bot side):
 *  - user            { telegramId }                        — always available
 *  - history         { telegramId, limit }                 — always available
 *  - topups          { telegramId, limit }                 — always available
 *  - admin-users     { query?, limit? }                    — NEW (user list/search)
 *  - admin-credit    { telegramId, amount, reason }        — NEW (give balance)
 *  - admin-debit     { telegramId, amount, reason }        — NEW (take balance)
 */

type Handler = (body: Record<string, unknown>) => Promise<Record<string, unknown>>

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const handlers: Record<string, Handler> = {
  /** Look up a single user by telegramId (works with the current bridge). */
  user: async (body) => {
    const telegramId = num(body.telegramId)
    if (!telegramId) throw new BridgeError(400, 'Укажите Telegram ID')
    const res = await bridge.user(telegramId)
    return res as Record<string, unknown>
  },

  /** List/search users — requires the new admin-users bridge action. */
  users: async (body) => {
    const query = typeof body.query === 'string' ? body.query.trim() : ''
    const limit = Math.min(Math.max(num(body.limit) || 50, 1), 200)
    return bridgeFetch('admin-users', { query, limit })
  },

  /** Purchases of a specific user. */
  purchases: async (body) => {
    const telegramId = num(body.telegramId)
    if (!telegramId) throw new BridgeError(400, 'Укажите Telegram ID')
    return bridge.history(telegramId, Math.min(num(body.limit) || 50, 200)) as Promise<
      Record<string, unknown>
    >
  },

  /** Top-ups of a specific user. */
  topups: async (body) => {
    const telegramId = num(body.telegramId)
    if (!telegramId) throw new BridgeError(400, 'Укажите Telegram ID')
    return bridge.topups(telegramId, Math.min(num(body.limit) || 50, 200)) as Promise<
      Record<string, unknown>
    >
  },

  /** Give or take balance — requires admin-credit / admin-debit on the bot. */
  balance: async (body) => {
    const telegramId = num(body.telegramId)
    const amount = Math.round(num(body.amount) * 100) / 100
    const op = body.op === 'debit' ? 'debit' : 'credit'
    if (!telegramId) throw new BridgeError(400, 'Укажите Telegram ID')
    if (amount <= 0) throw new BridgeError(400, 'Сумма должна быть больше нуля')
    const reason =
      (typeof body.reason === 'string' && body.reason.trim().slice(0, 200)) ||
      `Админ-панель: ${op === 'credit' ? 'начисление' : 'списание'} с сайта`
    return bridgeFetch(`admin-${op}`, { telegramId, amount, reason }, 30000)
  },

  /** Read feature blocks. */
  'flags-get': async () => {
    const flags = await getFlags()
    return { flags }
  },

  /** Update feature blocks. */
  'flags-set': async (body) => {
    const update: Partial<FeatureFlags> = {}
    for (const key of ['purchases', 'bulk', 'topup', 'codes'] as const) {
      if (typeof body[key] === 'boolean') update[key] = body[key]
    }
    if (typeof body.message === 'string') update.message = body.message
    const flags = await setFlags(update)
    return { flags }
  },

  /* ---- API platform clients (Neon DB, not the bot bridge) ---- */

  /** List / search API developer clients. */
  'api-clients': async (body) => {
    const query = typeof body.query === 'string' ? body.query.trim() : ''
    const limit = Math.min(Math.max(num(body.limit) || 50, 1), 200)
    const clients = await listApiClients(query, limit)
    return { clients }
  },

  /** Full detail for a single API client. */
  'api-client': async (body) => {
    const userId = typeof body.userId === 'string' ? body.userId : ''
    if (!userId) throw new BridgeError(400, 'Укажите ID клиента')
    return apiClientDetail(userId)
  },

  /** Credit / debit an API client's balance. */
  'api-balance': async (body) => {
    const userId = typeof body.userId === 'string' ? body.userId : ''
    const amount = Math.round(num(body.amount) * 100) / 100
    const op = body.op === 'debit' ? 'debit' : 'credit'
    if (!userId) throw new BridgeError(400, 'Укажите ID клиента')
    if (amount <= 0) throw new BridgeError(400, 'Сумма должна быть больше нуля')
    const reason =
      (typeof body.reason === 'string' && body.reason.trim().slice(0, 200)) ||
      `Админ-панель: ${op === 'credit' ? 'начисление' : 'списание'}`
    return adjustApiClientBalance(userId, op === 'debit' ? -amount : amount, reason)
  },

  /** Revoke all keys for an API client (block API access). */
  'api-block': async (body) => {
    const userId = typeof body.userId === 'string' ? body.userId : ''
    if (!userId) throw new BridgeError(400, 'Укажите ID клиента')
    return blockApiClient(userId)
  },

  /** Read the default markup percentage. */
  'api-markup-get': async () => {
    return { markupPercent: await getMarkup() }
  },

  /** Update the default markup percentage. */
  'api-markup-set': async (body) => {
    const percent = num(body.markupPercent)
    return { markupPercent: await setMarkup(percent) }
  },
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params

  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    // empty body is fine
  }

  // --- auth actions (no admin cookie required) ---
  if (action === 'login') {
    const login = typeof body.login === 'string' ? body.login : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!checkAdminCredentials(login, password)) {
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 },
      )
    }
    await setAdminCookie()
    return NextResponse.json({ ok: true })
  }

  if (action === 'logout') {
    await clearAdminCookie()
    return NextResponse.json({ ok: true })
  }

  if (action === 'session') {
    return NextResponse.json({ authed: await isAdminAuthed() })
  }

  // --- everything else requires the admin cookie ---
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
  }

  const handler = handlers[action]
  if (!handler) {
    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 404 })
  }

  try {
    const result = await handler(body)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof BridgeError) {
      const message =
        err.status === 404
          ? `Действие не поддерживается ботом (нужно добавить на стороне бота). ${err.message}`
          : err.message
      return NextResponse.json({ error: message }, { status: err.status })
    }
    const status =
      err && typeof err === 'object' && 'status' in err
        ? Number((err as { status: number }).status) || 500
        : 500
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Внутренняя ошибка' },
      { status },
    )
  }
}
