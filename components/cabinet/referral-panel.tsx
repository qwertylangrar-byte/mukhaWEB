'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { AlertCircle, Copy, Gift, Loader2, Users, Wallet } from 'lucide-react'
import { postBot, formatUsd } from '@/lib/client-api'
import { Button } from '@/components/ui/button'
import { useLang } from '@/lib/i18n'

interface ReferralData {
  referralLink?: string | null
  link?: string | null
  referralsCount?: number | null
  count?: number | null
  earned?: string | number | null
  totalEarned?: string | number | null
  percent?: number | null
}

export function ReferralPanel() {
  const { t } = useLang()
  const { data, error, isLoading } = useSWR<ReferralData>(
    'bot/referral',
    () => postBot<ReferralData>('referral'),
    { revalidateOnFocus: false },
  )
  const [copied, setCopied] = useState(false)

  if (isLoading) {
    return (
      <div className="mt-10 flex justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="mt-8 flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
        role="alert"
      >
        <AlertCircle className="size-5 shrink-0 text-destructive" />
        <span>
          {error instanceof Error ? error.message : t.referral.loadFailed}
        </span>
      </div>
    )
  }

  const link = data?.referralLink ?? data?.link ?? ''
  const count = data?.referralsCount ?? data?.count ?? 0
  const earned = data?.earned ?? data?.totalEarned ?? 0

  async function copy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-3xl border border-border/70 bg-card/80 p-5">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <Users className="size-5" />
          </span>
          <div>
            <p className="text-2xl font-bold tabular-nums">{count}</p>
            <p className="text-xs text-muted-foreground">{t.referral.invited}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-3xl border border-border/70 bg-card/80 p-5">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <Wallet className="size-5" />
          </span>
          <div>
            <p className="text-2xl font-bold tabular-nums">{formatUsd(earned)}</p>
            <p className="text-xs text-muted-foreground">{t.referral.earned}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border/70 bg-card/80 p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Gift className="size-4 text-primary" />
          {t.referral.yourLink}
          {data?.percent ? (
            <span className="ml-auto rounded-full bg-primary/12 px-2.5 py-0.5 text-xs font-medium text-primary">
              {t.referral.percentNote(data.percent)}
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={link || t.referral.linkUnavailable}
            aria-label={t.referral.linkLabel}
            className="h-11 flex-1 rounded-xl border border-input bg-background/60 px-4 font-mono text-sm outline-none"
            onFocus={(e) => e.currentTarget.select()}
          />
          <Button
            className="h-11 rounded-full px-5"
            onClick={copy}
            disabled={!link}
          >
            <Copy className="size-4" />
            {copied ? t.common.copied : t.common.copy}
          </Button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {t.referral.shareNote}
        </p>
      </div>
    </div>
  )
}
