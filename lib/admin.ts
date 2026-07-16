import 'server-only'
import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

/**
 * Admin auth is separate from the regular Telegram session:
 * login + password (ADMIN_LOGIN / ADMIN_PASSWORD env vars) exchanged for a
 * short-lived HMAC-signed cookie. The panel lives at /grobovozka.
 */

const COOKIE_NAME = 'mukha_admin'
const ADMIN_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

function getSecret(): string {
  const secret = process.env.SESSION_SECRET ?? process.env.BRIDGE_SECRET
  if (!secret) throw new Error('SESSION_SECRET or BRIDGE_SECRET must be set')
  return secret
}

function sign(payload: string): string {
  return createHmac('sha256', `admin:${getSecret()}`)
    .update(payload)
    .digest('base64url')
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

/** Validates the login/password pair against env vars. */
export function checkAdminCredentials(login: string, password: string): boolean {
  const expectedLogin = process.env.ADMIN_LOGIN ?? ''
  const expectedPassword = process.env.ADMIN_PASSWORD ?? ''
  if (!expectedLogin || !expectedPassword) return false
  return safeEqual(login, expectedLogin) && safeEqual(password, expectedPassword)
}

export async function setAdminCookie() {
  const payload = Buffer.from(
    JSON.stringify({ admin: true, exp: Date.now() + ADMIN_TTL_MS }),
  ).toString('base64url')
  const store = await cookies()
  store.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_TTL_MS / 1000,
  })
}

export async function clearAdminCookie() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

/** True if the current request carries a valid admin cookie. */
export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return false
  const dot = token.lastIndexOf('.')
  if (dot === -1) return false
  const payload = token.slice(0, dot)
  if (!safeEqual(token.slice(dot + 1), sign(payload))) return false
  try {
    const data = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as { admin?: boolean; exp?: number }
    return data.admin === true && typeof data.exp === 'number' && data.exp > Date.now()
  } catch {
    return false
  }
}
