import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Select } from '@/components/ui/Select'
import { usePageHeader } from '@/shared/store'
import {
  useMileageHistory,
  useMileageOrders,
  useCancelMileageOrder,
  type MileageOrderRow,
} from '../api/mileage'
import { useToast } from '@/components/ui/use-toast'
import type { HistoryRow } from './types'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { TONE_SOFT, TONE_SOLID } from '@/shared/lib/tone'

// 표시 행 — 구매 요청(주문)에서 온 행은 주문을 실어 취소(pending) 버튼을 노출한다.
type Row = HistoryRow & { order?: MileageOrderRow }

// 마일리지 사용 내역 (/student/mileage/history) — Figma 418:2066.
// 필터 키 → 행 매칭(구분 또는 처리 상태 기준)
function matchFilter(r: HistoryRow, key: string): boolean {
  switch (key) {
    case 'earn':
      return r.kind.label === '적립'
    case 'spend':
      return r.kind.label === '사용'
    case 'request':
      return r.kind.label === '구매 요청'
    case 'pending':
      return r.status.label === '대기'
    case 'rejected':
      return r.status.label === '반려'
    default:
      return true
  }
}

// 실 BE 주문 → 사용 내역 행. pending=구매요청/대기, approved=사용/완료, canceled=구매요청/취소됨, rejected=반려.
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
// 조회 기간 옵션(일수). mock이라 기준 시점은 가장 최근 행 날짜로 잡는다.
const PERIODS = [
  { key: '7', label: '최근 7일', days: 7 },
  { key: '30', label: '최근 30일', days: 30 },
  { key: '90', label: '최근 90일', days: 90 },
  { key: 'all', label: '전체 기간', days: Infinity },
]
const PAGE_SIZE = 5

export default function HistoryPage() {
  const { data, isPending, isError, refetch } = useMileageHistory()
  const { data: ordersData } = useMileageOrders()
  const cancel = useCancelMileageOrder()
  const toast = useToast()
  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState('all')
  const [page, setPage] = useState(1)
  usePageHeader('마일리지 사용 내역', '적립·사용·구매 요청 내역과 처리 상태')

  // mock 적립 내역 + 스토어 구매 요청(제출/승인/반려)을 한 목록으로 병합.
  // 구매 요청은 스토어가 단일 출처라 mock의 구매/사용 행은 제외(중복 방지), 적립만 가져온다.
  const mergedRows: Row[] = [
    ...(ordersData?.orders ?? []).map((o) => orderToRow(o)),
    ...(data?.rows ?? []).filter((r) => r.kind.label === '적립'),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  // 필터 칩 + 기간 + 내용 검색으로 행 필터
  const q = query.trim().toLowerCase()
  const refTime = Math.max(...mergedRows.map((r) => new Date(r.date).getTime()))
  const periodDays = PERIODS.find((p) => p.key === period)?.days ?? Infinity
  const periodLabel =
    PERIODS.find((p) => p.key === period)?.label ?? '최근 30일'
  const filters = (data?.filters ?? []).map((f) => ({
    ...f,
    count: mergedRows.filter((r) => matchFilter(r, f.key)).length,
  }))
  const visible = mergedRows.filter((r) => {
    if (!matchFilter(r, active)) return false
    if (q !== '' && !r.content.toLowerCase().includes(q)) return false
    if (periodDays !== Infinity) {
      const days = (refTime - new Date(r.date).getTime()) / 86_400_000
      if (days > periodDays) return false
    }
    return true
  })

  // 필터 결과를 페이지 단위로 자른다. 필터가 바뀌어 페이지 수가 줄면 마지막 페이지로 보정.
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const curPage = Math.min(page, pageCount)
  const pageRows = visible.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE)

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={refetch}
      skeleton={<SkeletonListPage columns={5} className="" />}
      errorTitle="내역을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && (
        <div className="flex flex-col gap-5 p-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {data.stats.map((s) => (
              <div key={s.key} className={cn(card, 'flex flex-col gap-2')}>
                <div className="flex items-start justify-between">
                  <span className="text-fg-muted text-[12px]">{s.label}</span>
                  <span
                    className={cn('size-2 rounded-full', TONE_SOLID[s.tone])}
                  />
                </div>
                <span className="text-fg text-[24px] leading-none font-bold">
                  {s.value}
                  <span className="text-fg-muted ml-0.5 text-[13px]">
                    {s.unit}
                  </span>
                </span>
                <span className="text-fg-subtle text-[11px]">{s.sub}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {filters.map((f) => {
                const on = f.key === active
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      setActive(f.key)
                      setPage(1)
                    }}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                      on
                        ? 'bg-brand-deep text-white'
                        : 'border-border text-fg-muted hover:bg-surface-muted border',
                    )}
                  >
                    {f.label}
                    <span
                      className={cn(
                        'text-[12px]',
                        on ? 'text-white/70' : 'text-fg-subtle',
                      )}
                    >
                      {f.count}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2">
              <Select
                aria-label="조회 기간"
                value={period}
                onChange={(v) => {
                  setPeriod(v)
                  setPage(1)
                }}
                options={PERIODS.map((p) => ({ value: p.key, label: p.label }))}
              />
              <div className="border-border focus-within:border-brand hidden items-center gap-1.5 rounded-lg border px-3 py-1.5 sm:flex">
                <span className="text-fg-subtle text-[12px]">🔍</span>
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setPage(1)
                  }}
                  placeholder="내역 검색"
                  className="text-fg placeholder:text-fg-subtle w-28 bg-transparent text-[12px] outline-none"
                />
              </div>
            </div>
          </div>

          <section className={cn(card, 'flex flex-col gap-0 p-0')}>
            <div className="text-fg-muted grid grid-cols-[100px_88px_1fr_120px_72px_140px] gap-3 px-5 py-3 text-[11px] font-bold">
              <span>일자</span>
              <span>구분</span>
              <span>내용</span>
              <span className="text-right">마일리지</span>
              <span>상태</span>
              <span>처리 메모</span>
            </div>
            {visible.length === 0 && (
              <div className="text-fg-subtle border-divider border-t px-5 py-10 text-center text-[12px]">
                조건에 맞는 내역이 없어요.
              </div>
            )}
            {pageRows.map((r, i) => (
              <div
                key={i}
                className="border-divider grid grid-cols-[100px_88px_1fr_120px_72px_140px] items-center gap-3 border-t px-5 py-3.5 text-[12px]"
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

          <div className="flex items-center justify-between pt-1">
            <span className="text-fg-subtle text-[12px]">
              {periodLabel} · 총 {visible.length}건 중 {pageRows.length}건 표시
            </span>
            {pageCount > 1 && (
              <div className="flex items-center gap-1">
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
        </div>
      )}
    </DataBoundary>
  )
}
