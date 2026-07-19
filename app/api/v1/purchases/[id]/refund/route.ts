import { refundPurchase, PurchaseError } from '@/lib/reseller/purchases'
import { apiError, apiOk, requireClient } from '@/lib/reseller/http'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireClient(req)
  if ('response' in auth) return auth.response

  const { id } = await params
  try {
    const purchase = await refundPurchase(auth.client.userId, id)
    return apiOk({ status: 'refunded', purchase })
  } catch (e) {
    if (e instanceof PurchaseError) return apiError(e.status, e.code, e.message)
    const message = e instanceof Error ? e.message : 'Refund failed.'
    return apiError(500, 'internal_error', message)
  }
}
