// 멘토링 요청 취소 확인 모달 — Figma 3083:6106. 사유(선택) 입력 + 돌아가기/요청 취소.
export function CancelRequestModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-surface flex w-[460px] max-w-full flex-col gap-4 rounded-2xl p-6 shadow-[0px_20px_48px_0px_rgba(18,23,38,0.24)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="bg-warning-bg text-warning flex size-9 shrink-0 items-center justify-center rounded-full text-[16px] font-bold">
            !
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-warning text-[10px] font-bold tracking-[0.12em]">
              CANCEL CONFIRM
            </span>
            <h2 className="text-fg text-[17px] font-bold">
              멘토링 요청을 취소할까요?
            </h2>
            <p className="text-fg-muted text-[13px] leading-5">
              취소 후 진행 중 요청이 없어 팀에서 다시 새 멘토링 요청을 보낼 수
              있습니다. 멘토 제안도 함께 사라집니다.
            </p>
          </div>
        </div>

        <textarea
          rows={3}
          placeholder="취소 사유를 남기면 멘토에게 전달됩니다 (선택)"
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand min-h-[72px] w-full rounded-[10px] border p-3 text-[13px] outline-none"
        />

        <div className="flex items-center justify-end gap-2">
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
        </div>
      </div>
    </div>
  )
}
