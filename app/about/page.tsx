import type { Metadata } from 'next'
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

export const metadata: Metadata = {
  title: 'О нас — MukhaTG',
  description:
    'MukhaTG — сервис продажи Telegram-аккаунтов с мгновенной выдачей. Контакты: бот, техподдержка и тема на форуме LOLZ.',
}

const contacts = [
  {
    icon: Send,
    title: 'Telegram-бот',
    handle: '@MukhaTGbot',
    text: 'Покупка аккаунтов, пополнение и баланс — всё доступно прямо в боте.',
    href: 'https://t.me/MukhaTGbot',
    cta: 'Открыть бота',
  },
  {
    icon: Headset,
    title: 'Техподдержка / Реклама',
    handle: '@MukhaSupport',
    text: 'Вопросы по заказам, замены, сотрудничество и размещение рекламы.',
    href: 'https://t.me/MukhaSupport',
    cta: 'Написать в поддержку',
  },
  {
    icon: MessageCircle,
    title: 'Тема на форуме LOLZ',
    handle: 'zelenka.guru',
    text: 'Наша официальная тема на форуме: отзывы, обсуждение и новости сервиса.',
    href: 'https://zelenka.guru/threads/10143996/',
    cta: 'Перейти к теме',
  },
]

const values = [
  {
    icon: Zap,
    title: 'Мгновенная выдача',
    text: 'Аккаунты выдаются автоматически сразу после оплаты — без ручной обработки и ожидания.',
  },
  {
    icon: Globe,
    title: 'Десятки стран',
    text: 'Каталог постоянно пополняется: США, Европа, Азия и другие регионы — поштучно и оптом.',
  },
  {
    icon: Shield,
    title: 'Замены и поддержка',
    text: 'Живая техподдержка в Telegram. При непредвиденных обстоятельствах поможем с заменой.',
  },
  {
    icon: Users,
    title: 'Единая экосистема',
    text: 'Сайт и бот работают с одним балансом и одной историей — покупайте там, где удобно.',
  },
]

const stats = [
  { value: '70+', label: 'стран в каталоге' },
  { value: '24/7', label: 'автоматическая выдача' },
  { value: '2', label: 'способа оплаты криптой' },
  { value: '1', label: 'общий баланс с ботом' },
]

export default function AboutPage() {
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
            О сервисе
          </span>
          <h1 className="max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Мы — <span className="text-primary">MukhaTG</span>, сервис продажи
            Telegram-аккаунтов
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Продаём отлежавшиеся Telegram-аккаунты по странам с мгновенной
            автоматической выдачей: Session + Tdata, коды входа онлайн, оптовые
            заказы и единый баланс между сайтом и ботом. Работаем быстро,
            прозрачно и с живой поддержкой.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-border/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-12 md:grid-cols-4 md:px-6">
          {stats.map((s) => (
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
              Почему выбирают нас
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {values.map((v) => (
              <div
                key={v.title}
                className="group flex gap-4 rounded-2xl border border-border/70 bg-card/60 p-6 transition-colors hover:border-primary/40 hover:bg-card"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <v.icon className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">{v.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {v.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacts */}
      <section id="contacts" className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight">
              Контакты
            </h2>
            <p className="mt-3 text-muted-foreground">
              Мы всегда на связи — выбирайте удобный способ.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {contacts.map((c) => (
              <a
                key={c.title}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col rounded-2xl border border-border/70 bg-card/60 p-6 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card hover:shadow-[0_8px_32px_-12px] hover:shadow-primary/25"
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <c.icon className="size-5" />
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <h3 className="mt-5 text-base font-semibold">{c.title}</h3>
                <p className="mt-0.5 text-sm font-medium text-primary">
                  {c.handle}
                </p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {c.text}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  {c.cta}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </a>
            ))}
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
                Готовы попробовать?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Войдите через Telegram и получите первый аккаунт уже через
                минуту.
              </p>
              <div className="mt-7 flex justify-center">
                <Button
                  size="lg"
                  nativeButton={false}
                  className="h-11 rounded-full px-6 text-sm shadow-[0_0_30px_-6px] shadow-primary/60"
                  render={
                    <Link href="/login">
                      <Send className="size-4" />
                      Войти через Telegram
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
          <nav className="flex items-center gap-5" aria-label="Контакты">
            <a
              href="https://t.me/MukhaTGbot"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Бот
            </a>
            <a
              href="https://t.me/MukhaSupport"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Поддержка
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
