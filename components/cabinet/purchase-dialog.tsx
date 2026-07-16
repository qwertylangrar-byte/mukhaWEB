'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  KeyRound,
  Loader2,
  MonitorSmartphone,
  Phone,
  ShieldCheck,
  X,
} from 'lucide-react'
import { postBot, formatUsd } from '@/lib/client-api'
import { Flag } from '@/components/flag'
import { Button } from '@/components/ui/button'
import { useLang } from '@/lib/i18n'

export interface Country {
  code: string
  name: string
  price: string
  available: number
}

type Mode = 'single' | 'bulk'

const CODE_POLL_TOTAL_MS = 120_000
const CODE_POLL_INTERVAL_MS = 5_000

type CodeState =
  | { phase: 'idle' }
  | { phase: 'polling'; secondsLeft: number }
  | { phase: 'success'; code: string }
  | { phase: 'error'; message: string }

function InfoBlock({ mode }: { mode: Mode }) {
  const { t } = useLang()
  const [showRecs, setShowRecs] = useState(false)
  return (
    <div className="mt-5 space-y-3">
      {/* Single: screen recording warning · Bulk: no-refund warning */}
      {mode === 'single' ? (
        <div
          className="flex items-start gap-2.5 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-xs leading-relaxed">
            <span className="font-semibold">{t.purchase.warnRecord}</span>{' '}
            {t.purchase.warnRecordSuffix}
          </p>
        </div>
      ) : (
        <div
          className="flex items-start gap-2.5 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-xs leading-relaxed">
            <span className="font-semibold">{t.purchase.bulkNoRefund}</span>{' '}
            {t.purchase.bulkNoRefundSuffix}
          </p>
        </div>
      )}

      {/* Device warning / bulk format note */}
      {mode === 'single' ? (
        <div className="flex items-start gap-2.5 rounded-2xl border border-border/70 bg-muted/40 px-4 py-3">
          <MonitorSmartphone className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t.purchase.deviceNote1}{' '}
            <span className="font-medium text-foreground">
              {t.purchase.deviceNote2}
            </span>{' '}
            {t.purchase.deviceNote3}{' '}
            <span className="font-medium text-foreground">Nicegram</span>{' '}
            {t.purchase.deviceNote4}
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 rounded-2xl border border-border/70 bg-muted/40 px-4 py-3">
          <MonitorSmartphone className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t.purchase.bulkNote1}{' '}
            <span className="font-medium text-foreground">
              {t.purchase.bulkNote2}
            </span>
            {t.purchase.bulkNote3}{' '}
            <span className="font-medium text-foreground">TData + Session</span>{' '}
            {t.purchase.bulkNote4}
          </p>
        </div>
      )}

      {/* Step-by-step instructions (relevant for single purchases) */}
      {mode === 'single' ? (
        <ol className="space-y-2 rounded-2xl border border-border/70 bg-background/50 p-4">
          {t.purchase.steps.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                {i + 1}
              </span>
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">{s.title}.</span>{' '}
                {s.text}
              </p>
            </li>
          ))}
        </ol>
      ) : null}

      {/* Collapsible security recommendations */}
      <div className="rounded-2xl border border-border/70 bg-background/50">
        <button
          type="button"
          onClick={() => setShowRecs((v) => !v)}
          className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
          aria-expanded={showRecs}
        >
          <ShieldCheck className="size-4 shrink-0 text-primary" />
          <span className="flex-1 text-xs font-medium">
            {t.purchase.recsTitle}
          </span>
          <ChevronDown
            className={
              'size-4 shrink-0 text-muted-foreground transition-transform ' +
              (showRecs ? 'rotate-180' : '')
            }
          />
        </button>
        {showRecs ? (
          <ol className="space-y-2 border-t border-border/70 px-4 py-3">
            {t.purchase.recommendations.map((r, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="text-[11px] font-bold text-primary">
                  {i + 1}.
                </span>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {r}
                </p>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </div>
  )
}

export function PurchaseDialog({
  country,
  onClose,
  onPurchased,
}: {
  country: Country
  onClose: () => void
  onPurchased: () => void
}) {
  const { t } = useLang()
  const [mode, setMode] = useState<Mode>('single')
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState(false)
  const [bulkPreparing, setBulkPreparing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<null | {
    single?: { id?: string | number; phoneNumber?: string | null }
    bulk?: { archiveUrl?: string | null; status?: string }
  }>(null)
  const [codeState, setCodeState] = useState<CodeState>({ phase: 'idle' })
  const [copied, setCopied] = useState<string | null>(null)
  const cancelled = useRef(false)

  useEffect(() => {
    return () => {
      cancelled.current = true
    }
  }, [])

  const unit = Number(country.price) || 0
  const total = mode === 'single' ? unit : unit * quantity

  async function buy() {
    setBusy(true)
    setError(null)
    try {
      if (mode === 'single') {
        const res = await postBot<{
          purchase?: { id?: string | number; phoneNumber?: string | null }
        }>('purchase', { countryCode: country.code })
        setDone({
          single: {
            id: res.purchase?.id,
            phoneNumber: res.purchase?.phoneNumber ?? null,
          },
        })
      } else {
        const res = await postBot<{
          bulkPurchaseId?: string | number
          status?: string
          archiveUrl?: string | null
        }>('purchase-bulk', { countryCode: country.code, quantity })
        // Poll for the archive if not ready yet.
        let status = res.status
        let archiveUrl = res.archiveUrl ?? null
        const id = res.bulkPurchaseId
        if (status !== 'SUCCESS' && id != null) {
          setBulkPreparing(true)
          let attempts = 0
          while (status !== 'SUCCESS' && attempts < 60 && !cancelled.current) {
            await new Promise((r) => setTimeout(r, 3000))
            try {
              const s = await postBot<{
                status?: string
                archiveUrl?: string | null
              }>('bulk-status', { bulkPurchaseId: id })
              status = s.status
              archiveUrl = s.archiveUrl ?? archiveUrl
            } catch {
              // transient errors tolerated
            }
            attempts += 1
          }
          setBulkPreparing(false)
        }
        setDone({ bulk: { archiveUrl, status } })
      }
      onPurchased()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.purchase.buyFailed)
    } finally {
      setBusy(false)
      setBulkPreparing(false)
    }
  }

  async function getCode() {
    const purchaseId = done?.single?.id
    if (purchaseId == null) return
    cancelled.current = false
    const deadline = Date.now() + CODE_POLL_TOTAL_MS
    setCodeState({ phase: 'polling', secondsLeft: CODE_POLL_TOTAL_MS / 1000 })

    const ticker = setInterval(() => {
      const secondsLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setCodeState((prev) =>
        prev.phase === 'polling' ? { phase: 'polling', secondsLeft } : prev,
      )
    }, 1000)

    try {
      while (Date.now() < deadline && !cancelled.current) {
        try {
          const res = await postBot<{ code?: string | null; status?: string }>(
            'request-code',
            { purchaseId },
          )
          if (res.code) {
            setCodeState({ phase: 'success', code: res.code })
            return
          }
          const st = String(res.status ?? '').toUpperCase()
          if (st === 'REFUND' || st === 'ERROR') {
            setCodeState({
              phase: 'error',
              message: t.purchase.codeError,
            })
            return
          }
        } catch {
          // transient errors tolerated
        }
        await new Promise((r) => setTimeout(r, CODE_POLL_INTERVAL_MS))
      }
      if (!cancelled.current) {
        setCodeState({
          phase: 'error',
          message: t.purchase.codeTimeout,
        })
      }
    } finally {
      clearInterval(ticker)
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      // clipboard unavailable
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
      <div
        className={
          'fancy-scroll max-h-[90vh] w-full overflow-y-auto rounded-3xl border border-border/70 bg-card shadow-2xl ' +
          (done ? 'max-w-2xl' : 'max-w-lg')
        }
      >
        {/* Sticky gradient header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border/60 bg-gradient-to-b from-card to-card/80 px-6 py-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl border border-border/60 bg-background/50 p-2">
              <Flag code={country.code} className="h-7 w-10" />
            </span>
            <div>
              <h2 className="text-lg font-semibold leading-tight">
                {country.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t.purchase.stockLine(country.available, formatUsd(country.price))}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            disabled={busy}
            aria-label={t.common.close}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="p-6 pt-5">

        {done ? (
          <div className="mt-6">
            <div className="flex items-center gap-2 rounded-2xl border border-[color-mix(in_oklch,var(--success)_40%,transparent)] bg-[color-mix(in_oklch,var(--success)_12%,transparent)] p-4 text-sm">
              <CheckCircle2 className="size-5 shrink-0 text-[var(--success)]" />
              <span>{t.purchase.purchased}</span>
            </div>

            {/* Single: phone + code retrieval */}
            {done.single ? (
              <div className="mt-3 space-y-3">
                {done.single.phoneNumber ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/50 px-4 py-3">
                    <Phone className="size-4 shrink-0 text-primary" />
                    <span className="flex-1 font-mono text-sm font-semibold tabular-nums">
                      {done.single.phoneNumber}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={() => copyText(done.single?.phoneNumber ?? '')}
                    >
                      <Copy className="size-4" />
                      {copied === done.single.phoneNumber
                        ? t.common.copied
                        : t.common.copy}
                    </Button>
                  </div>
                ) : null}

                <div className="flex items-start gap-2.5 rounded-2xl border border-[color-mix(in_oklch,var(--warning,orange)_40%,transparent)] bg-muted/40 px-4 py-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t.purchase.enterNumberNote}{' '}
                    <span className="font-medium text-foreground">
                      {t.purchase.onlyAfter}
                    </span>
                    {t.purchase.codeSentSuffix}
                  </p>
                </div>

                {codeState.phase === 'success' ? (
                  <div className="flex flex-col items-center gap-3 rounded-3xl border border-[color-mix(in_oklch,var(--success)_40%,transparent)] bg-[color-mix(in_oklch,var(--success)_10%,transparent)] px-4 py-6 text-center">
                    <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--success)]">
                      <KeyRound className="size-3.5" />
                      {t.purchase.loginCode}
                    </span>
                    <span className="font-mono text-4xl font-bold tracking-[0.2em] tabular-nums">
                      {codeState.code}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full bg-transparent"
                      onClick={() => copyText(codeState.code)}
                    >
                      <Copy className="size-4" />
                      {copied === codeState.code
                        ? t.common.copied
                        : t.common.copy}
                    </Button>
                  </div>
                ) : codeState.phase === 'polling' ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/50 px-4 py-3">
                    <Loader2 className="size-5 shrink-0 animate-spin text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {t.purchase.waitingCode}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.purchase.secondsLeft(codeState.secondsLeft)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button className="h-11 w-full rounded-full" onClick={getCode}>
                    <KeyRound className="size-4" />
                    {t.purchase.getCode}
                  </Button>
                )}

                {codeState.phase === 'error' ? (
                  <div
                    className="flex flex-wrap items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
                    role="alert"
                  >
                    <AlertCircle className="size-4 shrink-0 text-destructive" />
                    <span className="flex-1 text-xs leading-relaxed">
                      {codeState.message}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      onClick={getCode}
                    >
                      {t.common.retry}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Bulk: archive link */}
            {done.bulk?.archiveUrl ? (
              <div className="mt-4 flex flex-col items-center gap-3 rounded-3xl border border-[color-mix(in_oklch,var(--success)_40%,transparent)] bg-[color-mix(in_oklch,var(--success)_10%,transparent)] px-4 py-6 text-center">
                <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--success)]">
                  <Archive className="size-3.5" />
                  TData + Session
                </span>
                <Button
                  nativeButton={false}
                  className="h-11 rounded-full px-6"
                  render={
                    <a href={done.bulk.archiveUrl} download>
                      <Download className="size-4" />
                      {t.purchase.downloadArchive}
                    </a>
                  }
                />
              </div>
            ) : done.bulk && done.bulk.status !== 'SUCCESS' ? (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {t.purchase.archiveLater}
              </p>
            ) : null}

            <Button
              nativeButton={false}
              variant="outline"
              className="mt-4 h-10 w-full rounded-full bg-transparent"
              render={<Link href="/orders">{t.purchase.goToOrders}</Link>}
            />
          </div>
        ) : (
          <>
            <div className="mt-5 flex gap-2 rounded-full border border-border/70 bg-background/50 p-1">
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
                  {m === 'single' ? t.purchase.single : t.purchase.bulk}
                </button>
              ))}
            </div>

            <InfoBlock mode={mode} />

            {mode === 'bulk' ? (
              <div className="mt-4">
                <label
                  htmlFor="qty"
                  className="text-sm font-medium text-muted-foreground"
                >
                  {t.purchase.quantity}
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

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                {t.purchase.total}
              </span>
              <span className="text-lg font-bold tabular-nums text-primary">
                {formatUsd(total)}
              </span>
            </div>

            {bulkPreparing ? (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border/70 bg-background/50 px-4 py-3">
                <Loader2 className="size-5 shrink-0 animate-spin text-primary" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {t.purchase.dontClosePage}
                  </span>{' '}
                  {t.purchase.archivePreparingNote}
                </p>
              </div>
            ) : null}

            {error ? (
              <p
                className="mt-3 flex items-center gap-2 text-sm text-destructive"
                role="alert"
              >
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </p>
            ) : null}

            <Button
              className="mt-4 h-11 w-full rounded-full text-sm"
              onClick={buy}
              disabled={busy}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {busy
                ? bulkPreparing
                  ? t.purchase.preparingArchive
                  : t.purchase.processing
                : t.purchase.buyFor(formatUsd(total))}
            </Button>
          </>
        )}
        </div>
      </div>
    </div>
  )
}
