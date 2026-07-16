import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { CabinetHeader } from '@/components/cabinet/cabinet-header'

// Private, per-user area — keep it out of search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function CabinetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-dvh">
      <CabinetHeader
        firstName={session.firstName}
        username={session.username}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">{children}</main>
    </div>
  )
}
