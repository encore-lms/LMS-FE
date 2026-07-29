import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { AttendanceActionButton } from '../AttendanceActionButton'
import type { AttendanceFormSubmission } from '../../types'
import {
  downloadAttendanceAttachment,
  useDeleteAttendanceAttachment,
  useUploadAttendanceAttachments,
} from '../../../api/attendance'
import { useToast } from '@/components/ui/use-toast'
import { Download, Trash2 } from 'lucide-react'
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
  const toast = useToast()
  const uploadMutation = useUploadAttendanceAttachments()
  const deleteMutation = useDeleteAttendanceAttachment()
  const [editTarget, setEditTarget] = useState<AttendanceFormSubmission | null>(
    null,
  )
  // 사후 증빙은 '추가'다 — 기존 첨부는 서버에 그대로 두고 새로 고른 파일만 올린다.
  const [files, setFiles] = useState<File[]>([])
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(submissions.length / PAGE_SIZE))
  const curPage = Math.min(page, totalPages)
  const pageItems = submissions.slice(
    (curPage - 1) * PAGE_SIZE,
    curPage * PAGE_SIZE,
  )

  // 모달 대상은 id 로만 들고 있고 내용은 항상 최신 목록에서 읽는다 —
  // 업로드·삭제 후 캐시가 갱신돼도 모달이 옛 스냅샷을 보여주지 않게.
  const editing = editTarget
    ? (submissions.find((s) => s.id === editTarget.id) ?? editTarget)
    : null
  const attachments = editing?.attachments ?? []

  const openEdit = (submission: AttendanceFormSubmission) => {
    setEditTarget(submission)
    setFiles([])
  }
  const saveEdit = () => {
    if (!editTarget || files.length === 0) {
      setEditTarget(null)
      return
    }
    uploadMutation.mutate(
      { id: editTarget.id, files },
      { onSuccess: () => setEditTarget(null) },
    )
  }

  return (
    <section className="bg-surface flex flex-col gap-4 rounded-xl">
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
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? '저장 중…' : '저장'}
            </AttendanceActionButton>
          </>
        }
      >
        <p className="text-fg-muted mb-3 text-sm">
          제출한 출결 내용은 그대로 두고 증빙 파일만 추가·삭제합니다.
        </p>

        {/* 이미 올린 증빙 — 그동안 목록이 없어 확인도 삭제도 할 수 없었다. */}
        {attachments.length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            <p className="text-fg text-[13px] font-semibold">
              올린 증빙 {attachments.length}개
            </p>
            {attachments.map((a) => (
              <div
                key={a.id}
                className="border-border flex items-center gap-2 rounded-lg border px-3 py-2"
              >
                <span className="text-fg min-w-0 flex-1 truncate text-[13px]">
                  {a.fileName}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    downloadAttendanceAttachment(a.id, a.fileName).catch(() =>
                      toast.danger('증빙을 내려받지 못했어요'),
                    )
                  }
                  className="text-fg-muted hover:text-fg flex items-center gap-1 text-[12px] font-semibold"
                >
                  <Download className="size-3.5" />
                  받기
                </button>
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={() =>
                    editing &&
                    deleteMutation.mutate(
                      { id: editing.id, attachmentId: a.id },
                      {
                        onSuccess: () => toast.success('증빙을 삭제했어요'),
                        onError: () => toast.danger('증빙 삭제에 실패했어요'),
                      },
                    )
                  }
                  className="text-danger flex items-center gap-1 text-[12px] font-semibold disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}

        <EvidenceUploadStep files={files} onChange={setFiles} />
      </Modal>
    </section>
  )
}
