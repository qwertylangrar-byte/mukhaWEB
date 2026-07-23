'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Copy,
  Check,
  Plus,
  Trash2,
  KeyRound,
  Wallet,
  Webhook,
  Loader2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  addWebhook,
  createKey,
  removeWebhook,
  revokeKey,
  startTopup,
  type Overview,
} from '@/app/developers/actions'

const nf = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function Panel({
  title,
  icon,
  children,
  action,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="text-primary">{icon}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function DevDashboard({ data }: { data: Overview }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [newKey, setNewKey] = useState<string | null>(null)
  const [keyName, setKeyName] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [topupAmount, setTopupAmount] = useState('20')
  const [topupError, setTopupError] = useState<string | null>(null)
  const [whUrl, setWhUrl] = useState('')
  const [whSecret, setWhSecret] = useState('')
  const [busy, setBusy] = useState(false)

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  async function handleCreateKey() {
    setBusy(true)
    try {
      const { key } = await createKey(keyName)
      setNewKey(key)
      setKeyName('')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function handleTopup() {
    setTopupError(null)
    const amount = Number(topupAmount)
    if (!(amount >= 5)) {
      setTopupError('Минимальное пополнение — $5.')
      return
    }
    setBusy(true)
    try {
      const res = await startTopup(amount)
      if (res.url) {
        window.location.href = res.url
      } else {
        setTopupError(res.error ?? 'Не удалось создать счёт.')
      }
    } finally {
      setBusy(false)
    }
  }

  const spentPct = data.nextTier
    ? Math.min(
        100,
        Math.round(
          (data.totalSpent / (data.totalSpent + data.nextTier.spendNeeded)) * 100,
        ),
      )
    : 100

  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
      {/* Balance */}
      <Panel title="Баланс" icon={<Wallet size={16} />}>
        <p className="text-3xl font-semibold text-foreground">
          {nf.format(data.balance)}
        </p>
        <div className="mt-3 flex gap-4 text-xs text-foreground/80">
          <span>Пополнено: {nf.format(data.totalTopup)}</span>
          <span>Потрачено: {nf.format(data.totalSpent)}</span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <input
            type="number"
            min={5}
            step={5}
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
            className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
            aria-label="Сумма пополнения"
          />
          <Button onClick={handleTopup} disabled={busy || !data.heleketReady}>
            {busy ? <Loader2 className="animate-spin" size={16} /> : 'Пополнить'}
          </Button>
        </div>
        {!data.heleketReady && (
          <p className="mt-2 text-xs text-amber-400/80">
            Платёжный провайдер не настроен.
          </p>
        )}
        {topupError && (
          <p className="mt-2 text-xs text-red-400">{topupError}</p>
        )}
      </Panel>

      {/* Tier */}
      <Panel title="Уровень скидки" icon={<ShieldCheck size={16} />}>
        <p className="text-2xl font-semibold text-foreground">{data.tier.name}</p>
        <p className="mt-1 text-sm text-primary">
          Скидка {data.tier.discountPercent}%
        </p>
        {data.nextTier ? (
          <>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${spentPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-foreground/80">
              Ещё {nf.format(data.nextTier.spendNeeded)} до уровня «
              {data.nextTier.name}»
            </p>
          </>
        ) : (
          <p className="mt-4 text-xs text-foreground/80">
            Максимальный уровень достигнут.
          </p>
        )}
      </Panel>

      {/* Quick links */}
      <Panel title="Документация" icon={<ExternalLink size={16} />}>
        <p className="text-sm text-foreground/70">
          Полный справочник по эндпоинтам, авторизации и вебхукам.
        </p>
        <Button
          nativeButton={false}
          variant="outline"
          className="mt-4"
          render={<a href="/developers/docs" />}
        >
          Открыть документацию
        </Button>
      </Panel>

      {/* API Keys */}
      <div className="lg:col-span-2">
        <Panel
          title="API-ключи"
          icon={<KeyRound size={16} />}
          action={
            <div className="flex items-center gap-2">
              <input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Название"
                className="w-28 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary/60"
              />
              <Button onClick={handleCreateKey} disabled={busy} className="h-8 px-3 text-xs">
                <Plus size={14} /> Создать
              </Button>
            </div>
          }
        >
          {newKey && (
            <div className="mb-4 rounded-xl border border-primary/40 bg-primary/10 p-3">
              <p className="text-xs text-foreground/70">
                Скопируйте ключ — он показывается только один раз:
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg bg-black/40 px-3 py-2 font-mono text-xs text-primary">
                  {newKey}
                </code>
                <Button
                  onClick={() => copy(newKey, 'new')}
                  variant="outline"
                  className="h-8 px-3"
                >
                  {copied === 'new' ? <Check size={14} /> : <Copy size={14} />}
                </Button>
              </div>
            </div>
          )}
          {data.keys.length === 0 ? (
            <p className="text-sm text-foreground/70">Ключей пока нет.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {data.keys.map((k) => (
                <li key={k.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {k.name}{' '}
                      <span className="font-mono text-xs text-foreground/70">
                        {k.prefix}…
                      </span>
                    </p>
                    <p className="text-xs text-foreground/70">
                      {k.status === 'active' ? 'Активен' : 'Отозван'} ·{' '}
                      {new Date(k.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  {k.status === 'active' && (
                    <Button
                      onClick={() =>
                        startTransition(async () => {
                          await revokeKey(k.id)
                          router.refresh()
                        })
                      }
                      disabled={pending}
                      variant="ghost"
                      className="h-8 px-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Webhooks */}
      <Panel title="Вебхуки" icon={<Webhook size={16} />}>
        <div className="flex flex-col gap-2">
          <input
            value={whUrl}
            onChange={(e) => setWhUrl(e.target.value)}
            placeholder="https://ваш-сайт/webhook"
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
          />
          <input
            value={whSecret}
            onChange={(e) => setWhSecret(e.target.value)}
            placeholder="Секрет (необязательно)"
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
          />
          <Button
            onClick={() =>
              startTransition(async () => {
                try {
                  await addWebhook(whUrl, whSecret)
                  setWhUrl('')
                  setWhSecret('')
                  router.refresh()
                } catch (e) {
                  alert(e instanceof Error ? e.message : 'Ошибка')
                }
              })
            }
            disabled={pending || !whUrl}
            variant="outline"
          >
            <Plus size={14} /> Добавить вебхук
          </Button>
        </div>
        {data.webhooks.length > 0 && (
          <ul className="mt-4 divide-y divide-white/5">
            {data.webhooks.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 truncate text-xs text-foreground/70">
                  {w.url}
                </span>
                <Button
                  onClick={() =>
                    startTransition(async () => {
                      await removeWebhook(w.id)
                      router.refresh()
                    })
                  }
                  disabled={pending}
                  variant="ghost"
                  className="h-7 px-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 size={13} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Transactions */}
      <div className="lg:col-span-3">
        <Panel title="История операций" icon={<Wallet size={16} />}>
          {data.transactions.length === 0 ? (
            <p className="text-sm text-foreground/70">Операций пока нет.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-foreground/70">
                    <th className="pb-2 font-medium">Дата</th>
                    <th className="pb-2 font-medium">Тип</th>
                    <th className="pb-2 font-medium">Описание</th>
                    <th className="pb-2 text-right font-medium">Сумма</th>
                    <th className="pb-2 text-right font-medium">Баланс</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.transactions.map((t) => (
                    <tr key={t.id} className="text-foreground/80">
                      <td className="py-2 text-xs text-foreground/70">
                        {new Date(t.createdAt).toLocaleString('ru-RU')}
                      </td>
                      <td className="py-2">{t.type}</td>
                      <td className="py-2 text-foreground/80">{t.description}</td>
                      <td
                        className={`py-2 text-right font-medium ${
                          t.amount >= 0 ? 'text-emerald-400' : 'text-foreground'
                        }`}
                      >
                        {t.amount >= 0 ? '+' : ''}
                        {nf.format(t.amount)}
                      </td>
                      <td className="py-2 text-right text-foreground/80">
                        {nf.format(t.balanceAfter)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
