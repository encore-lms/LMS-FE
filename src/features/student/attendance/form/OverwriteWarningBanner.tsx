import type { AttendanceFormMeta } from '../types'
import { InfoBanner } from '../components/InfoBanner'
import { ATTENDANCE_STATUS_META } from '../components/attendanceStatusMeta'
import { formatSubmittedAt } from '../attendanceConstants'

// 기존 제출 경고 — 같은 cohort 마지막 1건만 유효(재제출 시 덮어쓰기). 최근 제출 요약 표시.
export function OverwriteWarningBanner({
  latest,
}: {
  latest: NonNullable<AttendanceFormMeta['latestSubmission']>
}) {
  const label = ATTENDANCE_STATUS_META[latest.attendanceType].label
  return (
    <InfoBanner tone="warning" title="기존 제출 내역이 있습니다">
      새로 제출하면 같은 기수의 마지막 제출 내용으로 덮어씁니다. 이전 제출
      내용은 보존되지 않습니다. (최근: {label} ·{' '}
      {formatSubmittedAt(latest.submittedAt)})
    </InfoBanner>
  )
}
