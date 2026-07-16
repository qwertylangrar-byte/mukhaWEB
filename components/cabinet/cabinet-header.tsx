'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { LogOut, Plus, Wallet } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatUsd } from '@/lib/client-api'

const nav = [
  { href: '/shop', label: 'Магазин' },
  { href: '/orders', label: 'Покупки' },
  { href: '/topup', label: 'Пополнение' },
  { href: '/referral', label: 'Рефералы' },
]

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
  const { data } = useSWR('me', fetchMe, { refreshInterval: 30000 })

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Logo href="/shop" />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Разделы">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm transition-colors',
                  pathname.startsWith(item.href)
                    ? 'bg-primary/15 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
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
            className="flex items-center gap-2 rounded-full border border-border bg-card/70 py-1.5 pl-3.5 pr-1.5 text-sm transition-colors hover:border-primary/40"
          >
            <Wallet className="size-4 text-primary" />
            <span className="font-semibold tabular-nums">
              {data?.user ? formatUsd(data.user.balance) : '—'}
            </span>
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Plus className="size-3.5" />
            </span>
          </Link>
          <span className="hidden text-sm text-muted-foreground lg:block">
            {firstName || (username ? `@${username}` : 'Аккаунт')}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            aria-label="Выйти"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav
        className="flex items-center gap-1 overflow-x-auto border-t border-border/40 px-4 py-2 md:hidden"
        aria-label="Разделы"
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
