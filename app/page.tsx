'use client'

import Image from 'next/image'
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
import { ShopCatalog } from '@/components/cabinet/shop-catalog'
import { useLang } from '@/lib/i18n'

const FEATURE_ICONS = [Globe, Zap, KeyRound, RefreshCw, Wallet, Shield]

export default function HomePage() {
  const { t } = useLang()

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:44px_44px]"
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-8 md:px-6 md:pt-28">
          <div className="flex flex-col items-center text-center">
            <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
              <span className="size-2 rounded-full bg-primary shadow-[0_0_12px_2px] shadow-primary/60" />
              {t.landing.badge}
            </span>
            <h1 className="max-w-4xl text-balance text-5xl font-extralight leading-[1.05] tracking-tight md:text-7xl">
              {t.landing.heroTitle1}
              <br />
              <span className="bg-gradient-to-b from-foreground to-foreground/55 bg-clip-text text-transparent">
                {t.landing.heroTitle2}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base font-light leading-relaxed text-muted-foreground md:text-lg">
              {t.landing.heroSubtitle}
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
                className="h-11 rounded-full border-white/12 bg-white/[0.03] px-6 text-sm backdrop-blur-sm"
                render={
                  <Link href="/shop">
                    {t.landing.browseCatalog}
                    <ArrowRight className="size-4" />
                  </Link>
                }
              />
            </div>
          </div>

          {/* Step cards */}
          <div className="mt-16 grid gap-x-5 gap-y-9 sm:grid-cols-3">
            <StepCard index={1} image="/sky-1.png" label={t.landing.stepChoose}>
              <span className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-neutral-900 shadow-lg">
                {t.landing.buyAccount}
              </span>
            </StepCard>

            <StepCard index={2} image="/sky-2.png" label={t.landing.stepGetCode}>
              <div className="flex gap-2">
                {['4', '*', '*', '1'].map((ch, i) => (
                  <span
                    key={i}
                    className="flex size-11 items-center justify-center rounded-xl bg-white text-xl font-semibold text-neutral-900 shadow-lg"
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </StepCard>

            <StepCard index={3} image="/sky-3.png" label={t.landing.stepUse}>
              <span className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white px-5 py-4 shadow-lg">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-2 rounded-full bg-neutral-400"
                  />
                ))}
              </span>
            </StepCard>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div className="max-w-2xl">
            <h2 className="text-balance text-3xl font-light tracking-tight md:text-4xl">
              {t.landing.catalogTitle}
            </h2>
            <p className="mt-3 font-light text-muted-foreground">
              {t.landing.catalogSub}
            </p>
          </div>
          <ShopCatalog publicMode />
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-light tracking-tight md:text-4xl">
              {t.landing.featuresTitle}
            </h2>
            <p className="mt-3 font-light text-muted-foreground">
              {t.landing.featuresSub}
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.landing.features.map((f, i) => {
              const Icon = FEATURE_ICONS[i] ?? Globe
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 backdrop-blur-sm transition-colors hover:border-primary/40 hover:bg-white/[0.04]"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-medium">{f.title}</h3>
                  <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
                    {f.text}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center backdrop-blur-sm">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_70%)]"
            />
            <div className="relative">
              <h2 className="text-balance text-3xl font-light tracking-tight md:text-4xl">
                {t.landing.ctaTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-xl font-light text-muted-foreground">
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
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm font-light text-muted-foreground md:flex-row md:px-6">
          <Logo />
          <span>{t.landing.footerSync}</span>
          <span>© {new Date().getFullYear()} MukhaTG</span>
        </div>
      </footer>
    </div>
  )
}

function StepCard({
  index,
  image,
  label,
  children,
}: {
  index: number
  image: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <span className="absolute -top-3 left-3 z-10 flex size-9 items-center justify-center rounded-xl border border-white/10 bg-neutral-900 text-sm font-medium text-white shadow-lg">
        {index}
      </span>
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl border border-white/10 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.8)]">
        <Image
          src={image || '/placeholder.svg'}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent"
        />
        <div className="relative">{children}</div>
      </div>
      <p className="mt-3 pl-1 text-sm font-light text-muted-foreground">
        {label}
      </p>
    </div>
  )
}
