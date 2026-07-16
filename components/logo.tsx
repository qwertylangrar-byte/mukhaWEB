import Link from 'next/link'
import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative flex size-9 items-center justify-center rounded-full shadow-[0_0_24px_-4px] shadow-primary/70 ring-1 ring-white/15',
        className,
      )}
      style={{
        background:
          'linear-gradient(135deg, oklch(0.72 0.16 240) 0%, oklch(0.58 0.18 258) 100%)',
      }}
      aria-hidden="true"
    >
      {/* Telegram paper plane */}
      <svg
        viewBox="0 0 24 24"
        className="size-5 -translate-x-px text-white"
        fill="currentColor"
      >
        <path d="M21.6 3.1c.3-.13.63.13.57.46l-2.7 15.3c-.06.36-.47.53-.77.33l-4.6-3.2-2.3 2.3c-.25.25-.68.13-.77-.2l-.9-3.5-4.9-1.7c-.37-.13-.38-.65-.02-.8L21.6 3.1Zm-2.5 3.1-8.9 6.3 1 .35c.13.05.23.15.27.28l.6 2.3 1.5-1.5-1.3-.9c-.24-.17-.23-.53.02-.68l6.8-6.15Z" />
      </svg>
    </span>
  )
}

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5">
      <LogoMark className="transition-transform group-hover:scale-105" />
      <span className="text-lg font-bold tracking-tight">
        Mukha
        <span className="bg-gradient-to-r from-[oklch(0.72_0.16_240)] to-[oklch(0.62_0.18_255)] bg-clip-text text-transparent">
          TG
        </span>
      </span>
    </Link>
  )
}
