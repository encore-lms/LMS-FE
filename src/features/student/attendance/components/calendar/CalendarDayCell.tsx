import { cn } from '@/shared/lib/cn'
import type { HrdAttendanceStatus } from '../../types'
import { AttendanceStatusBadge } from '../AttendanceStatusBadge'

// 캘린더 단일 일자 셀 — 날짜 숫자 + (당월·데이터 있을 때만) 상태 배지. 당월 외 날짜는 흐리게.
// 오늘(isToday)은 브랜드 링·배경 + 숫자 강조 칩으로 한눈에 띄게 한다.
//
// 출결 폼은 HRD 출결과 별개 데이터라 캘린더에 아무 흔적이 없었다. 지각·결석 같은 날에
// 사유를 냈는지 안 냈는지가 이 화면에서 안 보여, 수강생이 낸 걸 또 내거나 안 낸 걸 몰랐다.
interface CalendarDayCellProps {
  day: number
  inMonth: boolean
  status: HrdAttendanceStatus | null
  isToday?: boolean
  /** 이 날짜에 출결 폼을 냈는지. 사유가 필요한 날에만 판단한다. */
  formSubmitted?: boolean
}

/** 사유를 내야 하는 날 — 정상 출석·데이터 없는 날에는 폼이 필요 없다. */
function needsForm(status: HrdAttendanceStatus | null) {
  return status === 'LATE' || status === 'EARLY_LEAVE' || status === 'OUTING' || status === 'ABSENT'
}

export function CalendarDayCell({
  day,
  inMonth,
  status,
  isToday = false,
  formSubmitted = false,
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
      {inMonth && needsForm(status) && (
        <span
          className={cn(
            'rounded px-1.5 py-px text-[10px] font-bold',
            formSubmitted
              ? 'bg-success-bg text-success'
              : 'bg-warning-bg text-warning',
          )}
        >
          {formSubmitted ? '폼 제출' : '폼 미제출'}
        </span>
      )}
    </div>
  )
}
