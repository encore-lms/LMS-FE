import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mileagePurchaseKeys } from './queryKeys'
import type { PurchaseData } from './types'

// 마일리지 구매 요청 처리 큐 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function usePurchaseQueue() {
  return useQuery({
    queryKey: mileagePurchaseKeys.queue(),
    queryFn: () =>
      apiClient
        .get<PurchaseData>('/admin/mileage/purchase-requests')
        .then((r) => r.data),
  })
}
