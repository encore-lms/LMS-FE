import { cn } from '@/shared/lib/cn'
import type { RecordStat, Tone } from '../types'

// 기록실 요약 통계 4종 — 전체 기록 / 승인 완료 / 검토 중 / 반려.
const DOT: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}

export function RecordStatCards({ stats }: { stats: RecordStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.key}
          className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-fg-muted text-[12px] font-medium">
              {s.label}
            </span>
            <span className={cn('size-2 rounded-full', DOT[s.dotTone])} />
          </div>
          <span className="text-fg text-[28px] leading-none font-bold">
            {s.value}
            <span className="text-fg-muted ml-1 text-[14px] font-medium">
              {s.unit}
            </span>
          </span>
          <span className="text-fg-subtle border-divider border-t pt-2.5 text-[11px]">
            {s.sub}
          </span>
        </div>
      ))}
    </div>
  )
}
