// 과제 수정 제출 확인 모달 — 기존 제출본 덮어쓰기 경고 + 취소/수정 제출.
export function ConfirmResubmitModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="bg-surface flex w-[480px] max-w-full flex-col gap-4 rounded-2xl p-6 shadow-[0px_20px_48px_0px_rgba(18,23,38,0.24)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-fg text-[18px] font-bold">수정 제출 확인</h2>
        <p className="text-fg-muted text-[14px] leading-6">
          이미 제출한 과제를 다시 제출하면{' '}
          <b className="text-fg">이전 제출본을 덮어씁니다.</b> 마감 전에는
          마지막 제출본이 유효합니다. 계속하시겠어요?
        </p>
        <div className="mt-1 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="border-border text-fg h-10 rounded-[10px] border px-[18px] text-[14px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-brand h-10 rounded-[10px] px-[18px] text-[14px] font-semibold text-white"
          >
            수정 제출
          </button>
        </div>
      </div>
    </div>
  )
}
