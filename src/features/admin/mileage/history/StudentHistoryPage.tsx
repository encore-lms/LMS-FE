import { ChevronLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useStudentMileageHistory } from './api'
import { AMOUNT_COLOR, TX_META } from './meta'
import type { MileageTxRow } from './types'

/**
 * 수강생 마일리지 이력 — 원장 '상세'에서 들어온다.
 *
 * <p>거래 한 건만 띄우면 잔액이 왜 그렇게 됐는지 앞뒤가 보이지 않는다. 한 사람의 흐름을
 * 시간순으로 놓고 본다(2026-08-05 결정).</p>
 */
export default function StudentHistoryPage() {
  const { studentUserId = '' } = useParams()
  const { data, isPending, isError, refetch } =
    useStudentMileageHistory(studentUserId)
  usePageHeader(
    '수강생 마일리지 이력',
    '지급·차감 흐름과 남은 잔액을 시간순으로 확인합니다',
  )

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
          {r.amount}
        </span>
      ),
    },
    {
      key: 'type',
      header: '구분',
      className: 'w-24',
      // 구매는 요청 즉시 차감이라 승인 전에도 남는다 — 확정 차감과 구분한다.
      cell: (r) =>
        r.pending ? (
          <StatusBadge label="승인 검토" tone="warning" />
        ) : (
          <StatusBadge
            label={TX_META[r.txType].label}
            tone={TX_META[r.txType].tone}
          />
        ),
    },
    {
      key: 'balance',
      header: '잔액',
      className: 'w-28',
      cell: (r) => (
        <span className="text-fg-muted text-[13px] tabular-nums">
          {r.balance}
        </span>
      ),
    },
    {
      key: 'handler',
      header: '처리자',
      className: 'w-32',
      cell: (r) => (
        <div>
          <p className="text-fg text-[13px]">{r.handler}</p>
          <p className="text-fg-subtle text-[11px]">{r.handlerNote}</p>
        </div>
      ),
    },
  ]

  return (
    <div className="p-8">
      <Link
        to="/admin/mileage/history"
        className="text-fg-muted hover:text-fg mb-4 inline-flex w-fit items-center gap-1 text-[13px] font-medium"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        지급 내역
      </Link>

      <DataBoundary
        isPending={isPending}
        isError={isError || !data}
        onRetry={() => refetch()}
        skeleton={<SkeletonListPage kpis={3} columns={5} className="" />}
        errorTitle="수강생 이력을 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {data && (
          <>
            <div className="flex items-center gap-3">
              <Avatar name={data.studentName} size={40} />
              <div>
                <p className="text-fg text-[16px] font-bold">
                  {data.studentName}
                </p>
                <p className="text-fg-subtle text-[12px]">{data.cohortLabel}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <KpiCard label="현재 잔액" value={data.balance} tone="info" />
              <KpiCard
                label="누적 지급"
                value={data.totalEarned}
                tone="success"
              />
              <KpiCard label="누적 사용" value={data.totalSpent} tone="danger" />
            </div>

            <div className="mt-5">
              <DataTable
                columns={columns}
                rows={data.rows}
                rowKey={(r) => r.id}
                empty="아직 거래가 없어요"
              />
              <p className="text-fg-subtle mt-3 text-xs">
                총 {data.rows.length}건
              </p>
            </div>
          </>
        )}
      </DataBoundary>
    </div>
  )
}
