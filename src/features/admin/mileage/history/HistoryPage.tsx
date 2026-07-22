import { useMemo } from 'react'

import { Download } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Avatar } from '@/components/ui/Avatar'
import { Select } from '@/components/ui/Select'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { usePageHeader } from '@/shared/store'
import { MileageTabs } from '../MileageTabs'
import { CohortScopeSelect } from '../CohortScope'
import { useMileageHistory } from './api'
import type { AmountSign, MileageTxRow, TxType } from './types'
import { SkeletonListPage } from '@/components/ui/Skeleton'

const TX_META: Record<TxType, { label: string; tone: BadgeTone }> = {
  grant: { label: '지급', tone: 'success' },
  deduct: { label: '차감', tone: 'neutral' },
  partial: { label: '부분', tone: 'warning' },
  failed: { label: '실패', tone: 'danger' },
}

const AMOUNT_COLOR: Record<AmountSign, string> = {
  plus: 'text-success',
  minus: 'text-danger',
  zero: 'text-fg-subtle',
}

// 마일리지 지급 내역 (/admin/mileage/history) — 운영(MANAGER/ADMIN) 신규.
// Figma 1197:6378. 지급·차감 원장(MileageTransaction) 조회. 마일리지 클러스터 sub-page.
// 조회 전용 — CSV 내보내기·상세는 별도 시안 미설계 → 토스트 + TODO(P0_16).
export default function HistoryPage() {
  usePageHeader(
    '마일리지 지급 내역',
    '기수별 마일리지 지급·차감 내역을 확인합니다',
  )
  const [cohortId, setCohortId] = useSearchParamState('cohortId')
  const { data, isPending, isError, refetch } = useMileageHistory(cohortId)
  const toast = useToast()
  const [txType, setTxType] = useSearchParamState('txType', 'all')
  const [q, setQ] = useSearchParamState('q')

  const rows = useMemo(() => data?.rows ?? [], [data])
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (txType !== 'all' && r.txType !== txType) return false
      if (needle) {
        const hay = `${r.studentName} ${r.reason}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [rows, txType, q])

  const summary = data?.summary
  const footer = data?.footer

  const columns: Column<MileageTxRow>[] = [
    {
      key: 'date',
      header: '날짜',
      className: 'w-28',
      cell: (r) => (
        <span className="text-fg text-[13px] whitespace-nowrap">{r.date}</span>
      ),
    },
    {
      key: 'student',
      header: '수강생',
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Avatar name={r.studentName} size={24} />
          <span className="text-fg text-[13px] font-medium">
            {r.studentName}
          </span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: '사유',
      cell: (r) => <span className="text-fg text-[13px]">{r.reason}</span>,
    },
    {
      key: 'amount',
      header: '수량',
      className: 'w-32',
      cell: (r) => (
        <span
          className={cn(
            'text-[13px] font-semibold whitespace-nowrap tabular-nums',
            AMOUNT_COLOR[r.amountSign],
          )}
        >
          {r.amount} <span className="text-fg-subtle font-normal">M</span>
        </span>
      ),
    },
    {
      key: 'type',
      header: '구분',
      className: 'w-16',
      cell: (r) => (
        <StatusBadge
          label={TX_META[r.txType].label}
          tone={TX_META[r.txType].tone}
        />
      ),
    },
    {
      key: 'balance',
      header: '잔액',
      className: 'w-24',
      cell: (r) => (
        <span className="text-fg-muted text-[13px] tabular-nums">
          {r.balance} M
        </span>
      ),
    },
    {
      key: 'handler',
      header: '처리자',
      className: 'w-36',
      cell: (r) => (
        <div className="min-w-0">
          <p className="text-fg text-[13px]">{r.handler}</p>
          <p className="text-fg-subtle text-[11px]">{r.handlerNote}</p>
        </div>
      ),
    },
    {
      key: 'action',
      header: '',
      className: 'w-16',
      cell: (r) => (
        <button
          type="button"
          // TODO: 거래 상세(P0_16 BE 계약 확정 후)
          onClick={() =>
            toast.info(`${r.studentName} 거래 상세는 준비 중입니다.`)
          }
          className="text-brand text-[13px] font-semibold hover:underline"
        >
          상세
        </button>
      ),
    },
  ]

  return (
    <div className="p-8">
      {/* 브레드크럼 */}
      {/* 클러스터 탭 + 기수 필터(실 BE) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MileageTabs />
        <CohortScopeSelect value={cohortId} onChange={setCohortId} />
      </div>

      <DataBoundary
        isPending={isPending}
        isError={isError || !data}
        onRetry={() => refetch()}
        skeleton={<SkeletonListPage kpis={4} columns={6} className="" />}
        errorTitle="지급 내역을 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {/* KPI 4종 */}
        {summary && (
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label="총 지급"
              value={`${summary.granted} M`}
              hint={summary.grantedHint}
              tone="success"
            />
            <KpiCard
              label="총 차감"
              value={`${summary.deducted} M`}
              hint={summary.deductedHint}
              tone="danger"
            />
            <KpiCard
              label="순증감"
              value={`${summary.net} M`}
              hint={summary.netHint}
              tone="info"
            />
            <KpiCard
              label="내역 건수"
              value={`${summary.count}건`}
              hint={summary.countHint}
            />
          </div>
        )}

        {/* 필터 */}
        <div className="border-border bg-surface mt-5 flex flex-wrap items-center gap-2 rounded-xl border p-3.5">
          <Select
            value={txType}
            onChange={(v) => setTxType(v)}
            aria-label="구분 필터"
            options={[
              { value: 'all', label: '구분 전체' },
              ...(Object.keys(TX_META) as TxType[]).map((key) => ({
                value: key,
                label: TX_META[key].label,
              })),
            ]}
            className="h-9"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="수강생 이름·사유 검색"
            aria-label="수강생 이름·사유 검색"
            className="border-border text-fg placeholder:text-fg-subtle focus:border-brand bg-surface h-9 w-56 rounded-lg border px-3 text-sm outline-none focus-visible:shadow-none"
          />
          <button
            type="button"
            // TODO: 원장 CSV 내보내기(P0_16)
            onClick={() => toast.info('CSV 내보내기는 준비 중입니다.')}
            className="border-border text-fg-muted hover:bg-surface-muted ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg border px-3.5 text-[13px] font-semibold"
          >
            <Download className="h-4 w-4" />
            CSV 내보내기
          </button>
        </div>

        {/* 원장 표 */}
        <div className="mt-4">
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(r) => r.id}
            empty="조건에 맞는 거래가 없어요"
          />
          {footer && (
            <div className="text-fg-subtle mt-3 text-xs">
              총 {footer.total}건 · 지급 {footer.grant} · 차감 {footer.deduct} ·
              부분 {footer.partial} · 실패 {footer.failed}
            </div>
          )}
        </div>
      </DataBoundary>
    </div>
  )
}
