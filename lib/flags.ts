import 'server-only'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'

/**
 * Site feature blocks ("технические работы") controlled from the admin
 * panel. Stored in a local JSON file so they survive dev-server restarts.
 * All features default to enabled when the file is missing.
 */

export interface FeatureFlags {
  /** Single account purchases */
  purchases: boolean
  /** Bulk purchases */
  bulk: boolean
  /** Balance top-ups */
  topup: boolean
  /** Login code retrieval */
  codes: boolean
  /** Message shown to users when a feature is blocked */
  message: string
}

export const DEFAULT_FLAGS: FeatureFlags = {
  purchases: true,
  bulk: true,
  topup: true,
  codes: true,
  message:
    'Ведутся технические работы. Функция временно недоступна — попробуйте позже.',
}

const FILE = path.join(process.cwd(), '.data', 'flags.json')

let cache: FeatureFlags | null = null

export async function getFlags(): Promise<FeatureFlags> {
  if (cache) return cache
  try {
    const raw = await readFile(FILE, 'utf8')
    const parsed = JSON.parse(raw) as Partial<FeatureFlags>
    cache = { ...DEFAULT_FLAGS, ...parsed }
  } catch {
    cache = { ...DEFAULT_FLAGS }
  }
  return cache
}

export async function setFlags(update: Partial<FeatureFlags>): Promise<FeatureFlags> {
  const current = await getFlags()
  const next: FeatureFlags = {
    ...current,
    ...update,
    message:
      typeof update.message === 'string' && update.message.trim()
        ? update.message.trim().slice(0, 300)
        : current.message,
  }
  await mkdir(path.dirname(FILE), { recursive: true })
  await writeFile(FILE, JSON.stringify(next, null, 2), 'utf8')
  cache = next
  return next
}

/** Throwable helper: rejects with 503 + admin message when feature is off. */
export async function assertFeatureEnabled(
  feature: keyof Omit<FeatureFlags, 'message'>,
): Promise<void> {
  const flags = await getFlags()
  if (!flags[feature]) {
    const err = new Error(flags.message) as Error & { status?: number }
    err.status = 503
    throw err
  }
}
