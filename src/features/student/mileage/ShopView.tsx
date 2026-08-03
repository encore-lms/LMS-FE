import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Book,
  Coffee,
  Gift,
  Minus,
  Plus,
  ShoppingCart,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { buttonClass } from '@/components/ui/buttonClass'
import { useMileageProducts, useMileageOverview } from '../api/mileage'
import { parseMoney } from './store'
import { useCartStore, cartCount, cartTotal } from './cartStore'
import { FlexiblePurchaseModal } from './components/FlexiblePurchaseModal'
import { ProductImage } from './components/ProductImage'
import type { MileageLimit, MileageProduct, Tone } from './types'
import { SkeletonCards } from '@/components/ui/Skeleton'
import { TONE_SOFT } from '@/shared/lib/tone'
import { SearchInput } from '@/components/ui/SearchInput'

// 마일리지 상품 목록(/student/mileage/products) — 담기 → 장바구니 → 결제(이전 LMS Shop/Cart 흐름).
const card =
  'bg-surface rounded-2xl p-5 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'
// 상품 카드(한 줄 5개) — 기본은 그림자 없이 flat, 호버 시에만 그림자로 떠오르게.
const productCard =
  'bg-surface flex flex-col gap-3 rounded-2xl p-4 transition-shadow duration-200 hover:shadow-[0px_8px_24px_0px_rgba(18,23,38,0.12)]'
const PRODUCT_ICON: Record<'book' | 'video' | 'cup' | 'gift', LucideIcon> = {
  book: Book,
  video: Video,
  cup: Coffee,
  gift: Gift,
}
// 타입별 한도 카드 아이콘 — 라벨 기준(기프티콘/도서/인터넷 강의).
function limitIcon(label: string): LucideIcon {
  if (label.includes('도서')) return Book
  if (label.includes('강의')) return Video
  return Gift
}
const SORTS = [
  { key: 'latest', label: '전체' },
  { key: 'desc', label: '마일리지 높은 순' },
  { key: 'asc', label: '마일리지 낮은 순' },
] as const

interface FlyingItem {
  id: number
  startX: number
  startY: number
  endX: number
  endY: number
  icon: MileageProduct['icon']
  tone: Tone
  imageSrc?: string | null // 카드에 이미 로드된 상품 이미지(object URL) — 있으면 이미지가 날아감
}

// 담기 시 상품 이미지가 장바구니 버튼으로 날아가는 연출(이전 LMS flyToCart).
// 카드에 로드된 이미지가 있으면 그 이미지를, 없으면 타입 아이콘을 날린다.
function FlyingIcon({ item }: { item: FlyingItem }) {
  const [flown, setFlown] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setFlown(true)),
    )
    return () => cancelAnimationFrame(raf)
  }, [])
  const Icon = PRODUCT_ICON[item.icon]
  return (
    <div
      className="bg-surface pointer-events-none fixed z-[200] size-16 overflow-hidden rounded-xl shadow-[0px_8px_24px_0px_rgba(18,23,38,0.18)]"
      style={{
        left: item.startX,
        top: item.startY,
        transform: flown
          ? `translate(${item.endX - item.startX}px, ${item.endY - item.startY}px) scale(0.3)`
          : 'translate(0,0) scale(1)',
        opacity: flown ? 0.2 : 1,
        transition:
          'transform 0.9s cubic-bezier(0.5,-0.2,0.7,1.2), opacity 0.9s ease-in',
      }}
    >
      {item.imageSrc ? (
        <img src={item.imageSrc} alt="" className="size-full object-contain" />
      ) : (
        <span
          className={cn(
            'flex size-full items-center justify-center',
            TONE_SOFT[item.tone],
          )}
        >
          <Icon className="size-7" />
        </span>
      )}
    </div>
  )
}

export function ShopView({ onView }: { onView: (v: string | null) => void }) {
  const { data, isPending, isError, refetch } = useMileageProducts()
  const { data: overview } = useMileageOverview()
  const balance = data ? parseMoney(data.balance) : 0
  const [active, setActive] = useState('all')
  const [sort, setSort] = useState<'latest' | 'desc' | 'asc'>('latest')
  const [query, setQuery] = useState('')
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([])
  const [bump, setBump] = useState(false)
  const cartBtnRef = useRef<HTMLDivElement>(null)
  const flyId = useRef(0)
  const items = useCartStore((s) => s.items)
  const add = useCartStore((s) => s.add)
  const remove = useCartStore((s) => s.remove)
  const setQty = useCartStore((s) => s.setQty)
  // 도서·인터넷 강의(수강생 직접 입력) 구매 신청 모달 대상.
  const [flexTarget, setFlexTarget] = useState<MileageProduct | null>(null)

  // flexible 구매 확정 — 입력한 가격·링크로 장바구니에 담는다.
  const confirmFlexible = (price: number, link: string) => {
    if (!flexTarget) return
    add({
      productId: flexTarget.id,
      name: flexTarget.name,
      price,
      icon: flexTarget.icon,
      tone: flexTarget.tone,
      imageUrl: flexTarget.imageUrl,
      flexible: true,
      link,
    })
    setFlexTarget(null)
  }

  const q = query.trim().toLowerCase()
  const visible = (data?.products ?? [])
    .filter((p) => active === 'all' || p.categoryKey === active)
    .filter((p) => !q || p.name.toLowerCase().includes(q))
    .sort((a, b) =>
      sort === 'latest'
        ? 0
        : sort === 'desc'
          ? parseMoney(b.price) - parseMoney(a.price)
          : parseMoney(a.price) - parseMoney(b.price),
    )
  const limits: MileageLimit[] = overview?.limits ?? []
  const count = cartCount(items)
  const total = cartTotal(items)

  // 담기 → 아이콘이 장바구니로 날아가고 store에 추가
  const handleAdd = (
    e: React.MouseEvent<HTMLButtonElement>,
    p: MileageProduct,
  ) => {
    const cardEl = e.currentTarget.closest('[data-product-card]')
    const iconEl = cardEl?.querySelector('[data-cart-img]')
    // 카드에 이미 로드된 상품 이미지(object URL)를 그대로 날린다.
    const imageSrc = iconEl?.querySelector('img')?.getAttribute('src') ?? null
    const cartBtn = cartBtnRef.current
    add({
      productId: p.id,
      name: p.name,
      price: parseMoney(p.price),
      icon: p.icon,
      tone: p.tone,
      imageUrl: p.imageUrl,
    })
    if (iconEl && cartBtn) {
      const r = iconEl.getBoundingClientRect()
      const c = cartBtn.getBoundingClientRect()
      const SIZE = 64 // FlyingIcon size-16
      const id = ++flyId.current
      setFlyingItems((prev) => [
        ...prev,
        {
          id,
          startX: r.left + r.width / 2 - SIZE / 2,
          startY: r.top + r.height / 2 - SIZE / 2,
          endX: c.left + c.width / 2 - SIZE / 2,
          endY: c.top + c.height / 2 - SIZE / 2,
          icon: p.icon,
          tone: p.tone,
          imageSrc,
        },
      ])
      window.setTimeout(() => {
        setFlyingItems((prev) => prev.filter((f) => f.id !== id))
        setBump(true)
        window.setTimeout(() => setBump(false), 300)
      }, 900)
    }
  }

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={refetch}
      skeleton={<SkeletonCards count={6} />}
      errorTitle="상품을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
    >
      {data && (
        <div className="flex flex-col gap-5 pb-28">
          {/* 뒤로 — 마일리지 랜딩 */}
          <button
            type="button"
            onClick={() => onView(null)}
            className="text-fg-muted hover:text-fg flex w-fit items-center gap-1 text-[13px] font-medium"
          >
            <ArrowLeft className="size-4" /> 마일리지
          </button>

          {/* 타입별 한도 카드(도서·강의·기프티콘) */}
          {limits.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {limits.map((l) => {
                const Icon = limitIcon(l.label)
                const remaining = Math.max(0, l.total - l.used)
                return (
                  <section
                    key={l.label}
                    className={cn(card, 'flex flex-col gap-2.5')}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-bold',
                          TONE_SOFT[l.tone],
                        )}
                      >
                        <Icon className="size-3.5" />
                        {l.label}
                      </span>
                      <span className="text-fg-subtle text-[11px]">
                        한도 {l.total.toLocaleString()}M
                      </span>
                    </div>
                    <span className="text-fg text-[18px] font-bold">
                      {remaining.toLocaleString()}M{' '}
                      <span className="text-fg-subtle text-[12px] font-normal">
                        추가 신청 가능
                      </span>
                    </span>
                    <span className="text-fg-subtle text-[11px]">
                      사용 {l.used.toLocaleString()}M · {l.status.label}
                    </span>
                  </section>
                )
              })}
            </div>
          )}

          {/* 카테고리 필터 */}
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

          {/* 정렬 + 검색 */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {SORTS.map((s) => {
                const on = s.key === sort
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSort(s.key)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                      on
                        ? 'bg-brand text-white'
                        : 'border-border text-fg-muted hover:bg-surface-muted border',
                    )}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="검색어 입력"
              ariaLabel="상품 검색"
              // 옆 분류 칩과 높이를 맞춘다 — 이 줄만 목록 위 필터 바보다 낮다.
              className="h-8 w-52 gap-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((p) => {
              const Icon = PRODUCT_ICON[p.icon]
              // 도서·인터넷 강의는 수강생이 구매 시 링크·가격을 직접 입력(flexible).
              const flexible = p.priceType === '직접 입력'
              const unit = parseMoney(p.price)
              const affordable = flexible || unit <= balance
              const cartItem = items.find((i) => i.productId === p.id)
              const qty = cartItem?.quantity ?? 0
              const inCart = qty > 0
              // 지갑 잔액 내에서만 수량 추가 허용(장바구니 전체 합계 기준).
              const canAddMore = total + unit <= balance
              return (
                <section key={p.id} data-product-card className={productCard}>
                  {/* 상품 이미지 — 흰 배경에 전체가 보이도록 contain */}
                  <div
                    data-cart-img
                    className="bg-surface flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl"
                  >
                    <ProductImage
                      url={p.imageUrl}
                      className="size-full object-contain"
                      fallback={
                        <span
                          className={cn(
                            'flex size-full items-center justify-center',
                            TONE_SOFT[p.tone],
                          )}
                        >
                          <Icon className="size-12" />
                        </span>
                      }
                    />
                  </div>

                  {/* 이름 · 가격 */}
                  <div className="flex flex-1 flex-col gap-1.5">
                    <h3 className="text-fg text-[14px] leading-snug font-bold">
                      {p.name}
                    </h3>
                    <span className="text-brand text-[17px] font-extrabold tabular-nums">
                      {flexible ? '가격 직접 입력' : p.price}
                    </span>
                  </div>

                  {/* 액션 — 담기 전: 담기 버튼 / 담기 후: 수량 스테퍼 */}
                  {flexible ? (
                    <button
                      type="button"
                      onClick={() => setFlexTarget(p)}
                      className="bg-brand hover:bg-brand/90 flex h-11 items-center justify-center gap-1.5 rounded-xl text-[14px] font-bold text-white transition-colors"
                    >
                      <ShoppingCart className="size-4" />
                      구매 신청
                    </button>
                  ) : inCart ? (
                    <div className="flex items-center justify-center gap-5">
                      <button
                        type="button"
                        aria-label="수량 줄이기"
                        onClick={() =>
                          qty <= 1 ? remove(p.id) : setQty(p.id, qty - 1)
                        }
                        className="bg-brand hover:bg-brand/90 flex size-10 items-center justify-center rounded-full text-white transition-colors"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="text-fg min-w-[2ch] text-center text-[16px] font-bold tabular-nums">
                        {qty}
                      </span>
                      <button
                        type="button"
                        aria-label="수량 늘리기"
                        onClick={() => setQty(p.id, qty + 1)}
                        disabled={!canAddMore}
                        className="bg-brand hover:bg-brand/90 disabled:bg-surface-muted disabled:text-fg-subtle flex size-10 items-center justify-center rounded-full text-white transition-colors disabled:cursor-not-allowed"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => affordable && handleAdd(e, p)}
                      disabled={!affordable}
                      className={cn(
                        'flex h-11 items-center justify-center gap-1.5 rounded-xl text-[14px] font-bold transition-colors',
                        affordable
                          ? 'bg-brand hover:bg-brand/90 text-white'
                          : 'bg-surface-muted text-fg-subtle cursor-not-allowed',
                      )}
                    >
                      <ShoppingCart className="size-4" />
                      {affordable ? '담기' : '잔액 부족'}
                    </button>
                  )}
                </section>
              )
            })}
          </div>

          {/* 날아가는 아이콘 */}
          {flyingItems.map((f) => (
            <FlyingIcon key={f.id} item={f} />
          ))}

          {/* Floating 장바구니 + 호버 미리보기 */}
          <div ref={cartBtnRef} className="group fixed right-8 bottom-8 z-50">
            {/* 호버 시 담긴 상품 미리보기(이전 LMS cart-hover-popup) */}
            <div className="bg-surface invisible absolute right-0 bottom-[calc(100%+12px)] w-72 translate-y-2 rounded-2xl p-3 opacity-0 shadow-[0px_12px_32px_0px_rgba(18,23,38,0.18)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-fg text-[13px] font-bold">장바구니</span>
                <span className="text-fg-subtle text-[11px]">{count}개</span>
              </div>
              {items.length === 0 ? (
                <p className="text-fg-subtle py-6 text-center text-[12px]">
                  장바구니가 비어 있습니다.
                </p>
              ) : (
                <>
                  <div className="flex max-h-60 flex-col gap-0.5 overflow-y-auto">
                    {items.map((i) => {
                      const Icon = PRODUCT_ICON[i.icon]
                      return (
                        <div
                          key={i.productId}
                          className="flex items-center gap-2.5 rounded-lg px-1 py-1.5"
                        >
                          <span
                            className={cn(
                              'flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg',
                              !i.imageUrl && TONE_SOFT[i.tone],
                            )}
                          >
                            <ProductImage
                              url={i.imageUrl}
                              className="size-full object-cover"
                              fallback={<Icon className="size-[17px]" />}
                            />
                          </span>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="text-fg truncate text-[12px] font-semibold">
                              {i.name}
                            </span>
                            <span className="text-brand text-[11px] font-bold">
                              {(i.price * i.quantity).toLocaleString()}M
                            </span>
                          </div>
                          <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-0.5 text-[10px] font-bold">
                            ×{i.quantity}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="border-divider mt-2 flex items-center justify-between border-t px-1 pt-2">
                    <span className="text-fg-subtle text-[11px]">합계</span>
                    <span className="text-fg text-[14px] font-bold">
                      {total.toLocaleString()}M
                    </span>
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={() => onView('cart')}
                disabled={count === 0}
                className={buttonClass({
                  size: 'md',
                  className: 'mt-2 w-full',
                })}
              >
                장바구니로 이동 →
              </button>
            </div>
            {/* 버튼 */}
            <button
              type="button"
              onClick={() => onView('cart')}
              className={cn(
                'bg-brand-deep flex items-center gap-3 rounded-2xl px-5 py-3.5 text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)] transition-transform',
                bump && 'scale-110',
              )}
            >
              <div className="relative">
                <ShoppingCart className="size-6" />
                {count > 0 && (
                  <span className="bg-accent-strong absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full text-[11px] font-bold text-white">
                    {count}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[11px] text-white/70">장바구니</span>
                <span className="text-[14px] font-bold">
                  {total.toLocaleString()}M
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
      <FlexiblePurchaseModal
        open={!!flexTarget}
        productName={flexTarget?.name ?? ''}
        balance={balance}
        onClose={() => setFlexTarget(null)}
        onConfirm={confirmFlexible}
      />
    </DataBoundary>
  )
}
