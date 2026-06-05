import { cn } from '@/shared/lib/cn'
import type { QuestionType, QuizQuestion } from '@/shared/types'

// 퀴즈 응시 본문 문제 카드 — 칩(번호/배점/유형) + 발문 + 보기(객관식) 또는 입력(단답/서술).
const TYPE_LABEL: Record<QuestionType, string> = {
  multiple_choice: '객관식',
  short_answer: '단답',
  fill_blank: '빈칸',
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export function QuestionCard({
  question,
  index,
  total,
  value,
  onChange,
}: {
  question: QuizQuestion
  index: number
  total: number
  value: string | undefined
  onChange: (value: string) => void
}) {
  return (
    <div className="border-border bg-surface flex w-[800px] max-w-full flex-col gap-7 rounded-2xl border p-9 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-accent-strong rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white">
          문제 {index + 1} / {total}
        </span>
        <span className="bg-brand/10 text-brand rounded-full px-2.5 py-[5px] text-[11px] font-semibold">
          배점 {question.maxPoints}점
        </span>
        <span className="bg-surface-muted border-border text-fg-muted rounded-full border px-2.5 py-[5px] text-[11px] font-semibold">
          {TYPE_LABEL[question.type]}
        </span>
      </div>

      <p className="text-fg text-[18px] leading-[30px]">{question.prompt}</p>

      {question.type === 'multiple_choice' && question.choices ? (
        <div className="flex flex-col gap-3">
          {question.choices.map((choice, i) => {
            const selected = value === choice.id
            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => onChange(choice.id)}
                className={cn(
                  'flex items-center gap-3.5 rounded-xl border-2 px-5 py-4 text-left',
                  selected
                    ? 'border-brand bg-brand/10'
                    : 'border-border bg-surface',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-[10px] border-2',
                    selected ? 'border-brand bg-brand' : 'border-fg-subtle',
                  )}
                >
                  {selected && <span className="size-2 rounded bg-white" />}
                </span>
                <span
                  className={cn(
                    'text-[14px] font-semibold',
                    selected ? 'text-brand' : 'text-fg-muted',
                  )}
                >
                  {OPTION_LETTERS[i]}.
                </span>
                <span className="text-fg text-[15px]">{choice.label}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          rows={question.type === 'short_answer' ? 2 : 6}
          placeholder="답안을 입력하세요"
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand w-full rounded-xl border px-4 py-3 text-[15px] outline-none"
        />
      )}
    </div>
  )
}
