'use client'

import useSWR from 'swr'
import {
  AlertCircle,
  Archive,
  Loader2,
  Phone,
  ShoppingBag,
} from 'lucide-react'
import { postBot, formatUsd } from '@/lib/client-api'
import { Flag } from '@/components/flag'
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

export function OrdersList() {
  const { data, error, isLoading } = useSWR<HistoryResponse>(
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
        <OrderCard key={String(p.id)} purchase={p} />
      ))}
    </div>
  )
}

function OrderCard({ purchase }: { purchase: Purchase }) {
  const status = String(purchase.status ?? '').toUpperCase()
  const isRefunded = status === 'REFUNDED' || status === 'REFUND'
  const isBulk =
    (purchase.quantity ?? 1) > 1 ||
    String(purchase.type ?? '').toLowerCase() === 'bulk' ||
    Boolean(purchase.archiveUrl)

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
          {!isBulk && purchase.countryCode ? (
            <Flag code={purchase.countryCode} className="h-7 w-10" />
          ) : (
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
              {isBulk ? <Archive className="size-5" /> : <Phone className="size-5" />}
            </span>
          )}
          <div>
            <p className="font-semibold">
              {isBulk
                ? purchase.quantity
                  ? `Оптовый заказ · ${purchase.quantity} шт.`
                  : 'Оптовый заказ'
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

      {isBulk && purchase.archiveUrl ? (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
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

    </article>
  )
}
