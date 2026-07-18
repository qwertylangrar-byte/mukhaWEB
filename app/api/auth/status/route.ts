import { NextResponse, type NextRequest } from 'next/server'
import { setSessionCookie } from '@/lib/session'
import { bridge } from '@/lib/bridge'

/** Polled by the browser while waiting for the bot to confirm the login. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  let entry
  try {
    entry = await bridge.loginStatus(code)
  } catch {
    // мост временно недоступен — просим браузер продолжать ждать
    return NextResponse.json({ status: 'pending' })
  }

  if (entry.status === 'expired') {
    return NextResponse.json({ status: 'expired' })
  }
  if (entry.status !== 'confirmed' || typeof entry.telegramId !== 'number') {
    return NextResponse.json({ status: 'pending' })
  }

  const { telegramId, username, firstName } = entry

  // "Registration" in the bot DB happens on first login
  try {
    await bridge.user(telegramId, username, firstName)
  } catch {
    // non-fatal: user record will be created on the next bridge call
  }

  // Устанавливаем сессионную cookie — без неё браузер остаётся неавторизованным
  // Устанавливаем сессионную cookie — без неё браузер остаётся неавторизованным
  await setSessionCookie({ telegramId, username, firstName })

  return NextResponse.json({ status: 'confirmed' })