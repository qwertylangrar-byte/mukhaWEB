import type { Metadata } from 'next'
import { isAdminAuthed } from '@/lib/admin'
import { AdminGate } from '@/components/admin/admin-gate'

export const metadata: Metadata = {
  title: 'Панель управления — MukhaTG',
  description: 'Служебная страница.',
  robots: { index: false, follow: false },
}

export default async function GrobovozkaPage() {
  const authed = await isAdminAuthed()

  return (
    <main className="min-h-dvh bg-background">
      <AdminGate initialAuthed={authed} />
    </main>
  )
}
