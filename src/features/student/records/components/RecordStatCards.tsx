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
  // 첫 카드(전체 기록)를 100% 기준으로 각 카드의 비율 막대를 채운다.
  const total = parseInt(stats[0]?.value ?? '1', 10) || 1
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => {
        const fill = Math.min(1, (parseInt(s.value, 10) || 0) / total)
        return (
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
            <div className="bg-surface-muted h-1.5 w-full overflow-hidden rounded-full">
              <span
                className={cn('block h-full rounded-full', DOT[s.dotTone])}
                style={{ width: `${fill * 100}%` }}
              />
            </div>
            <span className="text-fg-subtle text-[11px]">{s.sub}</span>
          </div>
        )
      })}
    </div>
  )
}
