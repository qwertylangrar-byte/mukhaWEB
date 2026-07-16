'use client'

import { useLang } from '@/lib/i18n'

type Section = 'shop' | 'orders' | 'topup' | 'referral'

/** Localized h1 + subtitle for cabinet pages (server wrappers stay static). */
export function PageHeading({
  section,
  className,
}: {
  section: Section
  className?: string
}) {
  const { t } = useLang()
  const { heading, sub } = t[section]
  return (
    <div className={className}>
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        {heading}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
    </div>
  )
}
