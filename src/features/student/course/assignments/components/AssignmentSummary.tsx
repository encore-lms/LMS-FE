import { cn } from '@/shared/lib/cn'
import type { AssignmentDetail, AssignmentStatus, DueTone } from '../types'

// 과제 상세 요약 카드 — 제목·설명 / 마감·제출 상태 / 과목·마감·평가방식 배지.
export const STATUS_BADGE: Record<
  AssignmentStatus,
  { cls: string; label: string }
> = {
  not_submitted: { cls: 'bg-warning-bg text-warning', label: '미제출' },
  submitted: { cls: 'bg-brand/10 text-brand', label: '제출 완료' },
  reviewed: { cls: 'bg-info-bg text-info', label: '검토 완료' },
}
const DUE_BADGE: Record<DueTone, string> = {
  soon: 'bg-warning-bg text-warning',
  normal: 'bg-warning-bg text-warning',
  ended: 'bg-surface-muted text-fg-subtle',
}

export function AssignmentSummary({
  detail,
  status,
}: {
  detail: AssignmentDetail
  status?: AssignmentStatus // 제출 후 갱신된 유효 상태(미지정 시 detail.status)
}) {
  const effectiveStatus = status ?? detail.status
  return (
    <section className="border-border bg-surface flex items-start justify-between gap-6 rounded-lg border p-6">
      <div className="flex min-w-0 flex-col gap-3">
        <h2 className="text-fg text-[20px] font-bold">{detail.title}</h2>
        <p className="text-fg-muted max-w-[760px] text-[13px] leading-5">
          {detail.description}
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="bg-surface-muted text-fg-muted rounded-md px-2 py-[3px] text-[11px] font-semibold">
            {detail.subject}
          </span>
          <span
            className={cn(
              'rounded-md px-2 py-[3px] text-[11px] font-semibold',
              DUE_BADGE[detail.dueTone],
            )}
          >
            {detail.dueBadge}
          </span>
          <span className="bg-accent-bg text-accent-strong rounded-md px-2 py-[3px] text-[11px] font-semibold">
            {detail.evaluationType}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
        <span className="text-fg text-[13px] font-semibold">
          마감 {detail.dueAtLabel}
        </span>
        <span className="text-fg-muted text-[13px]">
          제출 상태: {STATUS_BADGE[effectiveStatus].label}
        </span>
      </div>
    </section>
  )
}
