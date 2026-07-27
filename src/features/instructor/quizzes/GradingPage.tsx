import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuizBasePath } from './useQuizBasePath'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useGradingDetail, useSaveGrading } from '../api/quizzes'
import { useCohortRoster } from '../api/console'
import { QUESTION_TYPE_LABEL } from './meta'

interface DraftEntry {
  score: string // input 원문 — 빈 문자열 = 미입력
  feedback: string
  visible: boolean
}

// 수동 채점 (/instructor/quizzes/:quizId/submissions/:submissionId/grade) — §9. (Figma 1345:9909)
// 모든 수동 문항 점수 입력 후에만 [채점 완료] 활성. 피드백 공개 토글은 학생 결과 화면 노출 제어.
export default function GradingPage() {
  const { quizId = '', submissionId = '' } = useParams()
  const navigate = useNavigate()
  const base = useQuizBasePath()
  const [searchParams] = useSearchParams()
  // 허브 진입이면 제출현황 복귀에도 cohortId를 이어붙여 최종 목록이 허브로 가게 한다.
  const fromCohortId = searchParams.get('cohortId')
  const hubQs = fromCohortId ? `?cohortId=${fromCohortId}` : ''
  const toast = useToast()
  const { data, isPending, isError, refetch } = useGradingDetail(
    quizId,
    submissionId,
  )
  const [drafts, setDrafts] = useState<Record<string, DraftEntry>>({})
  const saveGrading = useSaveGrading(quizId, submissionId)
  // 강사는 계정 목록 조회가 막혀 있어(403), 담당 기수 로스터로 이름을 join한다.
  const { data: roster } = useCohortRoster(fromCohortId)
  usePageHeader('수동 채점', '문항별 점수·피드백 입력 — 완료 시 점수 확정')

  // 채점 데이터 도착 시 기존 입력값으로 초기화.
  useEffect(() => {
    if (!data) return
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

  const gradedCount = useMemo(
    () => Object.values(drafts).filter((d) => d.score.trim() !== '').length,
    [drafts],
  )

  // 드래프트 → 저장 payload(items). 점수 빈 값은 null(미확정).
  const buildItems = () =>
    (data?.items ?? []).map((it) => {
      const d = drafts[it.questionId] ?? {
        score: '',
        feedback: '',
        visible: true,
      }
      return {
        questionId: it.questionId,
        score: d.score.trim() === '' ? null : Number(d.score),
        feedback: d.feedback,
        feedbackVisible: d.visible,
      }
    })
  const handleSave = (done: boolean) => {
    if (saveGrading.isPending) return
    saveGrading.mutate(
      { items: buildItems() },
      {
        onSuccess: () => {
          toast.success(done ? '채점을 완료했어요' : '임시 저장했어요')
          if (done) navigate(`${base}/${quizId}/submissions${hubQs}`)
        },
        onError: () => toast.danger('저장에 실패했어요'),
      },
    )
  }

  const total = data?.totalManualCount ?? 0
  const allEntered = gradedCount >= total
  const pct = total > 0 ? Math.round((gradedCount / total) * 100) : 0
  // 학생명 — BE는 studentUserId만 주므로 로스터 join(없으면 BE studentName/대체).
  const studentName =
    (roster ?? []).find((s) => s.userId === data?.studentUserId)?.name ||
    data?.studentName ||
    '수강생'
  // 임시 점수 = 자동 채점분 + 입력된 수동 점수 합 (입력값 우선 반영).
  const manualSum = (data?.items ?? []).reduce((acc, it) => {
    const raw = drafts[it.questionId]?.score ?? ''
    const n = Number(raw)
    return acc + (raw.trim() !== '' && !Number.isNaN(n) ? n : 0)
  }, 0)
  const autoBase =
    (data?.provisionalScore ?? 0) -
    (data?.items ?? []).reduce((acc, it) => acc + (it.score ?? 0), 0)
  const provisional = autoBase + manualSum

  const itemStatus = (questionId: string) => {
    const raw = drafts[questionId]?.score ?? ''
    if (raw.trim() === '') return { label: '대기', tone: 'warning' as const }
    return { label: '완료', tone: 'success' as const }
  }

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      loadingText="채점 정보를 불러오는 중…"
      errorTitle="채점 정보를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && (
        <div className="p-8">
          {/* 채점 헤더 */}
          <div className="border-border bg-surface rounded-xl border px-5 py-4">
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-3">
                <Avatar name={studentName} size={44} />
                <div>
                  <p className="text-fg text-base font-bold">
                    {studentName} · {data.cohortLabel}
                  </p>
                  <p className="text-fg-subtle text-xs">
                    {data.quizTitle} · 제출 {data.submittedAt}
                  </p>
                </div>
              </div>
              <div className="bg-divider h-9 w-px" />
              <div>
                <p className="text-fg-subtle text-xs">채점 진행률</p>
                <p className="text-fg text-sm font-bold">
                  {gradedCount} / {total} 문항 · {pct}%
                </p>
              </div>
              <div className="bg-divider h-9 w-px" />
              <div>
                <p className="text-fg-subtle text-xs">임시 점수</p>
                <p className="text-fg text-lg font-bold">
                  {provisional}{' '}
                  <span className="text-fg-subtle text-xs font-medium">
                    / {data.totalScore}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  navigate(`${base}/${quizId}/submissions${hubQs}`)
                }
                className="border-border text-fg-muted hover:bg-surface-muted ml-auto rounded-lg border px-3 py-1.5 text-xs font-medium"
              >
                ← 제출 현황으로
              </button>
            </div>
            <div className="bg-surface-muted mt-3 h-2 w-40 overflow-hidden rounded-full">
              <div
                className="bg-accent-strong h-full rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* 문제별 채점 카드 */}
          {data.items.map((it) => {
            const draft = drafts[it.questionId] ?? {
              score: '',
              feedback: '',
              visible: true,
            }
            const status = itemStatus(it.questionId)
            const update = (patch: Partial<DraftEntry>) =>
              setDrafts((p) => ({
                ...p,
                [it.questionId]: { ...draft, ...patch },
              }))
            return (
              <div
                key={it.questionId}
                className="border-border bg-surface mt-4 rounded-xl border"
              >
                <div className="border-divider flex items-center gap-3 border-b px-5 py-3.5">
                  <p className="text-fg text-sm font-bold">문제 {it.index}</p>
                  <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-px text-[10px] font-bold">
                    {QUESTION_TYPE_LABEL[it.type]}
                  </span>
                  <span className="text-fg-muted text-xs">
                    배점 {it.points}점
                  </span>
                  <div className="ml-auto">
                    <StatusBadge label={status.label} tone={status.tone} />
                  </div>
                </div>
                <div className="grid gap-5 px-5 py-4 xl:grid-cols-[1fr_320px]">
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-fg-subtle text-xs font-medium">문제</p>
                      <p className="text-fg mt-1 text-sm whitespace-pre-wrap">
                        {it.body}
                      </p>
                    </div>
                    <div>
                      <p className="text-fg-subtle text-xs font-medium">
                        학생 답안
                      </p>
                      <div className="bg-surface-muted mt-1 rounded-lg p-3.5">
                        <p className="text-fg text-sm whitespace-pre-wrap">
                          {it.studentAnswer}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-fg-subtle text-xs font-medium">
                        채점 기준 (강사용)
                      </p>
                      <div className="bg-warning-bg mt-1 rounded-lg p-3.5">
                        <p className="text-fg text-sm whitespace-pre-wrap">
                          {it.rubric}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-border h-fit rounded-xl border p-4">
                    <p className="text-fg text-sm font-bold">채점</p>
                    <label className="mt-3 flex flex-col gap-1.5">
                      <span className="text-fg text-xs font-bold">
                        점수 <span className="text-danger">*</span>{' '}
                        <span className="text-fg-subtle font-medium">
                          (0 ~ {it.points})
                        </span>
                      </span>
                      <div className="border-border focus-within:border-brand flex h-11 items-center rounded-lg border bg-white px-3">
                        <input
                          value={draft.score}
                          onChange={(e) => {
                            const v = e.target.value
                            if (v !== '' && Number.isNaN(Number(v))) return
                            if (v !== '' && Number(v) > it.points) return
                            update({ score: v })
                          }}
                          placeholder="입력 필요"
                          aria-label={`문제 ${it.index} 점수`}
                          className="text-fg placeholder:text-fg-subtle w-full bg-transparent text-base font-bold outline-none focus-visible:shadow-none"
                        />
                        <span className="text-fg-subtle shrink-0 text-xs">
                          / {it.points}점
                        </span>
                      </div>
                    </label>
                    <label className="mt-3 flex flex-col gap-1.5">
                      <span className="text-fg text-xs font-bold">
                        피드백 (학생 공개)
                      </span>
                      <textarea
                        value={draft.feedback}
                        onChange={(e) => update({ feedback: e.target.value })}
                        rows={3}
                        placeholder="(피드백 미입력)"
                        aria-label={`문제 ${it.index} 피드백`}
                        className="border-border focus:border-brand text-fg placeholder:text-fg-subtle w-full rounded-lg border bg-white p-3 text-sm outline-none focus-visible:shadow-none"
                      />
                    </label>
                    <div className="bg-surface-muted mt-3 flex items-center justify-between rounded-lg px-3 py-2.5">
                      <div>
                        <p className="text-fg text-xs font-medium">
                          피드백 공개
                        </p>
                        <p className="text-fg-subtle text-[11px]">
                          학생 결과 화면에 표시
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={draft.visible}
                        aria-label={`문제 ${it.index} 피드백 공개`}
                        onClick={() => update({ visible: !draft.visible })}
                        className={cn(
                          'h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors',
                          draft.visible ? 'bg-brand' : 'bg-border',
                        )}
                      >
                        <span
                          className={cn(
                            'block h-4 w-4 rounded-full bg-white transition-transform',
                            draft.visible && 'translate-x-4',
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* 푸터 */}
          <div className="border-border bg-surface mt-4 flex flex-wrap items-center gap-2 rounded-xl border px-5 py-4">
            <p
              className={cn(
                'text-xs',
                allEntered
                  ? 'text-success font-medium'
                  : 'text-warning font-medium',
              )}
            >
              {allEntered
                ? `✓ 모든 수동 문항 입력 완료 — 채점 완료 시 점수가 확정됩니다`
                : `⚠ 모든 수동 문항 점수 입력 후 [채점 완료] 활성 — 현재 ${gradedCount} / ${total} 입력`}
            </p>
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  navigate(`${base}/${quizId}/submissions${hubQs}`)
                }
              >
                취소
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={saveGrading.isPending}
                onClick={() => handleSave(false)}
              >
                임시 저장
              </Button>
              <Button
                type="button"
                disabled={!allEntered || saveGrading.isPending}
                onClick={() => handleSave(true)}
              >
                채점 완료
              </Button>
            </div>
          </div>
        </div>
      )}
    </DataBoundary>
  )
}
