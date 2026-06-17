import { Modal } from '@/components/ui/Modal'
import { cn } from '@/shared/lib/cn'
import type { BlogRecord, RecordStatus } from '../types'

// 블로그 기록 삭제 확인 모달 (?modal=delete-blog) — Figma 2173:15095. 공용 Modal 사용(조건부 렌더 = 항상 open).
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
    <Modal
      open
      onClose={onCancel}
      size="md"
      title="블로그 기록을 삭제할까요?"
      footer={
        <>
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
        </>
      }
    >
      <div className="flex flex-col gap-4">
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
      </div>
    </Modal>
  )
}
