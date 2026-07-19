import { getPurchase } from '@/lib/reseller/purchases'
import { apiError, apiOk, requireClient } from '@/lib/reseller/http'

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireClient(req)
  if ('response' in auth) return auth.response

  const { id } = await params
  const purchase = await getPurchase(auth.client.userId, id)
  if (!purchase) return apiError(404, 'not_found', 'Purchase not found.')
  return apiOk({ purchase })
}
