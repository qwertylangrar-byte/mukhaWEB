'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CodeTab {
  label: string
  language: string
  code: string
}

export function CodeBlock({
  tabs,
  className,
}: {
  tabs: CodeTab[]
  className?: string
}) {
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)
  const current = tabs[active]

  async function copy() {
    try {
      await navigator.clipboard.writeText(current.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-white/[0.08] bg-[oklch(0.08_0.015_260/0.9)] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] px-2 pr-2.5">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                'whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                i === active
                  ? 'text-foreground'
                  : 'text-foreground/50 hover:text-foreground/80',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-foreground/60 transition-colors hover:bg-white/[0.06] hover:text-foreground"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-400" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="fancy-scroll overflow-x-auto px-4 py-4 text-[13px] leading-relaxed">
        <code className="font-mono text-foreground/90">{current.code}</code>
      </pre>
    </div>
  )
}
