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
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { DashboardKpi, PriorityType } from '@/shared/types'
import { useInstructorDashboard } from '../api/console'

const PRIORITY_META: Record<PriorityType, { label: string; tone: BadgeTone }> =
  {
    supplement: { label: '보완', tone: 'danger' },
    manual_grading: { label: '수동 채점', tone: 'warning' },
    project_cert: { label: '프로젝트 인증', tone: 'accent' },
    blog_review: { label: '블로그 검토', tone: 'info' },
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
  const { data, isPending, isError, refetch } = useInstructorDashboard()
  usePageHeader(
    '강사 대시보드',
    '담당 기수의 채점 대기·검토·인증·보완 요청을 한곳에서',
  )

  if (isPending) {
    return <div className="text-fg-muted p-8">대시보드를 불러오는 중…</div>
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

  // 아이콘 박스는 Figma처럼 기능별 틴트 배경 (노랑·파랑·보라)
  const shortcuts = [
    {
      key: 'quizzes',
      icon: <ClipboardList className="h-5 w-5" />,
      iconBg: 'bg-warning-bg text-warning',
      title: '퀴즈 관리',
      badge: data.shortcuts.quizzes.badge,
      hint: data.shortcuts.quizzes.hint,
      to: '/instructor/quizzes',
    },
    {
      key: 'students',
      icon: <Users className="h-5 w-5" />,
      iconBg: 'bg-info-bg text-info',
      title: '수강생 목록',
      badge: 0,
      hint: data.shortcuts.students.hint,
      to: `/instructor/cohorts/${data.cohorts[0]?.id ?? ''}/students`,
    },
    {
      key: 'reviews',
      icon: <Search className="h-5 w-5" />,
      iconBg: 'bg-accent-bg text-accent-strong',
      title: '검토 화면',
      badge: data.shortcuts.reviews.badge,
      hint: data.shortcuts.reviews.hint,
      to: '/instructor/records',
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
          {/* 첫 칩 = 현재 선택 기수 (Figma: 검정 채움) */}
          {data.cohorts.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate('/instructor/cohorts')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                i === 0
                  ? 'bg-brand-deep font-bold text-white'
                  : 'border-border text-fg-muted hover:bg-surface-muted border',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI 4 */}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="채점 대기" kpi={data.kpiGrading} unit="건" />
        <KpiTile label="기록 검토 대기" kpi={data.kpiRecords} unit="건" />
        <KpiTile label="프로젝트 인증 대기" kpi={data.kpiProjects} unit="건" />
        <KpiTile label="보완 요청" kpi={data.kpiSupplements} unit="건" />
      </div>

      {/* 우선 처리 목록 */}
      <div className="border-border bg-surface mt-4 rounded-xl border">
        <div className="border-divider flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-fg text-sm font-bold">우선 처리 목록</p>
            <p className="text-fg-subtle text-xs">
              긴급도 + 마감 임박 순 ·{' '}
              {data.cohorts.map((c) => c.label.split(' · ')[0]).join('·')} 통합
              · 상위 {data.priorities.length}건
            </p>
          </div>
          <span className="border-border text-fg-muted rounded-md border px-2.5 py-1 text-xs">
            정렬: 긴급도
          </span>
        </div>
        {data.priorities.map((p) => {
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
