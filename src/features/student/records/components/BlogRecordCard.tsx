import { useState, type MouseEvent } from 'react'
import { AlertTriangle, Link2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Modal } from '@/components/ui/Modal'
import type { BlogRecord, RecordStatus } from '../types'

// 블로그 기록 카드 — 상태별 표시 + 수정/삭제. 반려 사유는 "자세히"로 모달, 스터디는 카드 클릭 시 상세 모달.
const STATUS: Record<RecordStatus, { cls: string }> = {
  draft: { cls: 'bg-surface-muted text-fg-muted' },
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
  const [rejectOpen, setRejectOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  // URL은 블로그 기록에만 의미가 있다(스터디·자격증은 증빙 파일 기반).
  const showUrl = record.category === 'blog' && !!record.url
  // 모든 기록은 카드를 누르면 상세 모달을 연다(블로그·스터디·자격증).
  const clickable = true
  const categoryLabel =
    record.category === 'blog'
      ? '블로그'
      : record.category === 'study'
        ? '스터디'
        : '자격증'

  // 카드 내부 버튼 클릭이 카드(상세 모달) 클릭으로 번지지 않게 막는다.
  const stop = (fn: () => void) => (e: MouseEvent) => {
    e.stopPropagation()
    fn()
  }

  return (
    <>
      <section
        className={cn(
          'border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5',
          clickable && 'hover:border-brand/40 cursor-pointer transition-colors',
        )}
        onClick={clickable ? () => setDetailOpen(true) : undefined}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setDetailOpen(true)
                }
              }
            : undefined
        }
      >
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

        {record.status === 'draft' && (
          <span className="bg-surface-muted text-fg-muted w-fit rounded-md px-2 py-1 text-[11px] font-semibold">
            임시저장 · 나에게만 보여요
          </span>
        )}

        {showUrl && (
          <div className="flex items-center gap-1.5 text-[12px]">
            <Link2 className="text-fg-subtle size-3.5 shrink-0" />
            <span className="text-fg-muted truncate">{record.url}</span>
            <a
              href={record.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-brand shrink-0 font-semibold"
            >
              원문 보기 →
            </a>
          </div>
        )}

        {record.rejectReason && (
          <div className="border-danger/40 bg-danger-bg/50 flex flex-col gap-2 rounded-[12px] border p-3.5">
            <span className="text-danger flex items-center gap-1.5 text-[12px] font-bold">
              <AlertTriangle className="size-3.5 shrink-0" />
              {record.rejectReason.title}
            </span>
            <div className="flex items-center gap-3 pt-0.5">
              <button
                type="button"
                onClick={stop(() => onEdit(record.id))}
                className="bg-danger rounded-md px-3 py-1.5 text-[11px] font-bold text-white"
              >
                수정 후 재제출
              </button>
              <button
                type="button"
                onClick={stop(() => setRejectOpen(true))}
                className="text-fg-muted text-[11px] font-semibold hover:underline"
              >
                자세히 →
              </button>
            </div>
          </div>
        )}

        <div className="border-divider flex items-center justify-between border-t pt-3">
          <span className="text-fg-subtle text-[12px]">
            {record.instructor}
          </span>
          <div className="flex items-center gap-2">
            {record.canEdit && (
              <button
                type="button"
                onClick={stop(() => onEdit(record.id))}
                className="bg-brand rounded-lg px-4 py-2 text-[12px] font-bold text-white"
              >
                수정
              </button>
            )}
            {record.canDelete && (
              <button
                type="button"
                onClick={stop(() => onDelete(record.id))}
                className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-4 py-2 text-[12px] font-semibold"
              >
                삭제
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 반려 사유 모달 — "자세히"로 진입 */}
      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        size="md"
        title="반려 사유"
      >
        {record.rejectReason && (
          <div className="flex flex-col gap-2">
            <span className="text-danger flex items-center gap-1.5 text-[14px] font-bold">
              <AlertTriangle className="size-4 shrink-0" />
              {record.rejectReason.title}
            </span>
            <p className="text-fg-muted text-[14px] leading-6">
              {record.rejectReason.detail}
            </p>
          </div>
        )}
      </Modal>

      {/* 기록 상세 모달 — 카드 클릭으로 진입(블로그·스터디·자격증) */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        size="md"
        title={`${categoryLabel} 상세`}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'rounded-md px-2 py-1 text-[11px] font-bold',
                STATUS[record.status].cls,
              )}
            >
              {record.statusLabel}
            </span>
            <span className="text-fg-subtle text-[12px]">
              {record.weekLabel} · {record.dateRange}
            </span>
          </div>
          <h3 className="text-fg text-[18px] font-bold">{record.title}</h3>
          <dl className="flex flex-col gap-2 text-[13px]">
            {record.category === 'blog' && record.url && (
              <div className="flex gap-2">
                <dt className="text-fg-subtle w-20 shrink-0">링크</dt>
                <dd className="min-w-0 flex-1">
                  <a
                    href={record.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand block truncate font-semibold"
                  >
                    {record.url}
                  </a>
                </dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="text-fg-subtle w-20 shrink-0">제출/검토</dt>
              <dd className="text-fg">
                {record.submittedAt} · {record.statusAt}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-fg-subtle w-20 shrink-0">검토자</dt>
              <dd className="text-fg">{record.instructor}</dd>
            </div>
          </dl>
          {record.rejectReason && (
            <div className="border-danger/40 bg-danger-bg/50 flex flex-col gap-1 rounded-[12px] border p-3.5">
              <span className="text-danger text-[12px] font-bold">
                {record.rejectReason.title}
              </span>
              <span className="text-fg-muted text-[12px] leading-5">
                {record.rejectReason.detail}
              </span>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
