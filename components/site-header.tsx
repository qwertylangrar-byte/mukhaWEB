import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[oklch(0.13_0.042_265/0.75)] shadow-[0_8px_32px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Logo />
        <Button
          size="sm"
          nativeButton={false}
          className="rounded-full px-4 shadow-[0_0_20px_-6px] shadow-primary/60"
          render={<Link href="/login">Войти через Telegram</Link>}
        />
      </div>
    </header>
  )
}
