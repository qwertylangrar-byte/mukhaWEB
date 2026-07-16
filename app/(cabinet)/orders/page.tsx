import type { Metadata } from 'next'
import { OrdersList } from '@/components/cabinet/orders-list'

export const metadata: Metadata = {
  title: 'Мои покупки — MukhaTG',
  description: 'История покупок Telegram-аккаунтов, получение кодов и архивов.',
}

export default function OrdersPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Мои покупки</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Получайте коды входа, скачивайте архивы и оформляйте возвраты.
      </p>
      <OrdersList />
    </div>
  )
}
