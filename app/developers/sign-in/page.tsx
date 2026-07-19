import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { SiteHeader } from '@/components/site-header'
import { DevAuthForm } from '@/components/developers/auth-form'

export const metadata = {
  title: 'Вход для разработчиков',
  robots: { index: false, follow: false },
}

export default async function DevSignInPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/developers/dashboard')
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-screen flex-col items-center justify-center px-4 pt-28 pb-16">
        <DevAuthForm mode="sign-in" />
      </main>
    </>
  )
}
