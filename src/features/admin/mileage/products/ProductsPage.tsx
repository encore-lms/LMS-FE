import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronLeft, Info, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { MileageTabs } from '../MileageTabs'
import { useMileageProducts } from './api'
import type { Product, ProductType } from './types'

const PRICE_MODE_LABEL = { fixed: '고정가', flexible: '수강생 입력' } as const

type TypeFilter = 'all' | ProductType

// 마일리지 상품 관리 (/admin/mileage/products) — 운영(MANAGER/ADMIN) 신규.
// Figma 1246:7113. 상품 카드 그리드 + 타입별 가격 방식(고정가/유연가) + 참조 중 삭제 제한.
// 상품 등록·수정·삭제 폼 모달(1306:8434)은 별도 — 토스트 + TODO(P0_16).
export default function ProductsPage() {
  usePageHeader(
    '마일리지 상품 관리',
    '상품 등록·수정·삭제 · 타입별 가격 방식 분기 · 참조 중 삭제 제한',
  )
  const { data, isPending, isError, refetch } = useMileageProducts()
  const toast = useToast()
  const [type, setType] = useState<TypeFilter>('all')

  const products = useMemo(() => data?.products ?? [], [data])
  const filtered = useMemo(
    () => products.filter((p) => type === 'all' || p.type === type),
    [products, type],
  )

  if (isPending) {
    return <div className="text-fg-muted p-8">상품을 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="상품을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const { course, cohortLabel, total, typeCounts, typePricing } = data

  return (
    <div className="p-8">
      {/* 브레드크럼 */}
      <Link
        to="/admin/mileage"
        className="text-fg-muted hover:text-fg inline-flex items-center gap-1 text-[13px]"
      >
        <ChevronLeft className="h-4 w-4" />
        마일리지 관리
        <span className="text-fg-subtle">› 상품 관리</span>
      </Link>

      {/* 클러스터 탭 + 과정/기수 */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <MileageTabs />
        <div className="flex items-center gap-2">
          <select
            aria-label="과정"
            defaultValue="ai"
            className="border-border text-fg-muted focus:border-brand h-9 rounded-lg border bg-white px-3 text-sm outline-none"
          >
            <option value="ai">{course}</option>
          </select>
          <select
            aria-label="기수"
            defaultValue="22"
            className="border-border text-fg-muted focus:border-brand h-9 rounded-lg border bg-white px-3 text-sm outline-none"
          >
            <option value="22">{cohortLabel}</option>
          </select>
        </div>
      </div>

      {/* 타입 필터 칩 + 상품 등록 */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-fg-muted text-xs">총 {total}개 상품</span>
          {typeCounts.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => setType(t.type)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors',
                type === t.type
                  ? 'bg-brand text-white'
                  : 'border-border text-fg-muted hover:bg-surface-muted border',
              )}
            >
              {t.label}
              <span
                className={cn(
                  'rounded px-1 text-[11px]',
                  type === t.type ? 'bg-white/20' : 'bg-surface-muted',
                )}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          // TODO: 상품 등록 폼 모달(이미지·타입·가격·순서·활성, P0_16)
          onClick={() => toast.info('상품 등록은 준비 중입니다.')}
          className="bg-brand hover:bg-brand/90 inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-semibold text-white transition-colors"
        >
          <Plus className="h-4 w-4" />
          상품 등록
        </button>
      </div>

      {/* 상품 카드 그리드 */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onEdit={() => toast.info(`${p.name} 수정은 준비 중입니다.`)}
            onDelete={() =>
              p.referenced
                ? undefined
                : toast.info(`${p.name} 삭제는 준비 중입니다.`)
            }
          />
        ))}
      </div>

      {/* 상품 타입별 가격 방식 */}
      <div className="border-border bg-surface mt-6 rounded-xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-fg text-sm font-bold">상품 타입별 가격 방식</p>
            <p className="text-fg-muted mt-0.5 text-xs">
              §20 정본 — 타입별 입력 방식과 처리 분기
            </p>
          </div>
          <span className="text-fg-subtle inline-flex items-center gap-1 text-xs">
            <Info className="h-3.5 w-3.5" />
            이미지: JPG·PNG·WEBP / 최대 5MB
          </span>
        </div>
        <ul className="mt-3 flex flex-col">
          {typePricing.map((t) => (
            <li
              key={t.type}
              className="border-divider flex flex-wrap items-center gap-2 border-t py-2.5 text-[13px] first:border-t-0"
            >
              <StatusBadge label={t.type} tone="neutral" />
              <span className="text-fg font-semibold">{t.mode}</span>
              <span className="text-fg-muted">{t.note}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 상품 등록/관리 정책 §20 */}
      <div className="border-info/30 bg-info-bg/50 mt-6 rounded-xl border p-5">
        <p className="text-info inline-flex items-center gap-1.5 text-base font-bold">
          <Info className="h-4 w-4" />
          상품 등록/관리 정책 · §20 완료 기준
        </p>
        <ul className="text-info/90 mt-2 flex flex-col gap-1.5 text-[13px] leading-relaxed">
          <li>
            상품 폼 입력 — 이미지·타입·상품명·가격(고정가 한정)·정렬 순서·활성
            상태
          </li>
          <li>
            참조 중 상품(구매 요청 이력 존재)은 삭제 제한 — 비활성으로만 전환
            가능
          </li>
          <li>
            유연가 상품(BOOK·LECTURE)은 매니저가 가격 입력 안 함 — 수강생 구매
            시 입력
          </li>
        </ul>
      </div>
    </div>
  )
}

// 상품 카드.
function ProductCard({
  product: p,
  onEdit,
  onDelete,
}: {
  product: Product
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="border-border bg-surface flex flex-col overflow-hidden rounded-xl border">
      <div className="bg-surface-muted flex h-24 items-center justify-center text-4xl">
        {p.emoji}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5">
          <StatusBadge label={p.type} tone="neutral" />
          <StatusBadge
            label={p.active ? '활성' : '비활성'}
            tone={p.active ? 'success' : 'neutral'}
          />
        </div>
        <p className="text-fg mt-2 text-[14px] font-bold">{p.name}</p>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-fg-subtle text-[11px]">
            {PRICE_MODE_LABEL[p.priceMode]}
          </span>
          <span className="text-fg text-[15px] font-bold tabular-nums">
            {p.price ? `${p.price} M` : '유연가'}
          </span>
        </div>
        <div className="text-fg-subtle mt-2 flex items-center justify-between text-[11px]">
          <span>순서 {p.order}</span>
          <span>판매 {p.salesCount}건</span>
        </div>
        <div className="border-divider mt-3 flex items-center gap-3 border-t pt-3">
          <button
            type="button"
            onClick={onEdit}
            className="text-brand text-[13px] font-semibold hover:underline"
          >
            수정
          </button>
          {p.referenced ? (
            <span className="text-fg-subtle inline-flex items-center gap-1 text-[12px]">
              <Info className="h-3.5 w-3.5" />
              참조 중 — 삭제 불가
            </span>
          ) : (
            <button
              type="button"
              onClick={onDelete}
              className="text-danger text-[13px] font-semibold hover:underline"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
