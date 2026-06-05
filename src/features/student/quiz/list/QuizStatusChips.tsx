import { cn } from '@/shared/lib/cn'
import type { QuizListItem } from '@/shared/types'

// 퀴즈 상태 필터 칩 — 응시 가능/완료/채점 대기/기간 종료. 활성 칩은 brand-deep 강조.
export type QuizStatus = QuizListItem['state']

const DOT: Record<QuizStatus, string> = {
  available: 'bg-brand',
  completed: 'bg-success',
  pending_manual: 'bg-accent-strong',
  closed: 'bg-fg-subtle',
}
const LABEL: Record<QuizStatus, string> = {
  available: '응시 가능',
  completed: '완료',
  pending_manual: '채점 대기',
  closed: '기간 종료',
}
const ORDER: QuizStatus[] = [
  'available',
  'completed',
  'pending_manual',
  'closed',
]

export function QuizStatusChips({
  counts,
  active,
  onChange,
}: {
  counts: Record<QuizStatus, number>
  active: QuizStatus
  onChange: (s: QuizStatus) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {ORDER.map((s) => {
        const isActive = s === active
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={cn(
              'flex items-center gap-2 rounded-[10px] px-3.5 py-[7px]',
              isActive ? 'bg-brand-deep' : 'border-border bg-surface border',
            )}
          >
            <span
              className={cn(
                'size-1.5 rounded-full',
                isActive ? 'bg-white' : DOT[s],
              )}
            />
            <span
              className={cn(
                'text-[13px]',
                isActive ? 'font-bold text-white' : 'text-fg font-medium',
              )}
            >
              {LABEL[s]}
            </span>
            <span
              className={cn(
                'rounded-[5px] px-1.5 py-0.5 text-[11px] font-bold',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-surface-muted text-fg-muted',
              )}
            >
              {counts[s]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
