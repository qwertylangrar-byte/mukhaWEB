import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative flex size-9 items-center justify-center overflow-hidden rounded-full shadow-[0_0_24px_-4px] shadow-primary/70 ring-1 ring-white/15',
        className,
      )}
    >
      <Image
        src="/logo.png"
        alt="MukhaTG"
        width={36}
        height={36}
        className="size-full object-cover"
        priority
      />
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
