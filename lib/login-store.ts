import 'server-only'

/**
 * In-memory store of pending Telegram deep-link logins.
 * code -> pending/confirmed state, TTL 5 minutes.
 * Stored on globalThis so it survives HMR and warm serverless invocations.
 */

export interface PendingLogin {
  createdAt: number
  confirmed: boolean
  telegramId?: number
  username?: string
  firstName?: string
}

const TTL_MS = 5 * 60 * 1000

const globalStore = globalThis as unknown as {
  __mukhaLoginStore?: Map<string, PendingLogin>
}

function store(): Map<string, PendingLogin> {
  if (!globalStore.__mukhaLoginStore) {
    globalStore.__mukhaLoginStore = new Map()
  }
  return globalStore.__mukhaLoginStore
}

function cleanup() {
  const now = Date.now()
  for (const [code, entry] of store()) {
    if (now - entry.createdAt > TTL_MS) store().delete(code)
  }
}

export function createPendingLogin(code: string) {
  cleanup()
  store().set(code, { createdAt: Date.now(), confirmed: false })
}

export function confirmLogin(
  code: string,
  data: { telegramId: number; username?: string; firstName?: string },
): boolean {
  cleanup()
  const entry = store().get(code)
  if (!entry) return false
  entry.confirmed = true
  entry.telegramId = data.telegramId
  entry.username = data.username
  entry.firstName = data.firstName
  return true
}

export function getPendingLogin(code: string): PendingLogin | null {
  cleanup()
  return store().get(code) ?? null
}

export function deletePendingLogin(code: string) {
  store().delete(code)
}
