import { Empty } from '@/components/ui/Empty'
import { AttendanceActionButton } from '../AttendanceActionButton'
import type { AttendanceFormSubmission } from '../../types'
import { SubmissionHistoryTable } from './SubmissionHistoryTable'

// 출결 폼 제출 이력 섹션 — 제목·건수 + [출결 폼 작성] CTA + 테이블(없으면 Empty).
export function SubmissionHistory({
  submissions,
  onWriteForm,
}: {
  submissions: AttendanceFormSubmission[]
  onWriteForm: () => void
}) {
  return (
    <section className="border-border bg-surface flex flex-col gap-4 rounded-xl border p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-fg font-bold">출결 폼 제출 이력</h2>
          <span className="text-fg-subtle text-sm">{submissions.length}건</span>
        </div>
        <AttendanceActionButton onClick={onWriteForm}>
          출결 폼 작성
        </AttendanceActionButton>
      </div>
      {submissions.length === 0 ? (
        <Empty
          title="제출한 출결 폼이 없어요"
          description="지각·조퇴·외출·결석이 있으면 출결 폼으로 신고하세요."
        />
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <SubmissionHistoryTable submissions={submissions} />
        </div>
      )}
    </section>
  )
}
