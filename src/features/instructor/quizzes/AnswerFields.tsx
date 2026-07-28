import { useId } from 'react'
import { Plus, X } from 'lucide-react'
import { NumberInput } from '@/components/ui/NumberInput'
import { cn } from '@/shared/lib/cn'
import type { InstructorQuestionType } from '@/shared/types'
import {
  countBlanks,
  deriveBlankAnswers,
  deriveBlankScores,
  distributeBlankScores,
  FIELD,
  FIELD_BASE,
  type AnswerDraft,
} from './answerDraft'

// 유형별 정답 입력 UI — 객관식 보기·정답 / 단답 정답 / 서술 채점 기준 / 빈칸 정답·배점.
// §7 퀴즈 문항 폼(QuizQuestionEditor)과 §10 템플릿 워크벤치(QuestionWorkbench)가 공유.
export function AnswerFields({
  type,
  text,
  points,
  value,
  onChange,
  essayNote,
}: {
  type: InstructorQuestionType
  /** 빈칸(___) 개수를 세는 원문 — 퀴즈는 prompt, 템플릿은 body */
  text: string
  points: number
  value: AnswerDraft
  onChange: (patch: Partial<AnswerDraft>) => void
  /** 서술형 하단 안내 문구 — 미지정 시 숨김 */
  essayNote?: string
}) {
  // 폼이 동시에 두 개 열려도 라디오 그룹이 섞이지 않게 인스턴스별 name.
  const radioName = useId()
  const blanks = type === 'fill_blank' ? countBlanks(text) : 0
  const answers = deriveBlankAnswers(value.answers, blanks)
  const scores = deriveBlankScores(value.blankScores, points, blanks)
  const scoreSum = scores.reduce((s, v) => s + (v || 0), 0)

  return (
    <>
      {type === 'multiple_choice' && (
        <div>
          <span className="text-fg-muted mb-1 block text-xs font-semibold">
            보기 · 정답(라디오 선택)
          </span>
          <div className="flex flex-col gap-1.5">
            {value.choices.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={radioName}
                  checked={value.answerIndex === i}
                  onChange={() => onChange({ answerIndex: i })}
                  aria-label={`정답 ${i + 1}`}
                />
                <input
                  value={c}
                  onChange={(e) =>
                    onChange({
                      choices: value.choices.map((x, j) =>
                        j === i ? e.target.value : x,
                      ),
                    })
                  }
                  placeholder={`보기 ${i + 1}`}
                  className={FIELD}
                />
                {value.choices.length > 2 && (
                  <button
                    type="button"
                    aria-label={`보기 ${i + 1} 삭제`}
                    onClick={() =>
                      onChange({
                        choices: value.choices.filter((_, j) => j !== i),
                        answerIndex: Math.max(
                          0,
                          value.answerIndex >= i
                            ? value.answerIndex - 1
                            : value.answerIndex,
                        ),
                      })
                    }
                    className="text-fg-subtle hover:text-danger shrink-0 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {value.choices.length < 5 && (
            <button
              type="button"
              onClick={() => onChange({ choices: [...value.choices, ''] })}
              className="border-border text-fg-muted hover:bg-surface-muted mt-2 inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" /> 보기 추가
            </button>
          )}
        </div>
      )}

      {type === 'short_answer' && (
        <div>
          <span className="text-fg-muted mb-1 block text-xs font-semibold">
            정답
          </span>
          <input
            value={value.answerText}
            onChange={(e) => onChange({ answerText: e.target.value })}
            placeholder="정답 텍스트"
            className={FIELD}
          />
        </div>
      )}

      {type === 'essay' && (
        <div>
          <span className="text-fg-muted mb-1 block text-xs font-semibold">
            채점 기준 / 모범답안 (선택) — 학생에게 비공개
          </span>
          <textarea
            rows={3}
            value={value.answerText}
            onChange={(e) => onChange({ answerText: e.target.value })}
            placeholder="강사 채점 시 참고할 기준이나 모범답안을 적어두세요"
            className={`${FIELD} h-auto py-2`}
          />
          {essayNote && (
            <p className="text-fg-subtle mt-1 text-xs">{essayNote}</p>
          )}
        </div>
      )}

      {type === 'fill_blank' && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-fg-muted text-xs font-semibold">
              빈칸 정답·배점 ({blanks}개)
            </span>
            {blanks > 0 && (
              <button
                type="button"
                onClick={() =>
                  onChange({
                    blankScores: distributeBlankScores(points, blanks),
                  })
                }
                className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-2.5 py-1 text-xs font-semibold"
              >
                배점 자동 분배
              </button>
            )}
          </div>
          {blanks === 0 ? (
            <p className="text-fg-subtle text-xs">
              문항 내용에 ___ 를 넣으면 빈칸 정답 칸이 생겨요.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                {answers.map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={a}
                      onChange={(e) =>
                        onChange({
                          answers: answers.map((x, j) =>
                            j === i ? e.target.value : x,
                          ),
                        })
                      }
                      placeholder={`빈칸 ${i + 1} 정답`}
                      className={`${FIELD_BASE} min-w-0 flex-1`}
                    />
                    <NumberInput
                      min={1}
                      aria-label={`빈칸 ${i + 1} 배점`}
                      value={scores[i] ?? 0}
                      onChange={(score) =>
                        onChange({
                          blankScores: scores.map((x, j) =>
                            j === i ? score : x,
                          ),
                        })
                      }
                      className={`${FIELD_BASE} w-20 shrink-0 text-center`}
                    />
                  </div>
                ))}
              </div>
              <p
                className={cn(
                  'mt-1 text-xs',
                  scoreSum === points ? 'text-fg-subtle' : 'text-warning',
                )}
              >
                배점 합 {scoreSum} / {points}
                {scoreSum !== points && ' · 배점과 일치해야 저장돼요'}
              </p>
            </>
          )}
        </div>
      )}
    </>
  )
}
