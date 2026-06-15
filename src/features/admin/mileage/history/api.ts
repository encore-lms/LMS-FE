import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mileageHistoryKeys } from './queryKeys'
import type { MileageHistoryData } from './types'

// 마일리지 지급 내역 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useMileageHistory() {
  return useQuery({
    queryKey: mileageHistoryKeys.overview(),
    queryFn: () =>
      apiClient
        .get<MileageHistoryData>('/admin/mileage/history')
        .then((r) => r.data),
  })
}
