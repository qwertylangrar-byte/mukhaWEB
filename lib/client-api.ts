'use client'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function postBot<T = Record<string, unknown>>(
  action: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch(`/api/bot/${action}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  let data: Record<string, unknown> = {}
  try {
    data = (await res.json()) as Record<string, unknown>
  } catch {
    // ignore
  }
  if (!res.ok) {
    throw new ApiError(
      res.status,
      (typeof data.error === 'string' && data.error) ||
        `Ошибка запроса (${res.status})`,
    )
  }
  return data as T
}

export const swrPost =
  <T,>(action: string, body: Record<string, unknown> = {}) =>
  () =>
    postBot<T>(action, body)

export function formatUsd(value: string | number | null | undefined): string {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return '$0.00'
  return `$${n.toFixed(2)}`
}
