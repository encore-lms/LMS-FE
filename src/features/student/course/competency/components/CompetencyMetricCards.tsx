import { cn } from '@/shared/lib/cn'
import type { CompetencyMetric } from '../types'

// 과정 핵심 지표 4카드 — 출석률·과제 검토완료율·퀴즈 평균·기록 승인.
export function CompetencyMetricCards({
  metrics,
}: {
  metrics: CompetencyMetric[]
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map((m) => (
        <div
          key={m.key}
          className="border-border bg-surface flex flex-col gap-2 rounded-xl border p-[18px]"
        >
          <span className="text-fg-muted text-[13px] font-medium">
            {m.label}
          </span>
          <span className="text-fg text-[30px] leading-none font-bold">
            {m.value}
          </span>
          <span
            className={cn(
              'text-[12px] font-semibold',
              m.noteTone === 'warning' ? 'text-warning' : 'text-brand',
            )}
          >
            {m.note}
          </span>
        </div>
      ))}
    </div>
  )
}
