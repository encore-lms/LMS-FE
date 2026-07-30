import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings2 } from 'lucide-react'
import { CohortDirectory } from '@/components/data/CohortDirectory'
import { type Column } from '@/components/data/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { usePageHeader } from '@/shared/store'
import { useCourseList } from '../api/settings'
import { useAllCourseCohorts, type AdminCohortRow } from './cohortRows'

// 담당 과정/기수 (/admin/education) — 기수를 골라 허브로 들어가는 1단계 화면.
// 예전에는 한 화면에서 과정·기수 드롭다운을 갈아 끼워, 지금 어느 기수를 보고 있는지 드러나지
// 않고 기수끼리 비교도 안 됐다. 강사 화면과 같은 골격(CohortDirectory)을 쓴다.

type StatusFilter = 'ongoing' | 'upcoming' | 'ended'

const STATUS_META: Record<
  StatusFilter,
  { label: string; tone: 'success' | 'info' | 'neutral' }
> = {
  ongoing: { label: '진행 중', tone: 'success' },
  upcoming: { label: '예정', tone: 'info' },
  ended: { label: '종료', tone: 'neutral' },
}

export default function CohortListPage() {
  const navigate = useNavigate()
  usePageHeader(
    '담당 과정/기수',
    '과정과 기수를 선택해 학습 자료와 활동을 관리합니다',
  )

  const { data: courses } = useCourseList()
  const { rows, isPending, isError, refetch } = useAllCourseCohorts(courses)

  const [statusParam, setStatus] = useSearchParamState('status', 'ongoing')
  const status = statusParam as StatusFilter
  const [q, setQ] = useSearchParamState('q')

  const counts = useMemo(
    () => ({
      ongoing: rows.filter((r) => r.status === 'ongoing').length,
      upcoming: rows.filter((r) => r.status === 'upcoming').length,
      ended: rows.filter((r) => r.status === 'ended').length,
    }),
    [rows],
  )

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows
      .filter((r) => r.status === status)
      .filter(
        (r) =>
          !needle ||
          `${r.courseTitle} ${r.cohortLabel}`.toLowerCase().includes(needle),
      )
  }, [rows, status, q])

  const columns: Column<AdminCohortRow>[] = [
    {
      key: 'name',
      header: '과정/기수',
      cell: (r) => (
        <div className="flex min-w-0 flex-col">
          <span className="text-fg text-[14px] font-bold">
            {r.courseTitle} {r.cohortLabel}
          </span>
          <span className="text-fg-subtle text-[11px]">
            {r.courseTitle} · {r.cohortNo}회차
          </span>
        </div>
      ),
    },
    {
      key: 'period',
      header: '운영 기간',
      className: 'w-56',
      cell: (r) => (
        <div className="flex flex-col">
          <span className="text-fg text-[13px] whitespace-nowrap">
            {r.startDate} ~ {r.endDate}
          </span>
          {r.dDayLabel && (
            <span className="text-brand text-[12px] font-bold">
              {r.dDayLabel}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-24',
      cell: (r) => (
        <StatusBadge
          tone={STATUS_META[r.status].tone}
          label={STATUS_META[r.status].label}
        />
      ),
    },
    {
      key: 'hrd',
      header: 'HRD 과정',
      className: 'w-36',
      cell: (r) => (
        <span className="text-fg-muted text-[12px]">
          {r.hrdTrprId ?? '미연동'}
        </span>
      ),
    },
    {
      key: 'action',
      header: '',
      className: 'w-24',
      cell: (r) => (
        // 설정은 허브 탭이 아니라 목록에서 바로 — 기수를 고르는 자리에서 곧장 손볼 수 있다.
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/admin/education/${r.cohortId}?tab=settings`)
          }}
          className="border-border text-fg-muted hover:bg-surface-muted inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold"
        >
          <Settings2 className="size-3.5" aria-hidden="true" />
          설정
        </button>
      ),
    },
  ]

  const ongoingNames = rows
    .filter((r) => r.status === 'ongoing')
    .map((r) => `${r.courseTitle} ${r.cohortLabel}`)

  return (
    <CohortDirectory<AdminCohortRow, StatusFilter>
      tabs={[
        { key: 'ongoing', label: '진행 중', count: counts.ongoing },
        { key: 'upcoming', label: '예정', count: counts.upcoming },
        { key: 'ended', label: '종료', count: counts.ended },
      ]}
      status={status}
      onStatusChange={setStatus}
      q={q}
      onQChange={setQ}
      scopeSummary={`전체 ${rows.length}개 (진행 중 ${counts.ongoing} · 예정 ${counts.upcoming} · 종료 ${counts.ended})`}
      cards={[
        {
          label: '진행 중 기수',
          value: counts.ongoing,
          unit: '개',
          hint: ongoingNames.slice(0, 2).join(' · ') || '진행 중인 기수 없음',
          dot: 'bg-info',
        },
        {
          label: '전체 기수',
          value: rows.length,
          unit: '개',
          hint: `예정 ${counts.upcoming} · 종료 ${counts.ended}`,
          dot: 'bg-accent',
        },
        {
          label: '등록 과정',
          value: (courses ?? []).length,
          unit: '개',
          hint: '교육 과정 설정에서 추가·수정',
          dot: 'bg-warning',
        },
      ]}
      columns={columns}
      rows={visible}
      rowKey={(r) => r.cohortId}
      onRowClick={(r) => navigate(`/admin/education/${r.cohortId}`)}
      emptyText="조건에 맞는 기수가 없어요"
      footnote="기수를 클릭하면 자료실·과제·퀴즈·프로젝트·이력서·기록실을 한 곳에서 확인 · [설정]은 목록에서 바로 진입"
      isPending={isPending}
      isError={isError}
      onRetry={refetch}
    />
  )
}
