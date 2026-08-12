import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { KpiCard } from '@/components/data/KpiCard'
import { DataTable, type Column } from '@/components/data/DataTable'
import { cn } from '@/shared/lib/cn'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { usePageHeader } from '@/shared/store'
import { useAdminMentoringLogs } from './api'
import { LOG_STATUS_META, logDisplayStatus } from './statusMeta'
import { LogReviewModal } from './LogReviewModal'
import type { AdminMentoringLogRow } from './types'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { SearchInput } from '@/components/ui/SearchInput'

// 멘토링 일지 관리 (/admin/mentoring/logs) — 운영(MANAGER/ADMIN) 승인·수정 요청 전용.
// 검토 모달에서 매니저 승인(POST .../approve)·수정 요청(.../change-requests) 가능,
// 직접 수정·폐기·반려는 없음(반려 KPI·버튼은 시안 단계라 제외).
// 상태 = 초안/승인 대기/유효/수정 요청/재제출 후 유효.
// embedded=true 면 기수 허브의 '멘토링' 탭에 임베드(자체 헤더·바깥 패딩 생략).
export default function LogsPage({
  embedded = false,
  scopeCohortId,
}: {
  embedded?: boolean
  scopeCohortId?: string
} = {}) {
  usePageHeader(
    '멘토링 일지 관리',
    '운영자 조회·수정 요청 · 직접 수정 불가 · 최종 유효본 기준 인정 시간 계산',
    !embedded,
  )
  const { data, isPending, isError, refetch } =
    useAdminMentoringLogs(scopeCohortId)
  const [status, setStatus] = useSearchParamState('status', 'all')
  const [q, setQ] = useSearchParamState('q')
  const [reviewId, setReviewId] = useState<string | null>(null)

  const rows = useMemo(() => data?.rows ?? [], [data])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (status !== 'all' && r.status !== status) return false
      if (needle) {
        const hay = `${r.teamName} ${r.mentorName}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [rows, status, q])

  const columns: Column<AdminMentoringLogRow>[] = [
    {
      key: 'team',
      header: '팀명',
      cell: (r) => (
        <span className="text-fg text-xs font-bold">{r.teamName}</span>
      ),
    },
    {
      key: 'mentor',
      header: '멘토',
      className: 'w-28',
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Avatar name={r.mentorName} size={26} />
          <span className="text-fg text-xs font-bold">{r.mentorName}</span>
        </div>
      ),
    },
    {
      key: 'performedAt',
      header: '진행 일시',
      className: 'w-28',
      cell: (r) => (
        <span className="text-fg-muted text-xs font-medium whitespace-nowrap">
          {r.performedAtLabel}
        </span>
      ),
    },
    {
      key: 'actual',
      header: '실제',
      className: 'w-20',
      cell: (r) => (
        <span className="text-fg text-xs font-bold">{r.actualMinutes}분</span>
      ),
    },
    {
      key: 'recognized',
      header: '인정',
      className: 'w-14',
      cell: (r) =>
        r.recognizedHours !== null ? (
          <span className="text-brand text-xs font-bold">
            {r.recognizedHours}h
          </span>
        ) : (
          <span className="text-fg-subtle">-</span>
        ),
    },
    {
      key: 'excess',
      header: '초과',
      className: 'w-12',
      cell: (r) =>
        r.excessHours > 0 ? (
          <span className="text-warning text-xs font-bold">
            {r.excessHours}h
          </span>
        ) : (
          <span className="text-fg-subtle">-</span>
        ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-28',
      cell: (r) => {
        const meta = LOG_STATUS_META[logDisplayStatus(r)]
        return <StatusBadge label={meta.label} tone={meta.tone} />
      },
    },
  ]

  return (
    <div className={embedded ? '' : 'p-8'}>
      {/* 돌아가기 — 멘토 배정 관리로. 허브 탭에선 위에 sub-nav 가 있어 필요 없고,
          누르면 허브 밖으로 나가 버린다. */}
      {!embedded && (
        <Link
          to="/admin/mentors/assignments"
          className="text-fg-muted hover:text-fg mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          멘토 배정 관리로 돌아가기
        </Link>
      )}

      <DataBoundary
        isPending={isPending}
        isError={isError || !data}
        onRetry={() => refetch()}
        skeleton={<SkeletonListPage kpis={4} columns={6} className="" />}
        errorTitle="일지 목록을 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {data && (
          <>
            {/* KPI 4 — 반려 없음(05-31) — 유효·수정 요청·초안·재제출 후 유효 */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="유효"
                value={data.kpis.valid}
                tone="success"
                hint="이번 달 인정 시간 산입"
              />
              <KpiCard
                label="수정 요청"
                value={data.kpis.changeRequested}
                tone="info"
                hint="재제출 대기"
              />
              <KpiCard
                label="초안"
                value={data.kpis.draft}
                hint="작성 중 · 인정 시간 미반영"
              />
              <KpiCard
                label="재제출 후 유효"
                value={data.kpis.resubmitted}
                tone="accent"
                hint="이번 달 재제출 처리"
              />
            </div>

            {/* 필터 바 */}
            <div className="border-border bg-surface mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={status}
                  onChange={(v) => setStatus(v)}
                  aria-label="상태 필터"
                  options={[
                    { value: 'all', label: '상태 전체' },
                    { value: 'submitted', label: '승인 대기' },
                    { value: 'valid', label: '유효' },
                    { value: 'change_requested', label: '수정 요청' },
                    { value: 'draft', label: '초안' },
                  ]}
                  className="h-9"
                />
              </div>
              <SearchInput
                value={q}
                onChange={setQ}
                placeholder="팀·멘토 검색"
                ariaLabel="팀·멘토 검색"
              />
            </div>

            {/* 일지 테이블 — 행 클릭 시 검토 모달(상세·승인·수정요청) */}
            <div className="mt-4">
              <DataTable
                columns={columns}
                rows={filtered}
                rowKey={(r) => r.logId}
                onRowClick={(r) => setReviewId(r.logId)}
                rowClassName={(r) =>
                  cn(
                    'cursor-pointer',
                    r.logId === reviewId &&
                      'border-l-brand border-l-4 bg-brand/10',
                  )
                }
                empty="조건에 맞는 일지가 없어요"
              />
              <div className="text-fg-subtle mt-3 text-xs">
                총 {rows.length} · 유효 {data.kpis.valid} · 수정 요청{' '}
                {data.kpis.changeRequested} · 초안 {data.kpis.draft} · 재제출{' '}
                {data.kpis.resubmitted}
              </div>
            </div>

            {reviewId && (
              <LogReviewModal
                open
                onClose={() => setReviewId(null)}
                logId={reviewId}
              />
            )}
          </>
        )}
      </DataBoundary>
    </div>
  )
}
