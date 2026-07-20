import { useSearchParams } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { Skeleton } from '@/components/ui/Skeleton'
import { useMileageOverview } from '../api/mileage'
import { parseMoney } from './store'
import { useCartStore, cartCount } from './cartStore'
import { LedgerView } from './LedgerView'
import { OrdersView } from './OrdersView'
import { ShopView } from './ShopView'
import { CartView } from './CartView'

// 내 마일리지 (/student/mileage) — 이전 LMS처럼 단일 페이지.
// 상단 신용카드(잔액) 고정 + 4개 뷰 pill 전환(내역·구매요청·상품·장바구니) + 하단 안내.
// 상품/장바구니/내역 라우트는 ?view= 로 리다이렉트(routes.tsx).
const VIEWS = [
  { key: 'history', label: '마일리지 내역' },
  { key: 'orders', label: '구매 요청' },
  { key: 'shop', label: '상품 신청' },
  { key: 'cart', label: '장바구니' },
] as const
type ViewKey = (typeof VIEWS)[number]['key']

export default function MileagePage() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('view')
  const view = (VIEWS.some((v) => v.key === raw) ? raw : 'history') as ViewKey
  const setView = (v: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (v === 'history') next.delete('view')
        else next.set('view', v)
        return next
      },
      { replace: true },
    )

  const { data, isPending } = useMileageOverview()
  const balance = data ? parseMoney(data.balance) : 0
  const earned = data?.stats.find((s) => s.key === 'earned')?.value ?? '0'
  const spent = data?.stats.find((s) => s.key === 'spent')?.value ?? '0'
  const cartN = cartCount(useCartStore((s) => s.items))

  usePageHeader('마일리지', '적립 내역을 확인하고 상품을 교환하세요.')

  return (
    <div
      className={cn(
        'flex flex-col gap-5 p-8',
        (view === 'shop' || view === 'cart') && 'pb-32',
      )}
    >
      {/* 신용카드 — 잔액·누적 적립/사용·만료(이전 LMS 신용카드 메타포) */}
      {isPending && !data ? (
        <Skeleton className="h-[188px] w-full rounded-3xl" />
      ) : (
        <div className="from-brand to-brand-deep relative overflow-hidden rounded-3xl bg-gradient-to-br p-7 text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.22)]">
          <div className="absolute -top-12 -right-10 size-48 rounded-full bg-white/10" />
          <div className="absolute top-16 right-20 size-28 rounded-full bg-white/5" />
          <div className="relative flex flex-col gap-7">
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
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold tracking-wider text-white/70">
                BALANCE · 사용 가능 마일리지
              </span>
              <span className="text-[44px] leading-none font-bold">
                {balance.toLocaleString()}
                <span className="ml-1 text-[20px]">M</span>
              </span>
              {data?.balanceDelta && (
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
            <div className="flex gap-7 border-t border-white/15 pt-4">
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
          </div>
        </div>
      )}

      {/* 뷰 전환 pill — 내역 · 구매 요청 · 상품 신청 · 장바구니(N) */}
      <div className="flex flex-wrap items-center gap-2">
        {VIEWS.map((v) => {
          const on = v.key === view
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              aria-current={on ? 'page' : undefined}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors',
                on
                  ? 'bg-brand-deep text-white'
                  : 'border-border text-fg-muted hover:bg-surface-muted border',
              )}
            >
              {v.label}
              {v.key === 'cart' && cartN > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[11px] font-bold',
                    on ? 'bg-white/20 text-white' : 'bg-brand/10 text-brand',
                  )}
                >
                  {cartN}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 활성 뷰 */}
      {view === 'history' && <LedgerView />}
      {view === 'orders' && <OrdersView onView={setView} />}
      {view === 'shop' && <ShopView onView={setView} />}
      {view === 'cart' && <CartView onView={setView} />}

      {/* 하단 안내(이전 LMS 만료 정책 문구) */}
      <p className="text-fg-subtle text-[11px] leading-5">
        · 마일리지는 종강일이 속한 달의 말일까지 사용 가능하며, 이후 자동
        소멸됩니다. 누락 건은 증빙과 함께 담당 매니저에게 문의해 주세요.
      </p>
    </div>
  )
}
