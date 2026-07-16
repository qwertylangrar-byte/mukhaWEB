import { ShopCatalog } from '@/components/cabinet/shop-catalog'

export const metadata = {
  title: 'Магазин — MukhaTG',
}

export default function ShopPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Магазин</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Выберите страну — аккаунты выдаются мгновенно после оплаты с баланса.
      </p>
      <ShopCatalog />
    </div>
  )
}
