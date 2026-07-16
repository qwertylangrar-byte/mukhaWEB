import Link from 'next/link'
import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold tracking-tight text-primary-foreground shadow-[0_0_20px_-4px] shadow-primary/60',
        className,
      )}
      aria-hidden="true"
    >
      MT
    </span>
  )
}

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight">
        Mukha<span className="text-primary">TG</span>
      </span>
    </Link>
  )
}
