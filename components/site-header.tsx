'use client'

import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useLang } from '@/lib/i18n'

export function SiteHeader() {
  const { t } = useLang()
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[oklch(0.13_0.042_265/0.75)] shadow-[0_8px_32px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Logo />
        <div className="flex items-center gap-1.5 sm:gap-3">
          <Link
            href="/about"
            className="rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            {t.nav.about}
          </Link>
          <Button
            size="sm"
            nativeButton={false}
            className="rounded-full px-4 shadow-[0_0_20px_-6px] shadow-primary/60"
            render={<Link href="/login">{t.nav.loginTg}</Link>}
          />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
