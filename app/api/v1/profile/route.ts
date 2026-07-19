import { tierById, TIERS } from '@/lib/reseller/pricing'
import { getBalance } from '@/lib/reseller/store'
import { apiOk, requireClient } from '@/lib/reseller/http'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = await requireClient(req)
  if ('response' in auth) return auth.response

  const bal = await getBalance(auth.client.userId)
  const tier = tierById(bal.tier)
  const next = TIERS.find((t) => t.threshold > bal.totalSpent)

  return apiOk({
    balance: bal.balance,
    currency: 'USD',
    total_spent: bal.totalSpent,
    total_topup: bal.totalTopup,
    tier: {
      id: tier.id,
      name: tier.name,
      discount_percent: tier.discountPercent,
    },
    next_tier: next
      ? {
          id: next.id,
          name: next.name,
          discount_percent: next.discountPercent,
          spend_needed: Math.round((next.threshold - bal.totalSpent) * 100) / 100,
        }
      : null,
  })
}
