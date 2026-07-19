'use client'

import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Globe,
  Headset,
  MessageCircle,
  Send,
  Shield,
  Users,
  Zap,
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useLang } from '@/lib/i18n'

const CONTACT_META = [
  { icon: Send, handle: '@MukhaTGbot', href: 'https://t.me/MukhaTGbot' },
  { icon: Headset, handle: '@MukhaSupp', href: 'https://t.me/MukhaSupp' },
  {
    icon: MessageCircle,
    handle: 'zelenka.guru',
    href: 'https://zelenka.guru/threads/10143996/',
  },
]

const VALUE_ICONS = [Zap, Globe, Shield, Users]

export function AboutContent() {
  const { t } = useLang()
  return (
    <div className="min-h-dvh">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_26%,transparent),transparent_70%)]"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center md:py-28">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-primary" />
            {t.about.badge}
          </span>
          <h1 className="max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            {t.about.titleA} <span className="text-primary">MukhaTG</span>
            {t.about.titleB}
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            {t.about.subtitle}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-border/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-12 md:grid-cols-4 md:px-6">
          {t.about.stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border/70 bg-card/60 p-6 text-center"
            >
              <p className="text-3xl font-bold tabular-nums text-primary">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight">
              {t.about.whyTitle}
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {t.about.values.map((v, i) => {
              const Icon = VALUE_ICONS[i] ?? Zap
              return (
                <div
                  key={v.title}
                  className="group flex gap-4 rounded-2xl border border-border/70 bg-card/60 p-6 transition-colors hover:border-primary/40 hover:bg-card"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{v.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {v.text}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contacts */}
      <section id="contacts" className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight">
              {t.about.contactsTitle}
            </h2>
            <p className="mt-3 text-muted-foreground">{t.about.contactsSub}</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {t.about.contacts.map((c, i) => {
              const meta = CONTACT_META[i]
              const Icon = meta?.icon ?? Send
              return (
                <a
                  key={c.title}
                  href={meta?.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex flex-col rounded-2xl border border-border/70 bg-card/60 p-6 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card hover:shadow-[0_8px_32px_-12px] hover:shadow-primary/25"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold">{c.title}</h3>
                  <p className="mt-0.5 text-sm font-medium text-primary">
                    {meta?.handle}
                  </p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {c.text}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    {c.cta}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 px-6 py-14 text-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_70%)]"
            />
            <div className="relative">
              <h2 className="text-balance text-3xl font-bold tracking-tight">
                {t.about.ctaTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                {t.about.ctaText}
              </p>
              <div className="mt-7 flex justify-center">
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
          <nav className="flex items-center gap-5" aria-label={t.about.contactsTitle}>
            <a
              href="https://t.me/MukhaTGbot"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              {t.about.footerBot}
            </a>
            <a
              href="https://t.me/MukhaSupp"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              {t.about.footerSupport}
            </a>
            <a
              href="https://zelenka.guru/threads/10143996/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              LOLZ
            </a>
          </nav>
          <span>© {new Date().getFullYear()} MukhaTG</span>
        </div>
      </footer>
    </div>
  )
}
