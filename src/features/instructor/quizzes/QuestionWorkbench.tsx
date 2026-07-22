import { useEffect, useMemo, useState } from 'react'
import { Copy, Eye, GripVertical, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import type {
  GradingMode,
  InstructorQuestion,
  QuestionDifficulty,
} from '@/shared/types'
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
  modelAnswerHint: string
  /** 주관식 수동 채점 안내 보조 문구 */
  manualHint: string
  saveToastMessage: string
  /** 우측 메타 카드 항목 — 화면별 구성(응답·평균 vs 사용·파생) */
  metaItems: (draft: InstructorQuestion) => string[]
  // ── 액션 콜백(선택) — 미지정 시 기존 mock 토스트 동작 유지(§7 퀴즈는 미지정). ──
  /** 새 문항 추가 — mock 변형 후 목록 갱신 */
  onAddQuestion?: () => void
  /** 현재 편집 중 draft 저장 — 신규/수정 모두 draft로 전달 */
  onSaveQuestion?: (draft: InstructorQuestion) => void
  /** 문항 삭제 */
  onDeleteQuestion?: (id: string) => void
  /** 문항 복제 */
  onCopyQuestion?: (id: string) => void
  /** 미리보기 진입 */
  onPreview?: () => void
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
  modelAnswerHint,
  manualHint,
  saveToastMessage,
  metaItems,
  onAddQuestion,
  onSaveQuestion,
  onDeleteQuestion,
  onCopyQuestion,
  onPreview,
}: QuestionWorkbenchProps) {
  const toast = useToast()
  const [activeId, setActiveId] = useState<string | null>(null)
  // 편집 폼 로컬 상태 — mock 저장 전 미리보기 (선택 문항 변경 시 재초기화).
  const [draft, setDraft] = useState<InstructorQuestion | null>(null)

  const active = useMemo(
    () => questions.find((q) => q.id === activeId) ?? questions[0] ?? null,
    [questions, activeId],
  )

  useEffect(() => {
    setDraft(active ? { ...active } : null)
  }, [active])

  const pointsOk = totalPoints === targetPoints

  // 콜백 미지정 시 = 기존 mock 토스트(§7 퀴즈는 실 BE라 콜백을 넘기지 않음).
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
      ? onSaveQuestion(draft)
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
                onClick={() => setActiveId(q.id)}
                className={cn(
                  'border-divider relative flex w-full items-center gap-2 border-t px-3 py-3 text-left',
                  isActive ? 'bg-accent-bg/40' : 'hover:bg-surface-muted',
                )}
              >
                {isActive && (
                  <span className="bg-accent-strong absolute top-2 bottom-2 left-0 w-0.5 rounded-full" />
                )}
                <GripVertical className="text-fg-subtle h-4 w-4 shrink-0" />
                <span className="text-fg-muted w-4 text-sm font-bold">
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
                <span className="text-fg-subtle text-xs">{bodyHint}</span>
                <textarea
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  rows={3}
                  aria-label="문제 본문"
                  className="border-border focus:border-accent-strong text-fg w-full rounded-lg border bg-white p-3 text-sm outline-none focus-visible:shadow-none"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-fg text-[13px] font-bold">
                  모범 답안 / 채점 기준
                </span>
                <span className="text-fg-subtle text-xs">
                  {modelAnswerHint}
                </span>
                <textarea
                  value={draft.modelAnswer}
                  onChange={(e) =>
                    setDraft({ ...draft, modelAnswer: e.target.value })
                  }
                  rows={3}
                  aria-label="모범 답안"
                  className="border-border focus:border-accent-strong text-fg w-full rounded-lg border bg-white p-3 text-sm outline-none focus-visible:shadow-none"
                />
              </label>
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
                  className="border-border focus:border-accent-strong text-fg w-full rounded-lg border bg-white p-3 text-sm outline-none focus-visible:shadow-none"
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
                <input
                  value={draft.points}
                  onChange={(e) =>
                    setDraft({ ...draft, points: Number(e.target.value) || 0 })
                  }
                  aria-label="배점"
                  className="border-border focus:border-brand text-fg h-9 w-24 rounded-lg border bg-white px-3 text-sm outline-none focus-visible:shadow-none"
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
