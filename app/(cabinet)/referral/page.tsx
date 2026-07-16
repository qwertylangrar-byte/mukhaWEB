import type { Metadata } from 'next'
import { ReferralPanel } from '@/components/cabinet/referral-panel'
import { PageHeading } from '@/components/cabinet/page-heading'

export const metadata: Metadata = {
  title: 'Реферальная программа — MukhaTG | Referral program',
  description: 'Приглашайте друзей и получайте бонусы на баланс.',
}

export default function ReferralPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <PageHeading section="referral" />
      <ReferralPanel />
    </div>
  )
}
