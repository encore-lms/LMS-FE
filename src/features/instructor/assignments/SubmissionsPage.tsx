import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { AssignmentSubmissionRow } from '@/shared/types'
import {
  useAssignmentSubmissions,
  useChangeSubmissionStatus,
} from '../api/assignments'
import { useStudentAccounts } from '@/shared/api/students'
import { ReviewCompleteModal } from './ReviewCompleteModal'
import { SupplementRequestModal } from './SupplementRequestModal'
import {
  SUBMISSION_FILTERS,
  SUBMISSION_STATUS_META,
  type SubmissionFilter,
} from './meta'

// 과제 제출 현황·피드백 (/instructor/assignments/:assignmentId/submissions) — P0 30. (Figma 2236:10651)
// 좌 학생별 제출 큐 + 우 제출물 검토 패널. 점수 입력 없음 — 보완요청/검토완료 상태 전이만.
export default function SubmissionsPage() {
  const { assignmentId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } =
    useAssignmentSubmissions(assignmentId)
  const { data: students } = useStudentAccounts()
  const changeStatus = useChangeSubmissionStatus(assignmentId)
  const [filter, setFilter] = useState<SubmissionFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [supplementOpen, setSupplementOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  usePageHeader(
    '과제 제출 현황·피드백',
    '제출 내용을 확인하고 보완요청 또는 검토완료 상태를 처리합니다',
  )

  // 제출자 사용자 ID → 이름/코드(학생 계정 join).
  const student = useMemo(() => {
    const map = new Map<string, { name: string; code: string }>()
    for (const s of students?.items ?? [])
      map.set(s.id, { name: s.name, code: s.studentUuid })
    return (userId: string) =>
      map.get(userId) ?? { name: '수강생', code: userId.slice(0, 8) }
  }, [students])

  const rows = useMemo(() => data?.rows ?? [], [data])

  const filtered = useMemo(
    () => rows.filter((r) => filter === 'all' || r.status === filter),
    [rows, filter],
  )

  const selected: AssignmentSubmissionRow | null =
    rows.find((r) => r.id === selectedId) ??
    rows.find((r) => r.status !== 'not_submitted') ??
    rows[0] ??
    null

  const applyTransition = (
    to: 'supplement_requested' | 'review_done',
    feedback: string,
  ) => {
    if (!selected) return
    changeStatus.mutate(
      {
        submissionId: selected.id,
        status: to,
        feedback: feedback || undefined,
      },
      {
        onSuccess: () => toast.success('상태와 피드백이 저장되었습니다.'),
        onError: () => toast.danger('처리에 실패했어요'),
      },
    )
  }

  const headerBadges: {
    label: string
    tone: 'info' | 'neutral' | 'warning' | 'success' | 'danger'
  }[] = data
    ? [
        { label: `제출 ${data.counts.submitted}`, tone: 'info' },
        { label: `미제출 ${data.counts.notSubmitted}`, tone: 'neutral' },
        {
          label: `보완요청 ${data.counts.supplementRequested}`,
          tone: 'warning',
        },
        { label: `검토완료 ${data.counts.reviewDone}`, tone: 'success' },
        { label: data.dueLabel, tone: data.closed ? 'danger' : 'warning' },
      ]
    : []

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      loadingText="제출 현황을 불러오는 중…"
      errorTitle="제출 현황을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && (
        <div className="p-8">
          {/* 과제 헤더 */}
          <div className="border-border bg-surface rounded-xl border p-6">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-fg text-xl font-bold">
                {data.assignmentTitle}
              </p>
              <button
                type="button"
                onClick={() => navigate('/instructor/assignments')}
                className="border-border text-fg-muted hover:bg-surface-muted ml-auto rounded-lg border px-3 py-1.5 text-xs font-medium"
              >
                ← 과제 목록으로
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {headerBadges.map((b) => (
                <StatusBadge key={b.label} label={b.label} tone={b.tone} />
              ))}
            </div>
          </div>

          <div className="mt-5 grid items-start gap-5 lg:grid-cols-[480px_1fr]">
            {/* 학생별 제출 */}
            <section className="border-border bg-surface rounded-xl border p-6">
              <p className="text-fg text-base font-bold">학생별 제출</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {SUBMISSION_FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium',
                      filter === f
                        ? 'bg-accent-bg text-accent-strong'
                        : 'text-fg-muted hover:bg-surface-muted',
                    )}
                  >
                    {f === 'all' ? '전체' : SUBMISSION_STATUS_META[f].label}
                  </button>
                ))}
              </div>
              <ul className="border-divider mt-3 border-t">
                {filtered.map((r) => (
                  <li key={r.id} className="border-divider border-b">
                    <button
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-2 py-3.5 text-left',
                        selected?.id === r.id
                          ? 'bg-accent-bg/40'
                          : 'hover:bg-surface-muted',
                      )}
                    >
                      <span className="text-fg w-20 shrink-0 text-[15px] font-semibold">
                        {student(r.studentUserId).name}
                      </span>
                      <StatusBadge
                        label={SUBMISSION_STATUS_META[r.status].label}
                        tone={SUBMISSION_STATUS_META[r.status].tone}
                      />
                      <span className="text-fg-muted ml-auto text-[13px]">
                        {r.submittedAtLabel ?? '-'}
                      </span>
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="text-fg-muted py-8 text-center text-sm">
                    조건에 맞는 제출이 없어요
                  </li>
                )}
              </ul>
            </section>

            {/* 제출물 검토 */}
            <section className="border-border bg-surface rounded-xl border p-6">
              <p className="text-fg text-base font-bold">제출물 검토</p>
              {!selected ? (
                <p className="text-fg-muted mt-4 text-sm">제출이 없습니다.</p>
              ) : (
                <>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <p className="text-fg-muted text-sm">
                      {student(selected.studentUserId).name} ·{' '}
                      {student(selected.studentUserId).code}
                    </p>
                    <div className="ml-auto">
                      <StatusBadge
                        label={`상태 변경: ${SUBMISSION_STATUS_META[selected.status].label}`}
                        tone={SUBMISSION_STATUS_META[selected.status].tone}
                      />
                    </div>
                  </div>
                  <div className="border-divider mt-4 border-t pt-5">
                    {selected.status === 'not_submitted' ? (
                      <Empty
                        title="아직 제출하지 않았어요"
                        description="제출이 들어오면 본문·URL·파일을 여기서 검토할 수 있어요."
                      />
                    ) : (
                      <>
                        <p className="text-fg text-sm font-bold">제출 본문</p>
                        <p className="text-fg-muted mt-2 text-sm leading-relaxed">
                          {selected.bodyText ?? '-'}
                        </p>
                        <p className="text-fg mt-5 text-sm font-bold">
                          제출 URL
                        </p>
                        {selected.url ? (
                          <a
                            href={selected.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-info mt-2 block text-sm break-all hover:underline"
                          >
                            {selected.url}
                          </a>
                        ) : (
                          <p className="text-fg-muted mt-2 text-sm">-</p>
                        )}
                        <p className="text-fg mt-5 text-sm font-bold">
                          제출 파일
                        </p>
                        {selected.files.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selected.files.map((f) => (
                              <span
                                key={f}
                                className="border-border bg-surface-muted text-fg-muted inline-flex rounded-lg border px-3 py-1.5 text-xs font-medium"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-fg-muted mt-2 text-sm">-</p>
                        )}
                        <p className="text-fg mt-5 text-sm font-bold">
                          피드백 스레드
                        </p>
                        <div className="mt-2 flex flex-col gap-2.5">
                          {selected.feedbacks.length === 0 && (
                            <p className="text-fg-muted text-sm">
                              아직 피드백이 없어요
                            </p>
                          )}
                          {selected.feedbacks.map((fb, i) => (
                            <div
                              key={i}
                              className={cn(
                                'border-border rounded-lg border p-3.5',
                                !fb.byStudent && 'bg-surface-muted/50',
                              )}
                            >
                              <p className="text-fg-muted text-xs font-semibold">
                                {fb.byStudent
                                  ? student(selected.studentUserId).name
                                  : '운영/강사'}
                                {fb.timeLabel && ` · ${fb.timeLabel}`}
                              </p>
                              <p className="text-fg mt-1.5 text-[13px]">
                                {fb.text}
                              </p>
                            </div>
                          ))}
                        </div>
                        <p className="text-fg mt-5 text-sm font-bold">
                          상태 변경 이력
                        </p>
                        <div className="mt-2 flex flex-col gap-1">
                          {selected.history.length === 0 && (
                            <p className="text-fg-muted text-sm">
                              아직 상태 변경 이력이 없어요
                            </p>
                          )}
                          {selected.history.map((h, i) => (
                            <p key={i} className="text-fg-muted text-[13px]">
                              {h}
                            </p>
                          ))}
                        </div>
                        <div className="mt-7 flex justify-end gap-2">
                          <Button
                            disabled={
                              selected.status === 'supplement_requested'
                            }
                            onClick={() => setSupplementOpen(true)}
                          >
                            보완요청
                          </Button>
                          <Button
                            disabled={selected.status === 'review_done'}
                            onClick={() => setReviewOpen(true)}
                          >
                            검토완료
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>

          <SupplementRequestModal
            open={supplementOpen}
            studentName={selected ? student(selected.studentUserId).name : ''}
            onClose={() => setSupplementOpen(false)}
            onConfirm={(reason) => {
              setSupplementOpen(false)
              applyTransition('supplement_requested', reason)
            }}
          />
          <ReviewCompleteModal
            open={reviewOpen}
            studentName={selected ? student(selected.studentUserId).name : ''}
            onClose={() => setReviewOpen(false)}
            onConfirm={(feedback) => {
              setReviewOpen(false)
              applyTransition('review_done', feedback)
            }}
          />
        </div>
      )}
    </DataBoundary>
  )
}
