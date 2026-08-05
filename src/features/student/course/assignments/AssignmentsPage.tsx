import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { DataTable, type Column } from '@/components/data/DataTable'
import { Select } from '@/components/ui/Select'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { useCourseHubHeader } from '../useCourseHubHeader'
import { useAssignments } from '../../api/course'
import { CourseTabs } from '../CourseTabs'
import type { AssignmentListItem, AssignmentStatus, DueTone } from './types'
import { SearchInput } from '@/components/ui/SearchInput'

type Filter = 'all' | AssignmentStatus
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'not_submitted', label: '미제출' },
  { key: 'submitted', label: '제출 완료' },
  { key: 'supplement_requested', label: '보완 요청' },
  { key: 'reviewed', label: '검토 완료' },
]

// 제출 상태 배지(공통 StatusBadge 톤) — 미제출/제출 완료/보완 요청/검토 완료.
const STATUS_META: Record<
  AssignmentStatus,
  { label: string; tone: BadgeTone }
> = {
  not_submitted: { label: '미제출', tone: 'neutral' },
  submitted: { label: '제출 완료', tone: 'info' },
  supplement_requested: { label: '보완 요청', tone: 'danger' },
  reviewed: { label: '검토 완료', tone: 'success' },
}

// 상태별 액션 — 미제출·보완 요청은 학생이 손대야 하므로 주요 CTA, 그 외는 보조.
const CTA: Record<AssignmentStatus, { label: string; primary: boolean }> = {
  not_submitted: { label: '제출하기', primary: true },
  submitted: { label: '제출 보기', primary: false },
  supplement_requested: { label: '보완 후 재제출', primary: true },
  reviewed: { label: '피드백 보기', primary: false },
}

const DUE_TONE: Record<DueTone, string> = {
  soon: 'text-warning font-medium',
  normal: 'text-fg-muted',
  ended: 'text-fg-subtle',
}

/**
 * 과제/실습 목록 (/student/course/assignments) — 나의 과정 '과제/실습' 탭.
 * 강사 과제 관리와 동일한 공통 DataTable로 정렬된 테이블(과제·마감·상태·액션).
 */
export default function AssignmentsPage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useAssignments()
  useCourseHubHeader()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const items = data ?? []
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (data ?? []).filter((it) => {
      if (filter !== 'all' && it.status !== filter) return false
      if (needle && !it.title.toLowerCase().includes(needle)) return false
      return true
    })
  }, [data, filter, query])

  const go = (id: string) => navigate(`/student/course/assignments/${id}`)

  const columns: Column<AssignmentListItem>[] = [
    {
      key: 'title',
      header: '과제',
      cell: (r) => (
        <div>
          <p className="text-fg text-[14px] font-semibold">{r.title}</p>
        </div>
      ),
    },
    {
      key: 'due',
      header: '마감',
      className: 'w-24',
      cell: (r) => (
        // "5/9 종료"처럼 공백이 있는 라벨이 좁은 열에서 두 줄이 되지 않게.
        <span
          className={cn('text-[13px] whitespace-nowrap', DUE_TONE[r.dueTone])}
        >
          {r.dueLabel.replace(/^마감\s*/, '')}
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-28',
      cell: (r) => (
        <StatusBadge
          label={STATUS_META[r.status].label}
          tone={STATUS_META[r.status].tone}
        />
      ),
    },
    {
      key: 'action',
      header: '액션',
      align: 'right',
      // '피드백 보기'가 96px 콘텐츠 폭에 3.6px 여유로 아슬아슬해 두 줄이 되던 열.
      className: 'w-36',
      cell: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            go(r.id)
          }}
          className={cn(
            'inline-flex h-8 items-center justify-center rounded-lg px-3 text-[13px] font-semibold whitespace-nowrap',
            CTA[r.status].primary
              ? 'bg-brand text-white'
              : 'border-border text-fg bg-surface border',
          )}
        >
          {CTA[r.status].label}
        </button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5 p-8">
      <CourseTabs />

      <DataBoundary
        isPending={isPending}
        isError={isError}
        onRetry={refetch}
        errorTitle="과제를 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {/* 헤더 — 개수 + 검색 + 상태 필터 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-fg text-[15px] font-bold">
            총 <span className="text-brand">{items.length}</span>개 과제
          </span>
          <div className="flex items-center gap-2">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="과제·과목 검색"
              ariaLabel="과제·과목 검색"
              className="h-[38px] w-[240px] rounded-[10px] px-3.5"
            />
            <Select
              aria-label="상태 필터"
              value={filter}
              onChange={(v) => setFilter(v as Filter)}
              options={FILTERS.map((f) => ({ value: f.key, label: f.label }))}
            />
          </div>
        </div>

        {/* 과제 테이블 — 공통 DataTable(플랫) */}
        <DataTable
          columns={columns}
          rows={shown}
          rowKey={(r) => r.id}
          onRowClick={(r) => go(r.id)}
          empty="해당 조건의 과제가 없어요"
        />
      </DataBoundary>
    </div>
  )
}
