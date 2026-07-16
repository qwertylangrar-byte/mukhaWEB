'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  Wallet,
} from 'lucide-react'
import { postBot, formatUsd } from '@/lib/client-api'
import { Button } from '@/components/ui/button'

const PROVIDERS = [
  {
    id: 'heleket',
    name: 'Heleket',
    desc: 'USDT, BTC, ETH, TON и 100+ монет',
    mark: 'H',
  },
  {
    id: 'cryptobot',
    name: 'CryptoBot',
    desc: 'Оплата внутри Telegram',
    mark: 'CB',
  },
] as const

const PRESETS = [5, 10, 25, 50, 100]

const PAY_POLL_TOTAL_MS = 600_000
const PAY_POLL_INTERVAL_MS = 5_000

type PayState =
  | { phase: 'idle' }
  | { phase: 'waiting'; url: string | null }
  | { phase: 'success'; amount: number }
  | { phase: 'error'; message: string }

interface Topup {
  id: string | number
  amount?: string | number | null
  provider?: string | null
  status?: string | null
  createdAt?: string | null
}

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса')
  return data
}

/**
 * The pending invoice is persisted so that polling survives page
 * navigation/reload (the user usually leaves to pay in Telegram).
 */
const PENDING_KEY = 'mukha_pending_topup'

interface PendingInvoice {
  provider: string
  externalId: string
  url: string | null
  amount: number
}

function savePending(inv: PendingInvoice | null) {
  try {
    if (inv) localStorage.setItem(PENDING_KEY, JSON.stringify(inv))
    else localStorage.removeItem(PENDING_KEY)
  } catch {
    // storage unavailable
  }
}

function loadPending(): PendingInvoice | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as PendingInvoice
    return p && p.externalId ? p : null
  } catch {
    return null
  }
}

export function TopupPanel() {
  const [provider, setProvider] = useState<string>('heleket')
  const [amount, setAmount] = useState<number>(10)
  const [busy, setBusy] = useState(false)
  const [pay, setPay] = useState<PayState>({ phase: 'idle' })
  const cancelled = useRef(false)

  const { data: topupsData, mutate } = useSWR<{ topups?: Topup[] }>(
    'bot/topups',
    () => postBot<{ topups?: Topup[] }>('topups', { limit: 10 }),
    { revalidateOnFocus: false },
  )
  const topups = topupsData?.topups ?? []

  /**
   * Polls the provider until paid. Crediting to the bot DB happens
   * server-side and is idempotent, so re-running after reload is safe.
   */
  async function pollInvoice(inv: PendingInvoice) {
    setPay({ phase: 'waiting', url: inv.url })
    const deadline = Date.now() + PAY_POLL_TOTAL_MS
    while (Date.now() < deadline && !cancelled.current) {
      try {
        const s = await postJson<{ status: string; amount?: number }>(
          '/api/topup/status',
          { provider: inv.provider, externalId: inv.externalId },
        )
        if (s.status === 'PAID') {
          savePending(null)
          setPay({ phase: 'success', amount: s.amount ?? inv.amount })
          mutate()
          globalMutate('me')
          return
        }
        if (s.status === 'FAILED') {
          savePending(null)
          setPay({ phase: 'error', message: 'Платёж не был завершён.' })
          return
        }
      } catch {
        // transient errors tolerated
      }
      await new Promise((r) => setTimeout(r, PAY_POLL_INTERVAL_MS))
    }
    if (!cancelled.current) {
      setPay({
        phase: 'error',
        message:
          'Не дождались подтверждения оплаты. Если вы оплатили — нажмите «Проверить оплату».',
      })
    }
  }

  // On mount: reconcile missed CryptoBot payments (paid while the user was
  // away) and resume polling for a pending invoice from localStorage.
  useEffect(() => {
    cancelled.current = false
    postJson<{ credited: number }>('/api/topup/reconcile', {})
      .then((r) => {
        if (r.credited > 0) {
          mutate()
          globalMutate('me')
        }
      })
      .catch(() => {})
    const pending = loadPending()
    if (pending) void pollInvoice(pending)
    return () => {
      cancelled.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function checkNow() {
    // Manual check: reconcile CryptoBot + re-check pending invoice.
    setBusy(true)
    try {
      const r = await postJson<{ credited: number }>('/api/topup/reconcile', {})
      const pending = loadPending()
      if (pending) {
        const s = await postJson<{ status: string; amount?: number }>(
          '/api/topup/status',
          { provider: pending.provider, externalId: pending.externalId },
        )
        if (s.status === 'PAID') {
          savePending(null)
          setPay({ phase: 'success', amount: s.amount ?? pending.amount })
        }
      }
      if (r.credited > 0 || pending == null) {
        setPay((prev) =>
          prev.phase === 'success'
            ? prev
            : r.credited > 0
              ? { phase: 'success', amount: 0 }
              : prev,
        )
      }
      mutate()
      globalMutate('me')
    } catch {
      // ignore
    } finally {
      setBusy(false)
    }
  }

  async function createTopup() {
    if (amount < 1) return
    setBusy(true)
    setPay({ phase: 'idle' })
    cancelled.current = false
    try {
      const inv = await postJson<{
        provider: string
        externalId: string
        url: string
      }>('/api/topup/create', { provider, amount })

      const pending: PendingInvoice = {
        provider: inv.provider,
        externalId: inv.externalId,
        url: inv.url,
        amount,
      }
      savePending(pending)
      window.open(inv.url, '_blank', 'noopener,noreferrer')
      await pollInvoice(pending)
    } catch (err) {
      setPay({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Не удалось создать платёж',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <section className="rounded-3xl border border-border/70 bg-card/80 p-6">
        <h2 className="text-sm font-semibold text-muted-foreground">Способ оплаты</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {PROVIDERS.map((p) => {
            const active = provider === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                className={
                  'flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ' +
                  (active
                    ? 'border-primary bg-primary/10'
                    : 'border-border/70 bg-background/40 hover:border-primary/40')
                }
                aria-pressed={active}
              >
                <span
                  className={
                    'flex size-10 items-center justify-center rounded-xl text-sm font-bold ' +
                    (active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-primary/12 text-primary')
                  }
                >
                  {p.mark}
                </span>
                <span>
                  <span className="block font-medium">{p.name}</span>
                  <span className="block text-xs text-muted-foreground">{p.desc}</span>
                </span>
              </button>
            )
          })}
        </div>

        <h2 className="mt-6 text-sm font-semibold text-muted-foreground">Сумма (USD)</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(v)}
              className={
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors ' +
                (amount === v
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/70 bg-background/40 text-muted-foreground hover:text-foreground')
              }
            >
              ${v}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <label htmlFor="custom-amount" className="sr-only">
            Своя сумма
          </label>
          <input
            id="custom-amount"
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
            className="h-11 w-full rounded-xl border border-input bg-background/60 px-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
            placeholder="Своя сумма, $"
          />
        </div>

        {pay.phase === 'waiting' ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-background/50 px-4 py-3">
            <Loader2 className="size-5 animate-spin text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Ожидаем оплату…</p>
              <p className="text-xs text-muted-foreground">
                Завершите платёж в открывшемся окне. Баланс в боте и на сайте
                обновится автоматически.
              </p>
            </div>
            {pay.url ? (
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                className="rounded-full bg-transparent"
                render={
                  <a href={pay.url} target="_blank" rel="noopener noreferrer">
                    <ArrowUpRight className="size-4" />
                    Открыть оплату
                  </a>
                }
              />
            ) : null}
          </div>
        ) : null}

        {pay.phase === 'success' ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[color-mix(in_oklch,var(--success)_40%,transparent)] bg-[color-mix(in_oklch,var(--success)_10%,transparent)] px-4 py-3 text-sm">
            <CheckCircle2 className="size-5 text-[var(--success)]" />
            {pay.amount > 0
              ? `Оплата получена — ${formatUsd(pay.amount)} зачислено на баланс.`
              : 'Оплата найдена и зачислена на баланс.'}
          </div>
        ) : null}

        {pay.phase === 'error' ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-destructive" role="alert">
            <AlertCircle className="size-4 shrink-0" />
            {pay.message}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button
            className="h-11 flex-1 rounded-full"
            onClick={createTopup}
            disabled={busy || amount < 1}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
            {busy ? 'Подождите…' : `Пополнить на ${formatUsd(amount)}`}
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-full bg-transparent"
            onClick={checkNow}
            disabled={busy}
          >
            Проверить оплату
          </Button>
        </div>
      </section>

      {topups.length > 0 ? (
        <section className="rounded-3xl border border-border/70 bg-card/80 p-6">
          <h2 className="text-sm font-semibold text-muted-foreground">Последние пополнения</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {topups.map((t) => {
              const st = String(t.status ?? '').toUpperCase()
              const ok = st === 'SUCCESS' || st === 'PAID' || st === 'COMPLETED'
              return (
                <li
                  key={String(t.id)}
                  className="flex items-center justify-between rounded-xl bg-background/40 px-4 py-2.5 text-sm"
                >
                  <span className="text-muted-foreground">
                    {t.createdAt
                      ? new Date(t.createdAt).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : t.provider || '—'}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium tabular-nums">{formatUsd(t.amount)}</span>
                    <span
                      className={
                        'rounded-full px-2 py-0.5 text-xs ' +
                        (ok
                          ? 'bg-[color-mix(in_oklch,var(--success)_15%,transparent)] text-[var(--success)]'
                          : 'bg-muted text-muted-foreground')
                      }
                    >
                      {ok ? 'Оплачено' : st || 'В обработке'}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
