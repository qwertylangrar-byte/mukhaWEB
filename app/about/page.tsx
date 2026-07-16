import type { Metadata } from 'next'
import { AboutContent } from '@/components/about-content'

export const metadata: Metadata = {
  title: 'О нас — MukhaTG | About us',
  description:
    'MukhaTG — сервис продажи Telegram-аккаунтов с мгновенной выдачей. MukhaTG — Telegram account selling service with instant delivery. Contacts: bot, support and LOLZ forum thread.',
}

export default function AboutPage() {
  return <AboutContent />
}
