import { AttendanceActionButton } from '../components/AttendanceActionButton'
import type { AttendanceFormSubmission } from '../types'
import { ATTENDANCE_STATUS_META } from '../components/attendanceStatusMeta'
import { OFFICIAL_LEAVE_LABEL, formatSubmittedAt } from '../attendanceConstants'

// 제출 완료 카드 — 수강생·출결 유형·공가·제출 시각 요약 + [홈으로 가기].
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-divider flex justify-between border-b py-2 text-sm last:border-0">
      <span className="text-fg-muted">{label}</span>
      <span className="text-fg font-medium">{value}</span>
    </div>
  )
}

export function SubmitSuccessCard({
  submission,
  onHome,
}: {
  submission: AttendanceFormSubmission
  onHome: () => void
}) {
  return (
    <section className="border-border bg-surface flex flex-col gap-4 rounded-xl border p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-fg text-lg font-bold">출결 폼을 제출했습니다</h2>
        <p className="text-fg-muted text-sm">
          같은 기수의 마지막 제출로 저장됩니다. HRD 원본 출결은 변경되지
          않습니다.
        </p>
      </div>
      <div className="flex flex-col">
        <SummaryRow
          label="출결 유형"
          value={ATTENDANCE_STATUS_META[submission.attendanceType].label}
        />
        <SummaryRow
          label="공가 사용"
          value={submission.officialLeaveUsed ? '사용' : '미사용'}
        />
        {submission.officialLeaveType && (
          <SummaryRow
            label="공가 유형"
            value={OFFICIAL_LEAVE_LABEL[submission.officialLeaveType]}
          />
        )}
        <SummaryRow
          label="제출 시각"
          value={formatSubmittedAt(submission.submittedAt)}
        />
      </div>
      <div>
        <AttendanceActionButton onClick={onHome}>
          홈으로 가기
        </AttendanceActionButton>
      </div>
    </section>
  )
}
