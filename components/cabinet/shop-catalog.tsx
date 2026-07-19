'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR, { mutate } from 'swr'
import {
  AlertCircle,
  Check,
  ChevronDown,
  Flame,
  Loader2,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { swrPost, formatUsd } from '@/lib/client-api'
import { Flag } from '@/components/flag'
import { PurchaseDialog, type Country } from '@/components/cabinet/purchase-dialog'
import { cn } from '@/lib/utils'
import { localizedCountryName, useLang, type Lang } from '@/lib/i18n'

type SortMode = 'popular' | 'price-asc' | 'price-desc'

const SORT_ICONS: Record<SortMode, typeof Flame> = {
  popular: Flame,
  'price-asc': TrendingDown,
  'price-desc': TrendingUp,
}

function sortCountries(list: Country[], mode: SortMode): Country[] {
  const sorted = [...list]
  switch (mode) {
    case 'price-asc':
      sorted.sort((a, b) => Number(a.price) - Number(b.price))
      break
    case 'price-desc':
      sorted.sort((a, b) => Number(b.price) - Number(a.price))
      break
    default:
      // Popularity: the biggest stock first (in-stock always above sold out)
      sorted.sort((a, b) => b.available - a.available)
  }
  return sorted
}

interface CountriesResponse {
  countries?: Array<Record<string, unknown>>
}

function SortDropdown({
  value,
  options,
  label,
  onChange,
}: {
  value: SortMode
  options: Array<{ value: SortMode; label: string }>
  label: string
  onChange: (v: SortMode) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const active = options.find((o) => o.value === value) ?? options[0]
  const ActiveIcon = SORT_ICONS[value]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className={cn(
          'flex h-10 items-center gap-2 rounded-full border bg-card/60 pl-3.5 pr-3 text-sm transition-colors',
          open
            ? 'border-primary/60 ring-2 ring-ring/30'
            : 'border-input hover:border-primary/40 hover:bg-card',
        )}
      >
        <ActiveIcon className="size-4 text-primary" />
        <span className="font-medium">{active.label}</span>
        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-2xl border border-border/70 bg-popover/95 p-1.5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        >
          {options.map((o) => {
            const Icon = SORT_ICONS[o.value]
            const selected = o.value === value
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors',
                  selected
                    ? 'bg-primary/15 font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground',
                )}
              >
                <Icon
                  className={cn(
                    'size-4 shrink-0',
                    selected ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <span className="flex-1">{o.label}</span>
                {selected ? <Check className="size-4 text-primary" /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function normalizeCountry(
  raw: Record<string, unknown>,
  lang: Lang,
): Country | null {
  const code = String(raw.countryCode ?? raw.code ?? '')
  if (!code) return null
  const botName = String(raw.name ?? raw.countryName ?? code)
  return {
    code,
    name: localizedCountryName(lang, code, botName),
    price: String(raw.price ?? raw.displayPrice ?? '0'),
    available: Number(raw.available ?? raw.count ?? raw.quantity ?? 0),
  }
}

async function fetchPublicCountries(): Promise<CountriesResponse> {
  const res = await fetch('/api/public/countries', { cache: 'no-store' })
  const data = (await res.json().catch(() => ({}))) as CountriesResponse & {
    error?: string
  }
  if (!res.ok) {
    throw new Error(data.error || `Ошибка запроса (${res.status})`)
  }
  return data
}

export function ShopCatalog({ publicMode = false }: { publicMode?: boolean }) {
  const { t, lang } = useLang()
  const router = useRouter()
  const { data, error, isLoading } = useSWR(
    publicMode ? 'public-countries' : 'countries',
    publicMode ? fetchPublicCountries : swrPost<CountriesResponse>('countries'),
    { refreshInterval: 60000 },
  )
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortMode>('popular')
  const [selected, setSelected] = useState<Country | null>(null)

  const sortOptions: Array<{ value: SortMode; label: string }> = [
    { value: 'popular', label: t.shop.sortPopular },
    { value: 'price-asc', label: t.shop.sortCheap },
    { value: 'price-desc', label: t.shop.sortExpensive },
  ]

  const countries = sortCountries(
    (data?.countries ?? [])
      .map((raw) => normalizeCountry(raw, lang))
      .filter((c): c is Country => c !== null)
      .filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())),
    sort,
  )

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
        <div className="relative w-full flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.shop.searchPlaceholder}
            className="h-10 w-full rounded-full border border-input bg-card/60 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/40"
            aria-label={t.shop.searchLabel}
          />
        </div>
        <SortDropdown
          value={sort}
          options={sortOptions}
          label={t.shop.sortLabel}
          onChange={setSort}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {t.shop.loading}
        </div>
      ) : error ? (
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">{t.shop.unavailable}</p>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              {error instanceof Error ? error.message : t.shop.connError}
            </p>
          </div>
        </div>
      ) : countries.length === 0 ? (
        <p className="py-24 text-center text-sm text-muted-foreground">
          {t.shop.nothing}
        </p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((c) => {
            const inStock = c.available > 0
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  if (!inStock) return
                  if (publicMode) {
                    router.push('/login')
                    return
                  }
                  setSelected(c)
                }}
                disabled={!inStock}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/70 p-5 text-left shadow-[0_4px_24px_-12px_rgba(0,0,0,0.7)] transition-all enabled:hover:-translate-y-0.5 enabled:hover:border-primary/50 enabled:hover:bg-card enabled:hover:shadow-[0_8px_32px_-12px] enabled:hover:shadow-primary/25 disabled:opacity-50"
              >
                <span className="flex items-center gap-3">
                  <Flag code={c.code} className="h-7 w-10" />
                  <span>
                    <span className="block font-medium">{c.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {inStock ? t.shop.inStock(c.available) : t.shop.outOfStock}
                    </span>
                  </span>
                </span>
                <span className="rounded-full bg-primary/12 px-3 py-1 text-sm font-semibold tabular-nums text-primary">
                  {formatUsd(c.price)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {selected ? (
        <PurchaseDialog
          country={selected}
          onClose={() => setSelected(null)}
          onPurchased={() => {
            mutate('me')
            mutate('countries')
          }}
        />
      ) : null}
    </div>
  )
}
