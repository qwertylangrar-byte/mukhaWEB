import type { Metadata } from 'next'
import { TopupPanel } from '@/components/cabinet/topup-panel'

export const metadata: Metadata = {
  title: 'Пополнение баланса — MukhaTG',
  description: 'Пополните баланс через CryptoBot или другие способы оплаты.',
}

export default function TopupPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Пополнение баланса</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Выберите способ оплаты и сумму — баланс зачислится автоматически.
      </p>
      <TopupPanel />
    </div>
  )
}
