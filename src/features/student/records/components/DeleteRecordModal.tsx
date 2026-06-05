import { cn } from '@/shared/lib/cn'
import type { BlogRecord, RecordStatus } from '../types'

// 블로그 기록 삭제 확인 모달 (?modal=delete-blog) — Figma 2173:15095.
const STATUS: Record<RecordStatus, string> = {
  approved: 'bg-success-bg text-success',
  reviewing: 'bg-accent-bg text-accent-strong',
  rejected: 'bg-danger-bg text-danger',
}

export function DeleteRecordModal({
  record,
  onCancel,
  onConfirm,
}: {
  record: BlogRecord
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="bg-surface flex w-[460px] max-w-full flex-col gap-4 rounded-2xl p-6 shadow-[0px_20px_48px_0px_rgba(18,23,38,0.24)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-fg text-[18px] font-bold">
          블로그 기록을 삭제할까요?
        </h2>
        <p className="text-fg-muted text-[13px] leading-6">
          삭제하면 이 기록은 기록실 목록과 검토 대기열에서 사라집니다. 승인된
          기록은 삭제할 수 없고, 반려 또는 검토 중 기록만 삭제할 수 있습니다.
        </p>

        <div className="border-border bg-surface-muted/50 flex flex-col gap-1.5 rounded-[12px] border p-4">
          <span className="text-fg text-[14px] font-bold">{record.title}</span>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[10px] font-bold',
                STATUS[record.status],
              )}
            >
              {record.statusLabel}
            </span>
            <span className="text-fg-subtle text-[11px]">
              {record.weekLabel} {record.dateRange} · {record.statusAt}
            </span>
          </div>
        </div>

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
            className="bg-danger h-10 rounded-[10px] px-[18px] text-[14px] font-semibold text-white"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}
