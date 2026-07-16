'use client'

import { useState } from 'react'
import { KeyRound, Loader2, LogOut, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminPanel } from '@/components/admin/admin-panel'

/**
 * Gate for the hidden admin panel (/grobovozka): shows a login/password
 * form until the admin cookie is set, then renders the panel itself.
 */
export function AdminGate({ initialAuthed }: { initialAuthed: boolean }) {
  const [authed, setAuthed] = useState(initialAuthed)

  if (!authed) return <LoginForm onSuccess={() => setAuthed(true)} />

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ShieldCheck className="size-6 text-primary" />
            Панель управления
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Пользователи, балансы, покупки и блокировки функций сайта.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full bg-transparent"
          onClick={async () => {
            await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {})
            setAuthed(false)
          }}
        >
          <LogOut className="size-4" />
          Выйти
        </Button>
      </div>
      <AdminPanel />
    </div>
  )
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!login.trim() || !password) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ login: login.trim(), password }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Неверный логин или пароль')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-border/70 bg-card/60 p-8"
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/12 text-primary">
          <KeyRound className="size-6" />
        </div>
        <h1 className="mt-4 text-center text-xl font-bold tracking-tight">
          Вход в панель
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Служебная страница. Введите логин и пароль.
        </p>

        <label className="mt-6 block">
          <span className="text-xs font-medium text-muted-foreground">Логин</span>
          <input
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoComplete="username"
            className="mt-1.5 h-11 w-full rounded-full border border-input bg-background/60 px-4 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/40"
            aria-label="Логин"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-xs font-medium text-muted-foreground">Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1.5 h-11 w-full rounded-full border border-input bg-background/60 px-4 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/40"
            aria-label="Пароль"
          />
        </label>

        {error ? (
          <p className="mt-3 text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          className="mt-5 h-11 w-full rounded-full"
          disabled={busy || !login.trim() || !password}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Войти
        </Button>
      </form>
    </div>
  )
}
