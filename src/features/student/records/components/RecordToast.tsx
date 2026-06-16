import { X } from 'lucide-react'

// 기록실 우하단 다크 토스트 — 삭제 완료(2173:15383)·수정 완료(2211:15861).
export function RecordToast({
  message,
  onClose,
}: {
  message: string
  onClose: () => void
}) {
  return (
    <div className="bg-brand-deep fixed right-8 bottom-8 z-50 flex items-center gap-4 rounded-xl px-5 py-3.5 text-[13px] font-semibold text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]">
      {message}
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="text-white/60 transition-colors hover:text-white"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
