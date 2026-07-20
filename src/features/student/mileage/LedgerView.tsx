import { useMemo, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import {
  useMileageHistory,
  useMileageOrders,
  useCancelMileageOrder,
  type MileageOrderRow,
} from '../api/mileage'
import { useToast } from '@/components/ui/use-toast'
import type { HistoryRow } from './types'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { TONE_SOFT } from '@/shared/lib/tone'

// 마일리지 내역 뷰 — 이전 LMS 그대로: 시작일/종료일 + 1개월/전체 프리셋 + 조회, 목록.
// 적립 내역 + 구매 요청(주문)을 한 목록으로 병합(대기 건은 취소 노출).
type Row = HistoryRow & { order?: MileageOrderRow }

function orderToRow(o: MileageOrderRow): Row {
  const amount = `-${o.amount.toLocaleString()}M`
  const base = {
    date: o.date,
    content: o.product,
    amount,
    positive: false,
    order: o,
  }
  if (o.status === 'approved')
    return {
      ...base,
      kind: { label: '사용', tone: 'accent' },
      status: { label: '완료', tone: 'success' },
      memo: '완료',
    }
  if (o.status === 'canceled')
    return {
      ...base,
      kind: { label: '구매 요청', tone: 'info' },
      status: { label: '취소됨', tone: 'info' },
      memo: '취소 환불됨',
    }
  if (o.status === 'rejected')
    return {
      ...base,
      kind: { label: '구매 요청', tone: 'info' },
      status: { label: '반려', tone: 'danger' },
      memo: '반려',
    }
  return {
    ...base,
    kind: { label: '구매 요청', tone: 'info' },
    status: { label: '대기', tone: 'warning' },
    memo: '검토 대기',
  }
}

const card =
  'bg-surface rounded-2xl p-5 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'
const COLS = 'grid grid-cols-[110px_88px_1fr_120px_72px_140px] gap-3'
const PAGE_SIZE = 8

// YYYY-MM-DD (오늘 / n개월 전)
function isoDay(offsetMonths = 0): string {
  const d = new Date()
  d.setMonth(d.getMonth() - offsetMonths)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function LedgerView() {
  const { data, isPending, isError, refetch } = useMileageHistory()
  const { data: ordersData } = useMileageOrders()
  const cancel = useCancelMileageOrder()
  const toast = useToast()
  const [start, setStart] = useState(() => isoDay(1))
  const [end, setEnd] = useState(() => isoDay(0))
  const [preset, setPreset] = useState<'1month' | 'all' | 'custom'>('1month')
  const [page, setPage] = useState(1)

  const mergedRows = useMemo<Row[]>(
    () =>
      [
        ...(ordersData?.orders ?? []).map((o) => orderToRow(o)),
        ...(data?.rows ?? []).filter((r) => r.kind.label === '적립'),
      ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [ordersData, data],
  )

  const startT = new Date(start).getTime()
  const endT = new Date(`${end}T23:59:59`).getTime()
  const visible =
    preset === 'all'
      ? mergedRows
      : mergedRows.filter((r) => {
          const t = new Date(r.date).getTime()
          return isNaN(t) || (t >= startT && t <= endT)
        })

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const curPage = Math.min(page, pageCount)
  const pageRows = visible.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE)

  const presetBtn = (on: boolean) =>
    cn(
      'rounded-lg px-3.5 py-2 text-[13px] font-bold transition-colors',
      on
        ? 'bg-brand-deep text-white'
        : 'border-border text-fg-muted hover:bg-surface-muted border',
    )

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={refetch}
      skeleton={<SkeletonListPage columns={5} className="" />}
      errorTitle="내역을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
    >
      {data && (
        <div className="flex flex-col gap-4">
          {/* 날짜 필터 */}
          <div className="border-divider flex flex-wrap items-center gap-3 border-b pb-4">
            <div className="flex items-center gap-2">
              <span className="text-fg-muted text-[12px] font-semibold">
                시작일
              </span>
              <DateTimePicker
                mode="date"
                value={start}
                onChange={(v) => {
                  setStart(v)
                  setPreset('custom')
                  setPage(1)
                }}
                ariaLabel="시작일"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-fg-muted text-[12px] font-semibold">
                종료일
              </span>
              <DateTimePicker
                mode="date"
                value={end}
                onChange={(v) => {
                  setEnd(v)
                  setPreset('custom')
                  setPage(1)
                }}
                ariaLabel="종료일"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setStart(isoDay(1))
                  setEnd(isoDay(0))
                  setPreset('1month')
                  setPage(1)
                }}
                className={presetBtn(preset === '1month')}
              >
                1개월
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreset('all')
                  setPage(1)
                }}
                className={presetBtn(preset === 'all')}
              >
                전체
              </button>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="bg-brand-deep ml-auto rounded-lg px-5 py-2 text-[13px] font-bold text-white"
            >
              조회
            </button>
          </div>

          {/* 목록 */}
          {visible.length === 0 ? (
            <div className="text-fg-subtle py-16 text-center text-[13px]">
              해당 조건에 부합하는 내역이 없습니다.
            </div>
          ) : (
            <section className={cn(card, 'flex flex-col gap-0 p-0')}>
              <div
                className={`${COLS} text-fg-muted px-5 py-3 text-[11px] font-bold`}
              >
                <span>일자</span>
                <span>구분</span>
                <span>내용</span>
                <span className="text-right">마일리지</span>
                <span>상태</span>
                <span>처리 메모</span>
              </div>
              {pageRows.map((r, i) => (
                <div
                  key={i}
                  className={`${COLS} border-divider items-center border-t px-5 py-3.5 text-[12px]`}
                >
                  <span className="text-fg-subtle">{r.date}</span>
                  <span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-bold',
                        TONE_SOFT[r.kind.tone],
                      )}
                    >
                      {r.kind.label}
                    </span>
                  </span>
                  <span className="text-fg font-semibold">{r.content}</span>
                  <span
                    className={cn(
                      'text-right font-bold',
                      r.positive ? 'text-success' : 'text-fg',
                    )}
                  >
                    {r.amount}
                  </span>
                  <span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-bold',
                        TONE_SOFT[r.status.tone],
                      )}
                    >
                      {r.status.label}
                    </span>
                  </span>
                  {r.order?.status === 'pending' ? (
                    <button
                      type="button"
                      disabled={cancel.isPending}
                      onClick={() =>
                        cancel.mutate(r.order!.id, {
                          onSuccess: () =>
                            toast.success(
                              '구매를 취소했어요. 마일리지가 복원됩니다.',
                            ),
                          onError: () => toast.danger('취소에 실패했어요.'),
                        })
                      }
                      className="border-danger/40 text-danger justify-self-start rounded-md border px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50"
                    >
                      구매 취소
                    </button>
                  ) : (
                    <span className="text-fg-subtle">{r.memo}</span>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* 페이지네이션 */}
          {pageCount > 1 && (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                aria-label="이전 페이지"
                disabled={curPage <= 1}
                onClick={() => setPage(curPage - 1)}
                className="border-border text-fg-subtle flex size-8 items-center justify-center rounded-lg border text-[13px] disabled:opacity-40"
              >
                ‹
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-current={n === curPage ? 'page' : undefined}
                  onClick={() => setPage(n)}
                  className={cn(
                    'flex size-8 items-center justify-center rounded-lg text-[13px] font-semibold',
                    n === curPage
                      ? 'bg-brand-deep text-white'
                      : 'border-border text-fg-muted border',
                  )}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                aria-label="다음 페이지"
                disabled={curPage >= pageCount}
                onClick={() => setPage(curPage + 1)}
                className="border-border text-fg-subtle flex size-8 items-center justify-center rounded-lg border text-[13px] disabled:opacity-40"
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}
    </DataBoundary>
  )
}
