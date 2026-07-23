import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { SiteHeader } from '@/components/site-header'
import { DevDashboard } from '@/components/developers/dashboard'
import { getOverview, reconcilePending } from '@/app/developers/actions'
import { SignOutButton } from '@/components/developers/sign-out-button'

export const metadata = {
  title: 'Кабинет разработчика',
  robots: { index: false, follow: false },
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/developers/sign-in')

  // Reconcile any pending crypto top-ups before rendering the balance.
  await reconcilePending().catch(() => {})
  const data = await getOverview()

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen px-4 pt-28 pb-16">
        <div className="mx-auto mb-6 flex max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Кабинет разработчика
            </h1>
            <p className="text-sm text-foreground/80">{session.user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/developers/docs"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-white/[0.07]"
            >
              Документация
            </Link>
            <SignOutButton />
          </div>
        </div>
        <DevDashboard data={data} />
      </main>
    </>
  )
}
