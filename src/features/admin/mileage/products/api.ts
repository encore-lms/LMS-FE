import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mileageProductsKeys } from './queryKeys'
import type { Product, ProductsData, ProductType } from './types'

// BE 운영 상품 응답(AdminMileageProductDtos.ListResponse, LMS-BE #71)
interface BeItem {
  id: string
  name: string
  productType: ProductType
  price: number
  status: string
  hasImage: boolean
  imageUrl: string | null
  referenced?: boolean // 구매 이력 존재 — 물리 삭제 불가(삭제 버튼 숨김)
}
interface BeListResponse {
  items: BeItem[]
  total: number
}

// 이전 LMS 정본 표기 — 기프티콘(COUPON)/도서(GOODS)/인터넷 강의(ETC). 저장 enum은 유지.
const EMOJI: Record<ProductType, string> = {
  COUPON: '🎁',
  GOODS: '📚',
  ETC: '🎬',
}
export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  COUPON: '기프티콘',
  GOODS: '도서',
  ETC: '인터넷 강의',
}
const TYPES: ProductType[] = ['COUPON', 'GOODS', 'ETC']

// BE 응답 → 운영 화면 ProductsData(부가 필드는 매핑 기본값)
function toProductsData(be: BeListResponse): ProductsData {
  const products: Product[] = be.items.map((it, idx) => ({
    id: it.id,
    emoji: EMOJI[it.productType] ?? '🎁',
    type: it.productType,
    name: it.name,
    // 이전 LMS 정본 — 기프티콘만 고정가, 도서·인터넷 강의는 수강생이 가격 직접 입력(flexible).
    priceMode: it.productType === 'COUPON' ? 'fixed' : 'flexible',
    price: it.price ? it.price.toLocaleString() : null,
    order: idx,
    salesCount: 0,
    active: it.status === 'ACTIVE',
    referenced: it.referenced ?? false,
    imageUrl: it.imageUrl,
  }))
  return {
    course: '',
    cohortLabel: '',
    total: be.total,
    typeCounts: [
      { type: 'all', label: '전체', count: products.length },
      ...TYPES.map((t) => ({
        type: t,
        label: PRODUCT_TYPE_LABEL[t],
        count: products.filter((p) => p.type === t).length,
      })),
    ],
    products,
    // 이전 LMS 정본 — 기프티콘만 고정가, 도서·인터넷 강의는 수강생이 링크·가격 제출.
    typePricing: TYPES.map((t) => ({
      type: t,
      mode: t === 'COUPON' ? '고정가' : '수강생 직접 입력',
      note:
        t === 'COUPON'
          ? '결제 시 마일리지 차감 · 승인 후 매니저가 일괄 전송'
          : '수강생이 구매 링크·가격 제출 → 매니저 확인 후 구매',
    })),
  }
}

export function useMileageProducts() {
  return useQuery({
    queryKey: mileageProductsKeys.list(),
    queryFn: () =>
      apiClient
        .get<BeListResponse>('/admin/mileage/products')
        .then((r) => toProductsData(r.data)),
  })
}

export interface UpsertInput {
  mode: 'create' | 'edit'
  id?: string
  name: string
  productType: ProductType
  price: number
  status: string
}

// 등록(POST)/수정(PUT) — 생성 시 BE가 새 id 반환. 성공 시 목록 무효화.
export function useUpsertProduct() {
  const qc = useQueryClient()
  return useMutation<string, Error, UpsertInput>({
    mutationFn: async (input) => {
      const body = {
        name: input.name,
        productType: input.productType,
        price: input.price,
        status: input.status,
      }
      if (input.mode === 'edit' && input.id) {
        await apiClient.put(`/admin/mileage/products/${input.id}`, body)
        return input.id
      }
      const res = await apiClient.post<string>('/admin/mileage/products', body)
      return res.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mileageProductsKeys.list() })
    },
  })
}

// 이미지 업로드(multipart) — 성공 시 목록·학생 상품 무효화
export function useUploadProductImage() {
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string; file: File }>({
    mutationFn: async ({ id, file }) => {
      const fd = new FormData()
      fd.append('file', file)
      await apiClient.postForm(`/admin/mileage/products/${id}/image`, fd)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mileageProductsKeys.list() })
    },
  })
}

// 삭제(비활성) — DELETE. 성공 시 목록 무효화.
export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/admin/mileage/products/${id}`)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mileageProductsKeys.list() })
    },
  })
}
