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
    <header className="fixed inset-x-0 top-4 z-50 px-3">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 rounded-2xl border border-white/[0.08] bg-[oklch(0.1_0.02_260/0.78)] pl-4 pr-2.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
        <Logo href="/shop" />

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label={t.nav.sections}
        >
          {nav.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-white/[0.09] text-foreground'
                    : 'text-foreground/70 hover:bg-white/[0.07] hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

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
          <span className="hidden text-sm text-muted-foreground xl:block">
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

      {/* Mobile / tablet nav — a second floating pill with the sections */}
      <nav
        className="mx-auto mt-2 flex w-full max-w-6xl items-center gap-1 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[oklch(0.1_0.02_260/0.78)] px-2 py-1.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.9)] backdrop-blur-2xl lg:hidden [&::-webkit-scrollbar]:hidden"
        aria-label={t.nav.sections}
      >
        {nav.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-white/[0.09] text-foreground'
                  : 'text-foreground/70 hover:bg-white/[0.07] hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
