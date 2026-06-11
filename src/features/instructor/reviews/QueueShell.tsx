import { Search } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { ReviewStat } from '@/shared/types'

// 검토 3종(§13~§15) 공용 골격 — KPI 스탯 4 + 검색·상태 탭 줄. (Figma 1422:10009 외)

export function QueueStats({ stats }: { stats: ReviewStat[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="border-border bg-surface rounded-xl border p-4"
        >
          <p className="text-fg-muted text-xs font-medium">{s.label}</p>
          <p className="text-fg mt-1.5 text-2xl font-bold">
            {s.value}{' '}
            <span className="text-fg-subtle text-sm font-medium">{s.unit}</span>
          </p>
        </div>
      ))}
    </div>
  )
}

export interface QueueTab<K extends string> {
  key: K
  label: string
  count: number
}

export function QueueFilterBar<K extends string>({
  q,
  onSearch,
  searchPlaceholder,
  tabs,
  active,
  onTab,
}: {
  q: string
  onSearch: (v: string) => void
  searchPlaceholder: string
  tabs: QueueTab<K>[]
  active: K
  onTab: (k: K) => void
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <div className="border-border flex h-9 w-64 items-center gap-2 rounded-lg border bg-white px-3">
        <Search className="text-fg-subtle h-4 w-4" />
        <input
          value={q}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="text-fg placeholder:text-fg-subtle w-full bg-transparent text-sm outline-none"
        />
      </div>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onTab(t.key)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium',
            active === t.key
              ? 'bg-accent-bg text-accent-strong'
              : 'text-fg-muted hover:bg-surface-muted',
          )}
        >
          {t.label} <span className="text-fg-subtle text-xs">({t.count})</span>
        </button>
      ))}
    </div>
  )
}
