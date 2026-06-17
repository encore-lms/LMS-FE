import { Modal } from '@/components/ui/Modal'

// 멘토링 요청 취소 확인 모달 — Figma 3083:6106. 공용 Modal 사용(portal·ESC·배경클릭·스크롤락).
// 본문 + "취소 가능 조건" 안내 박스 + 돌아가기/요청 취소.
export function CancelRequestModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg h-10 rounded-[10px] border px-[18px] text-[14px] font-semibold"
          >
            돌아가기
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-danger h-10 rounded-[10px] px-[18px] text-[14px] font-semibold text-white"
          >
            요청 취소
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="bg-warning-bg text-warning flex size-9 shrink-0 items-center justify-center rounded-full text-[16px] font-bold">
            !
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-warning text-[10px] font-bold tracking-[0.12em]">
              CANCEL_CONFIRM
            </span>
            <h2 className="text-fg text-[17px] font-bold">
              멘토링 요청을 취소할까요?
            </h2>
            <p className="text-fg-muted text-[13px] leading-5">
              확정 전 요청만 수강생이 취소할 수 있습니다. 취소하면 팀원 모두에게
              요청 취소 상태가 표시됩니다.
            </p>
          </div>
        </div>

        <div className="bg-surface-muted flex flex-col gap-1 rounded-[10px] p-3.5">
          <span className="text-fg text-[12px] font-bold">취소 가능 조건</span>
          <span className="text-fg-muted text-[12px] leading-5">
            요청 대기 또는 조정 제안 상태에서만 취소 가능 · 확정 후 변경/취소는
            멘토만 가능
          </span>
        </div>
      </div>
    </Modal>
  )
}
