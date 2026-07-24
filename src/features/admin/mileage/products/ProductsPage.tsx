import { useMemo, useState } from 'react'

import { Info, Plus } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import {
  ActionModal,
  type ActionModalSpec,
} from '@/features/admin/settings/ActionModal'
import { MileageTabs } from '../MileageTabs'
import { ProductFormModal } from './ProductFormModal'
import {
  PRODUCT_TYPE_LABEL,
  useDeleteProduct,
  useMileageProducts,
  useUpsertProduct,
  useUploadProductImage,
} from './api'
import { ProductImage } from './ProductImage'
import type { Product } from './types'
import { SkeletonCards } from '@/components/ui/Skeleton'

const PRICE_MODE_LABEL = { fixed: '고정가', flexible: '수강생 입력' } as const

// 마일리지 상품 관리 (/admin/mileage/products) — 운영(MANAGER/ADMIN) 신규.
// Figma 1246:7113. 상품 카드 그리드 + 타입별 가격 방식(고정가/유연가) + 참조 중 삭제 제한.
// 상품 등록·수정·삭제 폼 모달(1306:8434)은 별도 — 토스트 + TODO(P0_16).
export default function ProductsPage() {
  usePageHeader(
    '마일리지 상품 관리',
    '마일리지로 구매할 수 있는 상품을 등록하고 관리합니다',
  )
  const { data, isPending, isError, refetch } = useMileageProducts()
  const upsert = useUpsertProduct()
  const uploadImage = useUploadProductImage()
  const remove = useDeleteProduct()
  const toast = useToast()
  const [type, setType] = useSearchParamState('type', 'all')
  // 상품 등록·수정 폼 모달(formProduct=null → 등록).
  const [formOpen, setFormOpen] = useState(false)
  const [formProduct, setFormProduct] = useState<Product | null>(null)
  // 삭제 확인 모달 대상.
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const products = useMemo(() => data?.products ?? [], [data])
  const filtered = useMemo(
    () => products.filter((p) => type === 'all' || p.type === type),
    [products, type],
  )

  const { total, typeCounts, typePricing } = data ?? {
    total: 0,
    typeCounts: [],
    typePricing: [],
  }

  const deleteSpec: ActionModalSpec | null = deleteTarget
    ? {
        title: '상품 삭제',
        subtitle: `${deleteTarget.name} 상품을 삭제합니다.`,
        rows: [
          {
            label: '상품',
            value: `[${PRODUCT_TYPE_LABEL[deleteTarget.type]}] ${deleteTarget.name}`,
          },
          { label: '판매', value: `${deleteTarget.salesCount}건` },
          { label: '주의', value: '삭제 후 복구할 수 없습니다.' },
        ],
        confirmLabel: '삭제',
      }
    : null

  return (
    <div className="p-8">
      {/* 브레드크럼 */}
      {/* 클러스터 탭 — 상품 카탈로그는 전체 과정 공용(기수 무관) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MileageTabs />
      </div>

      <DataBoundary
        isPending={isPending}
        isError={isError || !data}
        onRetry={() => refetch()}
        skeleton={<SkeletonCards count={6} />}
        errorTitle="상품을 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
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
                    ? 'bg-brand text-on-color'
                    : 'border-border text-fg-muted hover:bg-surface-muted border',
                )}
              >
                {t.label}
                <span
                  className={cn(
                    'rounded px-1 text-[11px]',
                    type === t.type ? 'bg-surface/20' : 'bg-surface-muted',
                  )}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setFormProduct(null)
              setFormOpen(true)
            }}
            className="bg-brand hover:bg-brand/90 text-on-color inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-semibold transition-colors"
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
              onEdit={() => {
                setFormProduct(p)
                setFormOpen(true)
              }}
              onDelete={() => setDeleteTarget(p)}
            />
          ))}
        </div>

        {/* 상품 타입별 가격 방식 */}
        <div className="border-border bg-surface mt-6 rounded-xl border p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-fg text-sm font-bold">상품 타입별 가격 방식</p>
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
                <StatusBadge label={PRODUCT_TYPE_LABEL[t.type]} tone="neutral" />
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
            상품 등록/관리 정책 · 완료 기준
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
              도서·인터넷 강의는 매니저가 가격 입력 안 함 — 수강생이 구매 링크와
              가격을 제출
            </li>
          </ul>
        </div>

        {/* 상품 등록·수정 폼 모달 (Figma 1306:8434) */}
        <ProductFormModal
          open={formOpen}
          product={formProduct}
          onClose={() => setFormOpen(false)}
          pending={upsert.isPending || uploadImage.isPending}
          onSubmit={async (mode, values, file) => {
            try {
              const id = await upsert.mutateAsync({
                mode,
                id: formProduct?.id,
                name: values.name,
                productType: values.type,
                price: Number(values.price.replace(/[^\d]/g, '')) || 0,
                status: values.active ? 'ACTIVE' : 'INACTIVE',
              })
              if (file) await uploadImage.mutateAsync({ id, file })
              toast.success(
                mode === 'edit'
                  ? '상품을 수정했습니다.'
                  : '상품을 등록했습니다.',
              )
              setFormOpen(false)
            } catch {
              toast.danger(
                '상품 저장에 실패했어요. 잠시 후 다시 시도해 주세요.',
              )
            }
          }}
        />

        {/* 상품 삭제 확인 — 운영 액션 모달 공통 재사용 */}
        <ActionModal
          spec={deleteSpec}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (!deleteTarget) return
            const name = deleteTarget.name
            remove.mutate(deleteTarget.id, {
              onSuccess: () => {
                setDeleteTarget(null)
                toast.success(`${name} 상품을 삭제했습니다.`)
              },
              onError: () => {
                setDeleteTarget(null)
                toast.danger(
                  '상품 삭제에 실패했어요. 잠시 후 다시 시도해 주세요.',
                )
              },
            })
          }}
        />
      </DataBoundary>
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
      <div className="bg-surface-muted flex h-24 items-center justify-center overflow-hidden text-4xl">
        <ProductImage
          url={p.imageUrl}
          className="size-full object-cover"
          fallback={<span>{p.emoji}</span>}
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5">
          <StatusBadge label={PRODUCT_TYPE_LABEL[p.type]} tone="neutral" />
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
