import { getCatalog } from '@/lib/reseller/catalog'
import { tierById } from '@/lib/reseller/pricing'
import { getBalance } from '@/lib/reseller/store'
import { apiError, apiOk, requireClient } from '@/lib/reseller/http'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(req: Request) {
  const auth = await requireClient(req)
  if ('response' in auth) return auth.response

  try {
    const bal = await getBalance(auth.client.userId)
    const discount = tierById(bal.tier).discountPercent
    const { items } = await getCatalog(discount)
    return apiOk({
      items,
      count: items.length,
      tier: bal.tier,
      discount_percent: discount,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load catalog.'
    return apiError(502, 'upstream_error', message)
  }
}
