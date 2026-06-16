import { AlertTriangle, Link2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { BlogRecord, RecordStatus } from '../types'

// 블로그 기록 카드 — 승인/검토 중/반려 상태별 표시 + 수정/삭제 액션.
const STATUS: Record<RecordStatus, { cls: string }> = {
  approved: { cls: 'bg-success-bg text-success' },
  reviewing: { cls: 'bg-accent-bg text-accent-strong' },
  rejected: { cls: 'bg-danger-bg text-danger' },
}

export function BlogRecordCard({
  record,
  onEdit,
  onDelete,
}: {
  record: BlogRecord
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <section className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-surface-muted rounded-md px-2.5 py-1 text-[11px]">
            <span className="text-fg font-bold">{record.weekLabel}</span>{' '}
            <span className="text-fg-muted">{record.dateRange}</span>
          </span>
          <span
            className={cn(
              'rounded-md px-2 py-1 text-[11px] font-bold',
              STATUS[record.status].cls,
            )}
          >
            {record.statusLabel}
          </span>
        </div>
        <span className="text-fg-subtle shrink-0 text-[11px]">
          {record.submittedAt} · {record.statusAt}
        </span>
      </div>

      <h3 className="text-fg text-[16px] font-bold">{record.title}</h3>

      <div className="flex items-center gap-1.5 text-[12px]">
        <Link2 className="text-fg-subtle size-3.5 shrink-0" />
        <span className="text-fg-muted truncate">{record.url}</span>
        <a
          href={record.url}
          target="_blank"
          rel="noreferrer"
          className="text-brand shrink-0 font-semibold"
        >
          원문 보기 →
        </a>
      </div>

      {record.rejectReason && (
        <div className="border-danger/40 bg-danger-bg/50 flex flex-col gap-2 rounded-[12px] border p-3.5">
          <span className="text-danger flex items-center gap-1.5 text-[12px] font-bold">
            <AlertTriangle className="size-3.5 shrink-0" />
            {record.rejectReason.title}
          </span>
          <span className="text-fg-muted text-[12px] leading-5">
            {record.rejectReason.detail}
          </span>
          <div className="flex items-center gap-3 pt-0.5">
            <button
              type="button"
              onClick={() => onEdit(record.id)}
              className="bg-danger rounded-md px-3 py-1.5 text-[11px] font-bold text-white"
            >
              수정 후 재제출
            </button>
            <button
              type="button"
              className="text-fg-muted text-[11px] font-semibold"
            >
              자세히 →
            </button>
          </div>
        </div>
      )}

      <div className="border-divider flex items-center justify-between border-t pt-3">
        <span className="text-fg-subtle text-[12px]">{record.instructor}</span>
        <div className="flex items-center gap-2">
          {record.canEdit && (
            <button
              type="button"
              onClick={() => onEdit(record.id)}
              className="bg-brand rounded-lg px-4 py-2 text-[12px] font-bold text-white"
            >
              수정
            </button>
          )}
          {record.canDelete && (
            <button
              type="button"
              onClick={() => onDelete(record.id)}
              className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-4 py-2 text-[12px] font-semibold"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
