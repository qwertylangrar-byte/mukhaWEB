'use client'

import { useState } from 'react'

/**
 * Country flag rendered as a real image (flagcdn — hosted build of the
 * lipis/flag-icons GitHub repo), so flags work on every OS unlike emojis.
 * Falls back to the country code if the image fails to load.
 */
export function Flag({
  code,
  className = 'h-6 w-8',
}: {
  code: string
  className?: string
}) {
  const cc = code.trim().toLowerCase()
  const [failed, setFailed] = useState(false)

  if (!/^[a-z]{2}$/.test(cc) || failed) {
    return (
      <span
        className={`flex items-center justify-center rounded-md bg-muted text-[10px] font-bold uppercase text-muted-foreground ${className}`}
        aria-hidden="true"
      >
        {code.slice(0, 2)}
      </span>
    )
  }

  return (
    <img
      src={`https://flagcdn.com/w80/${cc}.png`}
      srcSet={`https://flagcdn.com/w160/${cc}.png 2x`}
      alt=""
      aria-hidden="true"
      loading="lazy"
      onError={() => setFailed(true)}
      className={`rounded-md object-cover shadow-[0_2px_8px_-2px_rgba(0,0,0,0.6)] ring-1 ring-white/10 ${className}`}
    />
  )
}
