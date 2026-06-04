import { cn } from '@/shared/lib/cn'
import type { HrdAttendanceStatus } from '../../types'
import { AttendanceStatusBadge } from '../AttendanceStatusBadge'

// 캘린더 단일 일자 셀 — 날짜 숫자 + (당월·데이터 있을 때만) 상태 배지. 당월 외 날짜는 흐리게.
interface CalendarDayCellProps {
  day: number
  inMonth: boolean
  status: HrdAttendanceStatus | null
}

export function CalendarDayCell({
  day,
  inMonth,
  status,
}: CalendarDayCellProps) {
  return (
    <div
      className={cn(
        'border-border flex min-h-[76px] flex-col gap-1 border-t border-l p-2',
        !inMonth && 'bg-surface-muted/40',
      )}
    >
      <span
        className={cn('text-xs', inMonth ? 'text-fg-muted' : 'text-fg-subtle')}
      >
        {day}
      </span>
      {inMonth && status && <AttendanceStatusBadge status={status} />}
    </div>
  )
}
