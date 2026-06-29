import { useMemo, useState } from 'react'
import { AlertTriangle, ChevronDown, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import type { InstructorQuestion } from '@/shared/types'
import {
  useDeleteQuizQuestion,
  useQuizQuestions,
  useSaveQuizQuestion,
  type SaveQuizQuestionInput,
} from '../api/quizzes'

// 이전 LMS 문제 생성 방식 — 객관식/주관식/빈칸. (코드블록·엑셀 임포트는 후속)
const TYPES: { value: SaveQuizQuestionInput['type']; label: string }[] = [
  { value: 'multiple_choice', label: '객관식' },
  { value: 'short_answer', label: '주관식' },
  { value: 'fill_blank', label: '빈칸 채우기' },
  { value: 'essay', label: '서술형' },
]
const TYPE_LABEL: Record<string, string> = {
  multiple_choice: '객관식',
  short_answer: '주관식',
  fill_blank: '빈칸',
  essay: '서술형',
}

interface DraftState {
  type: SaveQuizQuestionInput['type']
  prompt: string
  choices: string[]
  answerIndex: number
  answerText: string
  answers: string[]
  blankScores: number[]
  points: number
}

const EMPTY_DRAFT: DraftState = {
  type: 'multiple_choice',
  prompt: '',
  choices: ['', ''],
  answerIndex: 0,
  answerText: '',
  answers: [],
  blankScores: [],
  points: 10,
}

function toDraft(q: InstructorQuestion): DraftState {
  const type = (q.type as SaveQuizQuestionInput['type']) ?? 'multiple_choice'
  const fb = type === 'fill_blank' ? parseFillBlank(q.answerKey) : null
  return {
    type,
    prompt: q.body ?? '',
    choices: q.choices && q.choices.length >= 2 ? q.choices : ['', ''],
    answerIndex: type === 'multiple_choice' ? Number(q.answerKey ?? 0) || 0 : 0,
    answerText:
      type === 'short_answer' || type === 'essay' ? (q.answerKey ?? '') : '',
    answers: fb ? fb.answers : [],
    blankScores: fb ? fb.scores : [],
    points: q.points ?? 10,
  }
}
// fill_blank answerKey = {"answers":[...],"scores":[...]} (구버전 배열도 허용)
function parseFillBlank(json?: string): {
  answers: string[]
  scores: number[]
} {
  if (!json) return { answers: [], scores: [] }
  try {
    const v = JSON.parse(json)
    if (Array.isArray(v)) return { answers: v.map(String), scores: [] }
    return {
      answers: (v.answers ?? []).map(String),
      scores: (v.scores ?? []).map(Number),
    }
  } catch {
    return { answers: [], scores: [] }
  }
}
// 빈칸 내용의 ___ 개수만큼 정답 칸 동기화.
function countBlanks(prompt: string) {
  const m = prompt.match(/___/g)
  return m ? m.length : 0
}
// 배점 자동 분배(이전 LMS): 균등 + 나머지는 뒤 칸에 +1. (10,3)→[3,3,4]
function distributeBlankScores(points: number, blanks: number): number[] {
  if (blanks <= 0) return []
  if (points < blanks) return Array.from({ length: blanks }, () => 1)
  const base = Math.floor(points / blanks)
  const rem = points - base * blanks
  return Array.from({ length: blanks }, (_, i) =>
    i >= blanks - rem ? base + 1 : base,
  )
}

const FIELD_BASE =
  'border-border focus:border-brand text-fg placeholder:text-fg-subtle rounded-lg border bg-white px-3 py-2 text-sm outline-none'
const FIELD = `${FIELD_BASE} w-full`

// 인라인 문항 폼 — 추가/편집 공용.
function QuestionForm({
  quizId,
  questionId,
  initial,
  onClose,
}: {
  quizId: string
  questionId?: string
  initial: DraftState
  onClose: () => void
}) {
  const save = useSaveQuizQuestion(quizId, questionId)
  const toast = useToast()
  const [d, setD] = useState<DraftState>(initial)
  const set = (patch: Partial<DraftState>) => setD((p) => ({ ...p, ...patch }))

  const blanks = d.type === 'fill_blank' ? countBlanks(d.prompt) : 0
  // 빈칸 수에 맞춰 정답 배열 동기화
  const answers = useMemo(() => {
    const a = [...d.answers]
    a.length = blanks
    return Array.from({ length: blanks }, (_, i) => a[i] ?? '')
  }, [blanks, d.answers])
  // 빈칸 수가 바뀌면 배점 자동 분배, 사용자가 직접 고친 값은 유지
  const scores = useMemo(
    () =>
      d.blankScores.length === blanks
        ? d.blankScores
        : distributeBlankScores(d.points, blanks),
    [blanks, d.blankScores, d.points],
  )
  const scoreSum = scores.reduce((s, v) => s + (v || 0), 0)

  const submit = () => {
    if (!d.prompt.trim()) {
      toast.danger('문항 내용을 입력해 주세요')
      return
    }
    const payload: SaveQuizQuestionInput = {
      type: d.type,
      prompt: d.prompt.trim(),
      points: d.points,
    }
    if (d.type === 'multiple_choice') {
      payload.choices = d.choices
      payload.answerIndex = d.answerIndex
    } else if (d.type === 'short_answer') {
      payload.answerText = d.answerText
    } else if (d.type === 'essay') {
      // 서술형 — 수동 채점. 채점 기준(선택)만 보관.
      payload.answerText = d.answerText
    } else {
      if (blanks === 0) {
        toast.danger('문항 내용에 빈칸(___)을 넣어 주세요')
        return
      }
      if (scoreSum !== d.points) {
        toast.danger(`빈칸 배점 합(${scoreSum})이 배점(${d.points})과 달라요`)
        return
      }
      payload.answers = answers
      payload.blankScores = scores
    }
    save.mutate(payload, {
      onSuccess: () => {
        toast.success(questionId ? '문항을 수정했어요' : '문항을 추가했어요')
        onClose()
      },
      onError: () => toast.danger('저장에 실패했어요'),
    })
  }

  return (
    <div className="border-brand/40 bg-surface mt-2 flex flex-col gap-3 rounded-xl border-2 p-4">
      {/* 유형 토글 */}
      <div className="bg-surface-muted flex gap-1 rounded-lg p-1">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => set({ type: t.value })}
            className={cn(
              'flex-1 rounded-md px-2 py-1.5 text-[13px] font-semibold transition-colors',
              d.type === t.value
                ? 'bg-surface text-fg shadow-sm'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 문항 내용 */}
      <div>
        <span className="text-fg-muted mb-1 block text-xs font-semibold">
          문항 내용{' '}
          {d.type === 'fill_blank' && (
            <span className="text-fg-subtle">— 빈칸은 ___ (밑줄 3개)</span>
          )}
        </span>
        <textarea
          rows={2}
          value={d.prompt}
          onChange={(e) => set({ prompt: e.target.value })}
          placeholder={
            d.type === 'fill_blank'
              ? '예: ___는 후입선출, ___는 선입선출 자료구조다'
              : '문항을 입력하세요'
          }
          className={FIELD}
        />
      </div>

      {/* 유형별 정답 입력 */}
      {d.type === 'multiple_choice' && (
        <div>
          <span className="text-fg-muted mb-1 block text-xs font-semibold">
            보기 · 정답(라디오 선택)
          </span>
          <div className="flex flex-col gap-1.5">
            {d.choices.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="answer"
                  checked={d.answerIndex === i}
                  onChange={() => set({ answerIndex: i })}
                  aria-label={`정답 ${i + 1}`}
                />
                <input
                  value={c}
                  onChange={(e) =>
                    set({
                      choices: d.choices.map((x, j) =>
                        j === i ? e.target.value : x,
                      ),
                    })
                  }
                  placeholder={`보기 ${i + 1}`}
                  className={FIELD}
                />
                {d.choices.length > 2 && (
                  <button
                    type="button"
                    aria-label={`보기 ${i + 1} 삭제`}
                    onClick={() =>
                      set({
                        choices: d.choices.filter((_, j) => j !== i),
                        answerIndex: Math.max(
                          0,
                          d.answerIndex >= i
                            ? d.answerIndex - 1
                            : d.answerIndex,
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
          {d.choices.length < 5 && (
            <button
              type="button"
              onClick={() => set({ choices: [...d.choices, ''] })}
              className="border-border text-fg-muted hover:bg-surface-muted mt-2 inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" /> 보기 추가
            </button>
          )}
        </div>
      )}

      {d.type === 'short_answer' && (
        <div>
          <span className="text-fg-muted mb-1 block text-xs font-semibold">
            정답
          </span>
          <input
            value={d.answerText}
            onChange={(e) => set({ answerText: e.target.value })}
            placeholder="정답 텍스트"
            className={FIELD}
          />
        </div>
      )}

      {d.type === 'essay' && (
        <div>
          <span className="text-fg-muted mb-1 block text-xs font-semibold">
            채점 기준 / 모범답안 (선택) — 학생에게 비공개
          </span>
          <textarea
            rows={3}
            value={d.answerText}
            onChange={(e) => set({ answerText: e.target.value })}
            placeholder="강사 채점 시 참고할 기준이나 모범답안을 적어두세요"
            className={`${FIELD} h-auto py-2`}
          />
          <p className="text-fg-subtle mt-1 text-xs">
            서술형은 자동 채점되지 않고, 제출 후 수동 채점 화면에서 점수를
            매깁니다.
          </p>
        </div>
      )}

      {d.type === 'fill_blank' && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-fg-muted text-xs font-semibold">
              빈칸 정답·배점 ({blanks}개)
            </span>
            {blanks > 0 && (
              <button
                type="button"
                onClick={() =>
                  set({ blankScores: distributeBlankScores(d.points, blanks) })
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
                        set({
                          answers: answers.map((x, j) =>
                            j === i ? e.target.value : x,
                          ),
                        })
                      }
                      placeholder={`빈칸 ${i + 1} 정답`}
                      className={`${FIELD_BASE} min-w-0 flex-1`}
                    />
                    <input
                      type="number"
                      min={1}
                      aria-label={`빈칸 ${i + 1} 배점`}
                      value={scores[i] ?? 0}
                      onChange={(e) =>
                        set({
                          blankScores: scores.map((x, j) =>
                            j === i ? Number(e.target.value) : x,
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
                  scoreSum === d.points ? 'text-fg-subtle' : 'text-warning',
                )}
              >
                배점 합 {scoreSum} / {d.points}
                {scoreSum !== d.points && ' · 배점과 일치해야 저장돼요'}
              </p>
            </>
          )}
        </div>
      )}

      {/* 배점 + 액션 */}
      <div className="flex items-end justify-between gap-3">
        <div className="w-28">
          <span className="text-fg-muted mb-1 block text-xs font-semibold">
            배점
          </span>
          <input
            type="number"
            min={1}
            value={d.points}
            onChange={(e) => set({ points: Number(e.target.value) })}
            className={FIELD}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="h-9 text-sm" onClick={onClose}>
            취소
          </Button>
          <Button
            className="h-9 text-sm"
            disabled={save.isPending}
            onClick={submit}
          >
            {questionId ? '수정' : '추가'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// 문항 에디터 — 목록 카드 + "+ 문제 추가" + 인라인 폼(이전 LMS 방식).
export function QuizQuestionEditor({
  quizId,
  defaultAdding = false,
}: {
  quizId: string
  /** 생성 직후 진입 시 문항 추가 폼을 바로 펼침 */
  defaultAdding?: boolean
}) {
  const { data, isPending, isError, refetch } = useQuizQuestions(quizId)
  const deleteQ = useDeleteQuizQuestion(quizId)
  const toast = useToast()
  const [adding, setAdding] = useState(defaultAdding)
  const [editingId, setEditingId] = useState<string | null>(null)

  if (isPending) {
    return (
      <div className="text-fg-muted py-6 text-center text-sm">
        문항 불러오는 중…
      </div>
    )
  }
  if (isError || !data) {
    return (
      <Empty
        icon={<AlertTriangle className="h-6 w-6" />}
        title="문항을 불러오지 못했어요"
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }

  const questions = data.questions
  const totalScore = questions.reduce((s, q) => s + (q.points ?? 0), 0)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-fg-muted text-sm">
          {questions.length}문항 · 총점 {totalScore}점
          {data.targetPoints > 0 && totalScore !== data.targetPoints && (
            <span className="text-warning">
              {' '}
              · 설정 총점 {data.targetPoints}점과 다름
            </span>
          )}
        </p>
        {!adding && (
          <Button className="h-9 text-sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> 문제 추가
          </Button>
        )}
      </div>

      {adding && (
        <QuestionForm
          quizId={quizId}
          initial={EMPTY_DRAFT}
          onClose={() => setAdding(false)}
        />
      )}

      <div className="mt-2 flex flex-col gap-2">
        {questions.length === 0 && !adding && (
          <p className="text-fg-subtle bg-surface-muted rounded-lg px-4 py-6 text-center text-sm">
            아직 문항이 없어요. ‘문제 추가’로 시작하세요.
          </p>
        )}
        {questions.map((q, i) => (
          <div key={q.id} className="border-border rounded-xl border">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-fg-subtle w-8 shrink-0 text-sm font-bold">
                Q{i + 1}
              </span>
              <span className="bg-info-bg text-info shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold">
                {TYPE_LABEL[q.type] ?? q.type}
              </span>
              <span className="text-fg min-w-0 flex-1 truncate text-sm">
                {q.body || '(내용 없음)'}
              </span>
              <span className="text-fg-muted shrink-0 text-xs">
                {q.points}점
              </span>
              <button
                type="button"
                onClick={() => setEditingId(editingId === q.id ? null : q.id)}
                aria-label="문항 편집"
                className="text-fg-subtle hover:text-fg shrink-0 p-1"
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    editingId === q.id && 'rotate-180',
                  )}
                />
              </button>
              <button
                type="button"
                onClick={() =>
                  deleteQ.mutate(q.id, {
                    onSuccess: () => toast.success('문항을 삭제했어요'),
                    onError: () => toast.danger('삭제에 실패했어요'),
                  })
                }
                aria-label="문항 삭제"
                className="text-fg-subtle hover:text-danger shrink-0 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {editingId === q.id && (
              <div className="px-4 pb-3">
                <QuestionForm
                  quizId={quizId}
                  questionId={q.id}
                  initial={toDraft(q)}
                  onClose={() => setEditingId(null)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
