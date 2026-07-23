import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Search,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Select } from '@/components/ui/Select'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { DashboardKpi, PriorityType } from '@/shared/types'
import { useInstructorDashboard } from '../api/console'
import { useCohortContext } from '../cohortContext'
import { NoCohortNotice } from './NoCohortNotice'
import { SkeletonDashboard } from '@/components/ui/Skeleton'

const PRIORITY_META: Record<PriorityType, { label: string; tone: BadgeTone }> =
  {
    supplement: { label: '보완', tone: 'danger' },
    manual_grading: { label: '수동 채점', tone: 'warning' },
    project_cert: { label: '프로젝트 인증', tone: 'accent' },
    ts_review: { label: '트러블슈팅 검토', tone: 'info' },
  }

function KpiTile({
  label,
  kpi,
  unit,
}: {
  label: string
  kpi: DashboardKpi
  unit: string
}) {
  return (
    <div className="border-border bg-surface rounded-xl border p-4.5">
      <div className="flex items-center justify-between">
        <span className="text-fg-muted text-sm font-medium">{label}</span>
        {kpi.badge && (
          <StatusBadge
            label={kpi.badge}
            tone={kpi.badge === '긴급' ? 'danger' : 'warning'}
          />
        )}
      </div>
      <p className="text-fg mt-2 text-3xl font-bold">
        {kpi.value}{' '}
        <span className="text-fg-subtle text-base font-medium">{unit}</span>
      </p>
      <p className="text-fg-subtle mt-1.5 text-xs">{kpi.hint}</p>
    </div>
  )
}

// 강사 대시보드 (/instructor) — §1/P0 36. (Figma 1268:7456)
// 담당 과정/기수 selector + KPI 4 + 우선 처리 목록 6 + 바로가기 3. 기록실 승인 액션 없음(검토 화면에서).
export default function DashboardPage() {
  const navigate = useNavigate()
  // 선택 기수 컨텍스트 — 칩으로 전환(§2). null이면 첫 담당 기수(기본).
  // 선택 기수 — 공용 컨텍스트(화면 이동에도 유지). 검토 화면과 공유.
  const { cohortId, setCohortId } = useCohortContext()
  const [sort, setSort] = useState<'urgent' | 'dday'>('urgent')
  const { data, isPending, isError, refetch } = useInstructorDashboard(cohortId)
  usePageHeader(
    '강사 대시보드',
    '담당 기수의 채점 대기·검토·인증·보완 요청을 한곳에서',
  )

  if (isPending) {
    return <SkeletonDashboard kpis={4} panels={4} />
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="대시보드를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  // 담당 기수 0 — 대시보드 대신 안내 표시 (Figma 2750:1974)
  if (data.cohortCount === 0) {
    return <NoCohortNotice />
  }

  // 선택 기수 — KPI·우선처리목록·바로가기 모두 이 기수 기준. 'all'=전체(통합), 기본 전체.
  const COHORT_ALL = 'all'
  const cohortTabs = [{ id: COHORT_ALL, label: '전체' }, ...data.cohorts]
  const activeCohortId = cohortId
  const activeCohortLabel =
    cohortTabs.find((c) => c.id === activeCohortId)?.label.split(' · ')[0] ?? ''

  // 우선 처리 목록 정렬 — 긴급도순(긴급 먼저 + 지연 큰 순) / 마감일순(D-day 작은 순).
  const ddayNum = (d: string) => parseInt(d.replace(/[^0-9+-]/g, ''), 10) || 0
  const sortedPriorities = [...data.priorities].sort((a, b) => {
    if (sort === 'urgent') {
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1
      return ddayNum(b.dday) - ddayNum(a.dday)
    }
    return ddayNum(a.dday) - ddayNum(b.dday)
  })

  // 아이콘 박스는 Figma처럼 기능별 틴트 배경 (노랑·파랑·보라)
  const shortcuts = [
    {
      key: 'quizzes',
      icon: <ClipboardList className="h-5 w-5" />,
      iconBg: 'bg-warning-bg text-warning',
      title: '퀴즈 관리',
      badge: data.shortcuts.quizzes.badge,
      hint: data.shortcuts.quizzes.hint,
      // 퀴즈·과제는 교육 과정 허브(기수별) 안으로 이관 — 기수 선택 시 해당 허브 퀴즈 탭, 전체면 과정 목록.
      to:
        activeCohortId !== COHORT_ALL
          ? `/instructor/cohorts/${activeCohortId}/education?tab=quizzes`
          : '/instructor/cohorts',
    },
    {
      key: 'students',
      icon: <Users className="h-5 w-5" />,
      iconBg: 'bg-info-bg text-info',
      title: '수강생 목록',
      badge: 0,
      hint: data.shortcuts.students.hint,
      // 수강생 목록은 공용 선택 기수(컨텍스트)로 필터되므로 라우트 기수는 고정.
      to: '/instructor/cohorts/all/students',
    },
    {
      key: 'reviews',
      icon: <Search className="h-5 w-5" />,
      iconBg: 'bg-accent-bg text-accent-strong',
      title: '검토 화면',
      badge: data.shortcuts.reviews.badge,
      hint: data.shortcuts.reviews.hint,
      to: '/instructor/projects/review',
    },
  ]

  return (
    <div className="p-8">
      {/* 담당 과정/기수 selector */}
      <div className="border-border bg-surface flex flex-wrap items-center gap-3 rounded-xl border px-5 py-3.5">
        <div>
          <p className="text-fg-subtle text-xs">담당 과정/기수</p>
          <p className="text-fg text-sm font-bold">
            {data.instructorName} 강사 · 담당 {data.cohortCount}개
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          {/* 담당 기수 셀렉터 — 전체(통합) + 기수별. 선택 기수 = 검정 채움. */}
          {cohortTabs.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCohortId(c.id)}
              aria-pressed={c.id === activeCohortId}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                c.id === activeCohortId
                  ? 'bg-accent-bg text-accent-strong font-bold'
                  : 'border-border text-fg-muted hover:bg-surface-muted border',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI 3 — 기록 검토는 운영 매니저 소관이라 강사 대시보드에서 제외 */}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <KpiTile label="채점 대기" kpi={data.kpiGrading} unit="건" />
        <KpiTile label="프로젝트 인증 대기" kpi={data.kpiProjects} unit="건" />
        <KpiTile label="보완 요청" kpi={data.kpiSupplements} unit="건" />
      </div>

      {/* 우선 처리 목록 */}
      <div className="border-border bg-surface mt-4 rounded-xl border">
        <div className="border-divider flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-fg text-sm font-bold">우선 처리 목록</p>
            <p className="text-fg-subtle text-xs">
              {activeCohortLabel} · 상위 {data.priorities.length}건
            </p>
          </div>
          <Select
            value={sort}
            onChange={(v) => setSort(v as 'urgent' | 'dday')}
            aria-label="우선 처리 목록 정렬"
            options={[
              { value: 'urgent', label: '정렬: 긴급도' },
              { value: 'dday', label: '정렬: 마감일' },
            ]}
          />
        </div>
        {sortedPriorities.map((p) => {
          const meta = PRIORITY_META[p.type]
          return (
            <div
              key={p.id}
              className="border-divider flex items-center gap-4 border-t px-5 py-3.5 first:border-t-0"
            >
              <StatusBadge label={meta.label} tone={meta.tone} />
              <div className="min-w-0 flex-1">
                <p className="text-fg truncate text-sm font-medium">
                  {p.title}
                </p>
                <p className="text-fg-subtle text-xs">{p.subtitle}</p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-md px-2 py-1 text-xs font-bold',
                  p.urgent
                    ? 'bg-danger-bg text-danger'
                    : 'bg-surface-muted text-fg-muted',
                )}
              >
                {p.dday}
              </span>
              {/* 액션 버튼은 긴급 여부와 무관하게 흰 outline — 긴급 강조는 D+N 칩이 담당 (Figma 실측) */}
              <button
                type="button"
                onClick={() => navigate(p.to)}
                className={cn(
                  'border-border text-fg hover:bg-surface-muted shrink-0 rounded-lg border bg-white px-3.5 py-2 text-xs',
                  p.urgent ? 'font-bold' : 'text-fg-muted font-medium',
                )}
              >
                {p.actionLabel}
              </button>
            </div>
          )
        })}
      </div>

      {/* 바로가기 3 */}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {shortcuts.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => navigate(s.to)}
            className="border-border bg-surface hover:bg-surface-muted flex items-center gap-4 rounded-xl border px-4.5 py-5 text-left"
          >
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                s.iconBg,
              )}
            >
              {s.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="text-fg text-sm font-bold">{s.title}</span>
                {s.badge > 0 && (
                  <span className="bg-danger-bg text-danger rounded px-1.5 py-px text-[10px] font-bold">
                    {s.badge}
                  </span>
                )}
              </span>
              <span className="text-fg-subtle mt-0.5 block truncate text-xs">
                {s.hint}
              </span>
            </span>
            <ArrowRight className="text-fg-subtle h-4 w-4 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}
