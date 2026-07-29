import type { AttendanceFormSubmission } from '../../types'
import { SubmissionHistoryRow } from './SubmissionHistoryRow'

// 제출 이력 테이블 — 헤더 + 행. 행 렌더는 SubmissionHistoryRow에 위임.
// 출결 일자가 먼저다 — 어느 날 출결인지가 언제 냈는지보다 중요하다.
// 예전에는 제출 일시만 보여줘서, 지난 날짜를 뒤늦게 낸 건이 같은 날 중복 제출처럼 보였다.
const COLUMNS = [
  '출결 일자',
  '제출 일시',
  '출결 유형',
  '공가 사용',
  '공가 유형',
  '비고',
  '증빙',
]

export function SubmissionHistoryTable({
  submissions,
  onEditAttachments,
}: {
  submissions: AttendanceFormSubmission[]
  onEditAttachments: (submission: AttendanceFormSubmission) => void
}) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-surface-muted text-fg-muted text-left text-xs">
          {COLUMNS.map((col) => (
            <th key={col} className="px-4 py-3 font-medium whitespace-nowrap">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {submissions.map((submission) => (
          <SubmissionHistoryRow
            key={submission.id}
            submission={submission}
            onEditAttachments={onEditAttachments}
          />
        ))}
      </tbody>
    </table>
  )
}
