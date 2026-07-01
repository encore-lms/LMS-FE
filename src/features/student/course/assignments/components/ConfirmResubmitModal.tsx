import { Modal } from '@/components/ui/Modal'

// 과제 수정 제출 확인 모달 (Figma 2236:10522) — 공용 Modal 사용. 덮어쓰기 안내 + 재제출 주의 + 계속 편집/수정 제출.
export function ConfirmResubmitModal({
  open,
  isSaving,
  onCancel,
  onConfirm,
}: {
  open: boolean
  isSaving?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="md"
      title="수정 제출할까요?"
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="border-border text-fg h-10 rounded-[10px] border px-[18px] text-[14px] font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            계속 편집
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="bg-brand h-10 rounded-[10px] px-[18px] text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSaving ? '저장 중…' : '수정 제출'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-fg-muted text-[14px] leading-6">
          기존 제출본은 새 제출 내용으로 덮어쓰기됩니다. 마감 전에는 다시 수정할
          수 있습니다.
        </p>

        {/* 재제출 주의 박스 */}
        <div className="bg-warning-bg flex items-start gap-2.5 rounded-xl p-3.5">
          <span className="bg-warning/20 text-warning shrink-0 rounded-md px-1.5 py-1 text-[11px] font-bold">
            주의
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="text-warning text-[13px] font-bold">재제출 주의</p>
            <p className="text-warning/80 text-[12px] leading-5">
              마감 후에는 제출·재제출이 차단됩니다.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
