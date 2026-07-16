import 'server-only'
import { getSession, type Session } from '@/lib/session'

/**
 * Admin access is granted to Telegram IDs listed in ADMIN_TELEGRAM_IDS
 * (comma/space separated), e.g. "123456789, 987654321".
 */
export function isAdminId(telegramId: number): boolean {
  const raw = process.env.ADMIN_TELEGRAM_IDS ?? ''
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(String(telegramId))
}

/** Returns the session if the current user is an admin, otherwise null. */
export async function getAdminSession(): Promise<Session | null> {
  const session = await getSession()
  if (!session || !isAdminId(session.telegramId)) return null
  return session
}
