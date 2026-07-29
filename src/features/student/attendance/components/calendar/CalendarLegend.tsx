import { cn } from '@/shared/lib/cn'
import type { HrdAttendanceStatus } from '../../types'
import { ATTENDANCE_STATUS_META } from '../attendanceStatusMeta'

// 출결 상태 범례 — 점색 + 라벨. 색·라벨은 ATTENDANCE_STATUS_META 단일 출처를 따른다.
const ORDER: HrdAttendanceStatus[] = [
  'PRESENT',
  'LATE',
  'EARLY_LEAVE',
  'OUTING',
  'ABSENT',
]

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {ORDER.map((status) => {
        const meta = ATTENDANCE_STATUS_META[status]
        return (
          <span
            key={status}
            className="text-fg-muted flex items-center gap-1 text-xs"
          >
            <span className={cn('h-2 w-2 rounded-full', meta.dotClassName)} />
            {meta.label}
          </span>
        )
      })}
    </div>
  )
}
