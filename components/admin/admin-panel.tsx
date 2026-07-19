'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  Search,
  ShieldAlert,
  ShoppingBag,
  UserRound,
  Wallet,
  Code2,
  Percent,
} from 'lucide-react'
import { formatUsd } from '@/lib/client-api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* ----------------------------- shared helpers ---------------------------- */

async function postAdmin<T = Record<string, unknown>>(
  action: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch(`/api/admin/${action}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error(data.error || `Ошибка запроса (${res.status})`)
  return data
}

function Notice({
  kind,
  children,
}: {
  kind: 'error' | 'success'
  children: React.ReactNode
}) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm',
        kind === 'error'
          ? 'border-destructive/40 bg-destructive/10'
          : 'border-[color-mix(in_oklch,var(--success)_40%,transparent)] bg-[color-mix(in_oklch,var(--success)_10%,transparent)]',
      )}
    >
      {kind === 'error' ? (
        <AlertCircle className="size-4 shrink-0 text-destructive" />
      ) : (
        <CheckCircle2 className="size-4 shrink-0 text-[var(--success)]" />
      )}
      <span>{children}</span>
    </div>
  )
}

/* --------------------------------- tabs ---------------------------------- */

const TABS = [
  { id: 'user', label: 'Пользователь', icon: UserRound },
  { id: 'blocks', label: 'Блокировки', icon: ShieldAlert },
  { id: 'api', label: 'API-клиенты', icon: Code2 },
] as const

type TabId = (typeof TABS)[number]['id']

export function AdminPanel() {
  const [tab, setTab] = useState<TabId>('user')

  return (
    <div className="mt-6">
      <div
        className="inline-flex items-center gap-0.5 rounded-full border border-white/[0.06] bg-white/[0.03] p-1"
        role="tablist"
        aria-label="Разделы админ-панели"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors',
              tab === t.id
                ? 'bg-primary font-medium text-primary-foreground shadow-[0_0_16px_-4px] shadow-primary/60'
                : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground',
            )}
          >
            <t.icon className="size-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'user' ? (
          <UserTab />
        ) : tab === 'blocks' ? (
          <BlocksTab />
        ) : (
          <ApiClientsTab />
        )}
      </div>
    </div>
  )
}

/* ------------------------------- user tab -------------------------------- */

interface AdminUser {
  telegramId?: number | string
  username?: string | null
  firstName?: string | null
  balance?: string | number
  referralBalance?: string | number
  totalPurchases?: number
  [key: string]: unknown
}

interface AdminPurchase {
  id: string | number
  countryName?: string | null
  countryCode?: string | null
  phoneNumber?: string | null
  price?: string | number | null
  chargedPrice?: string | number | null
  status?: string | null
  createdAt?: string | null
  quantity?: number | null
}

function UserTab() {
  const [query, setQuery] = useState('')
  const [user, setUser] = useState<AdminUser | null>(null)
  const [purchases, setPurchases] = useState<AdminPurchase[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function lookup() {
    const telegramId = Number(query.trim())
    if (!Number.isFinite(telegramId) || telegramId <= 0) {
      setError('Введите числовой Telegram ID')
      return
    }
    setLoading(true)
    setError(null)
    setUser(null)
    setPurchases(null)
    try {
      const res = await postAdmin<{ user?: AdminUser } & AdminUser>('user', {
        telegramId,
      })
      // The bridge may return the user nested ({ user: {...} }) or flat.
      const u = (res.user ?? res) as AdminUser
      setUser({ ...u, telegramId })
      const hist = await postAdmin<{ purchases?: AdminPurchase[] }>(
        'purchases',
        { telegramId },
      ).catch(() => ({ purchases: [] }))
      setPurchases(hist.purchases ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось найти пользователя')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-3xl border border-border/70 bg-card/60 p-6">
        <h2 className="text-base font-semibold">Найти пользователя</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Введите Telegram ID пользователя (виден в боте и в БД).
        </p>
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
            void lookup()
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              inputMode="numeric"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Например: 8784958749"
              className="h-11 w-full rounded-full border border-input bg-background/60 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/40"
              aria-label="Telegram ID"
            />
          </div>
          <Button type="submit" className="h-11 rounded-full px-6" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Найти
          </Button>
        </form>
        {error ? (
          <div className="mt-3">
            <Notice kind="error">{error}</Notice>
          </div>
        ) : null}
      </div>

      {user ? <UserCard user={user} onChanged={lookup} /> : null}
      {purchases ? <UserPurchases purchases={purchases} /> : null}
    </div>
  )
}

function UserCard({ user, onChanged }: { user: AdminUser; onChanged: () => void }) {
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState<'credit' | 'debit' | null>(null)
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  async function adjust(op: 'credit' | 'debit') {
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setMsg({ kind: 'error', text: 'Введите сумму больше нуля' })
      return
    }
    setBusy(op)
    setMsg(null)
    try {
      await postAdmin('balance', {
        telegramId: user.telegramId,
        amount: value,
        op,
      })
      setMsg({
        kind: 'success',
        text:
          op === 'credit'
            ? `Начислено ${formatUsd(value)} пользователю ${user.telegramId}`
            : `Списано ${formatUsd(value)} у пользователя ${user.telegramId}`,
      })
      setAmount('')
      onChanged()
    } catch (err) {
      setMsg({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Операция не ��ыполнена',
      })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="rounded-3xl border border-border/70 bg-card/60 p-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/12 text-primary">
          <UserRound className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {user.firstName || (user.username ? `@${user.username}` : `ID ${user.telegramId}`)}
          </p>
          <p className="text-sm text-muted-foreground">
            ID: <span className="font-mono">{String(user.telegramId)}</span>
            {user.username ? ` · @${user.username}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Баланс</p>
            <p className="text-lg font-bold tabular-nums text-primary">
              {formatUsd(user.balance)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Реф. баланс</p>
            <p className="text-lg font-bold tabular-nums">
              {formatUsd(user.referralBalance)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-background/40 p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Wallet className="size-4 text-primary" />
          Изменить баланс
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Сумма, $"
            className="h-11 flex-1 rounded-full border border-input bg-background/60 px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/40"
            aria-label="Сумма изменения баланса"
          />
          <Button
            className="h-11 rounded-full"
            onClick={() => adjust('credit')}
            disabled={busy !== null}
          >
            {busy === 'credit' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Начислить
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-full bg-transparent"
            onClick={() => adjust('debit')}
            disabled={busy !== null}
          >
            {busy === 'debit' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Minus className="size-4" />
            )}
            Списать
          </Button>
        </div>
        {msg ? (
          <div className="mt-3">
            <Notice kind={msg.kind}>{msg.text}</Notice>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function UserPurchases({ purchases }: { purchases: AdminPurchase[] }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-card/60 p-6">
      <p className="flex items-center gap-2 text-sm font-medium">
        <ShoppingBag className="size-4 text-primary" />
        Покупки пользователя{' '}
        <span className="text-muted-foreground">({purchases.length})</span>
      </p>
      {purchases.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Покупок нет.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Страна</th>
                <th className="pb-2 pr-4 font-medium">Номер</th>
                <th className="pb-2 pr-4 font-medium">Кол-во</th>
                <th className="pb-2 pr-4 font-medium">Цена</th>
                <th className="pb-2 pr-4 font-medium">Статус</th>
                <th className="pb-2 font-medium">Дата</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={String(p.id)} className="border-b border-border/40 last:border-0">
                  <td className="py-2.5 pr-4">
                    {p.countryName || p.countryCode || '—'}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs">
                    {p.phoneNumber || '—'}
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums">{p.quantity ?? 1}</td>
                  <td className="py-2.5 pr-4 tabular-nums">
                    {(p.price ?? p.chargedPrice) != null
                      ? formatUsd(p.price ?? p.chargedPrice)
                      : '—'}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs',
                        String(p.status).toUpperCase() === 'SUCCESS'
                          ? 'bg-[color-mix(in_oklch,var(--success)_15%,transparent)] text-[var(--success)]'
                          : 'bg-white/[0.06] text-muted-foreground',
                      )}
                    >
                      {p.status || '—'}
                    </span>
                  </td>
                  <td className="py-2.5 text-xs text-muted-foreground">
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ------------------------------ blocks tab -------------------------------- */

interface Flags {
  purchases: boolean
  bulk: boolean
  topup: boolean
  codes: boolean
  message: string
}

const FLAG_LABELS: Array<{ key: keyof Omit<Flags, 'message'>; label: string; hint: string }> = [
  { key: 'purchases', label: 'Покупка аккаунтов', hint: 'Поштучная покупка в магазине' },
  { key: 'bulk', label: 'Оптовые покупки', hint: 'Покупка нескольких аккаунтов архивом' },
  { key: 'topup', label: 'Пополнение баланса', hint: 'Создание счетов CryptoBot / Heleket' },
  { key: 'codes', label: 'Получение кодов', hint: 'Выдача кодов входа после покупки' },
]

function BlocksTab() {
  const { data, mutate, isLoading } = useSWR('admin-flags', () =>
    postAdmin<{ flags: Flags }>('flags-get'),
  )
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  const flags = data?.flags

  async function toggle(key: keyof Omit<Flags, 'message'>, value: boolean) {
    setNotice(null)
    try {
      const res = await postAdmin<{ flags: Flags }>('flags-set', { [key]: value })
      mutate({ flags: res.flags }, { revalidate: false })
      setNotice({
        kind: 'success',
        text: value
          ? 'Функция включена — пользователи снова могут ей пользов��ться.'
          : 'Функция заблокирована — пользователи увидят сообщение о тех. работах.',
      })
    } catch (err) {
      setNotice({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Не удалось сохранить',
      })
    }
  }

  async function saveMessage() {
    if (message == null) return
    setSaving(true)
    setNotice(null)
    try {
      const res = await postAdmin<{ flags: Flags }>('flags-set', { message })
      mutate({ flags: res.flags }, { revalidate: false })
      setNotice({ kind: 'success', text: 'Сообщение обновлено.' })
      setMessage(null)
    } catch (err) {
      setNotice({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Не удалось сохранить',
      })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !flags) {
    return (
      <div className="flex items-center gap-2 rounded-3xl border border-border/70 bg-card/60 p-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Загружаем настройки...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-3xl border border-border/70 bg-card/60 p-6">
        <h2 className="text-base font-semibold">Блокировка функций</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Выключенная функция сразу блокируется для всех пользователей сайта —
          они увидят сообщение о технических работах.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          {FLAG_LABELS.map((f) => {
            const enabled = flags[f.key]
            return (
              <div
                key={f.key}
                className={cn(
                  'flex items-center justify-between gap-4 rounded-2xl border p-4 transition-colors',
                  enabled
                    ? 'border-border/60 bg-background/40'
                    : 'border-destructive/40 bg-destructive/10',
                )}
              >
                <div>
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{f.hint}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`${f.label}: ${enabled ? 'включено' : 'заблокировано'}`}
                  onClick={() => toggle(f.key, !enabled)}
                  className={cn(
                    'relative h-7 w-12 shrink-0 rounded-full border transition-colors',
                    enabled
                      ? 'border-primary/60 bg-primary'
                      : 'border-border bg-white/[0.06]',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 size-5.5 rounded-full bg-white shadow transition-transform',
                      enabled ? 'translate-x-[22px]' : 'translate-x-0.5',
                    )}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-border/70 bg-card/60 p-6">
        <h2 className="text-base font-semibold">Сообщение при блокировке</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Этот текст увидит пользователь при попытке воспользоваться
          заблокированной функцией.
        </p>
        <textarea
          value={message ?? flags.message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="mt-4 w-full resize-none rounded-2xl border border-input bg-background/60 px-4 py-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/40"
          aria-label="Сообщение о технических работах"
        />
        <div className="mt-3 flex justify-end">
          <Button
            className="rounded-full"
            onClick={saveMessage}
            disabled={saving || message == null || message.trim() === ''}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Сохранить сообщение
          </Button>
        </div>
      </div>

      {notice ? <Notice kind={notice.kind}>{notice.text}</Notice> : null}
    </div>
  )
}

/* ----------------------------- api clients tab --------------------------- */

interface ApiClient {
  id: string
  email: string
  name: string
  createdAt: string
  balance: number
  totalSpent: number
  totalTopup: number
  tier: string
}

interface ApiClientDetail extends ApiClient {
  revenue: number
  cost: number
  profit: number
  successCount: number
  keys: Array<{ id: string; prefix: string; name: string; status: string }>
  purchases: Array<{
    id: string
    country: string
    price: number
    status: string
    mode: string
    createdAt: string
  }>
  transactions: Array<{
    id: string
    type: string
    amount: number
    balanceAfter: number
    description: string | null
    createdAt: string
  }>
}

function ApiClientsTab() {
  const [query, setQuery] = useState('')
  const [clients, setClients] = useState<ApiClient[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<ApiClientDetail | null>(null)
  const [notice, setNotice] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)
  const [markup, setMarkup] = useState<number | null>(null)
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    setNotice(null)
    try {
      const data = await postAdmin<{ clients: ApiClient[] }>('api-clients', { query })
      setClients(data.clients)
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Ошибка' })
    } finally {
      setLoading(false)
    }
  }

  async function loadMarkup() {
    try {
      const d = await postAdmin<{ markupPercent: number }>('api-markup-get')
      setMarkup(d.markupPercent)
    } catch {
      /* ignore */
    }
  }

  async function openClient(id: string) {
    setNotice(null)
    try {
      const detail = await postAdmin<ApiClientDetail>('api-client', { userId: id })
      setSelected(detail)
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Ошибка' })
    }
  }

  async function adjust(op: 'credit' | 'debit') {
    if (!selected) return
    const value = Number(amount)
    if (!(value > 0)) return
    setBusy(true)
    setNotice(null)
    try {
      await postAdmin('api-balance', { userId: selected.id, amount: value, op })
      setAmount('')
      await openClient(selected.id)
      await load()
      setNotice({ kind: 'success', text: 'Баланс обновлён' })
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Ошибка' })
    } finally {
      setBusy(false)
    }
  }

  async function block() {
    if (!selected) return
    if (!confirm('Отозвать все API-ключи этого клиента?')) return
    setBusy(true)
    try {
      await postAdmin('api-block', { userId: selected.id })
      await openClient(selected.id)
      setNotice({ kind: 'success', text: 'Ключи отозваны' })
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Ошибка' })
    } finally {
      setBusy(false)
    }
  }

  async function saveMarkup() {
    if (markup == null) return
    setBusy(true)
    try {
      const d = await postAdmin<{ markupPercent: number }>('api-markup-set', {
        markupPercent: markup,
      })
      setMarkup(d.markupPercent)
      setNotice({ kind: 'success', text: 'Наценка сохранена' })
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Ошибка' })
    } finally {
      setBusy(false)
    }
  }

  // Load list + markup once on mount.
  if (markup == null && !loading && clients.length === 0) {
    void loadMarkup()
    void load()
  }

  const nf = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

  return (
    <div className="space-y-5">
      {/* Markup setting */}
      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Percent className="size-4 text-primary" />
          Наценка API по умолчанию
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Процент наценки поверх себестоимости для всех API-клиентов.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={0}
            step={1}
            value={markup ?? ''}
            onChange={(e) => setMarkup(Number(e.target.value))}
            className="h-10 w-28 rounded-full border border-input bg-background/60 px-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
            aria-label="Наценка в процентах"
          />
          <span className="text-sm text-muted-foreground">%</span>
          <Button className="rounded-full" onClick={saveMarkup} disabled={busy || markup == null}>
            Сохранить
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && load()}
            placeholder="Поиск по email или имени"
            className="h-11 w-full rounded-full border border-input bg-background/60 pl-11 pr-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
            aria-label="Поиск API-клиентов"
          />
        </div>
        <Button className="rounded-full" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : 'Найти'}
        </Button>
      </div>

      {notice ? <Notice kind={notice.kind}>{notice.text}</Notice> : null}

      {/* List */}
      <div className="overflow-hidden rounded-3xl border border-white/[0.06]">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.03] text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Клиент</th>
              <th className="px-4 py-3 font-medium">Уровень</th>
              <th className="px-4 py-3 text-right font-medium">Баланс</th>
              <th className="px-4 py-3 text-right font-medium">Потрачено</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {loading ? 'Загрузка…' : 'Клиентов не найдено'}
                </td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{c.email}</p>
                    <p className="text-xs text-muted-foreground">{c.name}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.tier}</td>
                  <td className="px-4 py-3 text-right">{nf.format(c.balance)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {nf.format(c.totalSpent)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full bg-transparent"
                      onClick={() => openClient(c.id)}
                    >
                      Открыть
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{selected.email}</h3>
                <p className="text-xs text-muted-foreground">
                  {selected.tier} · с {new Date(selected.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full px-3 py-1 text-sm text-muted-foreground hover:bg-white/[0.06]"
              >
                Закрыть
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Баланс" value={nf.format(selected.balance)} />
              <Stat label="Потрачено" value={nf.format(selected.totalSpent)} />
              <Stat label="Выручка" value={nf.format(selected.revenue)} />
              <Stat label="Прибыль" value={nf.format(selected.profit)} />
            </div>

            <div className="mt-5 rounded-2xl border border-white/[0.06] p-4">
              <p className="text-xs font-medium text-muted-foreground">Корректировка баланса</p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Сумма"
                  className="h-10 w-32 rounded-full border border-input bg-background/60 px-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                  aria-label="Сумма корректировки"
                />
                <Button
                  size="sm"
                  className="rounded-full"
                  onClick={() => adjust('credit')}
                  disabled={busy}
                >
                  <Plus className="size-4" /> Начислить
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full bg-transparent"
                  onClick={() => adjust('debit')}
                  disabled={busy}
                >
                  <Minus className="size-4" /> Списать
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto rounded-full border-destructive/40 bg-transparent text-destructive"
                  onClick={block}
                  disabled={busy}
                >
                  Отозвать ключи
                </Button>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Последние покупки ({selected.successCount} успешных)
              </p>
              <div className="space-y-1">
                {selected.purchases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Покупок нет</p>
                ) : (
                  selected.purchases.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-sm"
                    >
                      <span className="text-foreground">
                        {p.country}
                        {p.mode === 'bulk' ? ' (опт)' : ''}
                      </span>
                      <span className="text-muted-foreground">{p.status}</span>
                      <span className="text-foreground">{nf.format(p.price)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
