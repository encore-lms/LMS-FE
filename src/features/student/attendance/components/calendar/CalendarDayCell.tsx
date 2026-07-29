import { cn } from '@/shared/lib/cn'
import type { HrdAttendanceStatus } from '../../types'
import { AttendanceStatusBadge } from '../AttendanceStatusBadge'

// 캘린더 단일 일자 셀 — 날짜 숫자 + (당월·데이터 있을 때만) 상태 배지. 당월 외 날짜는 흐리게.
// 오늘(isToday)은 브랜드 링·배경 + 숫자 강조 칩으로 한눈에 띄게 한다.
interface CalendarDayCellProps {
  day: number
  inMonth: boolean
  status: HrdAttendanceStatus | null
  isToday?: boolean
}

export function CalendarDayCell({
  day,
  inMonth,
  status,
  isToday = false,
}: CalendarDayCellProps) {
  return (
    <div
      className={cn(
        'border-border flex min-h-[76px] flex-col items-start gap-1 border-t border-l p-2',
        !inMonth && 'bg-surface-muted/40',
        isToday && 'bg-brand/5 ring-brand ring-2 ring-inset',
      )}
    >
      <span
        className={cn(
          'text-xs',
          isToday
            ? 'bg-brand flex size-5 items-center justify-center rounded-full font-bold text-white'
            : inMonth
              ? 'text-fg-muted'
              : 'text-fg-subtle',
        )}
      >
        {day}
      </span>
      {inMonth && status && <AttendanceStatusBadge status={status} />}
    </div>
  )
}
