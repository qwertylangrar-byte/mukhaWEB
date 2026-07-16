'use client'

import { useRef, useState } from 'react'
import useSWR from 'swr'
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  Phone,
  RotateCcw,
  ShoppingBag,
} from 'lucide-react'
import { postBot, formatUsd } from '@/lib/client-api'
import { Button } from '@/components/ui/button'

interface Purchase {
  id: string | number
  phoneNumber?: string | null
  countryName?: string | null
  countryCode?: string | null
  price?: string | number | null
  status?: string | null
  createdAt?: string | null
  archiveUrl?: string | null
  quantity?: number | null
  type?: string | null
}

interface HistoryResponse {
  purchases?: Purchase[]
  history?: Purchase[]
}

const CODE_POLL_TOTAL_MS = 120_000
const CODE_POLL_INTERVAL_MS = 4_000

type CodeState =
  | { phase: 'idle' }
  | { phase: 'polling'; secondsLeft: number }
  | { phase: 'success'; code: string }
  | { phase: 'error'; message: string }

function extractCode(data: Record<string, unknown>): string | null {
  const direct = data.code ?? data.loginCode ?? data.confirmationCode
  if (typeof direct === 'string' && direct.trim() && direct !== 'PENDING') {
    return direct.trim()
  }
  if (typeof direct === 'number') return String(direct)
  const nested = data.result as Record<string, unknown> | undefined
  if (nested && typeof nested === 'object') {
    const c = nested.code
    if (typeof c === 'string' && c.trim() && c !== 'PENDING') return c.trim()
    if (typeof c === 'number') return String(c)
  }
  return null
}

function isPending(data: Record<string, unknown>): boolean {
  const status = String(data.status ?? '').toUpperCase()
  const code = data.code
  return (
    status === 'PENDING' ||
    status === 'WAITING' ||
    code === 'PENDING' ||
    code == null
  )
}

export function OrdersList() {
  const { data, error, isLoading, mutate } = useSWR<HistoryResponse>(
    'bot/history',
    () => postBot<HistoryResponse>('history', { limit: 100 }),
    { revalidateOnFocus: false },
  )

  const purchases = data?.purchases ?? data?.history ?? []

  if (isLoading) {
    return (
      <div className="mt-10 flex justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-8 flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm" role="alert">
        <AlertCircle className="size-5 shrink-0 text-destructive" />
        <span>{error instanceof Error ? error.message : 'Не удалось загрузить покупки'}</span>
      </div>
    )
  }

  if (purchases.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-border/70 bg-card/60 p-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <ShoppingBag className="size-6" />
        </span>
        <p className="font-medium">Покупок пока нет</p>
        <p className="text-sm text-muted-foreground">
          Выберите страну в магазине — аккаунт появится здесь сразу после покупки.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {purchases.map((p) => (
        <OrderCard key={String(p.id)} purchase={p} onChanged={() => mutate()} />
      ))}
    </div>
  )
}

function OrderCard({
  purchase,
  onChanged,
}: {
  purchase: Purchase
  onChanged: () => void
}) {
  const [codeState, setCodeState] = useState<CodeState>({ phase: 'idle' })
  const [refunding, setRefunding] = useState(false)
  const [refundMsg, setRefundMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const cancelled = useRef(false)

  const status = String(purchase.status ?? '').toUpperCase()
  const isRefunded = status === 'REFUNDED' || status === 'REFUND'
  const isBulk =
    (purchase.quantity ?? 1) > 1 ||
    String(purchase.type ?? '').toLowerCase() === 'bulk' ||
    Boolean(purchase.archiveUrl)

  async function getCode() {
    cancelled.current = false
    const deadline = Date.now() + CODE_POLL_TOTAL_MS
    setCodeState({ phase: 'polling', secondsLeft: CODE_POLL_TOTAL_MS / 1000 })

    while (Date.now() < deadline && !cancelled.current) {
      try {
        const res = await postBot<Record<string, unknown>>('request-code', {
          purchaseId: purchase.id,
        })
        const code = extractCode(res)
        if (code) {
          setCodeState({ phase: 'success', code })
          return
        }
        if (!isPending(res)) {
          // Unknown non-pending answer without a code — keep trying until deadline
        }
      } catch (err) {
        // Transient errors during polling are tolerated; hard-fail on auth errors
        if (
          err instanceof Error &&
          'status' in err &&
          (err as { status: number }).status === 401
        ) {
          setCodeState({ phase: 'error', message: 'Сессия истекла — войдите заново.' })
          return
        }
      }

      const secondsLeft = Math.max(0, Math.round((deadline - Date.now()) / 1000))
      setCodeState({ phase: 'polling', secondsLeft })
      await new Promise((r) => setTimeout(r, CODE_POLL_INTERVAL_MS))
    }

    if (!cancelled.current) {
      setCodeState({
        phase: 'error',
        message:
          'Код не пришёл за 120 секунд. Запросите код в приложении Telegram ещё раз и повторите.',
      })
    }
  }

  function stopPolling() {
    cancelled.current = true
    setCodeState({ phase: 'idle' })
  }

  async function refund() {
    if (!window.confirm('Оформить возврат по этой покупке?')) return
    setRefunding(true)
    setRefundMsg(null)
    try {
      await postBot('refund', { purchaseId: purchase.id })
      setRefundMsg('Возврат оформлен, средства зачислены на баланс.')
      onChanged()
    } catch (err) {
      setRefundMsg(err instanceof Error ? err.message : 'Не удалось оформить возврат')
    } finally {
      setRefunding(false)
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  const created = purchase.createdAt
    ? new Date(purchase.createdAt).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <article className="rounded-3xl border border-border/70 bg-card/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
            {isBulk ? <Archive className="size-5" /> : <Phone className="size-5" />}
          </span>
          <div>
            <p className="font-semibold">
              {isBulk
                ? `Опт · ${purchase.quantity ?? '—'} шт.`
                : purchase.phoneNumber || 'Аккаунт'}
            </p>
            <p className="text-xs text-muted-foreground">
              {[purchase.countryName || purchase.countryCode, created]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {purchase.price != null ? (
            <span className="text-sm font-bold tabular-nums text-primary">
              {formatUsd(purchase.price)}
            </span>
          ) : null}
          <span
            className={
              'rounded-full px-2.5 py-0.5 text-xs font-medium ' +
              (isRefunded
                ? 'bg-muted text-muted-foreground'
                : 'bg-[color-mix(in_oklch,var(--success)_15%,transparent)] text-[var(--success)]')
            }
          >
            {isRefunded ? 'Возврат' : 'Активна'}
          </span>
        </div>
      </div>

      {/* Code area */}
      {!isRefunded && !isBulk ? (
        <div className="mt-4">
          {codeState.phase === 'success' ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[color-mix(in_oklch,var(--success)_40%,transparent)] bg-[color-mix(in_oklch,var(--success)_10%,transparent)] px-4 py-3">
              <CheckCircle2 className="size-5 text-[var(--success)]" />
              <span className="text-sm text-muted-foreground">Код входа:</span>
              <span className="font-mono text-xl font-bold tracking-widest">
                {codeState.code}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto rounded-full"
                onClick={() => copyCode(codeState.code)}
              >
                <Copy className="size-4" />
                {copied ? 'Скопировано' : 'Копировать'}
              </Button>
            </div>
          ) : codeState.phase === 'polling' ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-background/50 px-4 py-3">
              <Loader2 className="size-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Ждём код от Telegram…</p>
                <p className="text-xs text-muted-foreground">
                  Осталось до {codeState.secondsLeft} с. Не закрывайте страницу.
                </p>
              </div>
              <Button variant="ghost" size="sm" className="rounded-full" onClick={stopPolling}>
                Отмена
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" className="rounded-full" onClick={getCode}>
                <KeyRound className="size-4" />
                Получить код
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-transparent"
                onClick={refund}
                disabled={refunding}
              >
                {refunding ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RotateCcw className="size-4" />
                )}
                Возврат
              </Button>
            </div>
          )}
          {codeState.phase === 'error' ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm" role="alert">
              <AlertCircle className="size-4 shrink-0 text-destructive" />
              <span className="flex-1">{codeState.message}</span>
              <Button size="sm" variant="ghost" className="rounded-full" onClick={getCode}>
                Повторить
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {isBulk && purchase.archiveUrl ? (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-transparent"
            render={
              <a href={purchase.archiveUrl} download>
                <Archive className="size-4" />
                Скачать архив
              </a>
            }
          />
        </div>
      ) : null}

      {refundMsg ? (
        <p className="mt-3 text-sm text-muted-foreground">{refundMsg}</p>
      ) : null}
    </article>
  )
}
