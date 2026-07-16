'use client'

import { useState } from 'react'
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
import { localizedCountryName, useLang } from '@/lib/i18n'

interface Purchase {
  id: string | number
  phoneNumber?: string | null
  countryName?: string | null
  countryCode?: string | null
  price?: string | number | null
  status?: string | null
  createdAt?: string | null
  archiveUrl?: string | null
  bulkPurchaseId?: string | number | null
  quantity?: number | null
  type?: string | null
}

interface HistoryResponse {
  purchases?: Purchase[]
  history?: Purchase[]
}

export function OrdersList() {
  const { t } = useLang()
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
        <span>
          {error instanceof Error ? error.message : t.orders.loadFailed}
        </span>
      </div>
    )
  }

  if (purchases.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-border/70 bg-card/60 p-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <ShoppingBag className="size-6" />
        </span>
        <p className="font-medium">{t.orders.emptyTitle}</p>
        <p className="text-sm text-muted-foreground">{t.orders.emptyText}</p>
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
  const { t, locale, lang } = useLang()
  const status = String(purchase.status ?? '').toUpperCase()
  const isRefunded = status === 'REFUNDED' || status === 'REFUND'
  const isBulk =
    (purchase.quantity ?? 1) > 1 ||
    String(purchase.type ?? '').toLowerCase() === 'bulk' ||
    Boolean(purchase.archiveUrl)

  const created = purchase.createdAt
    ? new Date(purchase.createdAt).toLocaleString(locale, {
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
                  ? t.orders.bulkOrderQty(purchase.quantity)
                  : t.orders.bulkOrder
                : purchase.phoneNumber || t.orders.accountFallback}
            </p>
            <p className="text-xs text-muted-foreground">
              {[
                localizedCountryName(
                  lang,
                  purchase.countryCode,
                  purchase.countryName || purchase.countryCode || '',
                ),
                created,
              ]
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
            {isRefunded ? t.orders.refunded : t.orders.active}
          </span>
        </div>
      </div>

      {isBulk ? <BulkArchiveActions purchase={purchase} /> : null}
    </article>
  )
}

/**
 * Archive download for bulk orders in history. If the stored link is
 * missing/stale, a fresh one is requested from the bot via bulk-status.
 * Archives are only kept for a limited time (~2–3 days) after purchase.
 */
function BulkArchiveActions({ purchase }: { purchase: Purchase }) {
  const { t } = useLang()
  const [archiveUrl, setArchiveUrl] = useState<string | null>(
    purchase.archiveUrl ?? null,
  )
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const bulkId = purchase.bulkPurchaseId ?? purchase.id

  async function fetchArchive() {
    setLoading(true)
    setMessage(null)
    try {
      const res = await postBot<{ status?: string; archiveUrl?: string | null }>(
        'bulk-status',
        { bulkPurchaseId: bulkId },
      )
      if (res.archiveUrl) {
        setArchiveUrl(res.archiveUrl)
      } else if (String(res.status ?? '').toUpperCase() === 'PENDING') {
        setMessage(t.orders.archivePending)
      } else {
        setMessage(t.orders.archiveGone)
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t.orders.archiveFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        {archiveUrl ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            className="rounded-full bg-transparent"
            render={
              <a href={archiveUrl} download>
                <Archive className="size-4" />
                {t.orders.downloadArchive}
              </a>
            }
          />
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-transparent"
            onClick={fetchArchive}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Archive className="size-4" />
            )}
            {t.orders.getArchive}
          </Button>
        )}
        <span className="text-xs text-muted-foreground">
          {t.orders.archiveTtl}
        </span>
      </div>
      {message ? (
        <p className="mt-2 text-xs text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  )
}
