import { useSearchParams } from 'react-router-dom'
import { ShoppingBag, Star } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useMileageOverview } from '../api/mileage'
import { parseMoney } from './store'
import { LedgerView } from './LedgerView'
import { OrdersView } from './OrdersView'
import { ShopView } from './ShopView'
import { CartView } from './CartView'

// 내 마일리지 (/student/mileage) — 이전 LMS 레이아웃 그대로.
// 랜딩: 보라 신용카드 + '마일리지 사용하기'(→상품) + 내역/구매요청 2탭 + 하단 안내.
// ?view=shop|cart 는 상품/장바구니 전체 뷰(카드 없이). ?tab=requests 는 랜딩의 구매요청 탭.
export default function MileagePage() {
  const [params, setParams] = useSearchParams()
  const view = params.get('view') // 없음=랜딩, 'shop', 'cart'
  const tab = params.get('tab') === 'requests' ? 'requests' : 'history'
  const setView = (v: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (!v) next.delete('view')
        else next.set('view', v)
        next.delete('tab')
        return next
      },
      { replace: true },
    )
  const setTab = (t: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (t === 'history') next.delete('tab')
        else next.set('tab', t)
        return next
      },
      { replace: true },
    )

  const { data } = useMileageOverview()
  const balance = data ? parseMoney(data.balance) : 0
  usePageHeader('마일리지', '적립 내역을 확인하고 상품을 교환하세요.')

  if (view === 'shop')
    return (
      <div className="p-8">
        <ShopView onView={setView} />
      </div>
    )
  if (view === 'cart')
    return (
      <div className="p-8">
        <CartView onView={setView} />
      </div>
    )

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      {/* 보라 신용카드(가운데) */}
      <div className="flex w-full max-w-[460px] flex-col items-center">
        <div className="from-brand to-brand-deep relative aspect-[1.62/1] w-full overflow-hidden rounded-[20px] bg-gradient-to-br p-6 text-white shadow-[0_12px_32px_rgba(18,23,38,0.24)]">
          <div className="absolute -top-10 -right-8 size-40 rounded-full bg-white/[0.06]" />
          <div className="absolute -bottom-8 -left-6 size-32 rounded-full bg-white/[0.05]" />
          <div className="relative flex h-full flex-col justify-between">
            {/* 상단: 브랜드 + 금색 칩 */}
            <div className="flex items-start justify-between">
              <div className="flex flex-col leading-tight">
                <span className="text-[15px] font-bold tracking-[0.14em]">
                  PLAYDATA
                </span>
                <span className="text-[10px] font-semibold tracking-[0.3em] text-white/50">
                  MILEAGE
                </span>
              </div>
              <div
                className="relative h-8 w-11 rounded-md"
                style={{
                  background:
                    'linear-gradient(135deg,#e8d5a3 0%,#c9a84c 50%,#e8d5a3 100%)',
                }}
              >
                <div className="absolute top-1/2 right-0 left-0 h-px bg-black/15" />
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-black/15" />
              </div>
            </div>
            {/* 중앙: 포인트 */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold tracking-wider text-white/50">
                TOTAL POINTS
              </span>
              <span className="text-[38px] leading-none font-bold">
                {balance.toLocaleString()}
                <small className="ml-1 text-[17px] font-semibold">P</small>
              </span>
            </div>
            {/* 하단: 만료 + 별 */}
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] tracking-wider text-white/45">
                  VALID THRU
                </span>
                <span className="text-[12px] font-semibold text-white/85">
                  종강월 말일
                </span>
              </div>
              <div className="flex gap-0.5 text-white/35">
                <Star className="size-3 fill-current" />
                <Star className="size-3 fill-current" />
                <Star className="size-3 fill-current" />
              </div>
            </div>
          </div>
        </div>

        {/* 안내 + 사용하기 */}
        <p className="text-fg-subtle mt-4 text-center text-[13px] leading-5">
          모든 마일리지는 종강일 기준 2주까지 사용 가능하며, 이후 자동
          소멸됩니다.
        </p>
        <button
          type="button"
          onClick={() => setView('shop')}
          className="bg-brand-deep hover:bg-brand-deep/90 mt-4 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[14px] font-bold text-white transition-colors"
        >
          <ShoppingBag className="size-[18px]" />
          마일리지 사용하기
        </button>
      </div>

      {/* 구분선 */}
      <div className="bg-divider h-px w-full" />

      {/* 탭 + 목록 */}
      <div className="flex w-full flex-col gap-5">
        <div className="bg-surface-muted flex w-fit gap-1 rounded-full p-1">
          {[
            { k: 'history', l: '마일리지 내역' },
            { k: 'requests', l: '구매 요청' },
          ].map((t) => {
            const on = tab === t.k
            return (
              <button
                key={t.k}
                type="button"
                onClick={() => setTab(t.k)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors',
                  on
                    ? 'bg-brand-deep text-white'
                    : 'text-fg-muted hover:text-fg',
                )}
              >
                {t.l}
              </button>
            )
          })}
        </div>
        {tab === 'requests' ? <OrdersView onView={setView} /> : <LedgerView />}
      </div>

      {/* 하단 안내(이전 LMS 3줄) */}
      <div className="text-fg-subtle flex w-full flex-col gap-1.5 text-[12px] leading-5">
        <p>· 마일리지 관련 내용은 현재 순으로 조회가 되고 있습니다.</p>
        <p>
          · 마일리지는{' '}
          <strong className="text-fg-muted font-semibold">
            종강일이 속한 달의 말일
          </strong>
          까지 사용 가능합니다.
        </p>
        <p>
          · 마일리지 관련하여 누락건이 있을 경우 증빙 자료와 함께 담당
          매니저님께 문의 부탁드립니다.
        </p>
      </div>
    </div>
  )
}
