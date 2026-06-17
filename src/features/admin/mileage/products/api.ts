import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mileageProductsKeys } from './queryKeys'
import type { Product, ProductsData } from './types'

// 마일리지 상품 목록 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useMileageProducts() {
  return useQuery({
    queryKey: mileageProductsKeys.list(),
    queryFn: () =>
      apiClient
        .get<ProductsData>('/admin/mileage/products')
        .then((r) => r.data),
  })
}

// 등록/수정/삭제 후 총계·타입 카운트를 재계산한다(목록 갱신).
function recount(products: Product[], prev: ProductsData): ProductsData {
  return {
    ...prev,
    products,
    total: products.length,
    typeCounts: prev.typeCounts.map((tc) =>
      tc.type === 'all'
        ? { ...tc, count: products.length }
        : { ...tc, count: products.filter((p) => p.type === tc.type).length },
    ),
  }
}

// 상품 등록·수정 훅 — 성공 시 목록 캐시에 추가(신규) 또는 교체(수정) + 총계 재계산.
// BE 계약(P0_16 MileageProduct) 미확정 → 네트워크 없이 클라이언트 낙관 반영으로 시뮬레이션한다.
// 계약 확정 시 mutationFn 을 apiClient.post/patch('/admin/mileage/products', ...) 로 교체한다.
export function useUpsertProduct() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, Product>({
    mutationFn: async () => {},
    onSuccess: (_result, product) => {
      queryClient.setQueryData<ProductsData>(
        mileageProductsKeys.list(),
        (prev) => {
          if (!prev) return prev
          const exists = prev.products.some((p) => p.id === product.id)
          const products = exists
            ? prev.products.map((p) => (p.id === product.id ? product : p))
            : [product, ...prev.products]
          return recount(products, prev)
        },
      )
    },
  })
}

// 상품 삭제 훅 — 성공 시 목록 캐시에서 제거 + 총계 재계산(참조 중 상품은 화면에서 사전 차단).
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async () => {},
    onSuccess: (_result, id) => {
      queryClient.setQueryData<ProductsData>(
        mileageProductsKeys.list(),
        (prev) =>
          prev
            ? recount(
                prev.products.filter((p) => p.id !== id),
                prev,
              )
            : prev,
      )
    },
  })
}
