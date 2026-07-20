'use client'

import { useEffect, useState } from 'react'
import { CodeBlock } from '@/components/developers/code-block'

interface Section {
  id: string
  title: string
}

const SECTIONS: Section[] = [
  { id: 'intro', title: 'Введение' },
  { id: 'auth', title: 'Авторизация' },
  { id: 'pricing', title: 'Цены и скидки' },
  { id: 'errors', title: 'Ошибки' },
  { id: 'health', title: 'Проверка статуса' },
  { id: 'catalog', title: 'Каталог' },
  { id: 'profile', title: 'Профиль и баланс' },
  { id: 'purchase', title: 'Покупка аккаунта' },
  { id: 'code', title: 'Получение кода' },
  { id: 'refund', title: 'Возврат средств' },
  { id: 'bulk', title: 'Оптовые заказы' },
  { id: 'webhooks', title: 'Вебхуки' },
]

function H({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-mt-28 border-b border-white/10 pb-2 text-xl font-semibold text-foreground"
    >
      {children}
    </h2>
  )
}

export function DocsContent({ baseUrl }: { baseUrl: string }) {
  const [active, setActive] = useState('intro')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  return (
    <div className="mx-auto flex max-w-6xl gap-10 px-4">
      {/* Sidebar */}
      <aside className="sticky top-28 hidden h-[calc(100vh-8rem)] w-56 shrink-0 overflow-y-auto py-2 lg:block">
        <nav className="flex flex-col gap-1">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${active === s.id
                  ? 'bg-primary/15 font-medium text-primary'
                  : 'text-foreground/60 hover:bg-white/[0.05] hover:text-foreground'
                }`}
            >
              {s.title}
            </a>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-12 py-2 pb-24">
        <section className="space-y-4">
          <H id="intro">Введение</H>
          <p className="leading-relaxed text-foreground/70">
            REST API для покупки Telegram-аккаунтов по странам — поштучно и
            оптом. Списание идёт с баланса, пополняемого криптовалютой. Все
            ответы в формате JSON. Базовый URL:
          </p>
          <CodeBlock language="http" code={`${baseUrl}/api/v1`} />
        </section>

        <section className="space-y-4">
          <H id="auth">Авторизация</H>
          <p className="leading-relaxed text-foreground/70">
            Каждый запрос должен содержать ваш API-ключ в заголовке{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-primary">
              x-api-key
            </code>
            . Создать ключ можно в кабинете разработчика.
          </p>
          <CodeBlock
            language="bash"
            code={`curl ${baseUrl}/api/v1/profile \\
  -H "x-api-key: sk_live_ваш_ключ"`}
          />
        </section>

        <section className="space-y-4">
          <H id="pricing">Цены и скидки</H>
          <p className="leading-relaxed text-foreground/70">
            Цена каждой страны рассчитывается автоматически с наценкой. Чем
            больше вы потратили за всё время, тем выше уровень и постоянная
            скидка от цены:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-foreground/50">
                <tr>
                  <th className="pb-2 font-medium">Уровень</th>
                  <th className="pb-2 font-medium">Порог трат</th>
                  <th className="pb-2 font-medium">Скидка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-foreground/80">
                <tr><td className="py-2">Bronze</td><td>$50</td><td>2.5%</td></tr>
                <tr><td className="py-2">Silver</td><td>$200</td><td>5%</td></tr>
                <tr><td className="py-2">Gold</td><td>$500</td><td>7.5%</td></tr>
                <tr><td className="py-2">Platinum</td><td>$2000</td><td>10%</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-foreground/50">
            Скидка применяется к финальной цене автоматически. Актуальные цены
            всегда возвращает эндпоинт каталога.
          </p>
        </section>

        <section className="space-y-4">
          <H id="errors">Ошибки</H>
          <p className="leading-relaxed text-foreground/70">
            При ошибке возвращается соответствующий HTTP-код и тело с полями{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-primary">
              error
            </code>{' '}
            и{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-primary">
              message
            </code>
            .
          </p>
          <CodeBlock
            language="json"
            code={`{
  "error": "insufficient_balance",
  "message": "Not enough balance."
}`}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-foreground/50">
                <tr>
                  <th className="pb-2 font-medium">Код</th>
                  <th className="pb-2 font-medium">Значение</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-foreground/80">
                <tr><td className="py-2">202</td><td>Не ошибка: код ещё готовится, повторите через retry_after сек</td></tr>
                <tr><td className="py-2">401</td><td>Неверный или отсутствующий API-ключ</td></tr>
                <tr><td className="py-2">402</td><td>Недостаточно средств на балансе</td></tr>
                <tr><td className="py-2">404</td><td>Ресурс не найден</td></tr>
                <tr><td className="py-2">409</td><td>Нет в наличии / некорректный статус</td></tr>
                <tr><td className="py-2">429</td><td>Слишком много запросов</td></tr>
                <tr><td className="py-2">502</td><td>Ошибка вышестоящего провайдера</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <H id="health">GET /health</H>
          <p className="leading-relaxed text-foreground/70">
            Проверка доступности сервиса и серверного времени. Не требует ключа.
          </p>
          <CodeBlock
            language="json"
            code={`{
  "ok": true,
  "time": "2026-07-19T12:00:00.000Z"
}`}
          />
        </section>

        <section className="space-y-4">
          <H id="catalog">GET /catalog</H>
          <p className="leading-relaxed text-foreground/70">
            Список доступных стран с вашими персональными ценами (с учётом
            скидки уровня) и наличием.
          </p>
          <CodeBlock
            language="bash"
            code={`curl ${baseUrl}/api/v1/catalog \\
  -H "x-api-key: sk_live_ваш_ключ"`}
          />
          <CodeBlock
            language="json"
            code={`{
  "countries": [
    {
      "code": "US",
      "name": "United States",
      "price": 1.39,
      "available": true
    }
  ]
}`}
          />
        </section>

        <section className="space-y-4">
          <H id="profile">GET /profile</H>
          <p className="leading-relaxed text-foreground/70">
            Баланс, уровень скидки и суммарная статистика.
          </p>
          <CodeBlock
            language="json"
            code={`{
  "balance": 42.5,
  "tier": { "id": "silver", "name": "Silver", "discountPercent": 5 },
  "totalSpent": 210.0
}`}
          />
        </section>

        <section className="space-y-4">
          <H id="purchase">POST /purchases</H>
          <p className="leading-relaxed text-foreground/70">
            Создаёт покупку одного аккаунта. Стоимость сразу списывается с
            баланса, статус —{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-primary">
              PENDING
            </code>
            . Далее запросите код.
          </p>
          <CodeBlock
            language="bash"
            code={`curl -X POST ${baseUrl}/api/v1/purchases \\
  -H "x-api-key: sk_live_ваш_ключ" \\
  -H "Content-Type: application/json" \\
  -d '{ "country_code": "US" }'`}
          />
          <CodeBlock
            language="json"
            code={`{
  "purchase": {
    "id": "pur_a1b2c3",
    "mode": "single",
    "country": "United States",
    "country_code": "US",
    "phone": "+1201555....",
    "price": 1.39,
    "quantity": 1,
    "status": "PENDING",
    "code": null,
    "password": null,
    "created_at": "2026-07-19T12:00:00.000Z"
  }
}`}
          />
        </section>

        <section className="space-y-4">
          <H id="code">POST /purchases/:id/request-code</H>
          <p className="leading-relaxed text-foreground/70">
            Запрашивает код входа для аккаунта. Эндпоинт{' '}
            <strong className="text-foreground">асинхронный</strong>: код
            приходит от провайдера в течение{' '}
            <strong className="text-foreground">5–30 секунд</strong>, поэтому с
            первого раза он почти никогда не готов. В этом случае возвращается{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-primary">
              HTTP 202
            </code>{' '}
            со статусом{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-primary">
              code_pending
            </code>
            . Это <strong className="text-foreground">не ошибка</strong> —
            повторяйте запрос, пока не получите код.
          </p>

          <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
            <p className="text-sm leading-relaxed text-amber-200/90">
              <strong>Важно:</strong> статус{' '}
              <code className="rounded bg-white/10 px-1.5 py-0.5">202</code> =
              «код ещё в пути». Дождитесь{' '}
              <code className="rounded bg-white/10 px-1.5 py-0.5">
                retry_after
              </code>{' '}
              секунд и повторите тот же запрос (polling). Запросы идемпотентны —
              новый код не создаётся.
            </p>
          </div>

          <h3 className="pt-2 text-sm font-semibold text-foreground/90">
            Статусы ответа
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-foreground/50">
                <tr>
                  <th className="pb-2 font-medium">HTTP</th>
                  <th className="pb-2 font-medium">Статус</th>
                  <th className="pb-2 font-medium">Что делать</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-foreground/80">
                <tr>
                  <td className="py-2">200</td>
                  <td>SUCCESS</td>
                  <td>Код получен — забрать из ответа</td>
                </tr>
                <tr>
                  <td className="py-2">202</td>
                  <td>code_pending</td>
                  <td>Подождать retry_after сек и повторить</td>
                </tr>
                <tr>
                  <td className="py-2">409</td>
                  <td>—</td>
                  <td>Код уже выдан — забрать через GET /purchases/:id</td>
                </tr>
                <tr>
                  <td className="py-2">402</td>
                  <td>insufficient_balance</td>
                  <td>Пополнить баланс</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="pt-2 text-sm font-semibold text-foreground/90">
            Запрос
          </h3>
          <CodeBlock
            language="bash"
            code={`curl -X POST ${baseUrl}/api/v1/purchases/prc_a1b2c3/request-code \\
  -H "x-api-key: sk_live_ваш_ключ"`}
          />

          <h3 className="pt-2 text-sm font-semibold text-foreground/90">
            Ответ 202 — код ещё не пришёл (повторите запрос)
          </h3>
          <CodeBlock
            language="json"
            code={`{
  "status": "code_pending",
  "message": "Code has not arrived yet. Please retry.",
  "retry_after": 5
}`}
          />

          <h3 className="pt-2 text-sm font-semibold text-foreground/90">
            Ответ 200 — код получен
          </h3>
          <CodeBlock
            language="json"
            code={`{
  "id": "prc_a1b2c3",
  "status": "SUCCESS",
  "code": "41 * * 1",
  "two_fa_password": "..."
}`}
          />

          <h3 className="pt-2 text-sm font-semibold text-foreground/90">
            Правильный вызов (polling)
          </h3>
          <p className="leading-relaxed text-foreground/70">
            Повторяйте запрос, пока не получите{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-primary">
              200
            </code>
            , уважая{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-primary">
              retry_after
            </code>
            :
          </p>
          <CodeBlock
            tabs={[
              {
                label: 'JavaScript',
                language: 'javascript',
                code: `async function getCode(purchaseId, apiKey) {
  const base = "${baseUrl}/api/v1"

  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await fetch(
      \`\${base}/purchases/\${purchaseId}/request-code\`,
      { method: "POST", headers: { "x-api-key": apiKey } },
    )

    // Код готов
    if (res.status === 200) {
      return await res.json() // { code, two_fa_password, ... }
    }

    // Код ещё не пришёл — ждём retry_after и повторяем
    if (res.status === 202) {
      const { retry_after } = await res.json()
      await new Promise((r) => setTimeout(r, (retry_after ?? 5) * 1000))
      continue
    }

    // Код уже выдавался ранее — забираем через GET
    if (res.status === 409) {
      const r = await fetch(\`\${base}/purchases/\${purchaseId}\`, {
        headers: { "x-api-key": apiKey },
      })
      return await r.json()
    }

    throw new Error(\`Unexpected status: \${res.status}\`)
  }

  throw new Error("Код не пришёл за отведённое время")
}`,
              },
              {
                label: 'Python',
                language: 'python',
                code: `import time, requests

def get_code(purchase_id, api_key):
    base = "${baseUrl}/api/v1"
    headers = {"x-api-key": api_key}

    for _ in range(20):
        res = requests.post(
            f"{base}/purchases/{purchase_id}/request-code",
            headers=headers,
        )

        # Код готов
        if res.status_code == 200:
            return res.json()

        # Код ещё не пришёл — ждём retry_after и повторяем
        if res.status_code == 202:
            time.sleep(res.json().get("retry_after", 5))
            continue

        # Код уже выдавался ранее — забираем через GET
        if res.status_code == 409:
            return requests.get(
                f"{base}/purchases/{purchase_id}", headers=headers
            ).json()

        raise Exception(f"Unexpected status: {res.status_code}")

    raise Exception("Код не пришёл за отведённое время")`,
              },
            ]}
          />

          <h3 className="pt-2 text-sm font-semibold text-foreground/90">
            Альтернатива — вебхук (без polling)
          </h3>
          <p className="leading-relaxed text-foreground/70">
            Передайте{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-primary">
              callback_url
            </code>{' '}
            — сервер ответит сразу, а код доставит на ваш вебхук, как только он
            появится. Ваш эндпоинт должен вернуть{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-primary">
              200
            </code>{' '}
            в течение 5 секунд.
          </p>
          <CodeBlock
            language="bash"
            code={`curl -X POST ${baseUrl}/api/v1/purchases/prc_a1b2c3/request-code \\
  -H "x-api-key: sk_live_ваш_ключ" \\
  -H "Content-Type: application/json" \\
  -d '{ "callback_url": "https://ваш-сайт/webhook" }'`}
          />
        </section>

        <section className="space-y-4">
          <H id="refund">POST /purchases/:id/refund</H>
          <p className="leading-relaxed text-foreground/70">
            Возврат средств, если код не был получен в течение{' '}
            <strong className="text-foreground">20 минут</strong> после покупки.
            Сумма возвращается на баланс.
          </p>
          <CodeBlock
            language="json"
            code={`{
  "id": "prc_a1b2c3",
  "status": "REFUNDED",
  "refunded_at": "2026-07-19T12:05:00.000Z"
}`}
          />
        </section>

        <section className="space-y-4">
          <H id="bulk">Оптовые заказы</H>
          <p className="leading-relaxed text-foreground/70">
            Заказ нескольких аккаунтов одной страны. Результат — ссылка на
            ZIP-архив. Оптовые заказы не подлежат возврату.
          </p>
          <CodeBlock
            language="bash"
            code={`# Создать оптовый заказ
curl -X POST ${baseUrl}/api/v1/bulk \\
  -H "x-api-key: sk_live_ваш_ключ" \\
  -H "Content-Type: application/json" \\
  -d '{ "country": "US", "quantity": 10 }'

# Проверить статус
curl ${baseUrl}/api/v1/bulk/blk_xxx -H "x-api-key: sk_live_ваш_ключ"

# Скачать архив
curl -L ${baseUrl}/api/v1/bulk/blk_xxx/download \\
  -H "x-api-key: sk_live_ваш_ключ" -o accounts.zip`}
          />
        </section>

        <section className="space-y-4">
          <H id="webhooks">Вебхуки</H>
          <p className="leading-relaxed text-foreground/70">
            Добавьте URL вебхука в кабинете, чтобы получать события в реальном
            времени. Мы отправляем{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-primary">
              POST
            </code>{' '}
            с JSON и ждём ответ{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-primary">
              200
            </code>{' '}
            в течение 5 секунд. При ошибке — до 3 повторов.
          </p>
          <CodeBlock
            language="json"
            code={`{
  "event": "code.received",
  "data": {
    "id": "prc_a1b2c3",
    "status": "SUCCESS",
    "code": "41 * * 1"
  }
}`}
          />
          <p className="text-sm text-foreground/50">
            События: purchase.created, code.received, purchase.refunded,
            bulk.created.
          </p>
        </section>
      </div>
    </div>
  )
}
