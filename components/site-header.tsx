'use client'

import Link from 'next/link'
import { Logo } from '@/components/logo'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useLang } from '@/lib/i18n'

const SUPPORT_URL = 'https://t.me/MukhaSupport'

export function SiteHeader() {
  const { t } = useLang()
  return (
    <header className="fixed inset-x-0 top-4 z-50 px-3">
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between gap-2 rounded-2xl border border-white/[0.08] bg-[oklch(0.1_0.02_260/0.78)] pl-4 pr-2.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
        <Logo />

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main navigation"
        >
          <Link
            href="/shop"
            className="rounded-full px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-white/[0.07] hover:text-foreground"
          >
            {t.nav.catalog}
          </Link>
          <Link
            href="/about"
            className="rounded-full px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-white/[0.07] hover:text-foreground"
          >
            {t.nav.about}
          </Link>
          <Link
            href="/developers"
            className="rounded-full px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-white/[0.07] hover:text-foreground"
          >
            {t.nav.api}
          </Link>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-white/[0.07] hover:text-foreground"
          >
            {t.nav.support}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="flex h-9 items-center rounded-xl bg-white px-4 text-sm font-medium text-neutral-900 shadow-[0_0_24px_-6px_rgba(255,255,255,0.5)] transition-colors hover:bg-white/90"
          >
            {t.nav.login}
          </Link>
        </div>
      </div>
    </header>
  )
}
