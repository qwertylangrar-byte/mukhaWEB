'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { LogOut, Plus, Wallet } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language-switcher'
import { cn } from '@/lib/utils'
import { formatUsd } from '@/lib/client-api'
import { useLang } from '@/lib/i18n'

interface MeResponse {
  user: { balance?: string } | null
}

async function fetchMe(): Promise<MeResponse> {
  const res = await fetch('/api/me', { cache: 'no-store' })
  if (!res.ok) throw new Error('unauthorized')
  return res.json()
}

export function CabinetHeader({
  firstName,
  username,
}: {
  firstName?: string
  username?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLang()
  const { data } = useSWR('me', fetchMe, { refreshInterval: 30000 })

  const nav = [
    { href: '/shop', label: t.nav.shop },
    { href: '/orders', label: t.nav.orders },
    { href: '/topup', label: t.nav.topup },
    { href: '/referral', label: t.nav.referral },
    { href: '/about', label: t.nav.about },
    { href: '/developers', label: t.nav.api },
  ]

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[oklch(0.13_0.042_265/0.75)] shadow-[0_8px_32px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Logo href="/shop" />
          <nav
            className="hidden items-center gap-0.5 rounded-full border border-white/[0.06] bg-white/[0.03] p-1 md:flex"
            aria-label={t.nav.sections}
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition-colors',
                  pathname.startsWith(item.href)
                    ? 'bg-primary font-medium text-primary-foreground shadow-[0_0_16px_-4px] shadow-primary/60'
                    : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/topup"
            className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] py-1.5 pl-3.5 pr-1.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:border-primary/50 hover:bg-primary/10"
          >
            <Wallet className="size-4 text-primary" />
            <span className="font-semibold tabular-nums">
              {data?.user ? formatUsd(data.user.balance) : '—'}
            </span>
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_12px_-2px] shadow-primary/60">
              <Plus className="size-3.5" />
            </span>
          </Link>
          <span className="hidden text-sm text-muted-foreground lg:block">
            {firstName || (username ? `@${username}` : t.common.account)}
          </span>
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            aria-label={t.common.logout}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav
        className="fancy-scroll flex items-center gap-1 overflow-x-auto border-t border-border/40 px-4 py-2 md:hidden"
        aria-label={t.nav.sections}
      >
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm',
              pathname.startsWith(item.href)
                ? 'bg-primary/15 font-medium text-primary'
                : 'text-muted-foreground',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
