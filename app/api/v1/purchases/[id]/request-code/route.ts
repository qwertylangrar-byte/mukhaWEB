import { waitForCode, PurchaseError } from '@/lib/reseller/purchases'
import { apiError, apiOk, requireClient } from '@/lib/reseller/http'

export const dynamic = 'force-dynamic'
// Allow the full long-poll window (Vercel caps Fluid/Node functions; 120s max)
export const maxDuration = 120

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireClient(req)
  if ('response' in auth) return auth.response

  const { id } = await params

  let body: { callback_url?: string } = {}
  try {
    body = await req.json()
  } catch {
    // body is optional
  }

  const callbackUrl = body.callback_url?.trim()

  // Async mode: respond immediately, deliver the code to the webhook later.
  if (callbackUrl) {
    ;(async () => {
      try {
        const result = await waitForCode(auth.client.userId, id, 115000)
        const payload = result.received
          ? { event: 'purchase.code_received', data: result.purchase }
          : { event: 'purchase.code_pending', data: { id, retry_after: result.retry_after } }
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 5000)
        await fetch(callbackUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ...payload, sent_at: new Date().toISOString() }),
          signal: controller.signal,
        }).catch(() => {})
        clearTimeout(timer)
      } catch {
        // swallow — client can still poll
      }
    })()

    return apiOk(
      {
        status: 'accepted',
        message:
          'Code request accepted. The code will be delivered to your callback_url when it arrives.',
        purchase_id: id,
      },
      202,
    )
  }

  // Sync long-poll mode: hold the request open until the code arrives (max ~115s).
  try {
    const result = await waitForCode(auth.client.userId, id, 115000)
    if (result.received) {
      return apiOk({
        status: 'success',
        code: result.purchase.code,
        password: result.purchase.password,
        purchase: result.purchase,
      })
    }
    return apiOk(
      {
        status: 'pending',
        message: 'Code has not arrived yet. Please retry.',
        retry_after: result.retry_after,
      },
      202,
    )
  } catch (e) {
    if (e instanceof PurchaseError) return apiError(e.status, e.code, e.message)
    const message = e instanceof Error ? e.message : 'Failed to request code.'
    return apiError(500, 'internal_error', message)
  }
}
