import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { CabinetHeader } from '@/components/cabinet/cabinet-header'

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
      <main className="mx-auto max-w-6xl md:px-2">{children}</main>
    </div>
  )
}
