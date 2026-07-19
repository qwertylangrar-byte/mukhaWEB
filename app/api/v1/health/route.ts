import { apiOk } from '@/lib/reseller/http'

export const dynamic = 'force-dynamic'

export async function GET() {
  return apiOk({ status: 'ok', time: new Date().toISOString() })
}
