import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Book, Coffee, Gift, Send, Video, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useMileageProducts } from '../api/mileage'
import { useMileageStore, parseMoney, type MileageRequest } from './store'
import { ProductApplyModal } from './components/ProductApplyModal'
import { RequestStatusModal } from './components/RequestStatusModal'
import type { MileageProduct, Tone } from './types'

// 마일리지 상품 신청 (/student/mileage/products) — Figma 418:1961.
const card =
  'border-border bg-surface rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
const CHIP: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
}
const DOT: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}
// 카드 좌상단 아이콘(Figma book-fill/camera-video-fill/cup-hot-fill/gift-fill)
const PRODUCT_ICON: Record<'book' | 'video' | 'cup' | 'gift', LucideIcon> = {
  book: Book,
  video: Video,
  cup: Coffee,
  gift: Gift,
}
const input =
  'border-border bg-surface text-fg focus:border-brand w-full rounded-[10px] border px-4 py-3 text-[14px] focus:outline-none'

// 직접 신청 — 상품 링크는 http/https URL만 허용
function isValidUrl(s: string): boolean {
  const v = s.trim()
  if (!v) return false
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export default function ProductsPage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useMileageProducts()
  // 잔액은 실 BE 값(products.balance). store.submit은 구매 시뮬(BE 구매 후속) 전용.
  const balance = data ? parseMoney(data.balance) : 0
  const submit = useMileageStore((s) => s.submit)
  const [active, setActive] = useState('all')
  const [link, setLink] = useState('')
  const [price, setPrice] = useState('')
  const [memo, setMemo] = useState('')
  const [applyProduct, setApplyProduct] = useState<MileageProduct | null>(null)
  const [resultRequest, setResultRequest] = useState<MileageRequest | null>(
    null,
  )
  usePageHeader(
    '마일리지 상품 신청',
    '상품 타입별 잔여 한도를 확인하고 구매 요청을 제출합니다.',
  )

  if (isPending)
    return <div className="text-fg-muted p-8">상품을 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="상품을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  // 카테고리 필터 + 직접 신청 제출(링크·가격 필수)
  const visible = data.products.filter(
    (p) => active === 'all' || p.categoryKey === active,
  )
  const urlOk = isValidUrl(link)
  const directAmount = Number(price || 0)
  const directOver = directAmount > balance
  const canSubmit =
    urlOk && price.trim() !== '' && directAmount > 0 && !directOver
  const submitDirect = () => {
    if (!canSubmit) return
    // 직접 신청은 매니저 검토 대상(자동 승인 아님) → PENDING, 승인 전 차감 없음
    const req = submit({
      product: '직접 신청 상품',
      amount: directAmount,
      autoApprove: false,
      link: link.trim(),
      memo: memo.trim() || undefined,
    })
    setLink('')
    setPrice('')
    setMemo('')
    setResultRequest(req)
  }

  return (
    <div className="flex flex-col gap-5 p-8">
      <div className="bg-brand flex items-center justify-between rounded-2xl p-5">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-white/70">
              BALANCE · 보유
            </span>
            <span className="text-[22px] font-bold text-white">
              {balance.toLocaleString()}M
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-white/70">
              진행 중 요청
            </span>
            <span className="text-[22px] font-bold text-white">
              {data.inProgress}건
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/student/mileage/history')}
          className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold text-white"
        >
          사용 내역 →
        </button>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <h2 className="text-fg text-[16px] font-bold">상품 목록</h2>
          <span className="text-fg-subtle text-[12px]">
            {data.products.length}개
          </span>
        </div>
        <span className="text-fg-subtle text-[12px]">
          운영자 등록 상품 + 직접 신청 가능
        </span>
      </div>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => {
          const Icon = PRODUCT_ICON[p.icon]
          // 고정가 상품은 잔액으로 살 수 있을 때만 신청 가능, 직접 입력은 항상 가능(금액은 모달에서 확인)
          const affordable = p.price == null || parseMoney(p.price) <= balance
          return (
            <section key={p.id} className={cn(card, 'flex flex-col gap-2.5')}>
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-[10px]',
                    CHIP[p.tone],
                  )}
                >
                  <Icon className="size-[21px]" />
                </span>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {p.badges.map((b, i) => (
                    <span
                      key={i}
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-bold',
                        CHIP[b.tone],
                      )}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-fg text-[15px] font-bold">{p.name}</span>
              <span className="text-brand text-[13px] font-bold">
                {p.price ?? p.priceType}
              </span>
              <span className="text-fg-muted min-h-[32px] text-[12px] leading-5">
                {p.desc}
              </span>
              <div className="flex items-center justify-between">
                <span className="text-fg-subtle text-[11px]">잔여 한도</span>
                <span className="text-fg text-[13px] font-bold">
                  {p.limit}M
                </span>
              </div>
              <div className="bg-surface-muted h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className={cn('h-full rounded-full', DOT[p.tone])}
                  style={{ width: `${p.barPct ?? 18}%` }}
                />
              </div>
              <button
                type="button"
                onClick={() => affordable && setApplyProduct(p)}
                disabled={!affordable}
                className={cn(
                  'mt-1 rounded-lg py-2.5 text-[13px] font-bold',
                  affordable
                    ? 'bg-brand text-white'
                    : 'bg-surface-muted text-fg-subtle cursor-not-allowed',
                )}
              >
                {affordable ? '신청하기 →' : '잔액 부족 · 신청 불가'}
              </button>
            </section>
          )
        })}
      </div>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <div className="flex items-center gap-2">
          <span className="text-fg text-[15px] font-bold">직접 신청</span>
          <span className="bg-accent-bg text-accent-strong rounded px-1.5 py-0.5 text-[10px] font-bold">
            가격 직접 입력
          </span>
          <span className="text-fg-subtle text-[11px]">
            매니저 검토 1영업일
          </span>
        </div>
        <span className="text-fg-subtle text-[11px]">
          등록 상품에 없는 항목은 링크 + 가격을 입력해 직접 신청합니다
        </span>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-fg text-[12px] font-bold">
              상품 링크 <span className="text-danger">*</span>
            </span>
            <input
              className={cn(
                input,
                link.trim() !== '' &&
                  !urlOk &&
                  'border-danger focus:border-danger',
              )}
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
            />
            <span
              className={cn(
                'text-[11px]',
                link.trim() !== '' && !urlOk ? 'text-danger' : 'text-fg-subtle',
              )}
            >
              http:// 또는 https:// 로 시작하는 올바른 URL을 입력하세요.
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-fg text-[12px] font-bold">
              신청 가격 <span className="text-danger">*</span>
            </span>
            <div className="border-border bg-surface focus-within:border-brand flex w-full items-center rounded-[10px] border px-4 text-[14px]">
              <input
                inputMode="numeric"
                className="text-fg placeholder:text-fg-subtle min-w-0 flex-1 bg-transparent py-3 outline-none"
                value={price ? Number(price).toLocaleString() : ''}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="가격만 입력"
              />
              <span className="text-fg-muted ml-1 font-semibold">M</span>
            </div>
            <span className="text-fg-subtle text-[11px]">
              숫자만 입력하면 단위 M이 자동으로 붙습니다.
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_200px]">
          <div className="flex flex-col gap-2">
            <span className="text-fg text-[12px] font-bold">
              매니저에게 남길 메모
            </span>
            <textarea
              className={cn(input, 'min-h-[96px] resize-none leading-6')}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="구매 목적이나 확인이 필요한 내용을 적어주세요."
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-bold text-transparent select-none">
              제출
            </span>
            <button
              type="button"
              onClick={submitDirect}
              disabled={!canSubmit}
              className="bg-brand flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[10px] py-4 text-white disabled:opacity-50"
            >
              <Send className="size-5" />
              <span className="text-[13px] font-bold">요청 제출</span>
            </button>
          </div>
        </div>
        {directOver ? (
          <div className="border-danger/40 bg-danger-bg/50 text-danger rounded-xl border p-3 text-[11px] font-semibold">
            ⓘ 신청 금액이 보유 마일리지({balance.toLocaleString()}M)를{' '}
            {(directAmount - balance).toLocaleString()}M 초과했습니다 · 신청
            불가
          </div>
        ) : (
          <div className="bg-info-bg/60 text-fg-muted rounded-xl p-3 text-[11px]">
            ⓘ 직접 신청은 매니저 검토 후 마일리지가 차감됩니다. 승인되지 않으면
            마일리지는 그대로 보존됩니다.
          </div>
        )}
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
