import { syncBulk, PurchaseError } from '@/lib/reseller/purchases'
import { apiError, apiOk, requireClient } from '@/lib/reseller/http'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireClient(req)
  if ('response' in auth) return auth.response

  const { id } = await params
  try {
    const purchase = await syncBulk(auth.client.userId, id)
    return apiOk({ purchase })
  } catch (e) {
    if (e instanceof PurchaseError) return apiError(e.status, e.code, e.message)
    const message = e instanceof Error ? e.message : 'Failed to load bulk order.'
    return apiError(500, 'internal_error', message)
  }
}
