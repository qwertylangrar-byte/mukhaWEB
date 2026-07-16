'use client'

import { useRef, useState } from 'react'
import useSWR from 'swr'
import {
  AlertCircle,
  ArrowUpRight,
  Bitcoin,
  CheckCircle2,
  CreditCard,
  Loader2,
  Wallet,
} from 'lucide-react'
import { postBot, formatUsd } from '@/lib/client-api'
import { Button } from '@/components/ui/button'

const PROVIDERS = [
  { id: 'cryptobot', name: 'CryptoBot', desc: 'USDT, TON, BTC и другие', icon: Bitcoin },
  { id: 'card', name: 'Банковская карта', desc: 'Visa / Mastercard / МИР', icon: CreditCard },
] as const

const PRESETS = [5, 10, 25, 50, 100]

const PAY_POLL_TOTAL_MS = 300_000
const PAY_POLL_INTERVAL_MS = 5_000

type PayState =
  | { phase: 'idle' }
  | { phase: 'waiting'; url: string | null }
  | { phase: 'success' }
  | { phase: 'error'; message: string }

interface Topup {
  id: string | number
  amount?: string | number | null
  provider?: string | null
  status?: string | null
  createdAt?: string | null
}

export function TopupPanel() {
  const [provider, setProvider] = useState<string>('cryptobot')
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

  async function createTopup() {
    if (amount <= 0) return
    setBusy(true)
    setPay({ phase: 'idle' })
    cancelled.current = false
    try {
      const res = await postBot<{
        topupId?: string | number
        paymentUrl?: string | null
        url?: string | null
        status?: string
      }>('topup', { provider, amount })

      const url = res.paymentUrl ?? res.url ?? null
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
      setPay({ phase: 'waiting', url })

      // Poll payment status
      const id = res.topupId
      if (id != null) {
        const deadline = Date.now() + PAY_POLL_TOTAL_MS
        while (Date.now() < deadline && !cancelled.current) {
          await new Promise((r) => setTimeout(r, PAY_POLL_INTERVAL_MS))
          try {
            const s = await postBot<{ status?: string }>('topup-status', {
              topupId: id,
            })
            const st = String(s.status ?? '').toUpperCase()
            if (st === 'SUCCESS' || st === 'PAID' || st === 'COMPLETED') {
              setPay({ phase: 'success' })
              mutate()
              return
            }
            if (st === 'FAILED' || st === 'CANCELLED' || st === 'EXPIRED') {
              setPay({ phase: 'error', message: 'Платёж не был завершён.' })
              return
            }
          } catch {
            // transient errors tolerated
          }
        }
        if (!cancelled.current) {
          setPay({
            phase: 'error',
            message:
              'Не дождались подтверждения оплаты. Если вы оплатили — баланс зачислится автоматически.',
          })
        }
      }
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
            const Icon = p.icon
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
                    'flex size-10 items-center justify-center rounded-xl ' +
                    (active ? 'bg-primary text-primary-foreground' : 'bg-primary/12 text-primary')
                  }
                >
                  <Icon className="size-5" />
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
                Завершите платёж в открывшемся окне. Баланс обновится автоматически.
              </p>
            </div>
            {pay.url ? (
              <Button
                variant="outline"
                size="sm"
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
            Оплата получена — баланс пополнен.
          </div>
        ) : null}

        {pay.phase === 'error' ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-destructive" role="alert">
            <AlertCircle className="size-4 shrink-0" />
            {pay.message}
          </p>
        ) : null}

        <Button
          className="mt-5 h-11 w-full rounded-full"
          onClick={createTopup}
          disabled={busy || amount <= 0}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
          {busy ? 'Создаём платёж…' : `Пополнить на ${formatUsd(amount)}`}
        </Button>
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
