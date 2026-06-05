import { cn } from '@/shared/lib/cn'
import type { StudentQuizListItem } from '../types'
import { CATEGORY_BADGE, GRADING_LABEL, dDayTone } from './quizDisplay'

// 응시 가능 퀴즈 한 줄 — D-day 원형 + 카테고리/기간/제목/메타 + 응시 시작 CTA(임박 시 빨강).
function Sep() {
  return <span className="bg-border h-3 w-px shrink-0" />
}
const Clock = (
  <svg
    viewBox="0 0 24 24"
    className="text-fg-muted size-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2.5M9 2h6" strokeLinecap="round" />
  </svg>
)
const Doc = (
  <svg
    viewBox="0 0 24 24"
    className="text-fg-muted size-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path
      d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
      strokeLinejoin="round"
    />
    <path d="M14 3v5h5" strokeLinejoin="round" />
  </svg>
)

export function AvailableQuizRow({
  item,
  onTake,
}: {
  item: StudentQuizListItem
  onTake: () => void
}) {
  const urgent = item.dDay != null && item.dDay <= 1
  return (
    <div className="flex w-full items-center gap-3.5 px-6 py-3.5">
      <div
        className={cn(
          'flex size-[54px] shrink-0 flex-col items-center justify-center rounded-full border-[1.5px]',
          dDayTone(item.dDay ?? 99),
        )}
      >
        <span className="text-[14px] leading-[18px] font-bold">
          D-{item.dDay}
        </span>
        <span className="text-[9px]">남음</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-[5px] px-2 py-[3px] text-[10px] font-bold tracking-[0.04em]',
              CATEGORY_BADGE[item.category],
            )}
          >
            {item.category}
          </span>
          <span className="text-fg-subtle text-[11px]">{item.periodLabel}</span>
        </div>
        <p className="text-fg text-[14px] leading-5 font-semibold">
          {item.quiz.title}
        </p>
        <div className="text-fg-muted flex items-center gap-3.5 text-[11px] font-medium">
          <span className="flex items-center gap-1">
            {Clock}
            {item.quiz.timeLimitMinutes}분
          </span>
          <Sep />
          <span className="flex items-center gap-1">
            {Doc}
            {item.questionCount}문항
          </span>
          <Sep />
          <span>채점 {GRADING_LABEL[item.quiz.gradingMode]}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onTake}
        className={cn(
          'flex h-[42px] w-[132px] shrink-0 items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-bold text-white',
          urgent ? 'bg-danger' : 'bg-brand',
        )}
      >
        응시 시작 <span aria-hidden>→</span>
      </button>
    </div>
  )
}
