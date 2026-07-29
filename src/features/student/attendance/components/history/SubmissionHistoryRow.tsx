import type { AttendanceFormSubmission } from '../../types'
import { AttendanceStatusBadge } from '../AttendanceStatusBadge'
import {
  OFFICIAL_LEAVE_LABEL,
  formatSubmittedAt,
} from '../../attendanceConstants'

// 제출 이력 단일 행 — 출결 일자 / 제출 일시 / 출결 유형(배지) / 공가 사용 / 공가 유형 / 비고 / 증빙(+수정).
export function SubmissionHistoryRow({
  submission,
  onEditAttachments,
}: {
  submission: AttendanceFormSubmission
  /** 증빙 첨부만 사후 수정 — 행의 "증빙 수정" 클릭 시 해당 제출 전달 */
  onEditAttachments: (submission: AttendanceFormSubmission) => void
}) {
  const {
    targetDate,
    submittedAt,
    attendanceType,
    officialLeaveUsed,
    officialLeaveType,
    note,
    attachments,
  } = submission
  const fileCount = attachments?.length ?? 0
  return (
    <tr className="border-divider border-t">
      <td className="text-fg px-4 py-3 text-sm font-medium whitespace-nowrap">
        {targetDate}
      </td>
      <td className="text-fg-muted px-4 py-3 text-sm whitespace-nowrap">
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
      <td className="text-fg-muted px-4 py-3 text-sm">
        {/* 비고는 자유 입력이라 길면 auto-layout 표의 폭을 독식한다.
            (td의 max-width는 auto 레이아웃에서 무시되므로 안쪽 div에 건다) */}
        <div className="max-w-[280px] truncate" title={note ?? undefined}>
          {note ?? '—'}
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-fg-muted">
            {fileCount > 0 ? `${fileCount}개` : '없음'}
          </span>
          <button
            type="button"
            onClick={() => onEditAttachments(submission)}
            className="text-brand shrink-0 text-xs font-semibold hover:underline"
          >
            {fileCount > 0 ? '증빙 수정' : '증빙 추가'}
          </button>
        </div>
      </td>
    </tr>
  )
}
