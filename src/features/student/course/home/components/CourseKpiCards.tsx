import { cn } from '@/shared/lib/cn'
import type { CourseKpi, CourseKpiTone } from '../../types'

// 강의 홈 KPI 4카드 — 다가올 퀴즈 · 마감 임박 과제 · 새 자료 · 출결 대기 요청.
// 각 카드: 라벨+톤 점 / 큰 수치+배지 / 진행 바 / 보조 문구.
const TONE: Record<
  CourseKpiTone,
  { dot: string; bar: string; badgeBg: string; badgeText: string }
> = {
  warning: {
    dot: 'bg-warning',
    bar: 'bg-warning',
    badgeBg: 'bg-warning-bg',
    badgeText: 'text-warning',
  },
  danger: {
    dot: 'bg-danger',
    bar: 'bg-danger',
    badgeBg: 'bg-danger-bg',
    badgeText: 'text-danger',
  },
  info: {
    dot: 'bg-info',
    bar: 'bg-info',
    badgeBg: 'bg-info-bg',
    badgeText: 'text-info',
  },
  accent: {
    dot: 'bg-accent-strong',
    bar: 'bg-accent-strong',
    badgeBg: 'bg-accent-bg',
    badgeText: 'text-accent-strong',
  },
}

function KpiCard({ kpi }: { kpi: CourseKpi }) {
  const tone = TONE[kpi.tone]
  return (
    <div className="border-border bg-surface flex flex-1 flex-col gap-2 rounded-[14px] border p-[18px] shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]">
      <div className="flex items-center justify-between">
        <span className="text-fg-muted text-[12px] font-medium">
          {kpi.label}
        </span>
        <span className={cn('size-2 rounded-full', tone.dot)} />
      </div>
      <div className="flex items-end gap-0.5">
        <span className="text-fg text-[34px] leading-[38px] font-bold">
          {kpi.value}
        </span>
        <span className="text-fg-muted pb-1 text-[14px] font-medium">
          {kpi.unit}
        </span>
        {kpi.badge && (
          <span
            className={cn(
              'mb-1.5 ml-1.5 rounded-[5px] px-1.5 py-0.5 text-[10px] font-bold',
              tone.badgeBg,
              tone.badgeText,
            )}
          >
            {kpi.badge}
          </span>
        )}
      </div>
      <div className="bg-surface-muted h-[5px] w-full overflow-hidden rounded-full">
        <div
          className={cn('h-full rounded-full', tone.bar)}
          style={{ width: `${kpi.barPct}%` }}
        />
      </div>
      <span className="text-fg-subtle text-[11px]">{kpi.caption}</span>
    </div>
  )
}

export function CourseKpiCards({ kpis }: { kpis: CourseKpi[] }) {
  return (
    <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.key} kpi={kpi} />
      ))}
    </div>
  )
}
