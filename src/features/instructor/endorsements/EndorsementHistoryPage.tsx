import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { KpiCard } from '@/components/data/KpiCard'
import { DataTable, type Column } from '@/components/data/DataTable'
import { Pagination } from '@/components/data/Pagination'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { Endorsement, EndorsementSnapshotStatus } from '@/shared/types'
import { useEndorsementHistory } from '../api/endorsements'
import { SNAPSHOT_META } from './meta'
import { SkeletonListPage } from '@/components/ui/Skeleton'

type StatusFilter = 'all' | EndorsementSnapshotStatus

// 강사 추천서 전체 보기 (/instructor/endorsements/history).
// 누적 추천서 큐 — KPI 4 + 검색·스냅샷 상태 필터 + 테이블. (Figma 2149:14744)
export default function EndorsementHistoryPage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useEndorsementHistory()
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  usePageHeader(
    '강사 추천서 전체 보기',
    '담당 기수 누적 추천서 큐 — 기수·기간·스냅샷 반영 상태로 필터링',
  )

  const items = useMemo(() => data?.items ?? [], [data])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return items.filter((e) => {
      if (filter !== 'all' && e.snapshotStatus !== filter) return false
      if (needle && !e.student.name.toLowerCase().includes(needle)) return false
      return true
    })
  }, [items, filter, q])

  // 필터·검색이 바뀌면 첫 페이지로.
  useEffect(() => {
    setPage(1)
  }, [filter, q])

  if (isPending) {
    return <SkeletonListPage kpis={3} columns={5} />
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="전체 추천서를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const { stats } = data
  const countBy = (s: EndorsementSnapshotStatus) =>
    items.filter((e) => e.snapshotStatus === s).length

  // 클라이언트 페이지네이션 — 큐가 길어져도 10건씩.
  const PAGE_SIZE = 10
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const paged = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const filters: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: '전체', count: items.length },
    {
      key: 'snapshot_applied',
      label: SNAPSHOT_META.snapshot_applied.label,
      count: countBy('snapshot_applied'),
    },
    {
      key: 'pending_certification',
      label: SNAPSHOT_META.pending_certification.label,
      count: countBy('pending_certification'),
    },
    {
      key: 'pending_refresh',
      label: SNAPSHOT_META.pending_refresh.label,
      count: countBy('pending_refresh'),
    },
  ]

  const columns: Column<Endorsement>[] = [
    {
      key: 'student',
      header: '수강생',
      className: 'w-48',
      cell: (e) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={e.student.name} size={30} />
          <div className="flex flex-col">
            <span className="text-fg font-medium">{e.student.name}</span>
            <span className="text-fg-subtle text-xs">{e.student.cohort}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'kind',
      header: '추천서',
      className: 'w-24',
      cell: () => <StatusBadge label="추천서" tone="info" />,
    },
    {
      key: 'summary',
      header: '코멘트 (요약)',
      cell: (e) => <span className="text-fg-muted text-sm">{e.summary}</span>,
    },
    {
      key: 'createdAt',
      header: '작성일',
      className: 'w-28',
      cell: (e) => (
        <span className="text-fg-muted text-xs whitespace-nowrap">
          {e.createdAt}
        </span>
      ),
    },
    {
      key: 'snapshot',
      header: '스냅샷 상태',
      className: 'w-32',
      cell: (e) => {
        const meta = SNAPSHOT_META[e.snapshotStatus]
        return <StatusBadge label={meta.label} tone={meta.tone} />
      },
    },
    {
      key: 'action',
      header: '액션',
      align: 'right',
      className: 'w-32',
      cell: (e) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => navigate(`/instructor/endorsements/${e.id}`)}
            className="bg-brand-deep rounded-md px-3 py-1.5 text-xs font-medium text-white"
          >
            보기
          </button>
          <button
            type="button"
            onClick={() => navigate(`/instructor/endorsements/${e.id}`)}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-3 py-1.5 text-xs font-medium"
          >
            상세
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="누적 추천서" value={`${stats.total} 건`} />
        <KpiCard
          label="이번 달"
          value={`${stats.thisMonth} 건`}
          tone="accent"
        />
        <KpiCard
          label="스냅샷 반영"
          value={`${stats.snapshotApplied} 건`}
          tone="success"
        />
        <KpiCard
          label="최신화 대기"
          value={`${stats.pendingRefresh} 건`}
          tone="warning"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름으로 검색"
          aria-label="추천서 이름 검색"
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-9 w-56 rounded-lg border bg-white px-3 text-sm outline-none"
        />
        <div className="flex flex-wrap gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium',
                filter === f.key
                  ? 'bg-accent-bg text-accent-strong'
                  : 'text-fg-muted hover:bg-surface-muted',
              )}
            >
              {f.label} <span className="text-fg-subtle">({f.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <DataTable
          columns={columns}
          rows={paged}
          rowKey={(e) => e.id}
          onRowClick={(e) => navigate(`/instructor/endorsements/${e.id}`)}
          empty="조건에 맞는 추천서가 없어요"
        />
        <Pagination
          className="mt-3"
          page={current}
          pageCount={pageCount}
          totalCount={filtered.length}
          shownCount={paged.length}
          onPage={setPage}
        />
      </div>
    </div>
  )
}
