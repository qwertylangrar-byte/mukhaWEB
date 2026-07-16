import { timingSafeEqual } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { confirmLogin } from '@/lib/login-store'

/** Called by the BOT after the user sends /start web_<code>. */
export async function POST(request: NextRequest) {
  const secret = process.env.BRIDGE_SECRET
  const auth = request.headers.get('authorization') ?? ''
  const provided =
    request.headers.get('x-bridge-secret') ??
    (auth.startsWith('Bearer ') ? auth.slice(7) : '')
  if (
    !secret ||
    provided.length !== secret.length ||
    !timingSafeEqual(Buffer.from(provided), Buffer.from(secret))
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    code?: string
    telegramId?: number
    username?: string
    firstName?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  if (typeof body.code !== 'string' || typeof body.telegramId !== 'number') {
    return NextResponse.json({ error: 'Bad params' }, { status: 400 })
  }

  const ok = confirmLogin(body.code, {
    telegramId: body.telegramId,
    username: body.username,
    firstName: body.firstName,
  })

  if (!ok) {
    return NextResponse.json(
      { error: 'Code not found or expired' },
      { status: 404 },
    )
  }

  return NextResponse.json({ ok: true })
}
