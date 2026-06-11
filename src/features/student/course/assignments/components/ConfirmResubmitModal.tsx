// 과제 수정 제출 확인 모달 (Figma 2236:10522) — 덮어쓰기 안내 + 재제출 주의 박스 + 계속 편집/수정 제출.
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
        className="bg-surface flex w-[500px] max-w-full flex-col gap-4 rounded-2xl p-6 shadow-[0px_20px_48px_0px_rgba(18,23,38,0.24)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-fg text-[20px] font-bold">수정 제출할까요?</h2>
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

        <div className="mt-1 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="border-border text-fg h-10 rounded-[10px] border px-[18px] text-[14px] font-semibold"
          >
            계속 편집
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
