import { cn } from '@/shared/lib/cn'
import type { MaterialCategory, MaterialCategoryCount } from '../../types'

// 자료실 카테고리 필터 칩 — 전체 + 강의 자료/실습/참고/학생 공유. 활성 칩은 brand-deep 강조.
const DOT: Record<MaterialCategory, string> = {
  lecture: 'bg-brand',
  practice: 'bg-success',
  reference: 'bg-info',
  shared: 'bg-accent-strong',
}

export type CategoryKey = 'all' | MaterialCategory

export function MaterialCategoryChips({
  categories,
  active,
  onChange,
}: {
  categories: MaterialCategoryCount[]
  active: CategoryKey
  onChange: (key: CategoryKey) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {categories.map((c) => {
        const isActive = c.key === active
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-[10px] px-3.5 py-[7px]',
              isActive ? 'bg-brand-deep' : 'border-border bg-surface border',
            )}
          >
            {c.key !== 'all' && !isActive && (
              <span className={cn('size-1.5 rounded-full', DOT[c.key])} />
            )}
            <span
              className={cn(
                'text-[13px] font-medium',
                isActive ? 'font-bold text-white' : 'text-fg',
              )}
            >
              {c.label}
            </span>
            <span
              className={cn(
                'rounded-[5px] px-1.5 py-0.5 text-[11px] font-bold',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-surface-muted text-fg-muted',
              )}
            >
              {c.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
