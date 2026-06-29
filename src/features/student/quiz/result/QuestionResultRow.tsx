import { cn } from '@/shared/lib/cn'
import type { AnswerPayload, QuizAnswer } from '@/shared/types'

// 퀴즈 결과 문제별 행 — 좌측 상태 스트립 + 번호/유형 + 발문 + 내 답안/정답 + 점수(+강사 피드백).
function answerText(a: AnswerPayload): string {
  if (a.kind === 'multiple_choice') return a.selectedChoiceId
  if (a.kind === 'short_answer') return a.text
  return a.answers.join(', ')
}

const KIND_LABEL: Record<AnswerPayload['kind'], string> = {
  multiple_choice: '객관식',
  short_answer: '단답',
  fill_blank: '빈칸',
}

export function QuestionResultRow({
  num,
  answer,
}: {
  num: number
  answer: QuizAnswer
}) {
  const tone = answer.pending
    ? {
        strip: 'bg-warning',
        badge: 'bg-warning-bg text-warning',
        score: 'text-warning',
      }
    : answer.isCorrect
      ? { strip: 'bg-brand', badge: 'bg-brand/10 text-brand', score: 'text-fg' }
      : {
          strip: 'bg-danger',
          badge: 'bg-danger-bg text-danger',
          score: 'text-danger',
        }
  const correctKey = Array.isArray(answer.correctAnswerKey)
    ? answer.correctAnswerKey.join(', ')
    : answer.correctAnswerKey

  return (
    <div className="border-border bg-surface relative flex overflow-hidden rounded-2xl border shadow-[0px_1px_4px_0px_rgba(0,0,0,0.03)]">
      <span className={cn('w-1 shrink-0', tone.strip)} />
      <div className="flex flex-1 items-start gap-3.5 p-6">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-2xl text-[13px] font-bold',
            tone.badge,
          )}
        >
          {num}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="bg-surface-muted border-border text-fg-muted w-fit rounded-[10px] border px-2.5 py-1 text-[10px] font-semibold">
            {KIND_LABEL[answer.answer.kind]}
          </span>
          <p className="text-fg text-[14px] leading-[22px] font-semibold">
            {answer.prompt}
          </p>
          {answer.answer.kind === 'fill_blank' ? (
            // 빈칸별 내 답안/정답 격자(이전 LMS 방식)
            <div className="mt-1 flex flex-col gap-1.5">
              {answer.answer.answers.map((mine, i) => {
                const correctArr = Array.isArray(answer.correctAnswerKey)
                  ? answer.correctAnswerKey
                  : []
                const correct = correctArr[i] ?? ''
                const okBlank =
                  mine.trim().toLowerCase() === correct.trim().toLowerCase() &&
                  correct !== ''
                return (
                  <div key={i} className="flex items-center gap-2 text-[13px]">
                    <span className="text-fg-subtle w-12 shrink-0 text-[11px] font-medium">
                      빈칸 {i + 1}
                    </span>
                    <span className={okBlank ? 'text-fg' : 'text-danger'}>
                      {mine.trim() || '미입력'}
                    </span>
                    {correct !== '' && (
                      <>
                        <span className="text-fg-subtle">→</span>
                        <span className="text-brand">{correct}</span>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <>
              <div className="mt-1 flex gap-3">
                <span className="text-fg-subtle w-12 shrink-0 text-[11px] font-medium">
                  내 답안
                </span>
                <span
                  className={cn(
                    'text-[13px]',
                    answer.pending
                      ? 'text-fg-muted'
                      : answer.isCorrect
                        ? 'text-fg'
                        : 'text-danger',
                  )}
                >
                  {answerText(answer.answer) || '미입력'}
                </span>
              </div>
              {correctKey && (
                <div className="flex gap-3">
                  <span className="text-fg-subtle w-12 shrink-0 text-[11px] font-medium">
                    정답
                  </span>
                  <span className="text-brand text-[13px]">{correctKey}</span>
                </div>
              )}
            </>
          )}
          {answer.feedback && (
            <div className="bg-accent-bg mt-2 flex items-start gap-4 rounded-[10px] px-3.5 py-2.5">
              <span className="text-accent-strong shrink-0 text-[11px] font-bold">
                강사 피드백
              </span>
              <span className="text-fg text-[12px] leading-[18px]">
                {answer.feedback}
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex w-[120px] shrink-0 flex-col items-start gap-1 rounded-[10px] px-4 py-2.5',
            answer.pending ? 'bg-warning-bg' : 'bg-surface-muted',
          )}
        >
          <span
            className={cn(
              'text-[11px] font-medium',
              answer.pending ? 'text-warning' : 'text-fg-subtle',
            )}
          >
            {answer.pending ? '채점 대기' : '점수'}
          </span>
          <span className={cn('text-[20px] font-bold', tone.score)}>
            {answer.pending ? '—' : answer.earnedPoints} / {answer.maxPoints}
          </span>
        </div>
      </div>
    </div>
  )
}
