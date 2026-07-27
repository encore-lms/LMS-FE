import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import type { StudentQuizListItem } from '../types'
import { CATEGORY_BADGE, GRADING_LABEL } from './quizDisplay'

// 상태별 배지(라벨·색) — 응시 예정/완료/채점 대기/기간 종료.
const STATUS_META: Record<
  'scheduled' | 'completed' | 'pending_manual' | 'closed',
  { label: string; badge: string }
> = {
  scheduled: { label: '응시 예정', badge: 'bg-warning-bg text-warning' },
  completed: { label: '완료', badge: 'bg-success-bg text-success' },
  pending_manual: {
    label: '채점 대기',
    badge: 'bg-accent-bg text-accent-strong',
  },
  closed: { label: '기간 종료', badge: 'bg-surface-muted text-fg-subtle' },
}

// 응시 예정/완료/채점 대기/기간 종료 퀴즈 한 줄 — 제목·메타 + 점수·상태 배지 + 액션(결과 보기/비활성).
export function OtherStatusRow({
  item,
  onResult,
}: {
  item: StudentQuizListItem
  onResult: () => void
}) {
  const closed = item.state === 'closed'
  const status =
    STATUS_META[item.state as keyof typeof STATUS_META] ?? STATUS_META.closed
  const meta = `${item.periodLabel} · ${item.quiz.timeLimitMinutes}분 · ${item.questionCount}문항 · ${GRADING_LABEL[item.quiz.gradingMode]}`

  return (
    <div className="flex w-full items-center gap-4 px-6 py-3.5">
      {/* 좌: 카테고리·제목·메타 */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          {item.category && (
            <span
              className={cn(
                'shrink-0 rounded-[5px] px-2 py-[3px] text-[10px] font-bold tracking-[0.04em]',
                CATEGORY_BADGE[item.category],
              )}
            >
              {item.category}
            </span>
          )}
          <span
            className={cn(
              'truncate text-[14px] font-semibold',
              closed ? 'text-fg-muted' : 'text-fg',
            )}
          >
            {item.quiz.title}
          </span>
        </div>
        <span className="text-fg-subtle text-[11px]">{meta}</span>
      </div>

      {/* 우: 점수 · 상태 배지 · 액션(고정 폭으로 행 간 정렬) */}
      <div className="flex shrink-0 items-center gap-3">
        {item.state === 'completed' && item.latestSubmission && (
          <span className="text-fg text-[14px] font-bold tabular-nums">
            {item.latestSubmission.totalScore}
            <span className="text-fg-subtle ml-0.5 text-[11px] font-medium">
              점
            </span>
          </span>
        )}
        <span
          className={cn(
            'rounded-[5px] px-2 py-[3px] text-[11px] font-bold',
            status.badge,
          )}
        >
          {status.label}
        </span>
        <div className="flex w-[104px] justify-end">
          {item.state === 'completed' ? (
            <button
              type="button"
              onClick={onResult}
              className={buttonClass({ size: 'sm', className: 'shrink-0' })}
            >
              결과 보기 <span aria-hidden>→</span>
            </button>
          ) : (
            <span className="text-fg-subtle text-[12px] font-medium">
              {item.state === 'pending_manual'
                ? '결과 준비 중'
                : item.state === 'scheduled'
                  ? '시작 전'
                  : '응시 불가'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
