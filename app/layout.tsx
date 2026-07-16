import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { cookies, headers } from 'next/headers'
import { LanguageProvider } from '@/lib/i18n'
import { LANG_COOKIE, type Lang } from '@/lib/lang'
import { FloatingBotButton } from '@/components/floating-bot-button'
import './globals.css'

const _inter = Inter({ subsets: ['latin', 'cyrillic'] })

// Production URL for canonical/OG links (Vercel injects this at build time).
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'https://mukhatg.vercel.app'

const title = 'MukhaTG — магазин Telegram-аккаунтов | Telegram Account Store'
const description =
  'Покупайте отлежавшиеся Telegram-аккаунты по странам — поштучно или оптом. Мгновенная выдача, Session + Tdata, коды входа. Buy aged Telegram accounts by country with instant delivery.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: '%s — MukhaTG',
  },
  description,
  applicationName: 'MukhaTG',
  generator: 'v0.app',
  keywords: [
    'MukhaTG',
    'Telegram аккаунты',
    'купить Telegram аккаунт',
    'Telegram аккаунты оптом',
    'отлежавшиеся аккаунты',
    'Session Tdata',
    'buy Telegram accounts',
    'aged Telegram accounts',
    'Telegram account store',
  ],
  authors: [{ name: 'MukhaTG' }],
  creator: 'MukhaTG',
  publisher: 'MukhaTG',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'MukhaTG',
    title,
    description,
    url: siteUrl,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MukhaTG — магазин Telegram-аккаунтов',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MukhaTG',
    url: siteUrl,
    logo: `${siteUrl}/icon.png`,
    description,
    sameAs: [
      'https://t.me/MukhaTGbot',
      'https://t.me/MukhaSupport',
      'https://zelenka.guru/threads/10143996/',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: 'https://t.me/MukhaSupport',
    },
  }
  return (
    <html lang={lang} className="bg-background">
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
        <FloatingBotButton />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
