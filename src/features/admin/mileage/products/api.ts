import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mileageProductsKeys } from './queryKeys'
import type { ProductsData } from './types'

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
