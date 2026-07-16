import type { Metadata } from 'next'
import { OrdersList } from '@/components/cabinet/orders-list'
import { PageHeading } from '@/components/cabinet/page-heading'

export const metadata: Metadata = {
  title: 'Мои покупки — MukhaTG | My orders',
  description: 'История покупок Telegram-аккаунтов и скачивание архивов.',
}

export default function OrdersPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <PageHeading section="orders" />
      <OrdersList />
    </div>
  )
}
