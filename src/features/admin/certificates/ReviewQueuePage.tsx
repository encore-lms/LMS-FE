import { useMemo } from 'react'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { KpiCard } from '@/components/data/KpiCard'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { CertReviewListItem, CertReviewStatus } from '@/shared/types'
import { useReviewQueue } from '../api/reviews'

const STATUS_META: Record<
  CertReviewStatus,
  { label: string; tone: BadgeTone }
> = {
  requested: { label: '요청됨', tone: 'neutral' },
  reviewing: { label: '검토 중', tone: 'info' },
  changes_requested: { label: '보완 요청', tone: 'warning' },
  certified: { label: '인증 완료', tone: 'success' },
}

type TabKey = 'all' | CertReviewStatus

// 인증 검토 큐 (/admin/certificates/reviews) — Flow 11.
// 정식 인증 요청을 분류·배정·검토하는 운영 진입 화면. (Figma "인증 검토 큐 v2")
export default function ReviewQueuePage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useReviewQueue()
  const [tab, setTab] = useSearchParamState('tab', 'all')
  const [q, setQ] = useSearchParamState('q')
  usePageHeader('인증 검토 큐', '운영 › 인증 검토')

  const filtered = useMemo(() => {
    if (!data) return []
    const needle = q.trim().toLowerCase()
    return data.items.filter((it) => {
      if (tab !== 'all' && it.status !== tab) return false
      if (needle) {
        const hay =
          `${it.student.name} ${it.student.studentNo} ${it.student.cohort}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [data, tab, q])

  if (isPending) {
    return <div className="text-fg-muted p-8">검토 큐를 불러오는 중…</div>
  }
  if (isError) {
    return (
      <Empty
        icon={<AlertTriangle className="h-6 w-6" />}
        title="검토 큐를 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }

  const { total, byStatus, unassigned, riskFlagged, myAssigned, avgHours } =
    data
  const pending =
    byStatus.requested + byStatus.reviewing + byStatus.changes_requested

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'all', label: '전체', count: total },
    { key: 'requested', label: '요청됨', count: byStatus.requested },
    { key: 'reviewing', label: '검토 중', count: byStatus.reviewing },
    {
      key: 'changes_requested',
      label: '보완 요청',
      count: byStatus.changes_requested,
    },
    { key: 'certified', label: '인증 완료', count: byStatus.certified },
  ]

  const columns: Column<CertReviewListItem>[] = [
    {
      key: 'student',
      header: '수강생',
      className: 'w-64',
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.student.name} />
          <div className="flex flex-col">
            <span className="text-fg font-medium">{r.student.name}</span>
            <span className="text-fg-subtle text-xs">
              {r.student.studentNo} · {r.student.cohort}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: '상태',
      cell: (r) => (
        <StatusBadge
          label={STATUS_META[r.status].label}
          tone={STATUS_META[r.status].tone}
        />
      ),
    },
    {
      key: 'requestedAt',
      header: '요청일',
      cell: (r) => <span className="text-fg-muted">{r.requestedAt}</span>,
    },
    {
      key: 'assignee',
      header: '담당자',
      cell: (r) =>
        r.assignee ? (
          <span className="text-fg">{r.assignee}</span>
        ) : (
          <StatusBadge label="미배정" tone="neutral" />
        ),
    },
    {
      key: 'missing',
      header: '결측',
      cell: (r) =>
        r.missingCount > 0 ? (
          <StatusBadge label={`${r.missingCount}건`} tone="warning" />
        ) : (
          <span className="text-fg-subtle">0</span>
        ),
    },
    {
      key: 'risk',
      header: '위험 플래그',
      cell: (r) =>
        r.riskFlags.length ? (
          <div className="flex flex-wrap gap-1">
            {r.riskFlags.map((f) => (
              <StatusBadge key={f} label={f} tone="danger" />
            ))}
          </div>
        ) : (
          <span className="text-fg-subtle">없음</span>
        ),
    },
    {
      key: 'reason',
      header: '최근 사유',
      cell: (r) => (
        <div className="flex items-center justify-between gap-2">
          <span className="text-fg-muted">{r.latestReason}</span>
          <span className="text-brand shrink-0 text-xs font-medium">
            {r.assignee ? '상세 →' : '배정 →'}
          </span>
        </div>
      ),
    },
  ]

  return (
    <div className="p-8">
      <div className="bg-brand text-on-color flex items-center justify-between gap-4 rounded-xl px-6 py-5">
        <div>
          <p className="font-bold">정식 인증 요청을 분류·배정·검토합니다</p>
          <p className="text-on-color/80 mt-1 text-sm">
            위험 플래그 {riskFlagged}건 · 내 담당 {myAssigned}건 · 미배정{' '}
            {unassigned}건
          </p>
        </div>
        <div className="flex shrink-0 gap-6 text-right">
          <div>
            <p className="text-on-color/70 text-xs">처리 대기</p>
            <p className="text-2xl font-bold">{pending}</p>
            <p className="text-on-color/60 text-[11px]">요청+검토+보완</p>
          </div>
          <div>
            <p className="text-on-color/70 text-xs">이번 달 완료</p>
            <p className="text-2xl font-bold">{byStatus.certified}</p>
            <p className="text-on-color/60 text-[11px]">평균 {avgHours}시간</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="요청됨"
          value={byStatus.requested}
          hint={`미배정 ${unassigned}건`}
        />
        <KpiCard
          label="검토 중"
          value={byStatus.reviewing}
          tone="info"
          hint="담당자 진행"
        />
        <KpiCard
          label="보완 요청"
          value={byStatus.changes_requested}
          tone="warning"
          hint="재요청 대기"
        />
        <KpiCard
          label="인증 완료"
          value={byStatus.certified}
          tone="success"
          hint="이번 달 누적"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium',
                tab === t.key
                  ? 'bg-accent-bg text-accent-strong'
                  : 'text-fg-muted hover:bg-surface-muted',
              )}
            >
              {t.label} <span className="text-fg-subtle">{t.count}</span>
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름·UUID·과정 검색"
          aria-label="검토 큐 검색"
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand bg-surface h-9 w-64 rounded-lg border px-3 text-sm outline-none"
        />
      </div>

      <div className="mt-3">
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(`/admin/certificates/reviews/${r.id}`)}
          rowClassName={(r) =>
            r.missingCount >= 2 || r.riskFlags.length >= 2 ? 'bg-danger-bg' : ''
          }
          empty="조건에 맞는 검토 건이 없어요"
        />
      </div>

      <div className="text-fg-subtle mt-3 text-xs">
        총 {total}건 · 요청 {byStatus.requested} · 검토 {byStatus.reviewing} ·
        보완 {byStatus.changes_requested} · 완료 {byStatus.certified}
      </div>

      <div className="border-border bg-info-bg mt-8 rounded-xl border p-5">
        <p className="text-fg text-sm font-bold">큐 운영 원칙 · 완료 기준</p>
        <ul className="text-fg-muted mt-2 flex flex-col gap-1 text-xs">
          <li>
            • 기본 노출: certification_requested · reviewing · changes_requested
            (완료된 건은 별도 탭)
          </li>
          <li>
            • 정렬: 위험 플래그 많은 순 · 결측이 많거나 위험 ≥ 2건은 행 강조
          </li>
          <li>
            • 미배정 행 → 담당자 지정 후 reviewing 전이 · 행 클릭 시 검토 상세
            진입
          </li>
        </ul>
      </div>
    </div>
  )
}
