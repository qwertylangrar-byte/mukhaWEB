import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import { gmt, GmtError } from '@/lib/getmytg'

/** Proxies the bulk purchase ZIP archive from GetMyTG using the site's API key. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { id } = await params
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Некорректный ID' }, { status: 400 })
  }

  try {
    const upstream = await gmt.downloadBulk(id)
    return new Response(upstream.body, {
      headers: {
        'content-type': 'application/zip',
        'content-disposition': `attachment; filename="accounts-${id}.zip"`,
        'cache-control': 'no-store',
      },
    })
  } catch (err) {
    if (err instanceof GmtError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
