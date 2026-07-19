import { downloadBulk, PurchaseError } from '@/lib/reseller/purchases'
import { apiError, requireClient } from '@/lib/reseller/http'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireClient(req)
  if ('response' in auth) return auth.response

  const { id } = await params
  try {
    const upstream = await downloadBulk(auth.client.userId, id)
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'content-type': 'application/zip',
        'content-disposition': `attachment; filename="bulk-${id}.zip"`,
      },
    })
  } catch (e) {
    if (e instanceof PurchaseError) return apiError(e.status, e.code, e.message)
    const message = e instanceof Error ? e.message : 'Download failed.'
    return apiError(500, 'internal_error', message)
  }
}
