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

const features = [
  {
    icon: Globe,
    title: 'Аккаунты по странам',
    text: 'Большой каталог отлежавшихся Telegram-аккаунтов с гибким выбором страны и количества.',
  },
  {
    icon: Zap,
    title: 'Мгновенная выдача',
    text: 'Session + Tdata приходят сразу после оплаты с баланса — без ожидания и ручной обработки.',
  },
  {
    icon: KeyRound,
    title: 'Коды входа онлайн',
    text: 'Запрашивайте код авторизации прямо на сайте в один клик, когда он вам нужен.',
  },
  {
    icon: RefreshCw,
    title: 'Криптооплата',
    text: 'Пополняйте баланс через CryptoBot, Heleket или OxaPay — USDT, BTC, ETH и другие монеты.',
  },
  {
    icon: Wallet,
    title: 'Единый баланс',
    text: 'Баланс синхронизирован с ботом: пополняете где угодно — тратите где угодно.',
  },
  {
    icon: Shield,
    title: 'Вход через Telegram',
    text: 'Никаких паролей. Авторизация проходит через вашего бота — быстро и безопасно.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Войдите через Telegram',
    text: 'Нажмите «Войти» и подтвердите вход в боте одним сообщением.',
  },
  {
    n: '02',
    title: 'Пополните баланс',
    text: 'Пополнение зачисляется и на сайте, и в боте одновременно.',
  },
  {
    n: '03',
    title: 'Выберите страну',
    text: 'Откройте каталог, выберите страну и количество аккаунтов.',
  },
  {
    n: '04',
    title: 'Получите аккаунты',
    text: 'Данные и коды входа доступны сразу в личном кабинете.',
  },
]

export default function HomePage() {
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
            Отлежавшиеся Telegram-аккаунты
          </span>
          <h1 className="max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Магазин Telegram-аккаунтов с{' '}
            <span className="text-primary">мгновенной выдачей</span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Покупайте аккаунты по странам поштучно или оптом. Session + Tdata и
            коды входа — всё в одном личном кабинете, с балансом, общим с ботом.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-11 rounded-full px-6 text-sm shadow-[0_0_30px_-6px] shadow-primary/60"
              render={
                <Link href="/login">
                  <Send className="size-4" />
                  Войти через Telegram
                </Link>
              }
            />
            <Button
              size="lg"
              variant="outline"
              className="h-11 rounded-full px-6 text-sm"
              render={
                <Link href="/shop">
                  Смотреть каталог
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
              Всё для быстрой и безопасной покупки
            </h2>
            <p className="mt-3 text-muted-foreground">
              Те же возможности, что и в боте, но в удобном веб-интерфейсе.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border/70 bg-card/60 p-6 transition-colors hover:border-primary/40 hover:bg-card"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
              Как это работает
            </h2>
            <p className="mt-3 text-muted-foreground">
              Четыре шага от входа до готового аккаунта.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-border/70 bg-card/60 p-6"
              >
                <span className="flex size-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-semibold text-primary">
                  {s.n}
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
                Готовы начать?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Войдите через Telegram — регистрация происходит автоматически
                при первом входе.
              </p>
              <div className="mt-8 flex justify-center">
                <Button
                  size="lg"
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
          <span>Баланс и аккаунты синхронизированы с Telegram-ботом</span>
          <span>© {new Date().getFullYear()} MukhaTG</span>
        </div>
      </footer>
    </div>
  )
}
