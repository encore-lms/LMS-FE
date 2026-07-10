import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { InstructorAssignmentRow } from '@/shared/types'
import {
  useDeleteAssignment,
  useInstructorAssignments,
} from '../api/assignments'
import { DeleteAssignmentModal } from './DeleteAssignmentModal'
import { SUBMISSION_STATUS_META } from './meta'
import { SkeletonListPage } from '@/components/ui/Skeleton'

type StatusFilter = 'all' | 'open' | 'closed'

// 과제·실습 관리 (/instructor/assignments) — P0 30. (Figma 2236:10561)
// 점수 없음 — 제출/미제출/보완요청/검토완료 상태 관제만. 마감일 가까운 순 기본 정렬.
export default function AssignmentsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = useInstructorAssignments()
  const deleteAssignment = useDeleteAssignment()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [cohort, setCohort] = useState<string>('전체')
  const [deleteTarget, setDeleteTarget] =
    useState<InstructorAssignmentRow | null>(null)
  // 기수 필터 옵션 — 데이터에서 파생(실 기수 라벨).
  const cohortOpts = useMemo(
    () => ['전체', ...new Set((data?.items ?? []).map((i) => i.cohortLabel))],
    [data],
  )
  usePageHeader(
    '과제·실습 관리',
    '담당 기수 과제·실습을 생성하고 제출 상태를 관리합니다',
  )

  const filtered = useMemo(() => {
    const items = data?.items ?? []
    const needle = q.trim().toLowerCase()
    return items.filter((r) => {
      if (status === 'open' && r.closed) return false
      if (status === 'closed' && !r.closed) return false
      if (cohort !== '전체' && r.cohortLabel !== cohort) return false
      if (needle) {
        const hay = `${r.title} ${r.subject ?? ''}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [data, q, status, cohort])

  if (isPending) {
    return <SkeletonListPage kpis={4} columns={5} />
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="과제 목록을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const { kpi } = data

  const columns: Column<InstructorAssignmentRow>[] = [
    {
      key: 'title',
      header: '과제명',
      cell: (r) => (
        <div>
          <p className="text-fg text-sm font-medium">{r.title}</p>
          <p className="text-fg-subtle text-xs">{r.cohortLabel}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: '과목/회차',
      className: 'w-32',
      cell: (r) => (
        <span className="text-fg-muted text-sm">{r.subject ?? '-'}</span>
      ),
    },
    {
      key: 'due',
      header: '마감',
      className: 'w-24',
      cell: (r) => (
        <span
          className={cn(
            'text-sm',
            r.closed ? 'text-danger font-medium' : 'text-fg-muted',
          )}
        >
          {r.dueLabel}
        </span>
      ),
    },
    {
      key: 'summary',
      header: '제출 현황',
      className: 'w-52',
      cell: (r) => (
        <div>
          <p className="text-fg-muted text-xs">
            제출 {r.counts.submitted} · 미제출 {r.counts.notSubmitted} · 보완{' '}
            {r.counts.supplementRequested} · 완료 {r.counts.reviewDone}
          </p>
          <div className="mt-1.5">
            <StatusBadge
              label={
                r.badgeCount === null
                  ? SUBMISSION_STATUS_META[r.badgeStatus].label
                  : `${SUBMISSION_STATUS_META[r.badgeStatus].label} ${r.badgeCount}`
              }
              tone={SUBMISSION_STATUS_META[r.badgeStatus].tone}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '액션',
      className: 'w-56',
      cell: (r) => (
        <div className="flex flex-wrap gap-1.5">
          {/* 상세 = 생성/수정 폼 단일 화면 (생성 정책: 생성/수정 후 상세 화면 이동) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/instructor/assignments/${r.id}`)
            }}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2 py-1 text-xs font-medium"
          >
            상세
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/instructor/assignments/${r.id}`)
            }}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2 py-1 text-xs font-medium"
          >
            수정
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setDeleteTarget(r)
            }}
            className="border-danger/40 text-danger hover:bg-danger-bg rounded-md border px-2 py-1 text-xs font-medium"
          >
            삭제
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/instructor/assignments/${r.id}/submissions`)
            }}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2 py-1 text-xs font-medium"
          >
            제출 현황
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-8">
      {/* KPI 4 — 담당 과제 전체 합산 */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="제출" value={kpi.submitted} hint="마감 전 제출 완료" />
        <KpiCard
          label="미제출"
          value={kpi.notSubmitted}
          hint="마감 전 제출 필요"
        />
        <KpiCard
          label="보완요청"
          value={kpi.supplementRequested}
          tone={kpi.supplementRequested > 0 ? 'warning' : 'default'}
          hint="재제출 대기"
        />
        <KpiCard
          label="검토완료"
          value={kpi.reviewDone}
          hint="피드백 반영 완료"
        />
      </div>

      {/* 필터 바 */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="border-border flex h-9 w-72 items-center gap-2 rounded-lg border bg-white px-3">
          <Search className="text-fg-subtle h-4 w-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="과제명·과목으로 검색"
            aria-label="과제 검색"
            className="text-fg placeholder:text-fg-subtle w-full bg-transparent text-sm outline-none"
          />
        </div>
        <label className="border-border flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs">
          <span className="text-fg-subtle">상태</span>
          <Select
            value={status}
            onChange={(v) => setStatus(v as StatusFilter)}
            aria-label="상태 필터"
            options={[
              { value: 'all', label: '전체' },
              { value: 'open', label: '진행 중' },
              { value: 'closed', label: '마감됨' },
            ]}
          />
        </label>
        <label className="border-border flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs">
          <span className="text-fg-subtle">기수</span>
          <Select
            value={cohort}
            onChange={(v) => setCohort(v)}
            aria-label="기수 필터"
            options={cohortOpts.map((c) => ({ value: c, label: c }))}
          />
        </label>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-fg-subtle text-xs">
            총 {data.total}개 · 마감일 가까운 순
          </span>
          <Button
            size="sm"
            onClick={() => navigate('/instructor/assignments/new')}
          >
            <Plus className="h-3.5 w-3.5" /> 과제 생성
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(`/instructor/assignments/${r.id}`)}
          empty="조건에 맞는 과제가 없어요"
        />
      </div>

      <DeleteAssignmentModal
        assignment={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={(a) => {
          setDeleteTarget(null)
          deleteAssignment.mutate(a.id, {
            onSuccess: () => toast.success(`${a.title} 삭제 — 제출 기록 포함`),
            onError: () => toast.danger('삭제에 실패했어요'),
          })
        }}
      />
    </div>
  )
}
