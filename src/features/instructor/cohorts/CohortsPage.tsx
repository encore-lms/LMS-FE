import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, Search } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type {
  CohortStatus,
  InstructorCohortRow,
  InstructorRole,
} from '@/shared/types'
import { useInstructorCohorts } from '../api/console'
import { SkeletonListPage } from '@/components/ui/Skeleton'

const ROLE_META: Record<InstructorRole, { label: string; tone: BadgeTone }> = {
  lead: { label: '강사', tone: 'accent' },
  assist: { label: '보조 강사', tone: 'info' },
  mentor: { label: '멘토', tone: 'warning' },
}

// 담당 과정/기수 (/instructor/cohorts) — §2/P0 36. (Figma 1324:9636)
// 기수 컨텍스트는 퀴즈·수강생·검토 화면에 유지됨(액션 4종으로 진입).
export default function CohortsPage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useInstructorCohorts()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<CohortStatus>('operating')
  usePageHeader('담당 과정/기수', '담당하는 과정과 기수를 확인합니다')

  const filtered = useMemo(() => {
    const items = data?.rows ?? []
    const needle = q.trim().toLowerCase()
    const list = items.filter((r) => {
      if (r.status !== status) return false
      if (needle) {
        const hay = `${r.name} ${r.subtitle}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
    // 이름 가나다순 고정(운영 요구)
    return [...list].sort((a, b) =>
      (a.name ?? '').localeCompare(b.name ?? '', 'ko'),
    )
  }, [data, q, status])

  const statusTabs: { key: CohortStatus; label: string; count: number }[] = data
    ? [
        { key: 'operating', label: '진행 중', count: data.operating },
        { key: 'upcoming', label: '예정', count: data.upcoming },
        { key: 'ended', label: '종료', count: data.ended },
      ]
    : []

  // 우상단 컬러 dot + 컬러 hint — Figma 카드 4종 색 구분(파랑·보라·주황·파랑).
  const summaryCards = data
    ? [
        {
          label: '진행 중 과정',
          unit: '개',
          dot: 'bg-info',
          hintColor: 'text-info',
          ...data.summary.operatingCourses,
        },
        {
          label: '담당 수강생',
          unit: '명',
          dot: 'bg-accent',
          hintColor: 'text-info',
          ...data.summary.students,
        },
        {
          label: '채점 대기',
          unit: '건',
          dot: 'bg-warning',
          hintColor: 'text-info',
          ...data.summary.gradingPending,
        },
        {
          label: '검토 대기',
          unit: '건',
          dot: 'bg-info',
          hintColor: 'text-info',
          ...data.summary.reviewPending,
        },
      ]
    : []

  const columns: Column<InstructorCohortRow>[] = [
    {
      key: 'cohort',
      header: '과정/기수',
      cell: (r) => (
        <div>
          <p className="text-fg text-sm font-medium">{r.name}</p>
          <p className="text-fg-subtle text-xs">{r.subtitle}</p>
        </div>
      ),
    },
    {
      key: 'period',
      header: '운영 기간',
      // 날짜 범위(2026.03.02 ~ 2026.08.28)가 한 줄에 들어갈 폭.
      className: 'w-48',
      cell: (r) => (
        <div>
          <p className="text-fg-muted text-sm whitespace-nowrap">{r.period}</p>
          <p className="text-accent-strong text-xs font-bold">{r.dday}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: '담당 역할',
      className: 'w-28',
      cell: (r) => (
        <StatusBadge
          label={ROLE_META[r.role].label}
          tone={ROLE_META[r.role].tone}
        />
      ),
    },
    {
      key: 'students',
      header: '수강생',
      // "24명 + 위험 N" 칩이 한 줄에 나란히 놓이는 폭.
      className: 'w-32',
      cell: (r) => (
        <div className="flex items-center gap-1.5">
          <span className="text-fg shrink-0 text-sm font-medium whitespace-nowrap">
            {r.students}명
          </span>
          {r.riskCount > 0 && (
            <span className="bg-danger-bg text-danger shrink-0 rounded px-1.5 py-px text-[10px] font-bold whitespace-nowrap">
              위험 {r.riskCount}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'eval',
      header: '평가',
      className: 'w-40',
      cell: (r) => (
        <div>
          <p className="text-fg-subtle text-xs">{r.evalSummary}</p>
          <p className="text-warning text-sm font-medium">{r.evalPending}</p>
        </div>
      ),
    },
    {
      key: 'review',
      header: '검토',
      className: 'w-44',
      cell: (r) => (
        <div>
          <p className="text-fg-subtle text-xs">{r.reviewSummary}</p>
          <p className="text-info text-sm font-medium">{r.reviewPending}</p>
        </div>
      ),
    },
  ]

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      skeleton={<SkeletonListPage columns={5} className="" />}
      errorTitle="담당 과정을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && (
        <div className="p-8">
          {/* 필터 바 */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="border-border focus-within:border-brand flex h-9 w-80 items-center gap-2 rounded-lg border bg-white px-3">
              <Search className="text-fg-subtle h-4 w-4" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="과정명·기수명·회차로 검색"
                aria-label="과정 검색"
                className="text-fg placeholder:text-fg-subtle w-full bg-transparent text-sm outline-none focus-visible:shadow-none"
              />
            </div>
            {/* 활성 탭은 brand 채움 (Figma 1324:9636) */}
            {statusTabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setStatus(t.key)}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-sm font-medium',
                  status === t.key
                    ? 'bg-brand font-bold text-white'
                    : 'border-border text-fg-muted hover:bg-surface-muted border',
                )}
              >
                {t.label} ({t.count})
              </button>
            ))}
            <span className="text-fg-subtle ml-auto text-xs">
              담당 {data.total}개 (진행 중 {data.operating} · 예정{' '}
              {data.upcoming} · 종료 {data.ended})
            </span>
          </div>

          {/* 요약 카드 4 */}
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="border-border bg-surface rounded-xl border p-4.5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-fg-muted text-sm font-medium">
                    {card.label}
                  </p>
                  <span className={cn('h-2 w-2 rounded-full', card.dot)} />
                </div>
                <p className="text-fg mt-2 text-3xl font-bold">
                  {card.value}{' '}
                  <span className="text-fg-subtle text-base font-medium">
                    {card.unit}
                  </span>
                </p>
                <p className={cn('mt-1.5 text-xs', card.hintColor)}>
                  {card.hint}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(r) => r.id}
              onRowClick={(r) =>
                navigate(`/instructor/cohorts/${r.id}/education`)
              }
              empty="조건에 맞는 과정이 없어요"
            />
          </div>
          <p className="text-fg-subtle mt-3 flex items-center gap-1.5 text-xs">
            <Info className="h-3 w-3" />
            종료 과정 {data.ended}개는 [종료] 탭에서 조회 · 과정을 클릭하면
            자료실·과제·퀴즈·프로젝트·이력서·기록실·설정을 한 곳에서 확인
          </p>
        </div>
      )}
    </DataBoundary>
  )
}
