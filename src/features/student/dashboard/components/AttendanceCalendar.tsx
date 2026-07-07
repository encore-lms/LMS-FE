import { CalendarDays } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { DashboardAttendance, DashboardAttendanceStatus } from '../types'
import { SectionCard } from './SectionCard'
import { MoreLink } from './MoreLink'

// 출결 캘린더 — 월 미니 캘린더. 평일은 출결 상태, 주말은 휴일, 오늘은 강조 + 현재 주 행 강조.
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const pad = (n: number) => String(n).padStart(2, '0')
const STATUS: Record<
  DashboardAttendanceStatus,
  { label: string; cls: string }
> = {
  PRESENT: { label: '출석', cls: 'bg-success-bg text-success' },
  LATE: { label: '지각', cls: 'bg-warning-bg text-warning' },
  EARLY_LEAVE: { label: '조퇴', cls: 'bg-info-bg text-info' },
  OUTING: { label: '외출', cls: 'bg-accent-bg text-accent-strong' },
  ABSENT: { label: '결석', cls: 'bg-danger-bg text-danger' },
}
const LEGEND = [
  { label: '출석', cls: 'bg-success' },
  { label: '지각', cls: 'bg-warning' },
  { label: '결석', cls: 'bg-danger' },
  { label: '휴일', cls: 'bg-surface-muted' },
]

export function AttendanceCalendar({
  attendance,
}: {
  attendance: DashboardAttendance
}) {
  const { calendar } = attendance
  const statusByDate = new Map(calendar.days.map((d) => [d.date, d.status]))
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
      weekend: i % 7 === 0 || i % 7 === 6,
      status: inMonth ? (statusByDate.get(date) ?? null) : null,
      isToday: date === calendar.today,
      row: Math.floor(i / 7),
    }
  })
  const todayRow = cells.find((c) => c.isToday)?.row

  return (
    <SectionCard
      icon={CalendarDays}
      title="출결 캘린더"
      subtitle={`${calendar.year}년 ${calendar.month}월 · 현재 주 강조`}
      action={<MoreLink to="/student/attendance" />}
    >
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-fg-subtle py-1 text-[11px]">
            {w}
          </span>
        ))}
        {cells.map((c) => {
          if (c.day == null) return <div key={c.key} className="h-12" />
          let label = ''
          let cls = 'text-fg-muted'
          if (c.isToday) {
            label = '오늘'
            cls = 'border-2 border-brand text-brand font-semibold'
          } else if (c.status) {
            label = STATUS[c.status].label
            cls = STATUS[c.status].cls
          } else if (c.weekend) {
            label = '휴일'
            cls = 'bg-surface-muted text-fg-subtle'
          }
          return (
            <div
              key={c.key}
              className={cn(
                'flex h-12 flex-col items-center justify-center gap-0.5 rounded-md text-xs',
                cls,
                c.row === todayRow && !c.isToday && 'ring-brand/15 ring-1',
              )}
            >
              <span>{c.day}</span>
              {label && (
                <span className="text-[10px] leading-none">{label}</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="border-divider flex flex-wrap gap-x-4 gap-y-1 border-t pt-3">
        {LEGEND.map((l) => (
          <span
            key={l.label}
            className="text-fg-subtle flex items-center gap-1.5 text-[11px]"
          >
            <span className={cn('size-2.5 rounded-sm', l.cls)} />
            {l.label}
          </span>
        ))}
      </div>
    </SectionCard>
  )
}
