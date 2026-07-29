import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mileagePurchaseKeys } from './queryKeys'
import type { PurchaseData, PurchaseStatus } from './types'

// 마일리지 구매 요청 처리 큐 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function usePurchaseQueue(cohortId = '') {
  return useQuery({
    queryKey: mileagePurchaseKeys.queue(cohortId),
    queryFn: () =>
      apiClient
        .get<PurchaseData>(
          '/admin/mileage/purchase-requests',
          cohortId ? { cohortId } : undefined,
        )
        .then((r) => r.data),
  })
}

/** 구매 요청 처리(승인·수정 요청·반려) 입력 */
export interface PurchaseProcessInput {
  id: string
  next: PurchaseStatus
  memo?: string
}

// 구매 요청 처리 훅 — PATCH /admin/mileage/purchase-requests/:id (승인·수정요청·반려). 성공 시 큐 재조회.
export function usePurchaseProcess() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, PurchaseProcessInput>({
    mutationFn: ({ id, next, memo }) =>
      apiClient
        .patch(`/admin/mileage/purchase-requests/${id}`, { next, memo })
        .then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mileagePurchaseKeys.all })
    },
  })
}
