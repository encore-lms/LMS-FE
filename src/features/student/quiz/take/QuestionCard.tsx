import { Fragment, useEffect } from 'react'
import { cn } from '@/shared/lib/cn'
import type { QuestionType, QuizQuestion } from '@/shared/types'

// 빈칸 채우기 인라인 입력 — 본문의 ___ 를 입력칸으로 치환. 빈칸별 값은 부모에 \n 으로 보관.
function FillBlankInline({
  prompt,
  value,
  onChange,
}: {
  prompt: string
  value: string | undefined
  onChange: (value: string) => void
}) {
  const parts = prompt.split('___')
  const blanks = Math.max(0, parts.length - 1)
  const vals = (value ?? '').split('\n')
  const setBlank = (i: number, v: string) => {
    const next = Array.from({ length: blanks }, (_, j) =>
      j === i ? v : (vals[j] ?? ''),
    )
    onChange(next.join('\n'))
  }
  return (
    <p className="text-fg text-[18px] leading-[44px]">
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < blanks && (
            <input
              type="text"
              aria-label={`빈칸 ${i + 1}`}
              value={vals[i] ?? ''}
              onChange={(e) => setBlank(i, e.target.value)}
              placeholder={`(${i + 1})`}
              className="border-brand/50 focus:border-brand text-fg bg-brand/5 mx-1.5 inline-block w-32 rounded-md border-b-2 px-2 py-1 text-center text-[15px] outline-none"
            />
          )}
        </Fragment>
      ))}
    </p>
  )
}

// 퀴즈 응시 본문 문제 카드 — 칩(번호/배점/유형/난이도) + 발문 + 보기(객관식) 또는 입력(단답/서술).
const TYPE_LABEL: Record<QuestionType, string> = {
  multiple_choice: '객관식',
  short_answer: '단답',
  fill_blank: '빈칸',
}

const DIFFICULTY_LABEL: Record<
  NonNullable<QuizQuestion['difficulty']>,
  string
> = {
  easy: '쉬움',
  normal: '보통',
  hard: '어려움',
}

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
  const isMultiple = question.type === 'multiple_choice' && !!question.choices

  // 1~9 숫자 키로 보기 빠르게 선택(객관식).
  useEffect(() => {
    if (!isMultiple || !question.choices) return
    const choices = question.choices
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (!/^[1-9]$/.test(e.key)) return
      const i = Number(e.key) - 1
      if (i < choices.length) {
        e.preventDefault()
        onChange(choices[i].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isMultiple, question.choices, onChange])

  return (
    <div className="border-border bg-surface flex w-[800px] max-w-full flex-col gap-7 rounded-2xl border p-9 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-accent-strong rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white">
          문제 {index + 1} / {total}
        </span>
        <span className="bg-surface-muted border-border text-fg-muted rounded-full border px-2.5 py-[5px] text-[11px] font-semibold">
          배점 {question.maxPoints}점
        </span>
        <span className="bg-surface-muted border-border text-fg-muted rounded-full border px-2.5 py-[5px] text-[11px] font-semibold">
          {TYPE_LABEL[question.type]}
        </span>
        {question.difficulty && (
          <span className="bg-warning-bg text-warning rounded-full px-2.5 py-[5px] text-[11px] font-semibold">
            난이도 · {DIFFICULTY_LABEL[question.difficulty]}
          </span>
        )}
      </div>

      {question.type === 'fill_blank' ? (
        // 빈칸 채우기 — 본문의 ___ 를 인라인 입력칸으로(이전 LMS 방식). 빈칸별 값은 \n 으로 보관.
        <FillBlankInline
          prompt={question.prompt}
          value={value}
          onChange={onChange}
        />
      ) : (
        <>
          <p className="text-fg text-[18px] leading-[30px]">
            {question.prompt}
          </p>
          {isMultiple && question.choices ? (
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
                      {i + 1}.
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
              rows={2}
              placeholder="답안을 입력하세요"
              className="border-border text-fg placeholder:text-fg-subtle focus:border-brand w-full rounded-xl border px-4 py-3 text-[15px] outline-none"
            />
          )}
        </>
      )}

      {isMultiple && question.choices && (
        <p className="text-fg-subtle flex items-center gap-1.5 text-[12px]">
          <kbd className="border-border bg-surface-muted rounded border px-1.5 py-0.5 text-[10px] font-semibold not-italic">
            1
          </kbd>
          ~
          <kbd className="border-border bg-surface-muted rounded border px-1.5 py-0.5 text-[10px] font-semibold not-italic">
            {question.choices.length}
          </kbd>
          키로 빠르게 선택할 수 있어요
        </p>
      )}
    </div>
  )
}
