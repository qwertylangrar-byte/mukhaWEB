import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { SiteHeader } from '@/components/site-header'
import { LoginCard } from '@/components/login-card'

export const metadata = {
  title: 'Вход — MukhaTG',
}

export default async function LoginPage() {
  const session = await getSession()
  if (session) redirect('/shop')

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 pt-28 pb-16">
        <LoginCard />
      </main>
    </div>
  )
}
