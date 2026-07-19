import { invoiceIdFromOrderId, reconcileInvoice } from '@/lib/reseller/topup'

export const dynamic = 'force-dynamic'

/**
 * Heleket payment callback for API-client balance top-ups. We don't trust the
 * body — we re-check the invoice against Heleket inside reconcileInvoice before
 * crediting, so a spoofed callback can't add funds.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return new Response('bad request', { status: 400 })
  }

  const orderId = typeof body.order_id === 'string' ? body.order_id : ''
  const invoiceId = invoiceIdFromOrderId(orderId)
  if (invoiceId) {
    try {
      await reconcileInvoice(invoiceId)
    } catch {
      // acknowledge anyway; the dashboard poll will reconcile later
    }
  }
  return new Response('ok', { status: 200 })
}
