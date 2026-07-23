'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Lock, Mail, User } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export function DevAuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSignUp = mode === 'sign-up'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = isSignUp
        ? await authClient.signUp.email({ email, password, name: name || email })
        : await authClient.signIn.email({ email, password })
      if (result.error) {
        setError(result.error.message ?? 'Что-то пошло не так.')
        setLoading(false)
        return
      }
      router.push('/developers/dashboard')
      router.refresh()
    } catch {
      setError('Не удалось выполнить запрос. Попробуйте ещё раз.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[oklch(0.1_0.02_260/0.7)] p-8 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
      <h1 className="text-2xl font-light tracking-tight">
        {isSignUp ? 'Регистрация разработчика' : 'Вход для разработчиков'}
      </h1>
      <p className="mt-1.5 text-sm font-light text-foreground/75">
        {isSignUp
          ? 'Создайте аккаунт, чтобы получить API-ключ и баланс.'
          : 'Войдите, чтобы управлять ключами и балансом.'}
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
        {isSignUp && (
          <Field
            icon={<User className="size-4" />}
            type="text"
            placeholder="Имя или название проекта"
            value={name}
            onChange={setName}
            autoComplete="name"
          />
        )}
        <Field
          icon={<Mail className="size-4" />}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />
        <Field
          icon={<Lock className="size-4" />}
          type="password"
          placeholder="Пароль (мин. 8 символов)"
          value={password}
          onChange={setPassword}
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          required
          minLength={8}
        />

        {error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="mt-2 h-11 w-full rounded-xl text-sm"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          {isSignUp ? 'Создать аккаунт' : 'Войти'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm font-light text-foreground/75">
        {isSignUp ? (
          <>
            Уже есть аккаунт?{' '}
            <Link href="/developers/sign-in" className="text-primary hover:underline">
              Войти
            </Link>
          </>
        ) : (
          <>
            Нет аккаунта?{' '}
            <Link href="/developers/sign-up" className="text-primary hover:underline">
              Зарегистрироваться
            </Link>
          </>
        )}
      </p>
    </div>
  )
}

function Field({
  icon,
  value,
  onChange,
  ...props
}: {
  icon: React.ReactNode
  value: string
  onChange: (v: string) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 focus-within:border-white/[0.2]">
      <span className="text-foreground/60">{icon}</span>
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/50"
      />
    </div>
  )
}
