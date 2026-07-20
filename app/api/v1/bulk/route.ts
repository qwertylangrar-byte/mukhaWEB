import { createBulk, PurchaseError } from '@/lib/reseller/purchases'
import { apiError, apiOk, requireClient } from '@/lib/reseller/http'

export const dynamic = 'force-dynamic'
// Bulk provisioning upstream can take longer than a catalog read.
export const maxDuration = 120

export async function POST(req: Request) {
  const auth = await requireClient(req)
  if ('response' in auth) return auth.response

  let body: { country_code?: string; quantity?: number } = {}
  try {
    body = await req.json()
  } catch {
    return apiError(400, 'invalid_body', 'Request body must be valid JSON.')
  }
  const countryCode = body.country_code?.trim()
  const quantity = Number(body.quantity)
  if (!countryCode)
    return apiError(400, 'missing_country', 'country_code is required.')
  if (!quantity) return apiError(400, 'missing_quantity', 'quantity is required.')

  try {
    const purchase = await createBulk(auth.client.userId, countryCode, quantity)
    return apiOk({ purchase }, 201)
  } catch (e) {
    if (e instanceof PurchaseError) return apiError(e.status, e.code, e.message)
    const message = e instanceof Error ? e.message : 'Bulk purchase failed.'
    return apiError(500, 'internal_error', message)
  }
}
