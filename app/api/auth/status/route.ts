import { NextResponse, type NextRequest } from 'next/server'
import { deletePendingLogin, getPendingLogin } from '@/lib/login-store'
import { setSessionCookie } from '@/lib/session'
import { bridge } from '@/lib/bridge'

/** Polled by the browser while waiting for the bot to confirm the login. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  const entry = getPendingLogin(code)
  if (!entry) {
    return NextResponse.json({ status: 'expired' })
  }

  if (!entry.confirmed || typeof entry.telegramId !== 'number') {
    return NextResponse.json({ status: 'pending' })
  }

  const { telegramId, username, firstName } = entry
  deletePendingLogin(code)
  await setSessionCookie({ telegramId, username, firstName })

  // "Registration" in the bot DB happens on first login
  try {
    await bridge.user(telegramId, username, firstName)
  } catch {
    // non-fatal: user record will be created on the next bridge call
  }

  return NextResponse.json({ status: 'confirmed' })
}
