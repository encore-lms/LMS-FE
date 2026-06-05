import { cn } from '@/shared/lib/cn'
import type { AssignmentListItem, AssignmentStatus, DueTone } from '../types'

// 과제 한 줄 카드 — 제목+상태 배지 / 과목·마감·평가방식·피드백 메타 / 상태별 액션 버튼.
const STATUS_BADGE: Record<AssignmentStatus, { cls: string; label: string }> = {
  not_submitted: { cls: 'bg-surface-muted text-fg-muted', label: '미제출' },
  submitted: { cls: 'bg-brand/10 text-brand', label: '제출 완료' },
  reviewed: { cls: 'bg-info-bg text-info', label: '검토 완료' },
}

const STATUS_CTA: Record<
  AssignmentStatus,
  { label: string; primary: boolean }
> = {
  not_submitted: { label: '제출하기', primary: true },
  submitted: { label: '제출 보기·수정', primary: false },
  reviewed: { label: '피드백 보기', primary: false },
}

const DUE_TONE: Record<DueTone, string> = {
  soon: 'text-warning',
  normal: 'text-fg-subtle',
  ended: 'text-fg-subtle',
}

function Dot() {
  return <span className="bg-fg-subtle size-[3px] shrink-0 rounded-full" />
}

export function AssignmentCard({
  item,
  onAction,
}: {
  item: AssignmentListItem
  onAction: () => void
}) {
  const badge = STATUS_BADGE[item.status]
  const cta = STATUS_CTA[item.status]
  return (
    <div className="border-border bg-surface flex w-full items-center gap-4 rounded-[14px] border p-5">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-fg text-[15px] font-semibold tracking-[-0.01em]">
            {item.title}
          </span>
          <span
            className={cn(
              'rounded-md px-2 py-[3px] text-[11px] font-semibold',
              badge.cls,
            )}
          >
            {badge.label}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-[12px]">
          <span className="text-fg-muted font-medium">{item.subject}</span>
          <Dot />
          <span className={cn('font-medium', DUE_TONE[item.dueTone])}>
            {item.dueLabel}
          </span>
          <Dot />
          <span className="text-fg-subtle">{item.evaluationType}</span>
          {item.hasFeedback && (
            <>
              <Dot />
              <span className="text-fg-subtle">강사 피드백 있음</span>
            </>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onAction}
        className={cn(
          'flex h-[42px] shrink-0 items-center justify-center rounded-[10px] px-[18px] text-[14px] font-semibold',
          cta.primary
            ? 'bg-brand text-white'
            : 'border-border text-fg bg-surface border',
        )}
      >
        {cta.label}
      </button>
    </div>
  )
}
