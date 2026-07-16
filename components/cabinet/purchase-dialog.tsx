'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Package,
  X,
} from 'lucide-react'
import { postBot, formatUsd } from '@/lib/client-api'
import { Button } from '@/components/ui/button'

export interface Country {
  code: string
  name: string
  price: string
  available: number
}

type Mode = 'single' | 'bulk'

export function PurchaseDialog({
  country,
  onClose,
  onPurchased,
}: {
  country: Country
  onClose: () => void
  onPurchased: () => void
}) {
  const [mode, setMode] = useState<Mode>('single')
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<null | {
    single?: { phoneNumber?: string }
    bulk?: { archiveUrl?: string | null; status?: string }
  }>(null)

  const unit = Number(country.price) || 0
  const total = mode === 'single' ? unit : unit * quantity

  async function buy() {
    setBusy(true)
    setError(null)
    try {
      if (mode === 'single') {
        const res = await postBot<{ purchase?: { phoneNumber?: string } }>(
          'purchase',
          { countryCode: country.code },
        )
        setDone({ single: { phoneNumber: res.purchase?.phoneNumber } })
      } else {
        const res = await postBot<{
          bulkPurchaseId?: string | number
          status?: string
          archiveUrl?: string | null
        }>('purchase-bulk', { countryCode: country.code, quantity })
        // Poll for archive if not ready
        let status = res.status
        let archiveUrl = res.archiveUrl ?? null
        const id = res.bulkPurchaseId
        let attempts = 0
        while (status !== 'SUCCESS' && id != null && attempts < 40) {
          await new Promise((r) => setTimeout(r, 3000))
          const s = await postBot<{
            status?: string
            archiveUrl?: string | null
          }>('bulk-status', { bulkPurchaseId: id })
          status = s.status
          archiveUrl = s.archiveUrl ?? archiveUrl
          attempts += 1
          if (status === 'SUCCESS') break
        }
        setDone({ bulk: { archiveUrl, status } })
      }
      onPurchased()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось купить')
    } finally {
      setBusy(false)
    }
  }

  const maxQty = Math.max(1, country.available)

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Package className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">{country.name}</h2>
              <p className="text-xs text-muted-foreground">
                {formatUsd(country.price)} за аккаунт · в наличии{' '}
                {country.available}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            disabled={busy}
            aria-label="Закрыть"
          >
            <X className="size-4" />
          </Button>
        </div>

        {done ? (
          <div className="mt-6">
            <div className="flex items-center gap-2 rounded-2xl border border-[color-mix(in_oklch,var(--success)_40%,transparent)] bg-[color-mix(in_oklch,var(--success)_12%,transparent)] p-4 text-sm">
              <CheckCircle2 className="size-5 text-[var(--success)]" />
              <span>Покупка выполнена. Данные доступны в разделе покупок.</span>
            </div>
            {done.bulk?.archiveUrl ? (
              <a
                href={done.bulk.archiveUrl}
                className="mt-3 block text-center text-sm text-primary underline underline-offset-2"
              >
                Скачать архив с аккаунтами
              </a>
            ) : done.bulk && done.bulk.status !== 'SUCCESS' ? (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Архив ещё готовится — ссылка появится в разделе «Покупки».
              </p>
            ) : null}
            <Button
              nativeButton={false}
              className="mt-4 h-10 w-full rounded-full"
              render={<Link href="/orders">Перейти к покупкам</Link>}
            />
          </div>
        ) : (
          <>
            <div className="mt-6 flex gap-2 rounded-full border border-border/70 bg-background/50 p-1">
              {(['single', 'bulk'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={
                    'flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ' +
                    (mode === m
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground')
                  }
                >
                  {m === 'single' ? 'Поштучно' : 'Оптом'}
                </button>
              ))}
            </div>

            {mode === 'bulk' ? (
              <div className="mt-5">
                <label
                  htmlFor="qty"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Количество
                </label>
                <input
                  id="qty"
                  type="number"
                  min={1}
                  max={maxQty}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.min(
                        maxQty,
                        Math.max(1, Math.trunc(Number(e.target.value) || 1)),
                      ),
                    )
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-input bg-background/60 px-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                />
              </div>
            ) : null}

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3">
              <span className="text-sm text-muted-foreground">Итого</span>
              <span className="text-lg font-bold tabular-nums text-primary">
                {formatUsd(total)}
              </span>
            </div>

            {error ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-destructive" role="alert">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </p>
            ) : null}

            <Button
              className="mt-5 h-11 w-full rounded-full text-sm"
              onClick={buy}
              disabled={busy}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {busy ? 'Обработка...' : `Купить за ${formatUsd(total)}`}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
