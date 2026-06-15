import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminMileageKeys } from './queryKeys'
import type { MileageOverview } from './types'

// 마일리지 관리 허브 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useMileageOverview() {
  return useQuery({
    queryKey: adminMileageKeys.overview(),
    queryFn: () =>
      apiClient.get<MileageOverview>('/admin/mileage').then((r) => r.data),
  })
}
