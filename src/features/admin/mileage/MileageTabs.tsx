import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'

// 마일리지 클러스터 공통 sub-nav — 5개 콘텐츠 탭(지급 내역·직접 지급·구매 요청·상품 관리·타입 한도).
// 아직 구현 안 된 탭은 비활성(disabled)으로 표시해 404를 막는다. 각 화면 구현 시 ready에 추가.
const TABS: { label: string; to: string; ready: boolean }[] = [
  { label: '지급 내역', to: '/admin/mileage/history', ready: true },
  { label: '직접 지급', to: '/admin/mileage/direct-pay', ready: true },
  { label: '구매 요청', to: '/admin/mileage/purchase-requests', ready: true },
  { label: '상품 관리', to: '/admin/mileage/products', ready: true },
  { label: '타입 한도', to: '/admin/mileage/type-limits', ready: true },
]

export function MileageTabs() {
  return (
    <div className="border-border bg-surface inline-flex flex-wrap gap-1 rounded-lg border p-1">
      {TABS.map((t) =>
        t.ready ? (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              cn(
                'rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                isActive
                  ? 'bg-brand text-white'
                  : 'text-fg-muted hover:text-fg',
              )
            }
          >
            {t.label}
          </NavLink>
        ) : (
          <span
            key={t.to}
            title="준비 중"
            className="text-fg-subtle cursor-not-allowed rounded-md px-3.5 py-1.5 text-[13px] font-semibold"
          >
            {t.label}
          </span>
        ),
      )}
    </div>
  )
}
