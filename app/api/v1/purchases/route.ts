import {
  createSingle,
  listPurchases,
  PurchaseError,
} from '@/lib/reseller/purchases'
import { apiError, apiOk, requireClient } from '@/lib/reseller/http'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  const auth = await requireClient(req)
  if ('response' in auth) return auth.response

  let body: { country_code?: string } = {}
  try {
    body = await req.json()
  } catch {
    return apiError(400, 'invalid_body', 'Request body must be valid JSON.')
  }
  const countryCode = body.country_code?.trim()
  if (!countryCode)
    return apiError(400, 'missing_country', 'country_code is required.')

  try {
    const purchase = await createSingle(auth.client.userId, countryCode)
    return apiOk({ purchase }, 201)
  } catch (e) {
    if (e instanceof PurchaseError) return apiError(e.status, e.code, e.message)
    const message = e instanceof Error ? e.message : 'Purchase failed.'
    return apiError(500, 'internal_error', message)
  }
}

export async function GET(req: Request) {
  const auth = await requireClient(req)
  if ('response' in auth) return auth.response

  const url = new URL(req.url)
  const page = Number(url.searchParams.get('page') ?? '1') || 1
  const pageSize = Number(url.searchParams.get('page_size') ?? '20') || 20
  const status = url.searchParams.get('status') ?? undefined

  const result = await listPurchases(auth.client.userId, {
    page,
    pageSize,
    status: status ? status.toUpperCase() : undefined,
  })
  return apiOk(result)
}
