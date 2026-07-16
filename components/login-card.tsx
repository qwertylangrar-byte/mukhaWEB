'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send, ShieldCheck } from 'lucide-react'
import { LogoMark } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useLang } from '@/lib/i18n'

type LoginState = 'idle' | 'starting' | 'waiting' | 'confirmed' | 'error'

const POLL_INTERVAL_MS = 2000
const MAX_WAIT_MS = 5 * 60 * 1000

export function LoginCard() {
  const router = useRouter()
  const { t } = useLang()
  const [state, setState] = useState<LoginState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  useEffect(() => stopPolling, [stopPolling])

  const startLogin = useCallback(async () => {
    stopPolling()
    setError(null)
    setState('starting')
    try {
      const res = await fetch('/api/auth/start', { method: 'POST' })
      const data = (await res.json()) as {
        code?: string
        link?: string
        error?: string
      }
      if (!res.ok || !data.code || !data.link) {
        throw new Error(data.error ?? t.login.startFailed)
      }
      setLink(data.link)
      setState('waiting')
      window.open(data.link, '_blank', 'noopener')

      const startedAt = Date.now()
      const code = data.code
      pollRef.current = setInterval(async () => {
        if (Date.now() - startedAt > MAX_WAIT_MS) {
          stopPolling()
          setState('error')
          setError(t.login.timedOut)
          return
        }
        try {
          const statusRes = await fetch(
            `/api/auth/status?code=${encodeURIComponent(code)}`,
            { cache: 'no-store' },
          )
          const status = (await statusRes.json()) as { status?: string }
          if (status.status === 'confirmed') {
            stopPolling()
            setState('confirmed')
            router.replace('/shop')
            router.refresh()
          } else if (status.status === 'expired') {
            stopPolling()
            setState('error')
            setError(t.login.codeExpired)
          }
        } catch {
          // network hiccup — keep polling
        }
      }, POLL_INTERVAL_MS)
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : t.login.loginError)
    }
  }, [router, stopPolling, t])

  const busy = state === 'starting' || state === 'confirmed'

  return (
    <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card/70 p-8 text-center shadow-[0_0_60px_-20px] shadow-primary/30">
      <div className="flex justify-center">
        <LogoMark className="size-12 rounded-2xl text-base" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">{t.login.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t.login.text}
      </p>

      {state === 'waiting' ? (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
            <Loader2 className="size-4 animate-spin" />
            {t.login.waiting}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {t.login.openBot}{' '}
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                {t.login.followLink}
              </a>
            ) : (
              t.login.tryAgain
            )}
            .
          </p>
        </div>
      ) : (
        <Button
          className="mt-6 h-11 w-full rounded-full text-sm"
          onClick={startLogin}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          {state === 'confirmed' ? t.login.loggingIn : t.nav.loginTg}
        </Button>
      )}

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" />
        {t.login.secure}
      </p>
    </div>
  )
}
