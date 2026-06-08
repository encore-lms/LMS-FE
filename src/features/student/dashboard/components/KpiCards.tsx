import { cn } from '@/shared/lib/cn'
import type { DashboardKpis, KpiTone } from '../types'

// 요약 KPI 4카드 — Figma 2455:5068. 라벨+색점 / 숫자+델타칩 / 진행 트랙바 / 캡션.
const DOT: Record<KpiTone, string> = {
  brand: 'bg-brand',
  warning: 'bg-warning',
  accent: 'bg-accent-strong',
  success: 'bg-success',
  info: 'bg-info',
  danger: 'bg-danger',
}
const DELTA: Record<'success' | 'warning' | 'danger', string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
}

export function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {kpis.items.map((k) => (
        <div
          key={k.key}
          className="border-border bg-surface flex flex-col gap-2 rounded-[14px] border p-[18px] shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]"
        >
          {/* 라벨 + 색점 */}
          <div className="flex items-center justify-between">
            <span className="text-fg-muted text-[12px] font-medium">
              {k.label}
            </span>
            <span className={cn('size-2 shrink-0 rounded-full', DOT[k.tone])} />
          </div>
          {/* 숫자 + 단위 + 델타칩 */}
          <div className="flex items-end gap-0.5">
            <span className="text-fg text-[34px] leading-[38px] font-bold">
              {k.value}
            </span>
            {k.unit && (
              <span className="text-fg-muted text-[14px] font-medium">
                {k.unit}
              </span>
            )}
            {k.delta && (
              <span
                className={cn(
                  'ml-2 rounded-[5px] px-1.5 py-0.5 text-[10px] font-bold',
                  DELTA[k.delta.tone],
                )}
              >
                {k.delta.label}
              </span>
            )}
          </div>
          {/* 진행 트랙바 */}
          <div className="bg-surface-muted h-[5px] w-full overflow-hidden rounded-full">
            <div
              className={cn('h-full rounded-full', DOT[k.tone])}
              style={{ width: `${k.barPct}%` }}
            />
          </div>
          {/* 캡션 */}
          <span className="text-fg-subtle text-[11px]">{k.caption}</span>
        </div>
      ))}
    </div>
  )
}
