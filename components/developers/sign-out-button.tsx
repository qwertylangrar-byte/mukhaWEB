'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export function SignOutButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut()
        router.push('/developers')
        router.refresh()
      }}
      className="flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-white/[0.07]"
    >
      <LogOut size={14} /> Выйти
    </button>
  )
}
