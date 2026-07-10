import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuizBasePath } from './useQuizBasePath'
import { AlertTriangle, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { QuizSubmissionRow } from '@/shared/types'
import { useStudentAccounts } from '@/features/admin/api/students'
import { useQuizSubmissions } from '../api/quizzes'
import { SkeletonListPage } from '@/components/ui/Skeleton'

type StatusFilter = 'all' | 'manual_pending' | 'not_submitted' | 'done'

// 제출 현황 (/instructor/quizzes/:quizId/submissions) — §8. (Figma 1343:9870)
// 독립 재채점 버튼 없음 — 정답·배점 변경 저장 후 자동 재채점 결과만 반영.
// 액션은 상태별 분기: 수동 대기 [채점][답안 보기] / 완료 [결과 보기] / 미제출 [재독촉 알림].
export default function SubmissionsPage() {
  const { quizId = '' } = useParams()
  const navigate = useNavigate()
  const base = useQuizBasePath()
  const toast = useToast()
  const { data, isPending, isError, refetch } = useQuizSubmissions(quizId)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  usePageHeader('제출 현황', '퀴즈 제출률과 채점 대기 현황을 확인합니다')

  const rows = useMemo(() => data?.rows ?? [], [data])
  const { data: students } = useStudentAccounts()
  // 제출자 userId → 이름(학생 계정 join). BE는 studentUserId만 주고 이름은 FE에서 결합.
  const nameOf = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of students?.items ?? []) map.set(s.id, s.name)
    return (userId: string) => map.get(userId) ?? '수강생'
  }, [students])

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

  if (isPending) {
    return <SkeletonListPage kpis={3} columns={5} />
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="제출 현황을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const { kpi } = data
  const doneCount = rows.filter(
    (r) => r.gradingState === 'done' || r.gradingState === 'auto_done',
  ).length

  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: '전체', count: kpi.targetCount },
    { key: 'manual_pending', label: '수동 대기', count: kpi.manualPending },
    { key: 'not_submitted', label: '미제출', count: kpi.notSubmitted },
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
      className: 'w-32',
      cell: (r) =>
        r.score === null ? (
          <span className="text-fg-muted text-sm">-</span>
        ) : (
          <div>
            <p className="text-fg text-sm font-bold">
              {r.score} / {data.totalPoints}
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
        if (!r.submitted)
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toast.success(`재독촉 알림은 준비 중입니다.`)
              }}
              className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2.5 py-1 text-xs font-medium"
            >
              재독촉 알림
            </button>
          )
        if (r.gradingState === 'manual_pending')
          return (
            <div className="flex gap-1.5">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`${base}/${quizId}/submissions/${r.id}/grade`)
                }}
              >
                채점
              </Button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toast.info(`답안 보기는 준비 중입니다.`)
                }}
                className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2.5 py-1 text-xs font-medium"
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
              toast.info(`결과 보기는 준비 중입니다.`)
            }}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2.5 py-1 text-xs font-medium"
          >
            결과 보기
          </button>
        )
      },
    },
  ]

  return (
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
        <div className="border-border flex h-9 w-64 items-center gap-2 rounded-lg border bg-white px-3">
          <Search className="text-fg-subtle h-4 w-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름으로 검색"
            aria-label="수강생 검색"
            className="text-fg placeholder:text-fg-subtle w-full bg-transparent text-sm outline-none"
          />
        </div>
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
        <button
          type="button"
          onClick={() => navigate(`${base}`)}
          className="border-border text-fg-muted hover:bg-surface-muted ml-auto rounded-lg border px-3 py-1.5 text-xs font-medium"
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
  )
}
