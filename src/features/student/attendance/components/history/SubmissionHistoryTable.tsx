import type { AttendanceFormSubmission } from '../../types'
import { SubmissionHistoryRow } from './SubmissionHistoryRow'

// 제출 이력 테이블 — 헤더 + 행. 행 렌더는 SubmissionHistoryRow에 위임.
const COLUMNS = ['제출 일시', '출결 유형', '공가 사용', '공가 유형', '비고']

export function SubmissionHistoryTable({
  submissions,
}: {
  submissions: AttendanceFormSubmission[]
}) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-surface-muted text-fg-muted text-left text-xs">
          {COLUMNS.map((col) => (
            <th key={col} className="px-4 py-3 font-medium">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {submissions.map((submission) => (
          <SubmissionHistoryRow key={submission.id} submission={submission} />
        ))}
      </tbody>
    </table>
  )
}
