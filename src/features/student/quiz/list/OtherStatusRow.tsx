import { cn } from '@/shared/lib/cn'
import type { StudentQuizListItem } from '../types'
import { CATEGORY_BADGE, GRADING_LABEL } from './quizDisplay'

// 완료/채점 대기/기간 종료 퀴즈 한 줄 — 제목·메타 + 상태/점수 + 액션(결과 보기/비활성).
export function OtherStatusRow({
  item,
  onResult,
}: {
  item: StudentQuizListItem
  onResult: () => void
}) {
  const closed = item.state === 'closed'
  const meta = `${item.periodLabel}  ·  ${item.quiz.timeLimitMinutes}분 · ${item.questionCount}문항 · ${GRADING_LABEL[item.quiz.gradingMode]}`

  return (
    <div className="flex w-full items-center gap-3.5 px-6 py-3.5">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-[5px] px-2 py-[3px] text-[10px] font-bold tracking-[0.04em]',
              CATEGORY_BADGE[item.category],
            )}
          >
            {item.category}
          </span>
          <span
            className={cn(
              'text-[13px] font-semibold',
              closed ? 'text-fg-muted' : 'text-fg',
            )}
          >
            {item.quiz.title}
          </span>
        </div>
        <span className="text-fg-subtle text-[11px]">{meta}</span>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        {item.state === 'completed' && (
          <>
            <span className="text-success text-[12px] font-medium">
              {item.latestSubmission?.totalScore}점
            </span>
            <span className="bg-success-bg text-success rounded-[5px] px-2 py-[3px] text-[11px] font-bold">
              완료
            </span>
          </>
        )}
        {item.state === 'pending_manual' && (
          <>
            <span className="text-accent-strong text-[12px] font-medium">
              운영자 채점 진행 중
            </span>
            <span className="bg-accent-bg text-accent-strong rounded-[5px] px-2 py-[3px] text-[11px] font-bold">
              채점 대기
            </span>
          </>
        )}
        {closed && (
          <>
            <span className="text-fg-subtle text-[12px] font-medium">
              미응시 · 기간 만료
            </span>
            <span className="bg-surface-muted text-fg-subtle rounded-[5px] px-2 py-[3px] text-[11px] font-bold">
              기간 종료
            </span>
          </>
        )}
      </div>

      {item.state === 'completed' ? (
        <button
          type="button"
          onClick={onResult}
          className="bg-brand flex shrink-0 items-center gap-1 rounded-lg px-3.5 py-1.5 text-[12px] font-semibold text-white"
        >
          결과 보기 <span aria-hidden>→</span>
        </button>
      ) : (
        <span className="bg-surface-muted text-fg-subtle shrink-0 rounded-lg px-3.5 py-1.5 text-[12px] font-semibold">
          {item.state === 'pending_manual' ? '채점 대기' : '응시 불가'}
        </span>
      )}
    </div>
  )
}
