import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  FileSpreadsheet,
  Star,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { usePageHeader } from '@/shared/store'
import type {
  AdminKpi,
  AdminQueueItem,
  AdminShortcut,
  Priority,
  SyncStatus,
} from '@/shared/types'
import { useAdminDashboard } from './api/dashboard'

const KPI_ICON = {
  request: Eye,
  reviewing: Clock,
  changes: AlertCircle,
  certified: CheckCircle2,
  mart: Database,
} as const

const SHORTCUT_ICON = {
  review: Eye,
  accounts: Users,
  csv: FileSpreadsheet,
  reputation: Star,
  quarantine: AlertCircle,
} as const

const PRIORITY_TONE: Record<Priority, BadgeTone> = {
  P0: 'danger',
  P1: 'warning',
  P2: 'neutral',
}

const SYNC_META: Record<SyncStatus, { label: string; tone: BadgeTone }> = {
  normal: { label: '정상', tone: 'success' },
  caution: { label: '주의', tone: 'warning' },
  error: { label: '오류', tone: 'danger' },
}

// 운영 대시보드 (/admin) — "통합 보강"(OPERATION CONSOLE).
// 히어로 + KPI 5 + 긴급 검토 우선순위 큐 + 위험 신호/바로가기 + 동기화 상태/결정 로그.
// (Figma 운영 Pages "운영 — 대시보드 통합 보강" 1457:10468)
export default function AdminDashboard() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useAdminDashboard()
  usePageHeader('대시보드', '운영자 종합 화면 · 오늘 처리할 운영 이슈 현황')

  if (isPending) {
    return <div className="text-fg-muted p-8">운영 현황을 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="운영 현황을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const {
    hero,
    kpis,
    queue,
    queueSummary,
    risks,
    shortcuts,
    sync,
    decisionLog,
  } = data

  const columns: Column<AdminQueueItem>[] = [
    {
      key: 'priority',
      header: '우선',
      className: 'w-14',
      cell: (r) => (
        <StatusBadge label={r.priority} tone={PRIORITY_TONE[r.priority]} />
      ),
    },
    {
      key: 'type',
      header: '유형',
      className: 'w-24',
      cell: (r) => (
        <span className="text-fg-muted whitespace-nowrap">{r.type}</span>
      ),
    },
    {
      key: 'target',
      header: '대상',
      cell: (r) => <span className="text-fg font-medium">{r.target}</span>,
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-32',
      cell: (r) => <span className="text-fg-muted">{r.status}</span>,
    },
    {
      key: 'due',
      header: '마감',
      className: 'w-16',
      cell: (r) => <span className="text-fg-subtle text-xs">{r.due}</span>,
    },
    {
      key: 'action',
      header: '액션',
      align: 'right',
      className: 'w-24',
      cell: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            navigate(r.action.to)
          }}
          className="border-border text-fg-muted hover:bg-surface-muted inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium"
        >
          {r.action.label}
          <ArrowRight className="h-3 w-3" />
        </button>
      ),
    },
  ]

  return (
    <div className="p-8">
      {/* 히어로 */}
      <div className="bg-brand rounded-xl px-6 py-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-white/60">
              OPERATION CONSOLE · 운영자 종합 화면
            </p>
            <h2 className="mt-1 text-xl font-bold">
              오늘 처리할 운영 이슈를 한 화면에서 파악합니다
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <HeroPill
                icon={<Check className="h-3 w-3" />}
                text={hero.status.label}
              />
              <HeroPill
                icon={<AlertCircle className="h-3 w-3" />}
                text={`위험 신호 ${hero.riskCount}건`}
              />
              <HeroPill
                icon={<Clock className="h-3 w-3" />}
                text={`마트 갱신 ${hero.martUpdatedAt} · 다음 ${hero.martNextAt}`}
              />
            </div>
          </div>
          <div className="flex shrink-0 gap-6 text-right">
            <div>
              <p className="text-xs text-white/70">오늘 처리 대기</p>
              <p className="text-2xl font-bold">{hero.todayPending.value}</p>
              <p className="text-[11px] text-white/60">
                {hero.todayPending.deltaLabel}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/70">오늘 처리 완료</p>
              <p className="text-2xl font-bold">{hero.todayDone.value}</p>
              <p className="text-[11px] text-white/60">
                {hero.todayDone.avgLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI 5 */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <KpiTile key={k.key} kpi={k} />
        ))}
      </div>

      {/* 긴급 검토 대상 + 위험 신호/바로가기 */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="border-border bg-surface rounded-xl border p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-fg font-bold">긴급 검토 대상</h2>
            <StatusBadge label={`P0 ${queueSummary.p0}`} tone="danger" />
          </div>
          <div className="mt-3">
            <DataTable
              columns={columns}
              rows={queue}
              rowKey={(r) => r.id}
              rowClassName={(r) =>
                r.priority === 'P0' ? 'bg-danger-bg/40' : ''
              }
            />
          </div>
          <div className="text-fg-subtle mt-3 flex items-center justify-between text-xs">
            <span>
              총 {queueSummary.total}건 · P0 {queueSummary.p0} · P1{' '}
              {queueSummary.p1} · P2 {queueSummary.p2}
            </span>
            <button
              type="button"
              onClick={() => navigate('/admin/certificates/reviews')}
              className="text-brand inline-flex items-center gap-1 font-medium"
            >
              인증 검토 큐 전체 보기 <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="border-border bg-surface rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-fg flex items-center gap-1.5 font-bold">
                <AlertTriangle className="text-warning h-4 w-4" />
                위험 신호
              </h2>
              <span className="text-fg-subtle text-xs">{risks.length}건</span>
            </div>
            <ul className="mt-2 flex flex-col">
              {risks.map((r) => (
                <li
                  key={r.title}
                  className="border-divider flex flex-col gap-0.5 border-b py-2.5 last:border-b-0"
                >
                  <span className="text-fg text-sm font-medium">{r.title}</span>
                  <span className="text-fg-subtle text-xs">{r.desc}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-border bg-surface rounded-xl border p-5">
            <h2 className="text-fg font-bold">바로가기</h2>
            <ul className="mt-2 flex flex-col">
              {shortcuts.map((s) => (
                <ShortcutRow
                  key={s.key}
                  shortcut={s}
                  onClick={() => navigate(s.to)}
                />
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* 데이터 동기화 상태 + 우선순위 결정 로그 */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="border-border bg-surface rounded-xl border p-5">
          <h2 className="text-fg font-bold">데이터 동기화 상태</h2>
          <p className="text-fg-subtle mt-0.5 text-xs">
            외부 연동과 내부 큐의 최신성을 확인합니다
          </p>
          <ul className="mt-2 flex flex-col">
            {sync.map((s) => (
              <li
                key={s.name}
                className="border-divider flex items-center justify-between border-b py-3 last:border-b-0"
              >
                <div className="flex flex-col">
                  <span className="text-fg text-sm font-medium">{s.name}</span>
                  <span className="text-fg-subtle text-xs">{s.at}</span>
                </div>
                <StatusBadge
                  label={SYNC_META[s.status].label}
                  tone={SYNC_META[s.status].tone}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="border-border bg-surface rounded-xl border p-5">
          <h2 className="text-fg font-bold">우선순위 결정 로그</h2>
          <p className="text-fg-subtle mt-0.5 text-xs">
            오늘 운영자가 남긴 판단 근거를 노출합니다
          </p>
          <ul className="mt-2 flex flex-col">
            {decisionLog.map((d) => (
              <li
                key={d.at}
                className="border-divider flex gap-3 border-b py-3 last:border-b-0"
              >
                <span className="text-fg-subtle shrink-0 text-xs font-medium">
                  {d.at}
                </span>
                <span className="text-fg-muted text-sm">{d.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function HeroPill({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90">
      {icon}
      {text}
    </span>
  )
}

function KpiTile({ kpi }: { kpi: AdminKpi }) {
  const Icon = KPI_ICON[kpi.icon]
  return (
    <div className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-5">
      <div className="flex items-center justify-between">
        <span className="bg-surface-muted text-fg-muted inline-flex h-9 w-9 items-center justify-center rounded-lg">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="bg-surface-muted text-fg-subtle rounded-full px-2 py-0.5 text-[11px] font-medium">
          {kpi.delta}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-fg text-2xl font-bold">{kpi.value}</span>
        <span className="text-fg-muted text-sm font-medium">{kpi.label}</span>
        <span className="text-fg-subtle text-xs">{kpi.hint}</span>
      </div>
    </div>
  )
}

function ShortcutRow({
  shortcut,
  onClick,
}: {
  shortcut: AdminShortcut
  onClick: () => void
}) {
  const Icon = SHORTCUT_ICON[shortcut.icon]
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="border-divider hover:bg-surface-muted flex w-full items-center gap-3 border-b py-2.5 text-left last:border-b-0"
      >
        <span className="bg-accent-bg text-accent-strong inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-fg text-sm font-medium">{shortcut.title}</span>
          <span className="text-fg-subtle truncate text-xs">
            {shortcut.desc}
          </span>
        </span>
        <ArrowRight className="text-fg-subtle h-4 w-4 shrink-0" />
      </button>
    </li>
  )
}
