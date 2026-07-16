'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Globe,
  KeyRound,
  RefreshCw,
  Send,
  Shield,
  Wallet,
  Zap,
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useLang } from '@/lib/i18n'

const FEATURE_ICONS = [Globe, Zap, KeyRound, RefreshCw, Wallet, Shield]
const STEP_NUMBERS = ['01', '02', '03', '04']

export default function HomePage() {
  const { t } = useLang()
  return (
    <div className="min-h-dvh">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_28%,transparent),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:44px_44px]"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center md:py-32">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-primary" />
            {t.landing.badge}
          </span>
          <h1 className="max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            {t.landing.title}{' '}
            <span className="text-primary">{t.landing.titleAccent}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            {t.landing.subtitle}
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Button
              size="lg"
              nativeButton={false}
              className="h-11 rounded-full px-6 text-sm shadow-[0_0_30px_-6px] shadow-primary/60"
              render={
                <Link href="/login">
                  <Send className="size-4" />
                  {t.nav.loginTg}
                </Link>
              }
            />
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              className="h-11 rounded-full px-6 text-sm"
              render={
                <Link href="/shop">
                  {t.landing.browseCatalog}
                  <ArrowRight className="size-4" />
                </Link>
              }
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
              {t.landing.featuresTitle}
            </h2>
            <p className="mt-3 text-muted-foreground">{t.landing.featuresSub}</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.landing.features.map((f, i) => {
              const Icon = FEATURE_ICONS[i] ?? Globe
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-border/70 bg-card/60 p-6 transition-colors hover:border-primary/40 hover:bg-card"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.text}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
              {t.landing.howTitle}
            </h2>
            <p className="mt-3 text-muted-foreground">{t.landing.howSub}</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.landing.steps.map((s, i) => (
              <div
                key={s.title}
                className="rounded-2xl border border-border/70 bg-card/60 p-6"
              >
                <span className="flex size-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-semibold text-primary">
                  {STEP_NUMBERS[i]}
                </span>
                <h3 className="mt-5 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 px-6 py-16 text-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_70%)]"
            />
            <div className="relative">
              <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
                {t.landing.ctaTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                {t.landing.ctaText}
              </p>
              <div className="mt-8 flex justify-center">
                <Button
                  size="lg"
                  nativeButton={false}
                  className="h-11 rounded-full px-6 text-sm shadow-[0_0_30px_-6px] shadow-primary/60"
                  render={
                    <Link href="/login">
                      <Send className="size-4" />
                      {t.nav.loginTg}
                    </Link>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:px-6">
          <Logo />
          <span>{t.landing.footerSync}</span>
          <span>© {new Date().getFullYear()} MukhaTG</span>
        </div>
      </footer>
    </div>
  )
}
