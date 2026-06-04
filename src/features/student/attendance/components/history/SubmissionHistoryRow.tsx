import type { AttendanceFormSubmission } from '../../types'
import { AttendanceStatusBadge } from '../AttendanceStatusBadge'
import {
  OFFICIAL_LEAVE_LABEL,
  formatSubmittedAt,
} from '../../attendanceConstants'

// 제출 이력 단일 행 — 제출 일시 / 출결 유형(배지) / 공가 사용 / 공가 유형 / 비고.
export function SubmissionHistoryRow({
  submission,
}: {
  submission: AttendanceFormSubmission
}) {
  const {
    submittedAt,
    attendanceType,
    officialLeaveUsed,
    officialLeaveType,
    note,
  } = submission
  return (
    <tr className="border-divider border-t">
      <td className="text-fg px-4 py-3 text-sm">
        {formatSubmittedAt(submittedAt)}
      </td>
      <td className="px-4 py-3">
        <AttendanceStatusBadge status={attendanceType} />
      </td>
      <td className="px-4 py-3 text-sm">
        {officialLeaveUsed ? (
          '사용'
        ) : (
          <span className="text-fg-subtle">미사용</span>
        )}
      </td>
      <td className="text-fg-muted px-4 py-3 text-sm">
        {officialLeaveType ? OFFICIAL_LEAVE_LABEL[officialLeaveType] : '—'}
      </td>
      <td className="text-fg-muted px-4 py-3 text-sm">{note ?? '—'}</td>
    </tr>
  )
}
