import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { KpiCard } from '@/components/data/KpiCard'
import { cn } from '@/shared/lib/cn'
import type { DashboardListItem, OverallStatus } from '@/shared/types'
import { useAdminDashboard } from './api/dashboard'

const STATUS_BADGE: Record<
  OverallStatus,
  { label: string; className: string }
> = {
  normal: { label: '정상', className: 'bg-success-bg text-success' },
  caution: { label: '주의', className: 'bg-warning-bg text-warning' },
  danger: { label: '위험', className: 'bg-danger-bg text-danger' },
}

// 긴급 검토 대상·위험 플래그 많은 대상 — 동일 구조의 리스트 섹션.
function ListSection({
  title,
  to,
  items,
}: {
  title: string
  to: string
  items: DashboardListItem[]
}) {
  return (
    <section className="border-border bg-surface rounded-xl border p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-fg font-bold">{title}</h2>
        <Link to={to} className="text-fg-muted text-sm font-medium">
          전체 →
        </Link>
      </div>
      <ul className="mt-2 flex flex-col">
        {items.map((it) => (
          <li
            key={it.id}
            className="border-divider flex items-center justify-between gap-3 border-b py-3 last:border-b-0"
          >
            <div className="flex items-start gap-2">
              <span className="bg-brand mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
              <div className="flex flex-col">
                <span className="text-fg text-sm font-medium">
                  {it.cohort} — {it.name}
                </span>
                <span className="text-fg-subtle text-xs">{it.detail}</span>
              </div>
            </div>
            {it.isNew && (
              <span className="bg-accent-bg text-accent-strong shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
                NEW
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

// 운영 대시보드 (/admin) — Figma "운영 대시보드 v2" 정합.
// 전체 상태 배지 + KPI 5칸 + 긴급 검토/위험 플래그 리스트 + 빠른 진입.
export default function AdminDashboard() {
  const { data, isPending, isError, refetch } = useAdminDashboard()

  if (isPending) {
    return <div className="text-fg-muted p-8">운영 현황을 불러오는 중…</div>
  }
  if (isError) {
    return (
      <Empty
        icon={<AlertTriangle className="h-6 w-6" />}
        title="운영 현황을 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }

  const { status, kpis, urgentReviews, riskFlags, quickEntry, martUpdatedAt } =
    data
  const badge = STATUS_BADGE[status.level]

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-fg text-2xl font-bold">운영 대시보드</h1>
          <p className="text-fg-muted mt-1 text-sm">
            오늘 처리할 인증 요청·보완·마트 오류를 한눈에 확인합니다
          </p>
        </div>
        <span className="text-fg-subtle shrink-0 text-xs">
          마지막 마트 갱신 {martUpdatedAt.slice(0, 16).replace('T', ' ')}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-fg-muted text-sm">전체 운영 상태</span>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            badge.className,
          )}
        >
          {badge.label} — {status.message}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="인증 요청"
          value={kpis.certificationRequests.value}
          tone="brand"
          hint={`신규 ${kpis.certificationRequests.newCount} · 누적 ${kpis.certificationRequests.total}`}
        />
        <KpiCard
          label="검토 중"
          value={kpis.reviewing.value}
          tone="warning"
          hint={`평균 ${kpis.reviewing.avgDays}일 소요`}
        />
        <KpiCard
          label="보완 요청"
          value={kpis.changesRequested.value}
          tone="accent"
          hint={`학생 답변 대기 ${kpis.changesRequested.awaitingStudent}`}
        />
        <KpiCard
          label="인증 완료"
          value={kpis.certified.value}
          tone="success"
          hint={`이번 달 +${kpis.certified.monthDelta}`}
        />
        <KpiCard
          label="마트 오류"
          value={kpis.martErrors.value}
          tone="danger"
          hint="재계산 필요"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ListSection
          title="긴급 검토 대상"
          to="/admin/certification-review"
          items={urgentReviews}
        />
        <ListSection
          title="위험 플래그 많은 대상"
          to="/admin/students"
          items={riskFlags}
        />
      </div>

      <h2 className="text-fg mt-8 font-bold">빠른 진입</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickEntry.map((q) => (
          <Link
            key={q.key}
            to={q.to}
            className="border-border bg-surface hover:border-brand flex flex-col gap-1 rounded-xl border p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-fg font-bold">{q.title}</span>
              <span className="text-fg-subtle text-xs">{q.meta}</span>
            </div>
            <span className="text-brand text-sm font-medium">{q.cta} →</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
