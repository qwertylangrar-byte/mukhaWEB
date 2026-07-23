import { headers } from 'next/headers'
import { SiteHeader } from '@/components/site-header'
import { DocsContent } from '@/components/developers/docs-content'

export const metadata = {
  title: 'Документация API',
  description:
    'REST API для покупки Telegram-аккаунтов: авторизация, каталог, покупки, получение кода, оптовые заказы и вебхуки.',
}

export default async function DocsPage() {
  const h = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const proto = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${proto}://${host}`

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen pt-28 pb-16">
        <div className="mx-auto mb-10 max-w-6xl px-4">
          <h1 className="text-3xl font-semibold text-foreground">
            Документация API
          </h1>
          <p className="mt-2 text-foreground/80">
            Всё, что нужно для интеграции покупки Telegram-аккаунтов.
          </p>
        </div>
        <DocsContent baseUrl={baseUrl} />
      </main>
    </>
  )
}
