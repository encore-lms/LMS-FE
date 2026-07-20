import { useState } from 'react'
import {
  Book,
  Coffee,
  Gift,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Empty } from '@/components/ui/Empty'
import { buttonClass } from '@/components/ui/buttonClass'
import { useToast } from '@/components/ui/use-toast'
import { useCreateMileageOrder, useMileageOverview } from '../api/mileage'
import { parseMoney } from './store'
import { useCartStore, cartTotal, type CartItem } from './cartStore'
import { ProductImage } from './components/ProductImage'
import { TONE_SOFT } from '@/shared/lib/tone'

// 마일리지 장바구니/결제 (/student/mileage/cart) — 이전 LMS MileageCart 흐름.
const PRODUCT_ICON: Record<CartItem['icon'], LucideIcon> = {
  book: Book,
  video: Video,
  cup: Coffee,
  gift: Gift,
}

export function CartView({ onView }: { onView: (v: string) => void }) {
  const toast = useToast()
  const { data } = useMileageOverview()
  const balance = data ? parseMoney(data.balance) : 0
  const items = useCartStore((s) => s.items)
  const setQty = useCartStore((s) => s.setQty)
  const remove = useCartStore((s) => s.remove)
  const create = useCreateMileageOrder()
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(items.map((i) => i.productId)),
  )

  const selectedItems = items.filter((i) => selected.has(i.productId))
  const total = cartTotal(selectedItems)
  const allSelected = items.length > 0 && selectedItems.length === items.length
  const over = total > balance

  const toggleAll = () =>
    setSelected(
      allSelected ? new Set() : new Set(items.map((i) => i.productId)),
    )
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const checkout = () => {
    if (selectedItems.length === 0 || over || create.isPending) return
    create.mutate(
      {
        items: selectedItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      },
      {
        onSuccess: () => {
          selectedItems.forEach((i) => remove(i.productId))
          toast.success(
            `${selectedItems.length}개 상품 구매를 요청했습니다. (${total.toLocaleString()}M 차감)`,
          )
          onView('history')
        },
        onError: () => toast.danger('결제에 실패했어요.'),
      },
    )
  }

  if (items.length === 0) {
    return (
      <Empty
        title="장바구니가 비어 있어요"
        description="상품 목록에서 원하는 상품을 담아보세요."
        action={
          <button
            type="button"
            onClick={() => onView('shop')}
            className={buttonClass({ size: 'md' })}
          >
            상품 보러 가기 →
          </button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-28">
      <button
        type="button"
        onClick={() => onView('shop')}
        className="text-fg-muted hover:text-fg flex w-fit items-center gap-1 text-[13px] font-medium"
      >
        ← 상품 더 담기
      </button>

      <div className="bg-surface flex flex-col gap-1 rounded-2xl p-5 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
        {/* 헤더 */}
        <div className="text-fg-subtle border-divider grid grid-cols-[40px_1fr_140px_120px_44px] items-center gap-3 border-b px-2 pb-3 text-[12px] font-semibold">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="accent-brand size-4"
          />
          <span>상품</span>
          <span className="text-center">수량</span>
          <span className="text-right">마일리지</span>
          <span />
        </div>
        {/* 목록 */}
        {items.map((i) => {
          const Icon = PRODUCT_ICON[i.icon]
          return (
            <div
              key={i.productId}
              className="border-divider grid grid-cols-[40px_1fr_140px_120px_44px] items-center gap-3 border-b px-2 py-3.5 last:border-b-0"
            >
              <input
                type="checkbox"
                checked={selected.has(i.productId)}
                onChange={() => toggle(i.productId)}
                className="accent-brand size-4"
              />
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px]',
                    !i.imageUrl && TONE_SOFT[i.tone],
                  )}
                >
                  <ProductImage
                    url={i.imageUrl}
                    className="size-full object-cover"
                    fallback={<Icon className="size-[20px]" />}
                  />
                </span>
                <span className="text-fg text-[14px] font-semibold">
                  {i.name}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setQty(i.productId, i.quantity - 1)}
                  className="border-border text-fg-muted flex size-7 items-center justify-center rounded-md border"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="text-fg w-6 text-center text-[14px] font-bold">
                  {i.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQty(i.productId, i.quantity + 1)}
                  className="border-border text-fg-muted flex size-7 items-center justify-center rounded-md border"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <span className="text-fg text-right text-[14px] font-bold">
                {(i.price * i.quantity).toLocaleString()}M
              </span>
              <button
                type="button"
                onClick={() => remove(i.productId)}
                aria-label="삭제"
                className="text-fg-subtle hover:text-danger flex items-center justify-center"
              >
                <Trash2 className="size-[18px]" />
              </button>
            </div>
          )
        })}
      </div>

      {over && (
        <div className="border-danger/40 bg-danger-bg/50 text-danger rounded-xl border p-3 text-[12px] font-semibold">
          ⓘ 선택 금액이 보유 마일리지({balance.toLocaleString()}M)를{' '}
          {(total - balance).toLocaleString()}M 초과했습니다 · 결제 불가
        </div>
      )}

      {/* 결제 바 */}
      <div className="bg-brand-deep fixed right-8 bottom-6 left-[232px] z-30 flex items-center justify-between rounded-2xl px-6 py-4 text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[11px] text-white/70">
              선택 {selectedItems.length}건 · 결제 금액
            </span>
            <span className="text-[22px] font-bold">
              {total.toLocaleString()}M
            </span>
          </div>
          <span className="text-[12px] text-white/70">
            결제 후 잔액 {(balance - total).toLocaleString()}M
          </span>
        </div>
        <button
          type="button"
          onClick={checkout}
          disabled={selectedItems.length === 0 || over || create.isPending}
          className="bg-brand flex items-center gap-2 rounded-lg px-6 py-2.5 text-[14px] font-bold disabled:opacity-50"
        >
          <ShoppingCart className="size-4" />
          {create.isPending ? '결제 중…' : '결제하기'}
        </button>
      </div>
    </div>
  )
}
