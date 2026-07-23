import Link from 'next/link'
import { cn } from '@/lib/utils'

/** The Mukha mark: a sparkle + two slanted rounded bars, drawn as crisp SVG. */
export function LogoGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M21 22 Q21 36 35 36 Q21 36 21 50 Q21 36 7 36 Q21 36 21 22 Z" />
      <rect
        x="36"
        y="36"
        width="16"
        height="46"
        rx="8"
        transform="rotate(20 44 59)"
      />
      <rect
        x="62"
        y="28"
        width="16"
        height="46"
        rx="8"
        transform="rotate(20 70 51)"
      />
    </svg>
  )
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative flex size-9 items-center justify-center overflow-hidden rounded-full bg-[oklch(0.13_0.02_262)] text-white shadow-[0_0_24px_-4px] shadow-primary/70 ring-1 ring-white/15',
        className,
      )}
    >
      <LogoGlyph className="size-[62%]" />
    </span>
  )
}

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5">
      <LogoMark className="transition-transform group-hover:scale-105" />
      <span className="font-serif text-base font-light tracking-tight">
        Mukha
        <span className="bg-gradient-to-r from-[oklch(0.72_0.16_240)] to-[oklch(0.62_0.18_255)] bg-clip-text text-transparent">
          TG
        </span>
      </span>
    </Link>
  )
}
