import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mileageHistoryKeys } from './queryKeys'
import type { MileageHistoryData, StudentMileageHistory } from './types'

// 마일리지 지급 내역 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
// cohortId 지정 시 해당 기수 계정의 거래만(빈 값=전체 기수).
export function useMileageHistory(cohortId = '') {
  return useQuery({
    queryKey: mileageHistoryKeys.overview(cohortId),
    queryFn: () =>
      apiClient
        .get<MileageHistoryData>(
          '/admin/mileage/history',
          cohortId ? { cohortId } : undefined,
        )
        .then((r) => r.data),
  })
}

/** 수강생 1명의 이력 — 거래 한 건만 보면 잔액이 왜 그렇게 됐는지 앞뒤가 안 보인다. */
export function useStudentMileageHistory(studentUserId: string | null) {
  return useQuery({
    queryKey: mileageHistoryKeys.student(studentUserId ?? ''),
    enabled: !!studentUserId,
    queryFn: () =>
      apiClient
        .get<StudentMileageHistory>(
          `/admin/mileage/students/${studentUserId}/history`,
        )
        .then((r) => r.data),
  })
}
