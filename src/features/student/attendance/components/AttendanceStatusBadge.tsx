import { cn } from '@/shared/lib/cn'
import type { HrdAttendanceStatus } from '../types'
import { ATTENDANCE_STATUS_META } from './attendanceStatusMeta'

/**
 * 출결 상태 배지. AttendanceType(지각·조퇴·외출·결석)은 HrdAttendanceStatus의 부분집합이라
 * 제출 이력(AttendanceType)·HRD 캘린더(상태 5종) 양쪽에서 그대로 재사용한다.
 * 라벨·색은 ATTENDANCE_STATUS_META 단일 출처(attendanceStatusMeta.ts)를 따른다.
 */
export function AttendanceStatusBadge({
  status,
  className,
}: {
  status: HrdAttendanceStatus
  className?: string
}) {
  const meta = ATTENDANCE_STATUS_META[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        meta.badgeClassName,
        className,
      )}
    >
      {meta.label}
    </span>
  )
}
