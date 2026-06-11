import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  Copy,
  Eye,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { InstructorQuestion, QuestionDifficulty } from '@/shared/types'
import { useQuizQuestions } from '../api/quizzes'
import { DIFFICULTY_LABEL, QUESTION_TYPE_LABEL } from './meta'

// 문제 관리 (/instructor/quizzes/:quizId/questions) — §7. (Figma 1341:9831)
// 3-column: 문제 목록 / 편집 폼 / 카테고리·배점·난이도. 주관식은 수동 채점으로 자동 연결.
export default function QuestionManagePage() {
  const { quizId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = useQuizQuestions(quizId)
  const [activeId, setActiveId] = useState<string | null>(null)
  // 편집 폼 로컬 상태 — mock 저장 전 미리보기 (선택 문제 변경 시 재초기화).
  const [draft, setDraft] = useState<InstructorQuestion | null>(null)
  usePageHeader('문제 관리', '문항 편집 · 배점 합계 검증 · 학생 미리보기')

  const questions = useMemo(() => data?.questions ?? [], [data])
  const active =
    questions.find((q) => q.id === activeId) ?? questions[0] ?? null

  useEffect(() => {
    setDraft(active ? { ...active } : null)
  }, [active])

  if (isPending) {
    return <div className="text-fg-muted p-8">문제 목록을 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="문제 목록을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const pointsOk = data.totalPoints === data.targetPoints

  return (
    <div className="p-8">
      {/* 메타 바 */}
      <div className="border-border bg-surface flex flex-wrap items-center gap-5 rounded-xl border px-5 py-3.5">
        <div>
          <p className="text-fg-subtle text-xs">퀴즈</p>
          <p className="text-fg text-sm font-bold">{data.quizTitle}</p>
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
            {data.totalPoints} / {data.targetPoints}
          </p>
        </div>
        <div className="bg-divider h-8 w-px" />
        <div>
          <p className="text-fg-subtle text-xs">채점 모드</p>
          <p className="text-fg text-sm font-bold">{data.gradingMode}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => navigate(`/instructor/quizzes/${quizId}/edit`)}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-3 py-1.5 text-xs font-medium"
          >
            ← 퀴즈 설정으로
          </button>
          <button
            type="button"
            onClick={() => toast.info('학생 미리보기 — 후속 화면 (mock)')}
            className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium"
          >
            <Eye className="h-3.5 w-3.5" /> 미리보기
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[280px_1fr_304px]">
        {/* 좌: 문제 목록 */}
        <div className="border-border bg-surface h-fit rounded-xl border">
          <div className="border-divider flex items-center justify-between border-b px-4 py-3">
            <p className="text-fg text-sm font-bold">문제 목록</p>
            <button
              type="button"
              onClick={() => toast.success('새 문제 추가 (mock)')}
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

        {/* 본문: 문제 편집 */}
        <div className="border-border bg-surface rounded-xl border">
          <div className="border-divider flex items-center justify-between border-b px-5 py-3.5">
            <p className="text-fg text-sm font-bold">
              문제 {active?.order} — 편집 중
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() =>
                  toast.success(`문제 ${active?.order} 복제 (mock)`)
                }
                className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium"
              >
                <Copy className="h-3 w-3" /> 복제
              </button>
              <button
                type="button"
                onClick={() =>
                  toast.success(`문제 ${active?.order} 삭제 (mock)`)
                }
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
                <select
                  value={draft.type}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      type: e.target.value as InstructorQuestion['type'],
                    })
                  }
                  aria-label="문항 유형"
                  className="border-border focus:border-brand text-fg h-10 rounded-lg border bg-white px-3 text-sm font-medium outline-none"
                >
                  {(
                    [
                      'multiple_choice',
                      'short_answer',
                      'fill_blank',
                      'essay',
                    ] as const
                  ).map((t) => (
                    <option key={t} value={t}>
                      {QUESTION_TYPE_LABEL[t]}
                      {t === 'essay' ? ' (서술형)' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-fg text-[13px] font-bold">
                  문제 본문 <span className="text-danger">*</span>
                </span>
                <span className="text-fg-subtle text-xs">
                  학생에게 그대로 노출 — 마크다운 지원
                </span>
                <textarea
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  rows={3}
                  aria-label="문제 본문"
                  className="border-border focus:border-accent-strong text-fg w-full rounded-lg border bg-white p-3 text-sm outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-fg text-[13px] font-bold">
                  모범 답안 / 채점 기준
                </span>
                <span className="text-fg-subtle text-xs">
                  강사 채점 시 참고용 — 학생에게 비공개
                </span>
                <textarea
                  value={draft.modelAnswer}
                  onChange={(e) =>
                    setDraft({ ...draft, modelAnswer: e.target.value })
                  }
                  rows={3}
                  aria-label="모범 답안"
                  className="border-border focus:border-accent-strong text-fg w-full rounded-lg border bg-white p-3 text-sm outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-fg text-[13px] font-bold">해설</span>
                <span className="text-fg-subtle text-xs">
                  결과 화면에서 학생에게 노출
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
                <select
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({ ...draft, category: e.target.value })
                  }
                  aria-label="카테고리"
                  className="border-border focus:border-brand text-fg h-10 rounded-lg border bg-white px-3 text-sm font-medium outline-none"
                >
                  {[
                    '알고리즘 · DP',
                    '알고리즘 · 재귀',
                    '자료구조',
                    'SQL',
                    'JavaScript',
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 flex items-center gap-2">
                <span className="text-fg text-xs font-bold">배점</span>
                <input
                  value={draft.points}
                  onChange={(e) =>
                    setDraft({ ...draft, points: Number(e.target.value) || 0 })
                  }
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
                    ? '주관식은 수동으로 자동 연결됨'
                    : '정답/배점 변경 시 자동 재채점'}
                </p>
              </div>
            </div>

            <div className="border-border bg-surface rounded-xl border p-4">
              <p className="text-fg text-sm font-bold">메타</p>
              <ul className="text-fg-muted mt-2 flex flex-col gap-1.5 text-xs">
                <li>· 작성일: {draft.createdAt}</li>
                <li>· 최근 수정: {draft.updatedAt}</li>
                <li>
                  · 응답 수: {draft.respondedCount} / {draft.totalCount}
                </li>
                <li>
                  · 평균 점수:{' '}
                  {draft.avgScore !== null
                    ? `${draft.avgScore} / ${draft.points}`
                    : '-'}
                </li>
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
          총점 합계 {data.totalPoints} / {data.targetPoints} ·{' '}
          {pointsOk ? '모든 문제 작성 완료' : '배점 합계가 총점과 달라요'}
        </p>
        <div className="ml-auto flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-10 text-sm"
            onClick={() => toast.info('학생 미리보기 — 후속 화면 (mock)')}
          >
            <Eye className="h-4 w-4" /> 학생 미리보기
          </Button>
          <Button
            type="button"
            className="h-10 text-sm"
            onClick={() => {
              toast.success('문제 저장 — 정답/배점 변경 시 자동 재채점 (mock)')
            }}
          >
            저장
          </Button>
        </div>
      </div>
    </div>
  )
}
