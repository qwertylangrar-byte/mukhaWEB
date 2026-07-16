import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { bridge, BridgeError } from '@/lib/bridge'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  try {
    const data = (await bridge.user(
      session.telegramId,
      session.username,
      session.firstName,
    )) as { user?: Record<string, unknown> }
    return NextResponse.json({
      authenticated: true,
      session: {
        telegramId: session.telegramId,
        username: session.username,
        firstName: session.firstName,
      },
      user: data.user ?? null,
    })
  } catch (err) {
    const status = err instanceof BridgeError ? err.status : 500
    const message = err instanceof Error ? err.message : 'Ошибка'
    return NextResponse.json(
      {
        authenticated: true,
        session: {
          telegramId: session.telegramId,
          username: session.username,
          firstName: session.firstName,
        },
        user: null,
        error: message,
      },
      { status: status === 401 ? 200 : status },
    )
  }
}
