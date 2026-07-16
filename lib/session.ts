import 'server-only'
import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'mukha_session'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export interface Session {
  telegramId: number
  username?: string
  firstName?: string
  exp: number
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET ?? process.env.BRIDGE_SECRET
  if (!secret) throw new Error('SESSION_SECRET or BRIDGE_SECRET must be set')
  return secret
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url')
}

export function encodeSession(data: Omit<Session, 'exp'>): string {
  const session: Session = { ...data, exp: Date.now() + SESSION_TTL_MS }
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function decodeSession(token: string | undefined): Session | null {
  if (!token) return null
  const dot = token.lastIndexOf('.')
  if (dot === -1) return null
  const payload = token.slice(0, dot)
  const signature = token.slice(dot + 1)
  const expected = sign(payload)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const session = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as Session
    if (typeof session.telegramId !== 'number') return null
    if (session.exp < Date.now()) return null
    return session
  } catch {
    return null
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  return decodeSession(store.get(COOKIE_NAME)?.value)
}

export async function setSessionCookie(data: Omit<Session, 'exp'>) {
  const store = await cookies()
  store.set(COOKIE_NAME, encodeSession(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
