import { useMemo, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useIntegrations } from './api'
import type {
  Integration,
  IntegrationStatus,
  JobStatus,
  SyncJob,
} from './types'

const STATUS_TONE: Record<IntegrationStatus, BadgeTone> = {
  normal: 'success',
  warning: 'warning',
  error: 'danger',
  inactive: 'neutral',
}

const JOB_META: Record<JobStatus, { label: string; tone: BadgeTone }> = {
  done: { label: '완료', tone: 'success' },
  failed: { label: '실패', tone: 'danger' },
  running: { label: '진행 중', tone: 'info' },
  pending: { label: '대기', tone: 'neutral' },
}

type Filter = 'all' | 'normal' | 'warning' | 'error' | 'manual'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'normal', label: '정상' },
  { key: 'warning', label: '주의' },
  { key: 'error', label: '오류' },
  { key: 'manual', label: '수동 동기화' },
]

// 외부 연동 (/admin/integrations) — 운영(MANAGER/ADMIN) 신규.
// Figma 1546:11613. 노션·GitHub·Google·행정·Slack 연동 상태·SyncJob 관리.
// 새로고침·재연결·수동 동기화 등 실제 처리는 BE 계약(P0_23) 미확정 → 토스트 + TODO.
export default function IntegrationsPage() {
  usePageHeader(
    '외부 연동',
    '노션·GitHub·Google·행정·Slack 연동 상태 · SyncJob · 내부 사용자 전용',
  )
  const { data, isPending, isError, refetch } = useIntegrations()
  const toast = useToast()
  const [filter, setFilter] = useState<Filter>('all')

  const integrations = useMemo(() => data?.integrations ?? [], [data])
  const filtered = useMemo(
    () =>
      integrations.filter((i) => {
        if (filter === 'all') return true
        if (filter === 'manual') return i.actionLabel === '수동 동기화'
        return i.status === filter
      }),
    [integrations, filter],
  )

  if (isPending) {
    return <div className="text-fg-muted p-8">연동 상태를 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="연동 상태를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const { summary, jobs } = data

  const integrationColumns: Column<Integration>[] = [
    {
      key: 'name',
      header: '연동',
      cell: (i) => (
        <span className="text-fg text-[13px] font-bold">{i.name}</span>
      ),
    },
    {
      key: 'purpose',
      header: '용도',
      cell: (i) => (
        <span className="text-fg-muted text-[13px]">{i.purpose}</span>
      ),
    },
    {
      key: 'lastSync',
      header: '최근 동기화',
      className: 'w-32',
      cell: (i) => (
        <span className="text-fg-muted text-[13px] whitespace-nowrap">
          {i.lastSync}
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-28',
      cell: (i) => (
        <StatusBadge label={i.statusLabel} tone={STATUS_TONE[i.status]} />
      ),
    },
    {
      key: 'owner',
      header: '담당',
      className: 'w-24',
      cell: (i) => <span className="text-fg text-[13px]">{i.owner}</span>,
    },
    {
      key: 'action',
      header: '액션',
      className: 'w-28',
      cell: (i) => (
        <button
          type="button"
          // TODO: 연동 액션(수동 동기화·재연결·권한 확인 등, P0_23 BE 계약 확정 후)
          onClick={() =>
            toast.info(`${i.name} ${i.actionLabel}은(는) 준비 중입니다.`)
          }
          className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2.5 py-1 text-[12px] font-semibold"
        >
          {i.actionLabel}
        </button>
      ),
    },
  ]

  const jobColumns: Column<SyncJob>[] = [
    {
      key: 'name',
      header: '작업',
      cell: (j) => (
        <span className="text-fg font-mono text-[13px] font-semibold">
          {j.name}
        </span>
      ),
    },
    {
      key: 'target',
      header: '대상',
      cell: (j) => (
        <span className="text-fg-muted text-[13px]">{j.target}</span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-24',
      cell: (j) => (
        <StatusBadge
          label={JOB_META[j.status].label}
          tone={JOB_META[j.status].tone}
        />
      ),
    },
    {
      key: 'nextRun',
      header: '다음 실행',
      className: 'w-28',
      cell: (j) => (
        <span className="text-fg-muted text-[13px]">{j.nextRun}</span>
      ),
    },
  ]

  return (
    <div className="p-8">
      {/* 필터 칩 + 새로고침 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors',
                filter === f.key
                  ? 'bg-brand text-white'
                  : 'border-border text-fg-muted hover:bg-surface-muted border',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          // 새로고침 — 연동 상태 재조회(refetch). TODO: 실시간 상태·증분 동기화는 BE(P0_23) 확정 후.
          onClick={() => {
            refetch()
            toast.success('연동 상태를 새로고침했습니다.')
          }}
          className="bg-brand hover:bg-brand/90 inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-semibold text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          연동 상태 새로고침
        </button>
      </div>

      {/* KPI 5종 */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="정상 연동"
          value={summary.normal}
          hint={summary.normalHint}
          tone="success"
        />
        <KpiCard
          label="주의"
          value={summary.warning}
          hint={summary.warningHint}
          tone="warning"
        />
        <KpiCard
          label="오류"
          value={summary.error}
          hint={summary.errorHint}
          tone="danger"
        />
        <KpiCard
          label="대기 작업"
          value={summary.pendingJobs}
          hint={summary.pendingHint}
        />
        <KpiCard
          label="실패율"
          value={summary.failureRate}
          hint={summary.failureHint}
        />
      </div>

      {/* 연동 표 */}
      <div className="mt-5">
        <DataTable
          columns={integrationColumns}
          rows={filtered}
          rowKey={(i) => i.id}
          empty="조건에 맞는 연동이 없어요"
        />
      </div>

      {/* 작업 표(좌) + 운영 기준(우) */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <p className="text-fg mb-2 text-sm font-bold">
            동기화 작업 (SyncJob)
          </p>
          <DataTable
            columns={jobColumns}
            rows={jobs}
            rowKey={(j) => j.id}
            empty="작업이 없어요"
          />
        </div>

        <aside className="border-warning/30 bg-warning-bg/50 w-full rounded-xl border p-5 lg:w-[360px] lg:shrink-0">
          <p className="text-warning text-base font-bold">연동 운영 기준</p>
          <ul className="text-warning/90 mt-3 flex flex-col gap-2.5 text-[13px] leading-relaxed">
            <li>토큰·Secret 값은 화면에 노출하지 않음</li>
            <li>재연결은 권한 범위 diff 확인 후 실행</li>
            <li>수동 동기화는 SyncJob 감사 로그에 기록</li>
            <li>오류 3회 이상은 운영 대시보드 위험 KPI에 반영</li>
          </ul>
        </aside>
      </div>
    </div>
  )
}
