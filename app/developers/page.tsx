import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import {
  ArrowRight,
  Boxes,
  Clock,
  Code2,
  KeyRound,
  Layers,
  ShieldCheck,
  Webhook,
  Zap,
} from 'lucide-react'
import { auth } from '@/lib/auth'
import { SiteHeader } from '@/components/site-header'
import { CodeBlock } from '@/components/developers/code-block'
import { TIERS } from '@/lib/reseller/pricing'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'API для разработчиков — Telegram-аккаунты по API',
  description:
    'REST API для покупки Telegram-аккаунтов: каталог по странам, мгновенная выдача кодов входа через long-polling, опт, вебхуки и криптопополнение баланса.',
  alternates: { canonical: '/developers' },
}

const FEATURES = [
  {
    icon: Zap,
    title: 'Мгновенная выдача',
    text: 'Создавайте покупку и получайте код входа через long-polling до 120 секунд — без ручных повторов.',
  },
  {
    icon: Boxes,
    title: 'Опт до 500 шт.',
    text: 'Оптовые заказы одним запросом с готовым ZIP-архивом Session + Tdata.',
  },
  {
    icon: Webhook,
    title: 'Вебхуки',
    text: 'Получайте события покупок и кодов на свой endpoint. До 3 попыток, таймаут 5 секунд.',
  },
  {
    icon: KeyRound,
    title: 'Простая аутентификация',
    text: 'Один заголовок x-api-key. Ключи выпускаются и отзываются в личном кабинете.',
  },
  {
    icon: Layers,
    title: 'Уровни скидок',
    text: 'Чем больше оборот — тем ниже цена: до 10% скидки на всех уровнях.',
  },
  {
    icon: ShieldCheck,
    title: 'Возврат за 20 минут',
    text: 'Автовозврат на баланс, если код не пришёл в течение 20 минут после покупки.',
  },
]

function curlExample(origin: string) {
  return `# 1. Каталог с вашими ценами
curl ${origin}/api/v1/catalog \\
  -H "x-api-key: sk_live_..."

# 2. Купить аккаунт
curl -X POST ${origin}/api/v1/purchases \\
  -H "x-api-key: sk_live_..." \\
  -H "content-type: application/json" \\
  -d '{"country_code":"US"}'

# 3. Дождаться кода (long-polling до 120с)
curl -X POST ${origin}/api/v1/purchases/PURCHASE_ID/request-code \\
  -H "x-api-key: sk_live_..."`
}

function jsExample(origin: string) {
  return `const API = "${origin}/api/v1";
const headers = { "x-api-key": process.env.API_KEY };

// Купить аккаунт
const res = await fetch(API + "/purchases", {
  method: "POST",
  headers: { ...headers, "content-type": "application/json" },
  body: JSON.stringify({ country_code: "US" }),
});
const { purchase } = await res.json();

// Дождаться кода (соединение висит до 120с)
const code = await fetch(
  API + "/purchases/" + purchase.id + "/request-code",
  { method: "POST", headers }
).then((r) => r.json());

console.log(code.code, code.password);`
}

function pyExample(origin: string) {
  return `import requests

API = "${origin}/api/v1"
headers = {"x-api-key": "sk_live_..."}

# Купить аккаунт
purchase = requests.post(
    f"{API}/purchases",
    headers=headers,
    json={"country_code": "US"},
).json()["purchase"]

# Дождаться кода (long-polling, timeout 130s)
code = requests.post(
    f"{API}/purchases/{purchase['id']}/request-code",
    headers=headers,
    timeout=130,
).json()

print(code["code"], code.get("password"))`
}

export default async function DevelopersPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const h = await headers()
  const origin = h.get('host') ? `https://${h.get('host')}` : 'https://api.example.com'
  const ctaHref = session?.user ? '/developers/dashboard' : '/developers/sign-up'

  return (
    <div className="relative min-h-dvh">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-40"
          style={{
            backgroundImage: 'url(/api-hero.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            maskImage: 'linear-gradient(to bottom, black, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
          }}
        />
        <div className="mx-auto max-w-5xl px-4 pt-40 pb-20 text-center md:pt-48">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur">
            <Code2 className="size-3.5 text-primary" />
            REST API v1
          </span>
          <h1 className="mt-6 text-balance text-5xl font-extralight leading-[1.05] tracking-tight md:text-7xl">
            Telegram-аккаунты
            <br />
            <span className="bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
              по одному API-запросу
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base font-light leading-relaxed text-foreground/60 md:text-lg">
            Интегрируйте покупку аккаунтов в свой продукт: каталог по странам,
            мгновенная выдача кодов, опт, вебхуки и криптопополнение баланса.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button
              nativeButton={false}
              className="h-11 rounded-xl px-6"
              render={
                <Link href={ctaHref}>
                  Начать бесплатно
                  <ArrowRight className="size-4" />
                </Link>
              }
            />
            <Button
              nativeButton={false}
              variant="outline"
              className="h-11 rounded-xl border-white/[0.12] bg-white/[0.03] px-6"
              render={<Link href="/developers/docs">Документация</Link>}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <span className="flex size-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                <f.icon className="size-5 text-primary" />
              </span>
              <h3 className="mt-4 text-base font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm font-light leading-relaxed text-foreground/55">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quickstart */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extralight tracking-tight md:text-4xl">
            Три запроса до первого аккаунта
          </h2>
          <p className="mt-3 text-pretty font-light text-foreground/55">
            Получите ключ в кабинете, пополните баланс криптовалютой и покупайте.
          </p>
        </div>
        <CodeBlock
          className="mt-8"
          tabs={[
            { label: 'cURL', language: 'bash', code: curlExample(origin) },
            { label: 'JavaScript', language: 'js', code: jsExample(origin) },
            { label: 'Python', language: 'python', code: pyExample(origin) },
          ]}
        />
      </section>

      {/* Tiers */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extralight tracking-tight md:text-4xl">
            Уровни и скидки
          </h2>
          <p className="mt-3 font-light text-foreground/55">
            Скидка растёт вместе с вашим оборотом и применяется автоматически.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-center"
            >
              <span className="text-sm font-medium text-foreground/70">
                {tier.name}
              </span>
              <span className="mt-3 text-3xl font-light text-primary">
                {tier.discountPercent}%
              </span>
              <span className="mt-1 text-xs text-foreground/45">скидка</span>
              <span className="mt-4 flex items-center justify-center gap-1 text-xs text-foreground/50">
                <Clock className="size-3" />
                от ${tier.threshold}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-24 pt-6">
        <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent p-10 text-center">
          <h2 className="text-3xl font-extralight tracking-tight md:text-4xl">
            Готовы интегрировать?
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-light text-foreground/55">
            Создайте аккаунт разработчика, получите API-ключ и сделайте первый
            запрос за пару минут.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button
              nativeButton={false}
              className="h-11 rounded-xl px-6"
              render={
                <Link href={ctaHref}>
                  Создать API-ключ
                  <ArrowRight className="size-4" />
                </Link>
              }
            />
          </div>
        </div>
      </section>
    </div>
  )
}
