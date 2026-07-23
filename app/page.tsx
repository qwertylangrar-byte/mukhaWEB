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

        {/* Floating 3D decor */}
        <Image
          src="/decor-keycap.png"
          alt=""
          aria-hidden="true"
          width={280}
          height={280}
          className="pointer-events-none absolute right-2 top-20 w-32 rotate-6 opacity-95 mix-blend-screen [mask-image:radial-gradient(closest-side,#000_55%,transparent_78%)] md:right-16 md:top-24 md:w-48"
        />
        <Image
          src="/decor-cube.png"
          alt=""
          aria-hidden="true"
          width={220}
          height={220}
          className="pointer-events-none absolute left-2 top-36 hidden w-24 -rotate-12 opacity-80 mix-blend-screen md:block md:w-32"
        />

        <div className="relative mx-auto max-w-6xl px-4 pt-36 pb-8 md:px-6 md:pt-44">
          <div className="flex flex-col items-center text-center">
            <h1 className="max-w-4xl text-balance font-serif text-4xl font-extralight leading-[1.15] tracking-tight md:text-6xl">
              {t.landing.heroTitle1}
              <br />
              <span className="bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent">
                {t.landing.heroTitle2}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base font-light leading-relaxed text-muted-foreground md:text-lg">
              {t.landing.heroSubtitle}
            </p>
          </div>

          {/* Step cards */}
          <div className="mx-auto mt-16 grid max-w-4xl gap-x-6 gap-y-10 sm:grid-cols-3">
            <StepCard
              index={1}
              image="/step-buy.png"
              label={t.landing.stepChoose}
            />
            <StepCard
              index={2}
              image="/step-code.png"
              label={t.landing.stepGetCode}
            />
            <StepCard
              index={3}
              image="/step-use.png"
              label={t.landing.stepUse}
            />
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
}: {
  index: number
  image: string
  label: string
}) {
  return (
    <div className="group relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] transition-transform duration-300 group-hover:-translate-y-1">
        <Image
          src={image || '/placeholder.svg'}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-sm font-semibold text-primary shadow-[0_0_14px_-2px] shadow-primary/50">
          {index}
        </span>
        <p className="text-base font-light text-foreground/90">{label}</p>
      </div>
    </div>
  )
}
