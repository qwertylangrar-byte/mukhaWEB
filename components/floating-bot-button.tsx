import Image from 'next/image'

/**
 * Floating circular logo button pinned to the bottom-right corner.
 * Doubles as a quick link to the Telegram bot and sits above the
 * auto-injected preview badge so the corner looks intentional.
 */
export function FloatingBotButton() {
  return (
    <a
      href="https://t.me/MukhaTGbot"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="MukhaTG Telegram bot"
      className="group fixed bottom-4 right-4 z-[60] flex size-14 items-center justify-center overflow-hidden rounded-full shadow-[0_8px_32px_-6px_rgba(0,0,0,0.6)] ring-1 ring-white/15 transition-transform hover:scale-105 active:scale-95"
    >
      <Image
        src="/logo.png"
        alt="MukhaTG"
        width={56}
        height={56}
        className="size-full object-cover"
      />
      <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-primary/0 transition-all group-hover:ring-primary/60" />
    </a>
  )
}
