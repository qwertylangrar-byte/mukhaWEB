import type { Metadata } from 'next'
import { TopupPanel } from '@/components/cabinet/topup-panel'
import { PageHeading } from '@/components/cabinet/page-heading'

export const metadata: Metadata = {
  title: 'Пополнение баланса — MukhaTG | Top up',
  description: 'Пополните баланс через CryptoBot или другие способы оплаты.',
}

export default function TopupPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <PageHeading section="topup" />
      <TopupPanel />
    </div>
  )
}
