import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import type { DashboardAttendance } from '../types'
import { SectionCard } from './SectionCard'

// 누적 출결 — 출석일/총일·연속 출석 + 지각·결석·조퇴·외출 범례 + 최근 8주 추이.
export function AttendanceSummary({
  attendance,
}: {
  attendance: DashboardAttendance
}) {
  const { summary, trend } = attendance
  const legend = [
    { label: '지각', value: `${summary.lateCount}회`, dot: 'bg-warning' },
    { label: '결석', value: `${summary.absentCount}회`, dot: 'bg-danger' },
    {
      label: '조퇴',
      value: `${summary.earlyLeaveCount}건`,
      dot: 'bg-fg-subtle',
    },
    { label: '외출', value: `${summary.outingCount}건`, dot: 'bg-info' },
  ]
  const maxRate = Math.max(...trend.map((t) => t.rate), 100)

  return (
    <SectionCard
      title="누적 출결"
      subtitle={`총 ${summary.totalDays}일 · 출석률 ${summary.attendanceRate}%`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="flex items-end gap-1">
            <span className="text-brand text-4xl leading-none font-bold">
              {summary.presentDays}
            </span>
            <span className="text-fg-muted pb-0.5 text-sm">
              / {summary.totalDays}일
            </span>
          </span>
          <Link
            to="/student/attendance"
            className="text-brand text-xs font-medium"
          >
            연속 출석 {summary.streakDays}일 진행 중
          </Link>
        </div>

        <ul className="flex flex-col gap-1.5">
          {legend.map((l) => (
            <li
              key={l.label}
              className="flex items-center gap-1.5 text-xs whitespace-nowrap"
            >
              <span className={cn('size-2 rounded-full', l.dot)} />
              <span className="text-fg font-semibold">{l.value}</span>
              <span className="text-fg-muted">{l.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <span className="text-fg-subtle text-xs">8주 출석률 추이</span>
        <div className="mt-3 flex items-end justify-between gap-2">
          {trend.map((t, i) => {
            const isLast = i === trend.length - 1
            return (
              <div
                key={t.week}
                className="flex flex-1 flex-col items-center gap-1.5"
              >
                <div className="flex h-36 w-full flex-col items-center justify-end gap-1">
                  <span
                    className={cn(
                      'text-[10px] font-semibold',
                      isLast ? 'text-brand' : 'text-fg-subtle',
                    )}
                  >
                    {t.rate}
                  </span>
                  <div
                    className={cn(
                      'w-6 rounded-t-lg',
                      isLast ? 'bg-brand' : 'bg-brand/20',
                    )}
                    style={{ height: `${(t.rate / maxRate) * 110}px` }}
                    title={`${t.week} ${t.rate}%`}
                  />
                </div>
                <span className="text-fg-subtle text-[10px]">{t.week}</span>
              </div>
            )
          })}
        </div>
      </div>
    </SectionCard>
  )
}
