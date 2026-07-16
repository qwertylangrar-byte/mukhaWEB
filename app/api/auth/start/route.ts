import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { createPendingLogin } from '@/lib/login-store'

export async function POST() {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME
  if (!botUsername) {
    return NextResponse.json(
      { error: 'TELEGRAM_BOT_USERNAME не настроен' },
      { status: 503 },
    )
  }
  const code = randomBytes(24).toString('base64url')
  createPendingLogin(code)
  return NextResponse.json({
    code,
    link: `https://t.me/${botUsername.replace(/^@/, '')}?start=web_${code}`,
  })
}
