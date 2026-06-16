import { useNavigate } from 'react-router-dom'
import { Book, Gift, Video, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useMileageOverview } from '../api/mileage'
import type { Tone } from './types'

// 내 마일리지 (/student/mileage) — Figma 418:1850.
const card =
  'border-border bg-surface rounded-2xl border p-6 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
// KPI 카드는 figma 기준 rounded-14 / p-18 (요약카드 패턴)
const kpiCard =
  'border-border bg-surface rounded-[14px] border p-[18px] shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
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
// 구매 가능 상품 카테고리 아이콘(Figma book-fill/camera-video-fill/gift-fill)
const PRODUCT_ICON: Record<'book' | 'video' | 'gift', LucideIcon> = {
  book: Book,
  video: Video,
  gift: Gift,
}

export default function MileagePage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useMileageOverview()
  usePageHeader('내 마일리지', '적립·사용 현황과 구매 요청 상태를 확인합니다.')

  if (isPending)
    return <div className="text-fg-muted p-8">마일리지를 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="마일리지를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-8">
      {/* 잔액 히어로 */}
      <div className="bg-brand flex items-center justify-between rounded-2xl p-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-wider text-white/70">
            BALANCE · 보유 마일리지
          </span>
          <span className="text-[36px] leading-none font-bold text-white">
            {data.balance}
            <span className="ml-1 text-[18px]">M</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-bold text-white">
              {data.balanceDelta}
            </span>
            <span className="text-[12px] text-white/80">{data.balanceSub}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/student/mileage/history')}
            className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold text-white"
          >
            사용 내역
          </button>
          <button
            type="button"
            onClick={() => navigate('/student/mileage/products')}
            className="text-brand rounded-lg bg-white px-4 py-2.5 text-[13px] font-bold"
          >
            상품 신청 →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {data.stats.map((s) => (
          <div key={s.key} className={cn(kpiCard, 'flex flex-col gap-2')}>
            <div className="flex items-center justify-between">
              <span className="text-fg-muted text-[12px] font-medium">
                {s.label}
              </span>
              <span
                className={cn('size-2 shrink-0 rounded-full', DOT[s.tone])}
              />
            </div>
            <div className="flex items-end gap-0.5">
              <span className="text-fg text-[28px] leading-[34px] font-bold">
                {s.value}
              </span>
              <span className="text-fg-muted text-[13px] font-medium">
                {s.unit}
              </span>
              {s.delta && (
                <span
                  className={cn(
                    'ml-1.5 rounded-[5px] px-1.5 py-0.5 text-[10px] font-bold',
                    CHIP[s.delta.tone],
                  )}
                >
                  {s.delta.label}
                </span>
              )}
            </div>
            {s.barPct != null && (
              <div className="bg-surface-muted h-[5px] w-full overflow-hidden rounded-full">
                <div
                  className={cn('h-full rounded-full', DOT[s.tone])}
                  style={{ width: `${s.barPct}%` }}
                />
              </div>
            )}
            <span className="text-fg-subtle text-[11px]">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-1 flex-col gap-2')}>
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-fg text-[15px] font-bold">
                최근 적립·사용 내역
              </span>
              <span className="text-fg-subtle text-[11px]">
                최근 30일 · {data.ledger.length}건 표시
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/student/mileage/history')}
              className="border-border text-fg-muted rounded-lg border px-3 py-1.5 text-[12px] font-medium"
            >
              전체 내역
            </button>
          </div>
          {data.ledger.map((l, i) => (
            <div
              key={l.id}
              className={cn(
                'flex items-center gap-3 py-2.5',
                i > 0 && 'border-divider border-t',
              )}
            >
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-lg text-[12px]',
                  l.positive
                    ? 'bg-success-bg text-success'
                    : 'bg-surface-muted text-fg-muted',
                )}
              >
                {l.positive ? '▲' : '▼'}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-fg text-[13px] font-semibold">
                  {l.label}
                </span>
                <span className="text-fg-subtle text-[11px]">{l.date}</span>
              </div>
              <span
                className={cn(
                  'text-[13px] font-bold',
                  l.positive ? 'text-success' : 'text-fg',
                )}
              >
                {l.amount}
              </span>
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-bold',
                  CHIP[l.status.tone],
                )}
              >
                {l.status.label}
              </span>
            </div>
          ))}
        </section>

        <section className={cn(card, 'flex flex-1 flex-col gap-3.5')}>
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-fg text-[15px] font-bold">
                구매 가능 상품
              </span>
              <span className="text-fg-subtle text-[11px]">
                잔여 한도 기준 · {data.products.length}종
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/student/mileage/products')}
              className="border-border text-fg-muted rounded-lg border px-3 py-1.5 text-[12px] font-medium"
            >
              상품 전체
            </button>
          </div>
          {data.products.map((p) => {
            const Icon = PRODUCT_ICON[p.icon]
            return (
              <div key={p.name} className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-[10px]',
                    CHIP[p.tone],
                  )}
                >
                  <Icon className="size-[21px]" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-fg text-[13px] font-semibold">
                      {p.name}
                    </span>
                    <span className="text-fg-muted shrink-0 text-[11px] font-medium">
                      {p.limit}
                    </span>
                  </div>
                  {p.barPct != null && (
                    <div className="bg-surface-muted h-[5px] w-full overflow-hidden rounded-full">
                      <div
                        className={cn('h-full rounded-full', DOT[p.tone])}
                        style={{ width: `${p.barPct}%` }}
                      />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/student/mileage/products')}
                  className="bg-brand text-on-color shrink-0 rounded-lg px-3.5 py-2 text-[12px] font-bold"
                >
                  신청 →
                </button>
              </div>
            )
          })}
        </section>
      </div>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <div className="flex flex-col">
          <span className="text-fg text-[15px] font-bold">
            타입별 사용 한도
          </span>
          <span className="text-fg-subtle text-[11px]">
            마일리지 정책 — 도서·강의·기프티콘 각 한도 별로 운영
          </span>
        </div>
        {data.limits.map((l) => (
          <div key={l.label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-fg flex items-center gap-1.5 font-medium">
                <span className={cn('size-2 rounded-full', DOT[l.tone])} />
                {l.label}
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[10px] font-bold',
                    CHIP[l.status.tone],
                  )}
                >
                  {l.status.label}
                </span>
              </span>
              <span className="text-fg font-bold">
                {l.used.toLocaleString()}{' '}
                <span className="text-fg-subtle font-normal">
                  / {l.total.toLocaleString()}M
                </span>
              </span>
            </div>
            <div className="bg-surface-muted h-2.5 w-full overflow-hidden rounded-full">
              <div
                className={cn('h-full rounded-full', DOT[l.tone])}
                style={{ width: `${Math.round((l.used / l.total) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
