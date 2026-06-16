import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useMileageHistory } from '../api/mileage'
import type { HistoryRow, Tone } from './types'

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
const card =
  'border-border bg-surface rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
const DOT: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}
const CHIP: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
}
// 조회 기간 옵션(일수). mock이라 기준 시점은 가장 최근 행 날짜로 잡는다.
const PERIODS = [
  { key: '7', label: '최근 7일', days: 7 },
  { key: '30', label: '최근 30일', days: 30 },
  { key: '90', label: '최근 90일', days: 90 },
  { key: 'all', label: '전체 기간', days: Infinity },
]

export default function HistoryPage() {
  const { data, isPending, isError, refetch } = useMileageHistory()
  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState('30')
  usePageHeader('마일리지 사용 내역', '적립·사용·구매 요청 내역과 처리 상태')

  if (isPending)
    return <div className="text-fg-muted p-8">내역을 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="내역을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  // 필터 칩 + 기간 + 내용 검색으로 행 필터
  const q = query.trim().toLowerCase()
  const refTime = Math.max(...data.rows.map((r) => new Date(r.date).getTime()))
  const periodDays = PERIODS.find((p) => p.key === period)?.days ?? Infinity
  const periodLabel =
    PERIODS.find((p) => p.key === period)?.label ?? '최근 30일'
  const visible = data.rows.filter((r) => {
    if (!matchFilter(r, active)) return false
    if (q !== '' && !r.content.toLowerCase().includes(q)) return false
    if (periodDays !== Infinity) {
      const days = (refTime - new Date(r.date).getTime()) / 86_400_000
      if (days > periodDays) return false
    }
    return true
  })

  return (
    <div className="flex flex-col gap-5 p-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {data.stats.map((s) => (
          <div key={s.key} className={cn(card, 'flex flex-col gap-2')}>
            <div className="flex items-start justify-between">
              <span className="text-fg-muted text-[12px]">{s.label}</span>
              <span className={cn('size-2 rounded-full', DOT[s.tone])} />
            </div>
            <span className="text-fg text-[24px] leading-none font-bold">
              {s.value}
              <span className="text-fg-muted ml-0.5 text-[13px]">{s.unit}</span>
            </span>
            <span className="text-fg-subtle text-[11px]">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {data.filters.map((f) => {
            const on = f.key === active
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setActive(f.key)}
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
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border-border text-fg-muted bg-surface focus:border-brand rounded-lg border px-3 py-1.5 text-[12px] font-semibold focus:outline-none"
          >
            {PERIODS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <div className="border-border focus-within:border-brand hidden items-center gap-1.5 rounded-lg border px-3 py-1.5 sm:flex">
            <span className="text-fg-subtle text-[12px]">🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
        {visible.map((r, i) => (
          <div
            key={i}
            className="border-divider grid grid-cols-[100px_88px_1fr_120px_72px_140px] items-center gap-3 border-t px-5 py-3.5 text-[12px]"
          >
            <span className="text-fg-subtle">{r.date}</span>
            <span>
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-bold',
                  CHIP[r.kind.tone],
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
                  CHIP[r.status.tone],
                )}
              >
                {r.status.label}
              </span>
            </span>
            <span className="text-fg-subtle">{r.memo}</span>
          </div>
        ))}
      </section>

      <div className="flex items-center justify-between pt-1">
        <span className="text-fg-subtle text-[12px]">
          {periodLabel} {visible.length}건 표시 · 총 누적 28건
        </span>
        <div className="flex items-center gap-1">
          <span className="border-border text-fg-subtle flex size-8 items-center justify-center rounded-lg border text-[13px]">
            ‹
          </span>
          {['1', '2', '3'].map((n) => (
            <span
              key={n}
              className={cn(
                'flex size-8 items-center justify-center rounded-lg text-[13px] font-semibold',
                n === '1'
                  ? 'bg-brand-deep text-white'
                  : 'border-border text-fg-muted border',
              )}
            >
              {n}
            </span>
          ))}
          <span className="border-border text-fg-subtle flex size-8 items-center justify-center rounded-lg border text-[13px]">
            ›
          </span>
        </div>
      </div>
    </div>
  )
}
