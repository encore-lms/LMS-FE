import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

// 과제 보완요청 확인 모달 (Figma 2750:1773) — 사유 필수, 마감 이후에도 재제출 허용 고지.
export function SupplementRequestModal({
  open,
  studentName,
  onClose,
  onConfirm,
}: {
  open: boolean
  studentName: string
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const close = () => {
    setReason('')
    onClose()
  }
  return (
    <Modal
      open={open}
      onClose={close}
      title="보완요청을 보낼까요?"
      size="md"
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            취소
          </Button>
          <Button
           
            disabled={!reason.trim()}
            onClick={() => {
              onConfirm(reason.trim())
              setReason('')
            }}
          >
            보완요청
          </Button>
        </>
      }
    >
      <p className="text-fg-muted text-sm">
        보완요청 코멘트는 필수이며, 수강생은 마감 이후에도 수정 후 재제출할 수
        있습니다.
      </p>
      <label className="mt-5 flex w-full flex-col gap-[6px]">
        <span className="text-fg text-[13px] font-bold">
          보완 요청 사유 <span className="text-danger">*</span>
        </span>
        <textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="예: cascade 범위와 테스트 근거를 보완해 주세요."
          aria-label={`${studentName} 보완 요청 사유`}
          className="border-border focus:border-brand text-fg placeholder:text-fg-subtle w-full rounded-[10px] border-2 bg-white p-3 text-sm outline-none"
        />
      </label>
    </Modal>
  )
}
