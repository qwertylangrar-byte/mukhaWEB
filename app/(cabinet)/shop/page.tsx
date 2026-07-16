import { ShopCatalog } from '@/components/cabinet/shop-catalog'
import { PageHeading } from '@/components/cabinet/page-heading'

export const metadata = {
  title: 'Магазин — MukhaTG | Shop',
}

export default function ShopPage() {
  return (
    <div>
      <PageHeading section="shop" />
      <ShopCatalog />
    </div>
  )
}
