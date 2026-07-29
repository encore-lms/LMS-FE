import { Fragment, useEffect, useRef, useState } from 'react'
import { ChevronDown, GripVertical, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { NumberInput } from '@/components/ui/NumberInput'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { SuggestInput } from '@/components/ui/SuggestInput'
import type { InstructorQuestion } from '@/shared/types'
import {
  useDeleteQuizQuestion,
  useQuizQuestions,
  useReorderQuizQuestions,
  useSaveQuizQuestion,
  type SaveQuizQuestionInput,
} from '../api/quizzes'
import { AnswerFields } from './AnswerFields'
import {
  buildAnswerPayload,
  emptyAnswer,
  parseAnswerDraft,
  FIELD,
  type AnswerDraft,
} from './answerDraft'

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

interface DraftState extends AnswerDraft {
  type: SaveQuizQuestionInput['type']
  prompt: string
  points: number
  /** 기술 카테고리(예: Spark) — 선택. 수강생 결과 화면의 카테고리별 정답률 집계 단위. */
  category: string
}

const EMPTY_DRAFT: DraftState = {
  type: 'multiple_choice',
  prompt: '',
  points: 10,
  category: '',
  ...emptyAnswer(),
}

function toDraft(q: InstructorQuestion): DraftState {
  const type = (q.type as SaveQuizQuestionInput['type']) ?? 'multiple_choice'
  return {
    type,
    prompt: q.body ?? '',
    points: q.points ?? 10,
    category: q.category ?? '',
    ...parseAnswerDraft(type, q.choices, q.answerKey),
  }
}

// 인라인 문항 폼 — 추가/편집 공용.
function QuestionForm({
  quizId,
  questionId,
  initial,
  order,
  categorySuggestions,
  onClose,
}: {
  quizId: string
  questionId?: string
  initial: DraftState
  /** 생성 시 삽입 위치(0-based). 미지정이면 맨 뒤. */
  order?: number
  /** 카테고리 자유 입력 추천 — 같은 기수·퀴즈에서 이미 쓴 값. */
  categorySuggestions: string[]
  onClose: () => void
}) {
  const save = useSaveQuizQuestion(quizId, questionId)
  const toast = useToast()
  const [d, setD] = useState<DraftState>(initial)
  const set = (patch: Partial<DraftState>) => setD((p) => ({ ...p, ...patch }))

  const submit = () => {
    if (!d.prompt.trim()) {
      toast.danger('문항 내용을 입력해 주세요')
      return
    }
    const answer = buildAnswerPayload(d.type, d.prompt, d.points, d)
    if (!answer.ok) {
      toast.danger(answer.error)
      return
    }
    const payload: SaveQuizQuestionInput = {
      type: d.type,
      prompt: d.prompt.trim(),
      points: d.points,
      // 빈 문자열도 그대로 보낸다 — BE가 '해제'로 해석한다(미전달=기존 유지와 구분).
      category: d.category.trim(),
      ...answer.fields,
    }
    // 생성 시에만 삽입 위치를 전달(수정은 위치 유지).
    if (!questionId && order != null) payload.order = order
    save.mutate(payload, {
      onSuccess: () => {
        toast.success(questionId ? '문항을 수정했어요' : '문항을 추가했어요')
        onClose()
      },
      // BE 검증 메시지가 있으면 그대로 노출, 없으면 일반 메시지.
      onError: (e) => {
        const msg = (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message
        toast.danger(msg || '저장에 실패했어요')
      },
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

      {/* 유형별 정답 입력 — 템플릿 워크벤치와 공용(answerFields). */}
      <AnswerFields
        type={d.type}
        text={d.prompt}
        points={d.points}
        value={d}
        onChange={set}
        essayNote="서술형은 자동 채점되지 않고, 제출 후 수동 채점 화면에서 점수를 매깁니다."
      />

      {/* 카테고리 + 배점 + 액션 */}
      <div className="flex items-end justify-between gap-3">
        <div className="w-44">
          <span className="text-fg-muted mb-1 block text-xs font-semibold">
            카테고리
          </span>
          <SuggestInput
            value={d.category}
            onChange={(category) => set({ category })}
            suggestions={categorySuggestions}
            placeholder="예: Spark (선택)"
            aria-label="문항 카테고리"
            maxLength={50}
            className={FIELD}
          />
        </div>
        <div className="w-28">
          <span className="text-fg-muted mb-1 block text-xs font-semibold">
            배점
          </span>
          <NumberInput
            min={1}
            value={d.points}
            onChange={(points) => set({ points })}
            className={FIELD}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" disabled={save.isPending} onClick={submit}>
            {questionId ? '수정' : '추가'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// 문항 사이 삽입 어포던스 — hover 시 원형 + 아이콘이 페이드·스케일로 나타난다(레이아웃 시프트 없음).
function InsertZone({
  onClick,
  hidden,
}: {
  onClick: () => void
  /** 다른 폼이 열려 있으면 + 어포던스를 숨기되 간격은 유지 */
  hidden?: boolean
}) {
  if (hidden) return <div className="h-5" aria-hidden="true" />
  return (
    <div className="group relative h-5">
      {/* hover 시 얇은 안내선(장식) */}
      <span
        aria-hidden="true"
        className="bg-brand/30 absolute inset-x-0 top-1/2 h-px -translate-y-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />
      <button
        type="button"
        onClick={onClick}
        aria-label="이 위치에 문항 추가"
        className="bg-brand hover:bg-brand/90 text-on-color pointer-events-none absolute top-1/2 left-1/2 z-10 flex size-7 -translate-x-1/2 -translate-y-1/2 scale-50 items-center justify-center rounded-full opacity-0 shadow-sm transition-all duration-200 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

// 문항 에디터 — 목록 카드 + 문항 사이 hover 삽입 + 인라인 폼(이전 LMS 방식).
export function QuizQuestionEditor({
  quizId,
  defaultAdding = false,
  categorySuggestions = [],
}: {
  quizId: string
  /** 생성 직후 진입 시 문항 추가 폼을 맨 아래에 펼침 */
  defaultAdding?: boolean
  /** 기수 범위 문항 카테고리 추천(폼에서 주입). 이 퀴즈에 이미 쓴 값과 합쳐 제안한다. */
  categorySuggestions?: string[]
}) {
  const { data, isPending, isError, refetch } = useQuizQuestions(quizId)
  const deleteQ = useDeleteQuizQuestion(quizId)
  const toast = useToast()
  // insertAt = 추가 폼이 열린 위치(0-based gap). null = 닫힘.
  const [insertAt, setInsertAt] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  // 드래그 재정렬 — dragIndex=잡은 문항, overIndex=올려둔 위치.
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const reorder = useReorderQuizQuestions(quizId)
  const initedRef = useRef(false)

  const questions = data?.questions ?? []
  const totalScore = questions.reduce((s, q) => s + (q.points ?? 0), 0)
  // 이 퀴즈에 이미 쓴 카테고리를 앞에 둔다 — 같은 퀴즈 안에서 표기가 갈라지는 게 제일 잦다.
  const suggestions = [
    ...new Set([
      ...questions.map((q) => q.category ?? '').filter(Boolean),
      ...categorySuggestions,
    ]),
  ]

  // 드롭 확정 — 순서 배열을 만들어 재정렬 저장(낙관적).
  const commitReorder = () => {
    const from = dragIndex
    const to = overIndex
    setDragIndex(null)
    setOverIndex(null)
    if (from === null || to === null || from === to) return
    const ids = questions.map((x) => x.id)
    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved)
    reorder.mutate(ids)
  }

  // 생성 직후 진입(defaultAdding) — 데이터 로드 후 맨 아래에 추가 폼을 연다.
  useEffect(() => {
    if (defaultAdding && data && !initedRef.current) {
      initedRef.current = true
      setInsertAt(data.questions.length)
    }
  }, [defaultAdding, data])

  const adding = insertAt !== null

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      loadingText="문항 불러오는 중…"
      errorTitle="문항을 불러오지 못했어요"
      errorDescription={null}
    >
      {data && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            {/* 총점은 문항 배점 합계에서 파생된다 — 설정값과 어긋날 수 없어 경고를 두지 않는다. */}
            <p className="text-fg-muted text-sm">
              {questions.length}문항 · 총점 {totalScore}점
            </p>
            {/* 버튼 추가는 항상 맨 아래에 폼을 연다(요청). */}
            {!adding && (
              <Button size="sm" onClick={() => setInsertAt(questions.length)}>
                <Plus className="h-4 w-4" /> 문제 추가
              </Button>
            )}
          </div>

          {questions.length === 0 && !adding && (
            <p className="text-fg-subtle bg-surface-muted mt-2 rounded-lg px-4 py-6 text-center text-sm">
              아직 문항이 없어요. ‘문제 추가’로 시작하세요.
            </p>
          )}

          {/* 각 위치(gap)마다 삽입 어포던스 또는 열린 추가 폼 → 그 뒤 문항 카드 */}
          <div className="flex flex-col">
            {Array.from({ length: questions.length + 1 }).map((_, p) => {
              const q = p < questions.length ? questions[p] : null
              return (
                <Fragment key={q ? q.id : `tail-${p}`}>
                  {insertAt === p ? (
                    <div className="my-1">
                      <QuestionForm
                        quizId={quizId}
                        initial={EMPTY_DRAFT}
                        order={p}
                        categorySuggestions={suggestions}
                        onClose={() => setInsertAt(null)}
                      />
                    </div>
                  ) : (
                    <InsertZone
                      onClick={() => setInsertAt(p)}
                      hidden={adding || dragIndex !== null}
                    />
                  )}
                  {q && (
                    <div
                      draggable={editingId !== q.id && !adding}
                      onDragStart={() => setDragIndex(p)}
                      onDragEnter={() => {
                        if (dragIndex !== null) setOverIndex(p)
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnd={commitReorder}
                      className={cn(
                        'bg-surface-muted rounded-xl transition',
                        dragIndex === p && 'opacity-40',
                        dragIndex !== null &&
                          overIndex === p &&
                          dragIndex !== p &&
                          'ring-brand/60 ring-2',
                      )}
                    >
                      <div className="flex items-center gap-2 px-4 py-3">
                        <span
                          aria-hidden="true"
                          className={cn(
                            'text-fg-subtle hover:text-fg shrink-0',
                            editingId !== q.id && !adding
                              ? 'cursor-grab active:cursor-grabbing'
                              : 'cursor-default opacity-30',
                          )}
                          title="드래그로 순서 이동"
                        >
                          <GripVertical className="h-4 w-4" />
                        </span>
                        <span className="text-fg-subtle w-8 shrink-0 text-sm font-bold">
                          Q{p + 1}
                        </span>
                        <span className="bg-info-bg text-info shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold">
                          {TYPE_LABEL[q.type] ?? q.type}
                        </span>
                        {q.category && (
                          <span className="bg-brand/10 text-brand shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold">
                            {q.category}
                          </span>
                        )}
                        <span className="text-fg min-w-0 flex-1 truncate text-sm">
                          {q.body || '(내용 없음)'}
                        </span>
                        <span className="text-fg-muted shrink-0 text-xs">
                          {q.points}점
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingId(editingId === q.id ? null : q.id)
                          }
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
                              onSuccess: () =>
                                toast.success('문항을 삭제했어요'),
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
                            categorySuggestions={suggestions}
                            onClose={() => setEditingId(null)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </Fragment>
              )
            })}
          </div>
        </div>
      )}
    </DataBoundary>
  )
}
