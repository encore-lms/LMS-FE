import { useState } from 'react'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { AttendanceActionButton } from '../AttendanceActionButton'
import type { AttendanceFormSubmission } from '../../types'
import { useUpdateAttendanceAttachments } from '../../../api/attendance'
import { EvidenceUploadStep } from '../../form/steps/EvidenceUploadStep'
import { SubmissionHistoryTable } from './SubmissionHistoryTable'

// 출결 폼 제출 이력 섹션 — 제목·건수 + [출결 폼 작성] CTA + 테이블(없으면 Empty).
// 제출 후에도 증빙 첨부만 따로 수정할 수 있게 행마다 모달을 연다.
export function SubmissionHistory({
  submissions,
  onWriteForm,
}: {
  submissions: AttendanceFormSubmission[]
  onWriteForm: () => void
}) {
  const updateMutation = useUpdateAttendanceAttachments()
  const [editTarget, setEditTarget] = useState<AttendanceFormSubmission | null>(
    null,
  )
  const [files, setFiles] = useState<string[]>([])

  const openEdit = (submission: AttendanceFormSubmission) => {
    setEditTarget(submission)
    setFiles((submission.attachments ?? []).map((a) => a.fileName))
  }
  const saveEdit = () => {
    if (!editTarget) return
    updateMutation.mutate(
      { id: editTarget.id, attachmentNames: files },
      { onSuccess: () => setEditTarget(null) },
    )
  }

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
          <SubmissionHistoryTable
            submissions={submissions}
            onEditAttachments={openEdit}
          />
        </div>
      )}

      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        size="md"
        title="증빙 첨부 수정"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditTarget(null)}
              className="border-border text-fg h-10 rounded-[10px] border px-[18px] text-[14px] font-semibold"
            >
              취소
            </button>
            <AttendanceActionButton
              onClick={saveEdit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? '저장 중…' : '저장'}
            </AttendanceActionButton>
          </>
        }
      >
        <p className="text-fg-muted mb-3 text-sm">
          제출한 출결 내용은 그대로 두고 증빙 파일만 추가·교체합니다.
        </p>
        <EvidenceUploadStep files={files} onChange={setFiles} />
      </Modal>
    </section>
  )
}
