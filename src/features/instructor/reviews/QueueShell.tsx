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
  cohortTabs,
  activeCohort,
  onCohort,
}: {
  q: string
  onSearch: (v: string) => void
  searchPlaceholder: string
  tabs: QueueTab<K>[]
  active: K
  onTab: (k: K) => void
  // 선택형 기수 필터 — 제공 시 카테고리/상태 탭 위에 기수 칩 줄을 우측 정렬로 렌더. (대시보드 기수 칩과 동일 맥락)
  cohortTabs?: string[]
  activeCohort?: string
  onCohort?: (c: string) => void
}) {
  const showCohort = cohortTabs && cohortTabs.length > 0 && onCohort
  return (
    <>
      {showCohort && (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <span className="text-fg-subtle mr-1 text-xs font-medium">기수</span>
          {cohortTabs.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onCohort(c)}
              aria-pressed={activeCohort === c}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium',
                activeCohort === c
                  ? 'bg-accent-bg text-accent-strong'
                  : 'text-fg-muted hover:bg-surface-muted',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="border-border focus-within:border-brand flex h-9 w-64 items-center gap-2 rounded-lg border bg-white px-3">
          <Search className="text-fg-subtle h-4 w-4" />
          <input
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="text-fg placeholder:text-fg-subtle w-full bg-transparent text-sm outline-none focus-visible:shadow-none"
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
            {t.label}{' '}
            <span className="text-fg-subtle text-xs">({t.count})</span>
          </button>
        ))}
      </div>
    </>
  )
}
