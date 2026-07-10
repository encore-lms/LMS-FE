import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { apiErrorOf, useAdminMentoringLogDetail, useApproveLog } from './api'
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
  const [changeOpen, setChangeOpen] = useState(false)
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
          <>
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
        }
      >
        <LogDetailPanel
          detail={detail ?? null}
          isPending={detailQuery.isPending}
          onRequestChange={() => setChangeOpen(true)}
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
