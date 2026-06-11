import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { KpiCard } from '@/components/data/KpiCard'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { AdminGradingItem, AdminGradingQuestionType } from '@/shared/types'
import { useAdminGradingDetail, useSaveGrading } from '../api/quizzes'

// 유형 라벨 — admin 로컬 상수(운영 작업은 instructor/quizzes/meta.ts 무접촉).
// essay는 Figma 운영 frame 원문 '서술형'(강사 meta '주관식'과 표기가 다름 — 운영 화면 기준).
const TYPE_LABEL: Record<AdminGradingQuestionType, string> = {
  multiple_choice: '객관식',
  short_answer: '단답형',
  fill_blank: '빈칸',
  essay: '서술형',
}

// 필 공통 — 정답 관리(AnswersPage) 액션 바와 동일 토큰.
const pill =
  'rounded-md border border-border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40'

interface DraftEntry {
  score: string // input 원문 — '' = 미입력
  feedback: string
  visible: boolean
}

const clampScore = (n: number, max: number) => Math.min(Math.max(n, 0), max)

// 운영 — 수동 채점 (/admin/quizzes/:quizId/submissions/:submissionId/grade, Figma 1515:10710, P1)
// B안: 운영 전용 신설 — 강사 GradingPage(§9) import 금지(역할 폴더 분리, 강사 ✅ 회귀 0).
// 점수·피드백은 blur 시 PATCH 자동 저장(KPI '임시 저장됨'·'자동 저장 포함'),
// [채점 완료]는 전 수동 문항 점수 입력 시 활성 → gradingStatus=finalized 확정.
export default function GradingPage() {
  const { quizId = '', submissionId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  usePageHeader(
    '수동 채점',
    '/admin/quizzes/:quizId/submissions/:submissionId/grade',
  )

  const { data, isPending, isError, refetch } = useAdminGradingDetail(
    quizId,
    submissionId,
  )
  const save = useSaveGrading(quizId, submissionId)

  const [drafts, setDrafts] = useState<Record<string, DraftEntry>>({})
  // 자동 저장 invalidate 재조회가 입력 중 드래프트를 덮지 않게 — 제출 건이 바뀔 때만 초기화.
  const initializedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!data || initializedFor.current === data.submissionId) return
    initializedFor.current = data.submissionId
    setDrafts(
      Object.fromEntries(
        data.items.map((it) => [
          it.questionId,
          {
            score: it.score !== null ? String(it.score) : '',
            feedback: it.feedback,
            visible: it.feedbackVisible,
          },
        ]),
      ),
    )
  }, [data])

  const scoredCount = useMemo(
    () => Object.values(drafts).filter((d) => d.score.trim() !== '').length,
    [drafts],
  )

  if (isPending) {
    return <div className="text-fg-muted p-8">채점 정보를 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="채점 정보를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const items = data.items
  const finalized = data.gradingStatus === 'finalized'
  const allEntered = items.length > 0 && scoredCount >= items.length
  const ungraded = items.length - scoredCount

  // 현재 점수(임시 저장 포함) = 자동 채점분 + 입력된 수동 점수 합 — 입력값 우선 반영.
  const autoBase =
    data.currentScore - items.reduce((acc, it) => acc + (it.score ?? 0), 0)
  const provisional =
    autoBase +
    items.reduce((acc, it) => {
      const raw = drafts[it.questionId]?.score ?? ''
      const n = Number(raw)
      return acc + (raw.trim() !== '' && !Number.isNaN(n) ? n : 0)
    }, 0)

  const draftFor = (it: AdminGradingItem): DraftEntry =>
    drafts[it.questionId] ?? {
      score: it.score !== null ? String(it.score) : '',
      feedback: it.feedback,
      visible: it.feedbackVisible,
    }

  // 상태 pill — 입력 점수에서 파생(Figma '부분 정답' warning 틴트).
  const statusFor = (
    it: AdminGradingItem,
  ): { label: string; tone: BadgeTone } => {
    const raw = draftFor(it).score
    if (raw.trim() === '') return { label: '미채점', tone: 'neutral' }
    const n = Number(raw)
    if (n >= it.maxPoints) return { label: '정답', tone: 'success' }
    if (n <= 0) return { label: '오답', tone: 'danger' }
    return { label: '부분 정답', tone: 'warning' }
  }

  // 자동 저장 — 서버 값과 다를 때만 PATCH(점수·피드백·공개만, answerPayload 조회 전용).
  const saveItem = (it: AdminGradingItem, draft: DraftEntry) => {
    const earnedPoints = draft.score.trim() === '' ? null : Number(draft.score)
    const dirty =
      earnedPoints !== it.score ||
      draft.feedback !== it.feedback ||
      draft.visible !== it.feedbackVisible
    if (!dirty) return
    save.mutate(
      {
        items: [
          {
            questionId: it.questionId,
            earnedPoints,
            feedback: draft.feedback,
            feedbackVisible: draft.visible,
          },
        ],
      },
      {
        onError: () =>
          toast.danger('자동 저장에 실패했어요 — 잠시 후 다시 시도해 주세요.'),
      },
    )
  }

  const finalize = () => {
    // 드래프트 일괄 플러시 + finalize — 전 수동 문항 점수 입력 시에만 도달(disabled 게이트).
    save.mutate(
      {
        items: items.map((it) => {
          const d = draftFor(it)
          return {
            questionId: it.questionId,
            earnedPoints: d.score.trim() === '' ? null : Number(d.score),
            feedback: d.feedback,
            feedbackVisible: d.visible,
          }
        }),
        finalize: true,
      },
      {
        onSuccess: () => {
          toast.success(
            `채점 완료 — ${data.student.name} ${provisional}점 확정 · 학생 결과 화면에 공개`,
          )
          navigate(`/admin/quizzes/${quizId}/submissions`)
        },
        onError: () =>
          toast.danger('채점 완료에 실패했어요 — 잠시 후 다시 시도해 주세요.'),
      },
    )
  }

  const goTo = (target: string | null) => {
    // 자동 저장이므로 이동 경고 없음(미저장 변경 없음 전제).
    if (target) navigate(`/admin/quizzes/${quizId}/submissions/${target}/grade`)
  }

  return (
    <div className="p-8">
      {/* 액션 바 — ← 제출 현황 / 이전·다음 학생(끝단 disabled) / 채점 완료(brand) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(`/admin/quizzes/${quizId}/submissions`)}
          className={cn(pill, 'bg-surface-muted text-fg-muted hover:text-fg')}
        >
          <ArrowLeft className="mr-1 inline h-3 w-3" /> 제출 현황
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!data.prevSubmissionId}
            onClick={() => goTo(data.prevSubmissionId)}
            className={cn(pill, 'bg-surface-muted text-fg-muted hover:text-fg')}
          >
            이전 학생
          </button>
          <button
            type="button"
            disabled={!data.nextSubmissionId}
            onClick={() => goTo(data.nextSubmissionId)}
            className={cn(pill, 'bg-surface-muted text-fg-muted hover:text-fg')}
          >
            다음 학생
          </button>
          {/* 모든 수동 문항 점수 입력 시에만 활성(P0-ADM-QUIZ-010) */}
          <button
            type="button"
            disabled={!allEntered || finalized || save.isPending}
            onClick={finalize}
            className={cn(
              pill,
              'bg-brand text-on-color hover:bg-brand/90 px-4',
            )}
          >
            {finalized ? '채점 완료됨' : '채점 완료'}
          </button>
        </div>
      </div>

      {/* KPI 5종 — Figma 라벨·캡션 원문. 현재 점수·미채점은 드래프트 실시간 파생 */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="현재 점수"
          value={provisional}
          hint={save.isPending ? '저장 중…' : '임시 저장됨'}
        />
        <KpiCard
          label="미채점 문항"
          value={ungraded}
          hint={`주관식 ${items.length}개`}
          tone={ungraded > 0 ? 'warning' : 'default'}
        />
        <KpiCard
          label="피드백 공개"
          value={finalized ? '공개' : '대기'}
          hint="완료 후 공개"
        />
        <KpiCard
          label="변경 이력"
          value={data.changeLogCount}
          hint="자동 저장 포함"
        />
        <KpiCard
          label="소요 시간"
          value={`${data.elapsedMinutes}m`}
          hint={`평균 ${data.avgElapsedMinutes}m`}
        />
      </div>

      {/* 제출 요약 바 — 수강생·기수·퀴즈명 + 제출 메타 */}
      <div className="border-border bg-surface mt-6 rounded-xl border px-5 py-4">
        <p className="text-fg text-lg font-bold">
          {data.student.name} · {data.student.cohort} · {data.quizTitle}
        </p>
        <p className="text-fg-muted mt-1 text-sm">
          제출 {data.submittedAt} · 제한 시간 {data.timeLimitMinutes}분 중{' '}
          {data.timeUsedMinutes}분 사용 · 자동 채점 {data.autoGradedCount}/
          {data.totalQuestionCount} 완료
        </p>
      </div>

      {/* 채점 문항 카드 — 수동 채점 대상만 2열 그리드 */}
      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {items.map((it) => {
          const draft = draftFor(it)
          const status = statusFor(it)
          const update = (patch: Partial<DraftEntry>) =>
            setDrafts((p) => ({
              ...p,
              [it.questionId]: { ...draft, ...patch },
            }))
          return (
            <div
              key={it.questionId}
              className="border-border bg-surface rounded-xl border p-5"
            >
              <div className="flex items-center gap-3">
                <p className="text-fg text-base font-bold">
                  문항 {it.questionNo} · {TYPE_LABEL[it.type]} · {it.maxPoints}
                  점
                </p>
                <div className="ml-auto">
                  <StatusBadge label={status.label} tone={status.tone} />
                </div>
              </div>
              <p className="text-fg-muted mt-3 text-sm">문제: {it.prompt}</p>

              <p className="text-fg mt-4 text-xs font-semibold">학생 답안</p>
              <div className="bg-surface-muted mt-1.5 rounded-md p-3">
                <p className="text-fg text-sm whitespace-pre-wrap">
                  {it.studentAnswer}
                </p>
              </div>

              {it.rubric && (
                <p className="text-fg-subtle mt-3 text-sm">
                  채점 기준: {it.rubric}
                </p>
              )}

              {/* 점수 입력 — 0~배점 클램프, blur 시 자동 저장 */}
              <div className="mt-4 grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-fg text-xs font-semibold">
                    점수 (0 ~ {it.maxPoints})
                  </span>
                  <div className="border-border bg-surface-muted focus-within:border-brand flex items-center rounded-md border px-3 py-2">
                    <input
                      value={draft.score}
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === '') return update({ score: '' })
                        const n = Number(v)
                        if (Number.isNaN(n)) return
                        update({ score: String(clampScore(n, it.maxPoints)) })
                      }}
                      onBlur={() => saveItem(it, draftFor(it))}
                      inputMode="numeric"
                      placeholder="—"
                      aria-label={`문항 ${it.questionNo} 점수`}
                      className="text-fg placeholder:text-fg-subtle w-full bg-transparent text-sm font-bold outline-none"
                    />
                    <span className="text-fg-subtle shrink-0 text-xs">
                      / {it.maxPoints}점
                    </span>
                  </div>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-fg text-xs font-semibold">피드백</span>
                  <textarea
                    value={draft.feedback}
                    onChange={(e) => update({ feedback: e.target.value })}
                    onBlur={() => saveItem(it, draftFor(it))}
                    rows={2}
                    placeholder="(피드백 미입력)"
                    aria-label={`문항 ${it.questionNo} 피드백`}
                    className="border-border bg-surface-muted focus:border-brand text-fg placeholder:text-fg-subtle w-full rounded-md border p-3 text-sm outline-none"
                  />
                </label>
              </div>

              {/* 하단 — 점수 pill(accent 틴트, Figma indigo) + 피드백 공개 토글 */}
              <div className="mt-4 flex items-center gap-3">
                <span className="bg-accent-bg text-accent-strong rounded-md px-3 py-1.5 text-xs font-semibold">
                  {draft.score.trim() === '' ? '—' : draft.score} /{' '}
                  {it.maxPoints}점
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-fg-muted text-xs">피드백 공개</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={draft.visible}
                    aria-label={`문항 ${it.questionNo} 피드백 공개`}
                    onClick={() => {
                      const next = { ...draft, visible: !draft.visible }
                      update({ visible: next.visible })
                      saveItem(it, next) // 토글은 즉시 저장(blur 없음)
                    }}
                    className={cn(
                      'h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors',
                      draft.visible ? 'bg-brand' : 'bg-border',
                    )}
                  >
                    <span
                      className={cn(
                        'bg-surface block h-4 w-4 rounded-full transition-transform',
                        draft.visible && 'translate-x-4',
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 저장 정책 배너 — Figma 원문(info 틴트) */}
      <div className="border-border bg-info-bg mt-8 rounded-xl border p-5">
        <p className="text-info text-sm font-bold">저장 정책</p>
        <p className="text-info mt-2 text-sm">
          문항별 점수와 피드백은 임시 저장되며, 채점 완료 후 학생 결과 화면에
          공개됩니다.
        </p>
      </div>
    </div>
  )
}
