import type { MetadataRoute } from 'next'

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'https://mukhatg.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private, auth-gated and admin areas must never be indexed.
      disallow: [
        '/api/',
        '/shop',
        '/orders',
        '/topup',
        '/referral',
        '/admin',
        '/grobovozka',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
