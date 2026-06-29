import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

// 반려/보완요청 사유 입력 모달 — 사유 필수, 변경 제안·재인증 검토가 공유한다.
// (Figma 2750:2070·2750:2202 검토 액션 — 사유 코멘트 필수 정책)
export function ReasonModal({
  open,
  title,
  description,
  confirmLabel,
  placeholder,
  pending = false,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  placeholder: string
  pending?: boolean
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
      title={title}
      size="md"
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="secondary" className="h-10 text-sm" onClick={close}>
            취소
          </Button>
          <Button
            className="h-10 text-sm"
            disabled={!reason.trim() || pending}
            onClick={() => onConfirm(reason.trim())}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-fg-muted text-sm">{description}</p>
      <label className="mt-5 flex w-full flex-col gap-[6px]">
        <span className="text-fg text-[13px] font-bold">
          사유 <span className="text-danger">*</span>
        </span>
        <textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={placeholder}
          aria-label={title}
          className="border-border focus:border-brand text-fg placeholder:text-fg-subtle w-full rounded-[10px] border-2 bg-white p-3 text-sm outline-none"
        />
      </label>
    </Modal>
  )
}
