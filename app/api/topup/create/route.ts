import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { heleketCreate, cryptobotCreate, PaymentError } from '@/lib/payments'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  let body: { provider?: string; amount?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
  }

  const amount = Number(body.amount)
  if (!Number.isFinite(amount) || amount < 1 || amount > 10000) {
    return NextResponse.json(
      { error: 'Сумма должна быть от $1 до $10 000' },
      { status: 400 },
    )
  }

  const origin = new URL(request.url).origin

  try {
    const invoice =
      body.provider === 'cryptobot'
        ? await cryptobotCreate(session.telegramId, amount)
        : await heleketCreate(session.telegramId, amount, origin)
    return NextResponse.json(invoice)
  } catch (err) {
    if (err instanceof PaymentError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json(
      { error: 'Не удалось создать платёж' },
      { status: 500 },
    )
  }
}
