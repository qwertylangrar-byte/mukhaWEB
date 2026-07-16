import type { Metadata } from 'next'
import { ReferralPanel } from '@/components/cabinet/referral-panel'

export const metadata: Metadata = {
  title: 'Реферальная программа — MukhaTG',
  description: 'Приглашайте друзей и получайте бонусы на баланс.',
}

export default function ReferralPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Реферальная программа</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Делитесь ссылкой и получайте процент с пополнений приглашённых.
      </p>
      <ReferralPanel />
    </div>
  )
}
