import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminMileageKeys } from './queryKeys'

// BE GET /admin/mileage/cohorts — 운영 마일리지 기수 필터 옵션(전체 기수 라벨 포함).
export interface MileageCohortOption {
  cohortId: string
  label: string
}

// 마일리지 기수 옵션 조회 훅 — history·direct-pay·purchase-requests가 공유.
export function useMileageCohorts() {
  return useQuery({
    queryKey: adminMileageKeys.cohorts(),
    queryFn: () =>
      apiClient
        .get<MileageCohortOption[]>('/admin/mileage/cohorts')
        .then((r) => r.data),
    staleTime: 5 * 60_000,
  })
}
