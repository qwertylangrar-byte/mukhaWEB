'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { AlertCircle, Loader2, Search } from 'lucide-react'
import { swrPost, formatUsd } from '@/lib/client-api'
import { Flag } from '@/components/flag'
import { PurchaseDialog, type Country } from '@/components/cabinet/purchase-dialog'

interface CountriesResponse {
  countries?: Array<Record<string, unknown>>
}

function normalizeCountry(raw: Record<string, unknown>): Country | null {
  const code = String(raw.countryCode ?? raw.code ?? '')
  if (!code) return null
  return {
    code,
    name: String(raw.name ?? raw.countryName ?? code),
    price: String(raw.price ?? raw.displayPrice ?? '0'),
    available: Number(raw.available ?? raw.count ?? raw.quantity ?? 0),
  }
}

export function ShopCatalog() {
  const { data, error, isLoading } = useSWR(
    'countries',
    swrPost<CountriesResponse>('countries'),
    { refreshInterval: 60000 },
  )
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Country | null>(null)

  const countries = (data?.countries ?? [])
    .map(normalizeCountry)
    .filter((c): c is Country => c !== null)
    .filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="mt-6">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск страны..."
          className="h-10 w-full rounded-full border border-input bg-card/60 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/40"
          aria-label="Поиск страны"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Загружаем каталог...
        </div>
      ) : error ? (
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">
              Каталог временно недоступен
            </p>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              {error instanceof Error ? error.message : 'Ошибка соединения с ботом.'}
            </p>
          </div>
        </div>
      ) : countries.length === 0 ? (
        <p className="py-24 text-center text-sm text-muted-foreground">
          Ничего не найдено.
        </p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((c) => {
            const inStock = c.available > 0
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => inStock && setSelected(c)}
                disabled={!inStock}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/70 p-5 text-left shadow-[0_4px_24px_-12px_rgba(0,0,0,0.7)] transition-all enabled:hover:-translate-y-0.5 enabled:hover:border-primary/50 enabled:hover:bg-card enabled:hover:shadow-[0_8px_32px_-12px] enabled:hover:shadow-primary/25 disabled:opacity-50"
              >
                <span className="flex items-center gap-3">
                  <Flag code={c.code} className="h-7 w-10" />
                  <span>
                    <span className="block font-medium">{c.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {inStock
                        ? `В наличии: ${c.available}`
                        : 'Нет в наличии'}
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
