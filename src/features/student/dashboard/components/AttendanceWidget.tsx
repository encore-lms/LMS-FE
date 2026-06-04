import { cn } from '@/shared/lib/cn'
import type { DashboardAttendance, DashboardAttendanceStatus } from '../types'
import { SectionCard } from './SectionCard'
import { MoreLink } from './MoreLink'

// 출결 영역 — 미니 캘린더(좌) + 누적·최근 8주 추이(우). 색은 @theme 토큰.
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const pad = (n: number) => String(n).padStart(2, '0')
const STATUS_BG: Record<DashboardAttendanceStatus, string> = {
  PRESENT: 'bg-success-bg text-success',
  LATE: 'bg-warning-bg text-warning',
  EARLY_LEAVE: 'bg-info-bg text-info',
  OUTING: 'bg-accent-bg text-accent-strong',
  ABSENT: 'bg-danger-bg text-danger',
}

export function AttendanceWidget({
  attendance,
}: {
  attendance: DashboardAttendance
}) {
  const { calendar, cumulative, trend } = attendance
  const statusByDate = new Map<string, DashboardAttendanceStatus | null>(
    calendar.days.map((d) => [d.date, d.status]),
  )
  const start = new Date(calendar.year, calendar.month - 1, 1).getDay()
  const daysInMonth = new Date(calendar.year, calendar.month, 0).getDate()
  const cells = Array.from({ length: 42 }, (_, i) => {
    const offset = i - start + 1
    const inMonth = offset >= 1 && offset <= daysInMonth
    const date = inMonth
      ? `${calendar.year}-${pad(calendar.month)}-${pad(offset)}`
      : ''
    return {
      key: inMonth ? date : `x${i}`,
      day: inMonth ? offset : null,
      status: inMonth ? (statusByDate.get(date) ?? null) : null,
    }
  })
  const maxRate = Math.max(...trend.map((t) => t.rate), 100)
  const stats = [
    { label: '지각', value: cumulative.lateCount },
    { label: '조퇴', value: cumulative.earlyLeaveCount },
    { label: '외출', value: cumulative.outingCount },
    { label: '결석', value: cumulative.absentCount },
  ]

  return (
    <SectionCard title="출결" action={<MoreLink to="/student/attendance" />}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span className="text-fg-muted text-sm font-medium">
            {calendar.year}년 {calendar.month}월
          </span>
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w) => (
              <span key={w} className="text-fg-subtle py-1 text-[11px]">
                {w}
              </span>
            ))}
            {cells.map((c) => (
              <div
                key={c.key}
                className={cn(
                  'flex h-8 items-center justify-center rounded-md text-xs',
                  c.status ? STATUS_BG[c.status] : c.day ? 'text-fg-muted' : '',
                )}
              >
                {c.day ?? ''}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-end gap-2">
            <span className="text-brand text-3xl font-bold">
              {cumulative.presentDays}
            </span>
            <span className="text-fg-muted pb-1 text-sm">일 출석</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-surface-muted flex flex-col items-center rounded-md py-2"
              >
                <span className="text-fg text-sm font-bold">{s.value}</span>
                <span className="text-fg-subtle text-[11px]">{s.label}</span>
              </div>
            ))}
          </div>
          <div>
            <span className="text-fg-subtle text-xs">최근 8주 출석률</span>
            <div className="mt-1 flex h-16 items-end gap-1">
              {trend.map((t) => (
                <div
                  key={t.week}
                  className="bg-brand/70 flex-1 rounded-t"
                  style={{ height: `${(t.rate / maxRate) * 100}%` }}
                  title={`${t.week} ${t.rate}%`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
