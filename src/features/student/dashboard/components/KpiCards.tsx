import { cn } from '@/shared/lib/cn'
import type { DashboardKpis } from '../types'

// 요약 KPI 4카드 — 출석률(강조) · 미응시 퀴즈 · 승인 대기 기록 · 보완 요청.
export function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  const items = [
    { label: '출석률', value: `${kpis.attendanceRate}%`, accent: true },
    { label: '미응시 퀴즈', value: `${kpis.pendingQuizzes}건`, accent: false },
    {
      label: '승인 대기 기록',
      value: `${kpis.pendingRecords}건`,
      accent: false,
    },
    { label: '보완 요청', value: `${kpis.changeRequests}건`, accent: false },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="border-border bg-surface flex flex-col gap-2 rounded-xl border p-5"
        >
          <span className="text-fg-muted text-[13px]">{it.label}</span>
          <span
            className={cn(
              'text-2xl font-bold',
              it.accent ? 'text-brand' : 'text-fg',
            )}
          >
            {it.value}
          </span>
        </div>
      ))}
    </div>
  )
}
