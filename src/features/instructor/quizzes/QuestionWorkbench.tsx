import { useEffect, useMemo, useState } from 'react'
import { Copy, Eye, GripVertical, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { NumberInput } from '@/components/ui/NumberInput'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import type {
  GradingMode,
  InstructorQuestion,
  QuestionDifficulty,
} from '@/shared/types'
import { AnswerFields } from './AnswerFields'
import { emptyAnswer, parseAnswerDraft, type AnswerDraft } from './answerDraft'
import { DIFFICULTY_LABEL, QUESTION_TYPE_LABEL } from './meta'

export interface QuestionWorkbenchProps {
  /** 메타 바 첫 칸 라벨/값 — 퀴즈 | 템플릿 */
  subjectLabel: string
  subjectName: string
  gradingMode: GradingMode
  totalPoints: number
  targetPoints: number
  questions: InstructorQuestion[]
  /** 좌측 목록 제목 — 문제 목록 | 템플릿 문항 목록 */
  listTitle: string
  /** 항목 명사 — 문제 | 문항 (편집 헤더·토스트에 사용) */
  itemNoun: string
  back: { label: string; onClick: () => void }
  previewLabel: string
  /** 본문/해설 보조 문구 — 퀴즈와 템플릿이 노출 시점 표현이 다름 */
  bodyHint: string
  explanationHint: string
  /** 주관식 수동 채점 안내 보조 문구 */
  manualHint: string
  saveToastMessage: string
  /** 우측 메타 카드 항목 — 화면별 구성(응답·평균 vs 사용·파생) */
  metaItems: (draft: InstructorQuestion) => string[]
  /** 선택 문항 제어 — 지정 시 controlled(저장 후 신규 선택 유지 등 호출부가 관리) */
  activeId?: string | null
  onActiveIdChange?: (id: string) => void
  /** 미저장(로컬 드래프트) 표시 — true면 목록에 미저장 칩 */
  isUnsaved?: (q: InstructorQuestion) => boolean
  // ── 액션 콜백(선택) — 미지정 시 기존 mock 토스트 동작 유지. ──
  /** 새 문항 추가 */
  onAddQuestion?: () => void
  /** 현재 편집 중 draft 저장 — 신규/수정 모두 draft + 유형별 정답으로 전달 */
  onSaveQuestion?: (draft: InstructorQuestion, answer: AnswerDraft) => void
  /** 문항 삭제 */
  onDeleteQuestion?: (id: string) => void
  /** 문항 복제 */
  onCopyQuestion?: (id: string) => void
  /** 미리보기 진입 */
  onPreview?: () => void
}

// 저장된 문항 → 편집용 정답 상태. 템플릿 서술형 채점 기준은 modelAnswer 컬럼에 보관.
function toAnswerDraft(q: InstructorQuestion): AnswerDraft {
  const a = parseAnswerDraft(q.type, q.choices, q.answerKey)
  if (q.type === 'essay' && !a.answerText) a.answerText = q.modelAnswer
  return a
}

// 문항 편집 워크벤치 — §7 문제 관리(1341:9831)와 §10 템플릿 문항(3547:2247) 공용 3-column.
// 메타 바 + 좌측 목록 + 본문 편집 + 우측 설정/메타 + 푸터(총점 합계 검증).
export function QuestionWorkbench({
  subjectLabel,
  subjectName,
  gradingMode,
  totalPoints,
  targetPoints,
  questions,
  listTitle,
  itemNoun,
  back,
  previewLabel,
  bodyHint,
  explanationHint,
  manualHint,
  saveToastMessage,
  metaItems,
  activeId,
  onActiveIdChange,
  isUnsaved,
  onAddQuestion,
  onSaveQuestion,
  onDeleteQuestion,
  onCopyQuestion,
  onPreview,
}: QuestionWorkbenchProps) {
  const toast = useToast()
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null)
  const currentId = activeId !== undefined ? activeId : internalActiveId
  // 편집 폼 로컬 상태 — 저장 전 미리보기 (선택 문항 변경 시 재초기화).
  const [draft, setDraft] = useState<InstructorQuestion | null>(null)
  const [answer, setAnswer] = useState<AnswerDraft>(emptyAnswer())

  const active = useMemo(
    () => questions.find((q) => q.id === currentId) ?? questions[0] ?? null,
    [questions, currentId],
  )

  useEffect(() => {
    setDraft(active ? { ...active } : null)
    setAnswer(active ? toAnswerDraft(active) : emptyAnswer())
  }, [active])

  const selectQuestion = (id: string) => {
    onActiveIdChange?.(id)
    if (activeId === undefined) setInternalActiveId(id)
  }

  const pointsOk = totalPoints === targetPoints

  // 콜백 미지정 시 = 기존 mock 토스트 동작 유지.
  const handleAdd = () =>
    onAddQuestion ? onAddQuestion() : toast.success(`새 ${itemNoun} 추가`)
  const handleCopy = () =>
    active
      ? onCopyQuestion
        ? onCopyQuestion(active.id)
        : toast.success(`${itemNoun} ${active.order} 복제`)
      : undefined
  const handleDelete = () =>
    active
      ? onDeleteQuestion
        ? onDeleteQuestion(active.id)
        : toast.success(`${itemNoun} ${active.order} 삭제`)
      : undefined
  const handleSave = () =>
    draft && onSaveQuestion
      ? onSaveQuestion(draft, answer)
      : toast.success(saveToastMessage)
  const handlePreview = () =>
    onPreview
      ? onPreview()
      : toast.info(`${previewLabel} 미리보기는 준비 중입니다.`)

  return (
    <div className="p-8">
      {/* 메타 바 */}
      <div className="border-border bg-surface flex flex-wrap items-center gap-5 rounded-xl border px-5 py-3.5">
        <div>
          <p className="text-fg-subtle text-xs">{subjectLabel}</p>
          <p className="text-fg text-sm font-bold">{subjectName}</p>
        </div>
        <div className="bg-divider h-8 w-px" />
        <div>
          <p className="text-fg-subtle text-xs">문항 수</p>
          <p className="text-fg text-sm font-bold">
            {questions.length} / 무제한
          </p>
        </div>
        <div className="bg-divider h-8 w-px" />
        <div>
          <p className="text-fg-subtle text-xs">총점 합계</p>
          <p
            className={cn(
              'text-sm font-bold',
              pointsOk ? 'text-fg' : 'text-warning',
            )}
          >
            {totalPoints} / {targetPoints}
          </p>
        </div>
        <div className="bg-divider h-8 w-px" />
        <div>
          <p className="text-fg-subtle text-xs">채점 모드</p>
          <p className="text-fg text-sm font-bold">{gradingMode}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={back.onClick}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-3 py-1.5 text-xs font-medium"
          >
            {back.label}
          </button>
          <button
            type="button"
            onClick={handlePreview}
            className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium"
          >
            <Eye className="h-3.5 w-3.5" /> 미리보기
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[280px_1fr_304px]">
        {/* 좌: 문항 목록 */}
        <div className="border-border bg-surface h-fit rounded-xl border">
          <div className="border-divider flex items-center justify-between border-b px-4 py-3">
            <p className="text-fg text-sm font-bold">{listTitle}</p>
            <button
              type="button"
              onClick={handleAdd}
              className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-0.5 rounded-md border px-2 py-1 text-xs font-medium"
            >
              <Plus className="h-3 w-3" /> 추가
            </button>
          </div>
          {questions.map((q) => {
            const isActive = q.id === active?.id
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => selectQuestion(q.id)}
                className={cn(
                  'border-divider relative flex w-full items-center gap-2 border-t px-3 py-3 text-left',
                  isActive ? 'bg-accent-bg/40' : 'hover:bg-surface-muted',
                )}
              >
                {isActive && (
                  <span className="bg-accent-strong absolute top-2 bottom-2 left-0 w-0.5 rounded-full" />
                )}
                <GripVertical className="text-fg-subtle h-4 w-4 shrink-0" />
                {/* 두 자릿수(10번 이상)에서 숫자가 쪼개지지 않게 여유 폭 + 가운데 정렬. */}
                <span className="text-fg-muted w-6 shrink-0 text-center text-sm font-bold tabular-nums">
                  {q.order}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-px text-[10px] font-bold">
                      {QUESTION_TYPE_LABEL[q.type]}
                    </span>
                    <span className="text-fg-subtle text-[11px]">
                      {q.points}점
                    </span>
                    {isUnsaved?.(q) && (
                      <span className="bg-warning-bg text-warning rounded px-1.5 py-px text-[10px] font-bold">
                        미저장
                      </span>
                    )}
                  </span>
                  <span className="text-fg mt-0.5 block truncate text-xs font-medium">
                    {q.summary}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {/* 본문: 문항 편집 */}
        <div className="border-border bg-surface rounded-xl border">
          <div className="border-divider flex items-center justify-between border-b px-5 py-3.5">
            <p className="text-fg text-sm font-bold">
              {itemNoun} {active?.order} — 편집 중
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium"
              >
                <Copy className="h-3 w-3" /> 복제
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="border-danger/40 text-danger hover:bg-danger-bg flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium"
              >
                <Trash2 className="h-3 w-3" /> 삭제
              </button>
            </div>
          </div>
          {draft && (
            <div className="flex flex-col gap-4 p-5">
              <label className="flex w-52 flex-col gap-1.5">
                <span className="text-fg text-[13px] font-bold">
                  유형 <span className="text-danger">*</span>
                </span>
                <Select
                  value={draft.type}
                  onChange={(v) =>
                    setDraft({
                      ...draft,
                      type: v as InstructorQuestion['type'],
                    })
                  }
                  aria-label="문항 유형"
                  options={(
                    [
                      'multiple_choice',
                      'short_answer',
                      'fill_blank',
                      'essay',
                    ] as const
                  ).map((t) => ({
                    value: t,
                    label: `${QUESTION_TYPE_LABEL[t]}${t === 'essay' ? ' (서술형)' : ''}`,
                  }))}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-fg text-[13px] font-bold">
                  문제 본문 <span className="text-danger">*</span>
                </span>
                <span className="text-fg-subtle text-xs">
                  {bodyHint}
                  {draft.type === 'fill_blank' && ' — 빈칸은 ___ (밑줄 3개)'}
                </span>
                <textarea
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  rows={3}
                  aria-label="문제 본문"
                  placeholder={
                    draft.type === 'fill_blank'
                      ? '예: ___는 후입선출, ___는 선입선출 자료구조다'
                      : undefined
                  }
                  className="border-border focus:border-accent-strong text-fg w-full rounded-lg border bg-white p-3 text-sm outline-none"
                />
              </label>
              {/* 유형별 정답 입력 — §7 퀴즈 문항 폼과 공용(answerFields). */}
              <AnswerFields
                type={draft.type}
                text={draft.body}
                points={draft.points}
                value={answer}
                onChange={(patch) => setAnswer((p) => ({ ...p, ...patch }))}
              />
              <label className="flex flex-col gap-1.5">
                <span className="text-fg text-[13px] font-bold">해설</span>
                <span className="text-fg-subtle text-xs">
                  {explanationHint}
                </span>
                <textarea
                  value={draft.explanation}
                  onChange={(e) =>
                    setDraft({ ...draft, explanation: e.target.value })
                  }
                  rows={2}
                  aria-label="해설"
                  className="border-border focus:border-accent-strong text-fg w-full rounded-lg border bg-white p-3 text-sm outline-none"
                />
              </label>
            </div>
          )}
        </div>

        {/* 우: 설정 */}
        {draft && (
          <div className="flex h-fit flex-col gap-4">
            <div className="border-border bg-surface rounded-xl border p-4">
              <p className="text-fg text-sm font-bold">카테고리·배점·난이도</p>
              <label className="mt-3 flex flex-col gap-1.5">
                <span className="text-fg text-xs font-bold">
                  카테고리 (QuizCategory) <span className="text-danger">*</span>
                </span>
                <Select
                  value={draft.category}
                  onChange={(v) => setDraft({ ...draft, category: v })}
                  aria-label="카테고리"
                  options={[
                    '알고리즘 · DP',
                    '알고리즘 · 재귀',
                    '자료구조',
                    'SQL',
                    'JavaScript',
                  ].map((c) => ({ value: c, label: c }))}
                />
              </label>
              <label className="mt-3 flex items-center gap-2">
                <span className="text-fg text-xs font-bold">배점</span>
                <NumberInput
                  min={1}
                  value={draft.points}
                  onChange={(points) => setDraft({ ...draft, points })}
                  aria-label="배점"
                  className="border-border focus:border-brand text-fg h-9 w-24 rounded-lg border bg-white px-3 text-sm outline-none"
                />
                <span className="text-fg-muted text-xs">점</span>
              </label>
              <div className="mt-3">
                <p className="text-fg text-xs font-bold">
                  난이도 <span className="text-danger">*</span>
                </p>
                <div className="border-border mt-1.5 grid grid-cols-3 overflow-hidden rounded-lg border">
                  {(['easy', 'normal', 'hard'] as QuestionDifficulty[]).map(
                    (d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDraft({ ...draft, difficulty: d })}
                        className={cn(
                          'h-8 text-xs font-medium',
                          draft.difficulty === d
                            ? 'bg-accent-bg text-accent-strong font-bold'
                            : 'text-fg-muted hover:bg-surface-muted',
                        )}
                      >
                        {DIFFICULTY_LABEL[d]}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div className="border-border bg-surface rounded-xl border p-4">
              <p className="text-fg text-sm font-bold">채점 방식</p>
              <div className="bg-warning-bg mt-2 rounded-lg p-3">
                <p className="text-fg text-xs font-medium">
                  {draft.type === 'essay'
                    ? '수동 채점 (강사 입력)'
                    : '자동 채점 (정답 매칭)'}
                </p>
                <p className="text-fg-muted text-xs">
                  {draft.type === 'essay'
                    ? manualHint
                    : '정답/배점 변경 시 자동 재채점'}
                </p>
              </div>
            </div>

            <div className="border-border bg-surface rounded-xl border p-4">
              <p className="text-fg text-sm font-bold">메타</p>
              <ul className="text-fg-muted mt-2 flex flex-col gap-1.5 text-xs">
                {metaItems(draft).map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className="border-border bg-surface mt-4 flex flex-wrap items-center gap-2 rounded-xl border px-5 py-4">
        <p
          className={cn(
            'text-xs',
            pointsOk ? 'text-fg-subtle' : 'text-warning font-medium',
          )}
        >
          총점 합계 {totalPoints} / {targetPoints} ·{' '}
          {pointsOk
            ? `모든 ${itemNoun} 작성 완료`
            : '배점 합계가 총점과 달라요'}
        </p>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="secondary" onClick={handlePreview}>
            <Eye className="h-4 w-4" /> {previewLabel}
          </Button>
          <Button type="button" onClick={handleSave}>
            저장
          </Button>
        </div>
      </div>
    </div>
  )
}
