import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin'
import { AdminPanel } from '@/components/admin/admin-panel'

export const metadata: Metadata = {
  title: 'Админ-панель — MukhaTG',
  description: 'Управление пользователями, балансами и блокировками сайта.',
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  const session = await getAdminSession()
  if (!session) redirect('/shop')

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Админ-панель</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Пользователи, балансы, покупки и блокировки функций сайта.
      </p>
      <AdminPanel />
    </div>
  )
}
