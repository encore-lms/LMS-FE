import { useMemo, useState } from 'react'

import { Pencil, Plus, Trash2 } from 'lucide-react'
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

  const { total, typeCounts } = data ?? {
    total: 0,
    typeCounts: [],
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

        {/* 상품 카드 그리드 — 한 줄 5개 */}
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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

// 상품 카드 — 기본은 이미지·배지·이름·가격, 호버 시 이미지 위에 삭제/수정 버튼.
function ProductCard({
  product: p,
  onEdit,
  onDelete,
}: {
  product: Product
  onEdit: () => void
  onDelete: () => void
}) {
  const overlayBtn =
    'inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/15 px-4 py-2 text-[13px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30'
  return (
    <div className="group bg-surface flex flex-col overflow-hidden rounded-2xl shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
      {/* 이미지 + 호버 오버레이(삭제·수정) */}
      <div className="bg-surface relative flex aspect-square items-center justify-center overflow-hidden">
        <ProductImage
          url={p.imageUrl}
          className="size-full object-contain"
          fallback={<span className="text-5xl">{p.emoji}</span>}
        />
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {/* 참조 중(구매 이력 존재) 상품은 삭제 불가 — 수정만 노출 */}
          {!p.referenced && (
            <button type="button" onClick={onDelete} className={overlayBtn}>
              <Trash2 className="size-4" />
              삭제
            </button>
          )}
          <button type="button" onClick={onEdit} className={overlayBtn}>
            <Pencil className="size-4" />
            수정
          </button>
        </div>
      </div>
      {/* 내용 */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1.5">
          <StatusBadge label={PRODUCT_TYPE_LABEL[p.type]} tone="neutral" />
          <StatusBadge
            label={p.active ? '활성' : '비활성'}
            tone={p.active ? 'success' : 'neutral'}
          />
        </div>
        <p className="text-fg text-[15px] font-bold">{p.name}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-fg-subtle text-[12px]">상품 가격</span>
          <span className="text-fg text-[17px] font-bold tabular-nums">
            {p.priceMode === 'fixed' ? `${p.price ?? '0'} M` : '수강생 입력'}
          </span>
        </div>
      </div>
    </div>
  )
}
