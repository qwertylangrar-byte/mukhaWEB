import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { cookies, headers } from 'next/headers'
import { LanguageProvider, LANG_COOKIE, type Lang } from '@/lib/i18n'
import './globals.css'

const _inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'MukhaTG — магазин Telegram-аккаунтов | Telegram account store',
  description:
    'Покупайте отлежавшиеся Telegram-аккаунты по странам поштучно или оптом. Buy aged Telegram accounts by country — instant delivery, Session + Tdata and login codes.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0b1220',
}

/**
 * Language detection: explicit cookie wins; otherwise the browser's
 * Accept-Language decides (Russian family → ru, anything else → en).
 */
async function detectLang(): Promise<Lang> {
  const cookieStore = await cookies()
  const saved = cookieStore.get(LANG_COOKIE)?.value
  if (saved === 'ru' || saved === 'en') return saved

  const headerStore = await headers()
  const accept = (headerStore.get('accept-language') ?? '').toLowerCase()
  // The first (highest-priority) language decides.
  const first = accept.split(',')[0]?.trim() ?? ''
  const ruFamily = ['ru', 'be', 'uk', 'kk']
  return ruFamily.some((code) => first.startsWith(code)) ? 'ru' : 'en'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const lang = await detectLang()
  return (
    <html lang={lang} className="bg-background">
      <body className="font-sans antialiased">
        <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
