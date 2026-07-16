import type { Metadata } from 'next'
import { OrdersList } from '@/components/cabinet/orders-list'

export const metadata: Metadata = {
  title: 'Мои покупки — MukhaTG',
  description: 'История покупок Telegram-аккаунтов и скачивание архивов.',
}

export default function OrdersPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Мои покупки</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Вся история ваших покупок. Архивы оптовых заказов можно скачать здесь.
      </p>
      <OrdersList />
    </div>
  )
}
