import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Book, Coffee, Gift, Video, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useMileageOverview, useMileageProducts } from '../api/mileage'
import { parseMoney, type MileageRequest } from './store'
import { ProductApplyModal } from './components/ProductApplyModal'
import { RequestStatusModal } from './components/RequestStatusModal'
import type { MileageProduct, Tone } from './types'

// 내 마일리지 (/student/mileage) — Figma 418:1850.
const card =
  'border-border bg-surface rounded-2xl border p-6 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
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
// 구매 가능 상품 카드 아이콘(Figma book-fill/camera-video-fill/cup-hot-fill/gift-fill)
const PRODUCT_ICON: Record<MileageProduct['icon'], LucideIcon> = {
  book: Book,
  video: Video,
  cup: Coffee,
  gift: Gift,
}

export default function MileagePage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useMileageOverview()
  const { data: productsData } = useMileageProducts()
  // 잔액은 실 BE 값(overview.balance)을 표시. store.balance는 구매 시뮬(BE 구매 후속) 전용.
  const balance = data ? parseMoney(data.balance) : 0
  // 카드 보조지표 — 누적 적립/사용(stats에서 추출, 히어로 KPI 중복 제거)
  const earned = data?.stats.find((s) => s.key === 'earned')?.value ?? '0'
  const spent = data?.stats.find((s) => s.key === 'spent')?.value ?? '0'
  usePageHeader('내 마일리지', '적립·사용 현황과 구매 요청 상태를 확인합니다.')

  // 구매 가능 상품 "신청" → 신청 폼(모달) → 제출 결과 모달
  const [applyProduct, setApplyProduct] = useState<MileageProduct | null>(null)
  const [resultRequest, setResultRequest] = useState<MileageRequest | null>(
    null,
  )
  // 실제 보유 잔액으로 살 수 있는 상품만 노출(고정가는 가격≤잔액, 직접 입력은 항상 노출)
  const affordable = (productsData?.products ?? []).filter(
    (p) => p.price == null || parseMoney(p.price) <= balance,
  )

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
      {/* 마일리지 카드 — 잔액·누적 적립/사용·만료를 한 장에(이전 LMS 신용카드 메타포) */}
      <div className="from-brand to-brand-deep relative overflow-hidden rounded-3xl bg-gradient-to-br p-7 text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.22)]">
        {/* 배경 장식 */}
        <div className="absolute -top-12 -right-10 size-48 rounded-full bg-white/10" />
        <div className="absolute top-16 right-20 size-28 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-7">
          {/* 상단: 브랜드 + 칩 */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col leading-tight">
              <span className="text-[14px] font-bold tracking-[0.18em] text-white">
                PLAYDATA
              </span>
              <span className="text-[10px] font-semibold tracking-[0.32em] text-white/60">
                MILEAGE
              </span>
            </div>
            <div className="h-7 w-10 rounded-md bg-gradient-to-br from-white/40 to-white/15" />
          </div>
          {/* 중앙: 잔액 */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-wider text-white/70">
              BALANCE · 사용 가능 마일리지
            </span>
            <span className="text-[44px] leading-none font-bold">
              {balance.toLocaleString()}
              <span className="ml-1 text-[20px]">M</span>
            </span>
            {data.balanceDelta && (
              <div className="mt-0.5 flex items-center gap-2">
                <span className="rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-bold">
                  {data.balanceDelta}
                </span>
                <span className="text-[12px] text-white/80">
                  {data.balanceSub}
                </span>
              </div>
            )}
          </div>
          {/* 하단: 누적 적립/사용 + 만료 + 액션 */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-white/15 pt-4">
            <div className="flex gap-7">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] tracking-wider text-white/55">
                  누적 적립
                </span>
                <span className="text-[16px] font-bold">{earned}M</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] tracking-wider text-white/55">
                  누적 사용
                </span>
                <span className="text-[16px] font-bold">{spent}M</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] tracking-wider text-white/55">
                  VALID THRU
                </span>
                <span className="text-[13px] font-bold">종강월 말일</span>
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
        </div>
      </div>
      {/* 만료 안내(이전 LMS 정책 문구) */}
      <p className="text-fg-subtle -mt-1 text-[11px]">
        · 마일리지는 종강일이 속한 달의 말일까지 사용 가능하며, 이후 자동
        소멸됩니다. 누락 건은 증빙과 함께 담당 매니저에게 문의해 주세요.
      </p>

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
                보유 {balance.toLocaleString()}M 기준 · {affordable.length}종
                구매 가능
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
          {affordable.length === 0 && (
            <div className="text-fg-subtle py-6 text-center text-[12px]">
              지금 잔액으로 구매 가능한 상품이 없어요.
            </div>
          )}
          {affordable.map((p) => {
            const Icon = PRODUCT_ICON[p.icon]
            return (
              <div key={p.id} className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-[10px]',
                    CHIP[p.tone],
                  )}
                >
                  <Icon className="size-[21px]" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-fg truncate text-[13px] font-semibold">
                    {p.name}
                  </span>
                  <span className="text-brand text-[12px] font-bold">
                    {p.price ?? '가격 직접 입력'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setApplyProduct(p)}
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

      <ProductApplyModal
        product={applyProduct}
        onClose={() => setApplyProduct(null)}
        onSubmitted={(req) => {
          setApplyProduct(null)
          setResultRequest(req)
        }}
      />
      <RequestStatusModal
        request={resultRequest}
        onClose={() => setResultRequest(null)}
      />
    </div>
  )
}
