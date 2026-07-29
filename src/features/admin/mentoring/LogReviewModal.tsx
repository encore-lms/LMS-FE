import { useState } from 'react'
import { CheckCircle2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import {
  apiErrorOf,
  useAdminMentoringLogDetail,
  useApproveLog,
  useDeleteMentoringLog,
} from './api'
import { LogDetailPanel } from './LogDetailPanel'
import { ChangeRequestModal } from './ChangeRequestModal'

interface LogReviewModalProps {
  open: boolean
  onClose: () => void
  logId: string
}

/**
 * 일지 리뷰 모달 — 상세 + 승인/수정 요청.
 * submitted(승인 대기)면 [승인]·[수정 요청], valid면 [수정 요청]만(재오픈).
 */
export function LogReviewModal({ open, onClose, logId }: LogReviewModalProps) {
  const toast = useToast()
  const detailQuery = useAdminMentoringLogDetail(logId)
  const approve = useApproveLog()
  const deleteLog = useDeleteMentoringLog()
  const [changeOpen, setChangeOpen] = useState(false)
  // 삭제는 파괴적이라 인라인 확인 단계를 둔다(잘못 등록·정리 대상 일지 제거용).
  const [confirmDelete, setConfirmDelete] = useState(false)
  const detail = detailQuery.data

  const doApprove = () => {
    approve.mutate(logId, {
      onSuccess: (d) => {
        toast.success(
          `승인 완료 — ${d.roundLabel} · 인정 ${d.recognizedHours ?? 0}h`,
        )
        onClose()
      },
      onError: (error) =>
        toast.danger(apiErrorOf(error).message ?? '승인에 실패했어요.'),
    })
  }

  const doDelete = () => {
    deleteLog.mutate(logId, {
      onSuccess: () => {
        toast.success('일지를 삭제했어요')
        onClose()
      },
      onError: (error) =>
        toast.danger(apiErrorOf(error).message ?? '일지 삭제에 실패했어요.'),
    })
  }

  const canApprove = detail?.status === 'submitted'
  const canRequestChange =
    detail?.status === 'submitted' || detail?.status === 'valid'

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="일지 검토"
        size="lg"
        footer={
          confirmDelete ? (
            <>
              <span className="text-danger mr-auto text-sm font-bold">
                이 일지를 삭제할까요? 되돌릴 수 없어요.
              </span>
              <Button
                variant="secondary"
                onClick={() => setConfirmDelete(false)}
                disabled={deleteLog.isPending}
              >
                취소
              </Button>
              <button
                type="button"
                onClick={doDelete}
                disabled={deleteLog.isPending}
                className="bg-danger rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {deleteLog.isPending ? '삭제 중…' : '삭제'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="border-danger/40 text-danger hover:bg-danger-bg bg-surface mr-auto inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-bold"
              >
                <Trash2 className="h-4 w-4" />
                삭제
              </button>
              <Button variant="secondary" onClick={onClose}>
                닫기
              </Button>
              {canRequestChange && (
                <button
                  type="button"
                  onClick={() => setChangeOpen(true)}
                  className="border-warning text-warning hover:bg-warning/10 bg-surface rounded-lg border px-4 py-2 text-sm font-bold"
                >
                  수정 요청
                </button>
              )}
              {canApprove && (
                <Button onClick={doApprove} disabled={approve.isPending}>
                  <CheckCircle2 className="h-4 w-4" />
                  {approve.isPending ? '승인 중…' : '승인'}
                </Button>
              )}
            </>
          )
        }
      >
        <LogDetailPanel
          detail={detail ?? null}
          isPending={detailQuery.isPending}
        />
      </Modal>
      {changeOpen && detail && (
        <ChangeRequestModal
          open
          onClose={() => setChangeOpen(false)}
          detail={detail}
        />
      )}
    </>
  )
}
