import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Logo />
        <Button
          size="sm"
          nativeButton={false}
          className="rounded-full px-4"
          render={<Link href="/login">Войти через Telegram</Link>}
        />
      </div>
    </header>
  )
}
