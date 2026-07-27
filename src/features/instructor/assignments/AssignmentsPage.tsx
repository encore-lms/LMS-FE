import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
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
// embedded=true면 과정·기수·교과목 '과제' 탭에 임베드(자체 헤더·탭·기수 필터 생략, 선택 기수로 서버 스코프).
export default function AssignmentsPage({
  embedded = false,
  cohortId = null,
}: {
  embedded?: boolean
  cohortId?: string | null
}) {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } =
    useInstructorAssignments(cohortId)
  // 허브(과정·기수 탭)에서 폼·상세로 진입 시 cohortId를 넘겨, 저장·취소 후 허브로 복귀·기수 고정.
  const hubQs = embedded && cohortId ? `?cohortId=${cohortId}` : ''
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
    !embedded,
  )

  const filtered = useMemo(() => {
    const items = data?.items ?? []
    const needle = q.trim().toLowerCase()
    return items.filter((r) => {
      if (status === 'open' && r.closed) return false
      if (status === 'closed' && !r.closed) return false
      if (cohort !== '전체' && r.cohortLabel !== cohort) return false
      if (needle) {
        if (!r.title.toLowerCase().includes(needle)) return false
      }
      return true
    })
  }, [data, q, status, cohort])

  const kpi = data?.kpi

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
          {/* 열 폭보다 긴 문장이라 접히는데, 라벨과 숫자가 갈라지지 않도록 쌍 단위로 nowrap. */}
          <p className="text-fg-muted text-xs">
            <span className="whitespace-nowrap">제출 {r.counts.submitted}</span>{' '}
            ·{' '}
            <span className="whitespace-nowrap">
              미제출 {r.counts.notSubmitted}
            </span>{' '}
            ·{' '}
            <span className="whitespace-nowrap">
              보완 {r.counts.supplementRequested}
            </span>{' '}
            ·{' '}
            <span className="whitespace-nowrap">
              완료 {r.counts.reviewDone}
            </span>
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
          {/* 상세 = 생성/수정 폼 단일 화면 (생성 정책: 생성/수정 후 상세 화면 이동)
              — 구 [수정] 버튼과 이동 경로가 같아 [상세] 하나로 합쳤다. */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/instructor/assignments/${r.id}${hubQs}`)
            }}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2 py-1 text-xs font-medium whitespace-nowrap"
          >
            상세
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setDeleteTarget(r)
            }}
            className="border-danger/40 text-danger hover:bg-danger-bg rounded-md border px-2 py-1 text-xs font-medium whitespace-nowrap"
          >
            삭제
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/instructor/assignments/${r.id}/submissions${hubQs}`)
            }}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2 py-1 text-xs font-medium whitespace-nowrap"
          >
            제출 현황
          </button>
        </div>
      ),
    },
  ]

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      // 스켈레톤 여백은 DataBoundary className(p-8)에서 부여 — 중복 패딩 방지
      skeleton={<SkeletonListPage kpis={4} columns={5} className="" />}
      errorTitle="과제 목록을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className={embedded ? '' : 'p-8'}
    >
      {data && kpi && (
        <div className={embedded ? '' : 'p-8'}>
          {/* KPI 4 — 담당 과제 전체 합산 */}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="제출"
              value={kpi.submitted}
              hint="마감 전 제출 완료"
            />
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
            <label className="flex items-center gap-2 text-xs">
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
            {/* 기수 필터 — 임베드(과정·기수·교과목 탭)에선 상단에서 이미 기수를 선택하므로 숨김 */}
            {!embedded && (
              <label className="flex items-center gap-2 text-xs">
                <span className="text-fg-subtle">기수</span>
                <Select
                  value={cohort}
                  onChange={(v) => setCohort(v)}
                  aria-label="기수 필터"
                  options={cohortOpts.map((c) => ({ value: c, label: c }))}
                />
              </label>
            )}
            <div className="ml-auto flex items-center gap-3">
              <span className="text-fg-subtle text-xs">
                총 {data.total}개 · 마감일 가까운 순
              </span>
              <Button
                size="sm"
                onClick={() => navigate(`/instructor/assignments/new${hubQs}`)}
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
              onRowClick={(r) =>
                navigate(`/instructor/assignments/${r.id}${hubQs}`)
              }
              empty="조건에 맞는 과제가 없어요"
            />
          </div>

          <DeleteAssignmentModal
            assignment={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={(a) => {
              setDeleteTarget(null)
              deleteAssignment.mutate(a.id, {
                onSuccess: () =>
                  toast.success(`${a.title} 삭제 — 제출 기록 포함`),
                onError: () => toast.danger('삭제에 실패했어요'),
              })
            }}
          />
        </div>
      )}
    </DataBoundary>
  )
}
