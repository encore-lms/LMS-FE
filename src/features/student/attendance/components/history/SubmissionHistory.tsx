import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { AttendanceActionButton } from '../AttendanceActionButton'
import type { AttendanceFormSubmission } from '../../types'
import { useUpdateAttendanceAttachments } from '../../../api/attendance'
import { EvidenceUploadStep } from '../../form/steps/EvidenceUploadStep'
import { SubmissionHistoryTable } from './SubmissionHistoryTable'

// 한 페이지에 보여줄 제출 이력 수 — 그 이상은 페이지로 넘겨 예전 기록도 본다.
const PAGE_SIZE = 5

// 출결 폼 제출 이력 섹션 — 제목·건수 + [출결 폼 작성] CTA + 테이블(없으면 Empty) + 페이지네이션.
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
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(submissions.length / PAGE_SIZE))
  const curPage = Math.min(page, totalPages)
  const pageItems = submissions.slice(
    (curPage - 1) * PAGE_SIZE,
    curPage * PAGE_SIZE,
  )

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
        <>
          <div className="border-border overflow-hidden rounded-lg border">
            <SubmissionHistoryTable
              submissions={pageItems}
              onEditAttachments={openEdit}
            />
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-fg-subtle text-xs">
                {submissions.length}건 중 {pageItems.length}건 표시
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="이전"
                  onClick={() => setPage(Math.max(1, curPage - 1))}
                  className="border-border text-fg-muted flex size-8 items-center justify-center rounded-lg border text-xs"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      aria-current={p === curPage ? 'page' : undefined}
                      className={cn(
                        'flex size-8 items-center justify-center rounded-lg text-xs font-medium',
                        p === curPage
                          ? 'bg-brand-deep text-white'
                          : 'border-border text-fg-muted border',
                      )}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  aria-label="다음"
                  onClick={() => setPage(Math.min(totalPages, curPage + 1))}
                  className="border-border text-fg-muted flex size-8 items-center justify-center rounded-lg border text-xs"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </>
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
