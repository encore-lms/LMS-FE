import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuizBasePath } from './useQuizBasePath'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { QuizSubmissionRow } from '@/shared/types'
import { useCohortRoster } from '../api/console'
import { useQuizSubmissions, useRemindSubmission } from '../api/quizzes'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { SearchInput } from '@/components/ui/SearchInput'

type StatusFilter = 'all' | 'manual_pending' | 'not_submitted' | 'done'

// 제출 현황 (/instructor/quizzes/:quizId/submissions) — §8. (Figma 1343:9870)
// 독립 재채점 버튼 없음 — 정답·배점 변경 저장 후 자동 재채점 결과만 반영.
// 액션은 상태별 분기: 수동 대기 [채점][답안 보기] / 완료 [결과 보기] / 미제출 [재독촉 알림].
export default function SubmissionsPage() {
  const { quizId = '' } = useParams()
  const navigate = useNavigate()
  const base = useQuizBasePath()
  const [searchParams] = useSearchParams()
  // 허브 진입이면 목록으로 = 허브 퀴즈 탭. 채점 진입에도 cohortId를 이어붙인다.
  const fromCohortId = searchParams.get('cohortId')
  const hubQs = fromCohortId ? `?cohortId=${fromCohortId}` : ''
  // 결과·답안 보기 — 채점 화면을 읽기 전용(view=1)으로 연다.
  const viewQs = fromCohortId ? `${hubQs}&view=1` : '?view=1'
  const backTo = fromCohortId
    ? `/instructor/cohorts/${fromCohortId}/education?tab=quizzes`
    : base
  const toast = useToast()
  const { data, isPending, isError, refetch } = useQuizSubmissions(quizId)
  const remind = useRemindSubmission(quizId)
  // 한 세션에서 같은 수강생에게 연타로 중복 알림이 가지 않도록 전송한 행을 기억한다.
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set())
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  usePageHeader('제출 현황', '퀴즈 제출률과 채점 대기 현황을 확인합니다')
  // 정답 관리는 운영 전용이다 — 강사 마운트에서는 감춘다.
  const isAdmin = useQuizBasePath().startsWith('/admin')

  const rows = useMemo(() => data?.rows ?? [], [data])
  // 제출자 userId → 이름 join. BE는 studentUserId만 주고 이름은 FE에서 결합.
  // 강사는 계정 목록(/users/students) 조회가 막혀 있어(403), 담당 기수 로스터로 join한다.
  const { data: roster } = useCohortRoster(fromCohortId)
  const nameOf = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of roster ?? []) map.set(s.userId, s.name)
    return (userId: string) => map.get(userId) ?? '수강생'
  }, [roster])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = rows.filter((r) => {
      if (filter === 'manual_pending' && r.gradingState !== 'manual_pending')
        return false
      if (filter === 'not_submitted' && r.submitted) return false
      if (
        filter === 'done' &&
        !(r.gradingState === 'done' || r.gradingState === 'auto_done')
      )
        return false
      if (needle && !nameOf(r.studentUserId).toLowerCase().includes(needle))
        return false
      return true
    })
    // 이름 가나다순 고정(운영 요구)
    return [...list].sort((a, b) =>
      nameOf(a.studentUserId).localeCompare(nameOf(b.studentUserId), 'ko'),
    )
  }, [rows, q, filter, nameOf])

  const kpi = data?.kpi
  const doneCount = rows.filter(
    (r) => r.gradingState === 'done' || r.gradingState === 'auto_done',
  ).length

  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: '전체', count: kpi?.targetCount ?? 0 },
    {
      key: 'manual_pending',
      label: '수동 대기',
      count: kpi?.manualPending ?? 0,
    },
    { key: 'not_submitted', label: '미제출', count: kpi?.notSubmitted ?? 0 },
    { key: 'done', label: '완료', count: doneCount },
  ]

  const columns: Column<QuizSubmissionRow>[] = [
    {
      key: 'student',
      header: '수강생',
      cell: (r) => (
        <div>
          <p className="text-fg text-sm font-medium">
            {nameOf(r.studentUserId)}
          </p>
          <p className="text-fg-subtle text-xs">{r.cohortLabel}</p>
        </div>
      ),
    },
    {
      key: 'submitStatus',
      header: '제출 상태',
      className: 'w-28',
      cell: (r) => (
        <StatusBadge
          label={r.submitted ? '제출 완료' : '미제출'}
          tone={r.submitted ? 'success' : 'neutral'}
        />
      ),
    },
    {
      key: 'submittedAt',
      header: '제출 시각',
      className: 'w-32',
      cell: (r) => (
        <span className="text-fg-muted text-sm">{r.submittedAt ?? '-'}</span>
      ),
    },
    {
      key: 'score',
      header: '총점',
      // 보조 라벨 "임시 (수동 대기)"가 한 줄에 들어갈 폭.
      className: 'w-36',
      cell: (r) =>
        r.score === null ? (
          <span className="text-fg-muted text-sm">-</span>
        ) : (
          <div>
            <p className="text-fg text-sm font-bold">
              {r.score} / {data?.totalPoints}
            </p>
            <p className="text-fg-subtle text-[11px]">
              {r.scoreFinal ? '확정' : '임시 (수동 대기)'}
            </p>
          </div>
        ),
    },
    {
      key: 'grading',
      header: '채점 상태',
      className: 'w-32',
      cell: (r) => {
        if (!r.gradingState)
          return <span className="text-fg-muted text-sm">-</span>
        if (r.gradingState === 'manual_pending')
          return (
            <StatusBadge
              label={`수동 대기 ${r.manualPendingCount}`}
              tone="warning"
            />
          )
        if (r.gradingState === 'auto_done')
          return <StatusBadge label="자동 완료" tone="success" />
        return <StatusBadge label="완료" tone="success" />
      },
    },
    {
      key: 'feedback',
      header: '피드백',
      className: 'w-20',
      cell: (r) =>
        r.feedbackEntered ? (
          <span className="text-success text-xs font-medium">✓ 입력</span>
        ) : (
          <span className="text-fg-muted text-sm">-</span>
        ),
    },
    {
      key: 'actions',
      header: '액션',
      className: 'w-48',
      cell: (r) => {
        if (!r.submitted) {
          const sent = remindedIds.has(r.id)
          return (
            <button
              type="button"
              disabled={sent || remind.isPending}
              onClick={(e) => {
                e.stopPropagation()
                remind.mutate(r.studentUserId, {
                  onSuccess: () => {
                    setRemindedIds((prev) => new Set(prev).add(r.id))
                    toast.success(
                      `${nameOf(r.studentUserId)} 님에게 제출 독촉 알림을 보냈어요`,
                    )
                  },
                  onError: () => toast.danger('알림 전송에 실패했어요'),
                })
              }}
              className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap disabled:opacity-50 disabled:hover:bg-transparent"
            >
              {sent ? '알림 전송됨' : '재독촉 알림'}
            </button>
          )
        }
        if (r.gradingState === 'manual_pending')
          return (
            <div className="flex gap-1.5">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(
                    `${base}/${quizId}/submissions/${r.id}/grade${hubQs}`,
                  )
                }}
              >
                채점
              </Button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(
                    `${base}/${quizId}/submissions/${r.id}/grade${viewQs}`,
                  )
                }}
                className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap"
              >
                답안 보기
              </button>
            </div>
          )
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`${base}/${quizId}/submissions/${r.id}/grade${viewQs}`)
            }}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap"
          >
            결과 보기
          </button>
        )
      },
    },
  ]

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      skeleton={<SkeletonListPage kpis={3} columns={5} className="" />}
      errorTitle="제출 현황을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && kpi && (
        <div className="p-8">
          {/* KPI 4 */}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="제출률"
              value={
                kpi.targetCount > 0
                  ? `${Math.round((kpi.submitted / kpi.targetCount) * 100)}%`
                  : '0%'
              }
              hint={`${kpi.submitted}/${kpi.targetCount}`}
            />
            <KpiCard label="미제출" value={kpi.notSubmitted} hint="명" />
            <KpiCard
              label="수동 대기"
              value={kpi.manualPending}
              tone={kpi.manualPending > 0 ? 'warning' : 'default'}
              hint="건"
            />
            <KpiCard
              label="평균 점수"
              value={kpi.avgScore}
              hint={`/${data.totalPoints}`}
            />
          </div>

          {/* 검색 + 상태 탭 */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="이름으로 검색"
              ariaLabel="수강생 검색"
              className="w-64"
            />
            {statusTabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium',
                  filter === t.key
                    ? 'bg-accent-bg text-accent-strong'
                    : 'text-fg-muted hover:bg-surface-muted',
                )}
              >
                {t.label}{' '}
                <span className="text-fg-subtle text-xs">({t.count})</span>
              </button>
            ))}
            {/* 정답 관리 — 채점 결과를 보다 정답 오류를 발견했을 때 여기서 들어간다.
                운영 전용 화면이라 /admin 마운트에서만 보인다(BE 도 /admin/quizzes/* 전용). */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate(`/admin/quizzes/${quizId}/answers`)}
                className="border-border text-fg-muted hover:bg-surface-muted ml-auto rounded-lg border px-3 py-1.5 text-xs font-medium"
              >
                정답 관리 →
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate(backTo)}
              className={cn(
                'border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-3 py-1.5 text-xs font-medium',
                !isAdmin && 'ml-auto',
              )}
            >
              ← 퀴즈 목록으로
            </button>
          </div>

          <div className="mt-3">
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(r) => r.id}
              empty="조건에 맞는 제출이 없어요"
            />
          </div>
        </div>
      )}
    </DataBoundary>
  )
}
