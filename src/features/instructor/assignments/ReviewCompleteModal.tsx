import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

// 과제 검토완료 확인 모달 (Figma 2750:1873) — 점수 없음·피드백 선택 고지 후 상태 전이.
export function ReviewCompleteModal({
  open,
  studentName,
  onClose,
  onConfirm,
}: {
  open: boolean
  studentName: string
  onClose: () => void
  onConfirm: (feedback: string) => void
}) {
  const [feedback, setFeedback] = useState('')
  const close = () => {
    setFeedback('')
    onClose()
  }
  return (
    <Modal
      open={open}
      onClose={close}
      title="검토완료로 변경할까요?"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            취소
          </Button>
          <Button
           
            onClick={() => {
              onConfirm(feedback.trim())
              setFeedback('')
            }}
          >
            검토완료
          </Button>
        </>
      }
    >
      <p className="text-fg-muted text-sm">
        검토완료 피드백은 선택입니다. 점수는 저장하지 않습니다.
      </p>
      <div className="mt-4 flex gap-2">
        <span className="border-border bg-surface-muted text-fg-muted inline-flex rounded-lg border px-3.5 py-1.5 text-xs font-semibold">
          점수 없음
        </span>
        <span className="border-border bg-surface-muted text-fg-muted inline-flex rounded-lg border px-3.5 py-1.5 text-xs font-semibold">
          피드백 선택
        </span>
      </div>
      <label className="mt-5 flex w-full flex-col gap-[6px]">
        <span className="text-fg text-[13px] font-bold">
          검토 피드백 (선택)
        </span>
        <textarea
          rows={3}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="검토 완료와 함께 남길 피드백이 있으면 입력하세요."
          aria-label={`${studentName} 검토 피드백`}
          className="border-border focus:border-brand text-fg placeholder:text-fg-subtle w-full rounded-[10px] border-2 bg-white p-3 text-sm outline-none"
        />
      </label>
    </Modal>
  )
}
