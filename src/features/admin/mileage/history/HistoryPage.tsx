import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronLeft, Download, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Avatar } from '@/components/ui/Avatar'
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
    '지급·차감 원장 조회 · 기수 선택 전 빈 상태 안내 · 직접 지급/구매 승인 즉시 반영',
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

  if (isPending) {
    return <div className="text-fg-muted p-8">지급 내역을 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="지급 내역을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const { summary, footer } = data

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
      <Link
        to="/admin/mileage"
        className="text-fg-muted hover:text-fg inline-flex items-center gap-1 text-[13px]"
      >
        <ChevronLeft className="h-4 w-4" />
        마일리지 관리
        <span className="text-fg-subtle">› 지급 내역</span>
      </Link>

      {/* 클러스터 탭 + 기수 필터(실 BE) */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <MileageTabs />
        <CohortScopeSelect value={cohortId} onChange={setCohortId} />
      </div>

      {/* KPI 4종 */}
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

      {/* 필터 */}
      <div className="border-border bg-surface mt-5 flex flex-wrap items-center gap-2 rounded-xl border p-3.5">
        <select
          value={txType}
          onChange={(e) => setTxType(e.target.value)}
          aria-label="구분 필터"
          className="border-border text-fg-muted focus:border-brand h-9 rounded-lg border bg-white px-3 text-sm outline-none"
        >
          <option value="all">구분 전체</option>
          {(Object.keys(TX_META) as TxType[]).map((key) => (
            <option key={key} value={key}>
              {TX_META[key].label}
            </option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="수강생 이름·사유 검색"
          aria-label="수강생 이름·사유 검색"
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-9 w-56 rounded-lg border bg-white px-3 text-sm outline-none"
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
        <div className="text-fg-subtle mt-3 text-xs">
          총 {footer.total}건 · 지급 {footer.grant} · 차감 {footer.deduct} ·
          부분 {footer.partial} · 실패 {footer.failed}
        </div>
      </div>

      {/* 원장 정책 */}
      <div className="border-info/30 bg-info-bg/50 mt-6 rounded-xl border p-5">
        <p className="text-info inline-flex items-center gap-1.5 text-base font-bold">
          <Info className="h-4 w-4" />
          원장 정책 · 완료 기준
        </p>
        <ul className="text-info/90 mt-2 flex flex-col gap-1.5 text-[13px] leading-relaxed">
          <li>기수 선택 전에는 빈 상태로 안내 — 잘못된 전체 조회 방지</li>
          <li>지급/차감 필터·수강생 이름 검색·CSV 내보내기 지원</li>
          <li>
            직접 지급·구매 승인 결과가 원장(MileageTransaction)에 즉시
            반영됩니다
          </li>
        </ul>
      </div>
    </div>
  )
}
