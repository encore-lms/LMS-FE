import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mileagePurchaseKeys } from './queryKeys'
import type { PurchaseData, PurchaseStatus } from './types'

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

/** 구매 요청 처리(승인·수정 요청·반려) 입력 */
export interface PurchaseProcessInput {
  id: string
  next: PurchaseStatus
  memo?: string
}

// 구매 요청 처리 훅 — 성공 시 큐 캐시에서 해당 요청 상태를 전이하고 KPI·대기 건수를 재계산(목록 갱신).
// BE 계약(P0_16 MileageOrder) 미확정 → 네트워크 없이 클라이언트 낙관 반영으로 시뮬레이션한다.
// 계약 확정 시 mutationFn 을 apiClient.patch('/admin/mileage/purchase-requests/:id', ...) 로 교체한다.
export function usePurchaseProcess() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, PurchaseProcessInput>({
    mutationFn: async () => {},
    onSuccess: (_result, { id, next }) => {
      queryClient.setQueryData<PurchaseData>(
        mileagePurchaseKeys.queue(),
        (prev) => {
          if (!prev) return prev
          const requests = prev.requests.map((r) =>
            r.id === id ? { ...r, status: next } : r,
          )
          const countBy = (s: PurchaseStatus) =>
            requests.filter((r) => r.status === s).length
          return {
            ...prev,
            requests,
            kpis: prev.kpis.map((k) => ({ ...k, count: countBy(k.status) })),
            pendingCount: countBy('pending'),
          }
        },
      )
    },
  })
}
