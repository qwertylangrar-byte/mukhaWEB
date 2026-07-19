import 'server-only'

import { NextResponse } from 'next/server'
import { authenticateApiKey, type AuthedClient } from './apikey'

export function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export function apiOk(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

/**
 * Authenticate an API request via the `x-api-key` header (or Bearer token).
 * Returns either the client or a ready-to-return 401 response.
 */
export async function requireClient(
  req: Request,
): Promise<{ client: AuthedClient } | { response: NextResponse }> {
  const header =
    req.headers.get('x-api-key') ?? req.headers.get('authorization')
  const client = await authenticateApiKey(header)
  if (!client) {
    return {
      response: apiError(
        401,
        'unauthorized',
        'Missing or invalid API key. Pass it in the x-api-key header.',
      ),
    }
  }
  return { client }
}
