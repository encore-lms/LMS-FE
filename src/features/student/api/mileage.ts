import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mileageKeys } from '../mileage/queryKeys'
import type {
  MileageHistoryData,
  MileageOverview,
  MileageProductsData,
} from '../mileage/types'

// 마일리지 훅 — 엔드포인트가 /student/* 라 학생 feature 소유. baseURL /api 라 경로 앞 /api 생략.
export function useMileageOverview() {
  return useQuery({
    queryKey: mileageKeys.overview(),
    queryFn: () =>
      apiClient.get<MileageOverview>('/student/mileage').then((r) => r.data),
  })
}

export function useMileageProducts() {
  return useQuery({
    queryKey: mileageKeys.products(),
    queryFn: () =>
      apiClient
        .get<MileageProductsData>('/student/mileage/products')
        .then((r) => r.data),
  })
}

export function useMileageHistory() {
  return useQuery({
    queryKey: mileageKeys.history(),
    queryFn: () =>
      apiClient
        .get<MileageHistoryData>('/student/mileage/history')
        .then((r) => r.data),
  })
}
