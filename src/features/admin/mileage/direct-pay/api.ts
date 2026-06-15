import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { mileageDirectPayKeys } from './queryKeys'
import type { DirectPayData } from './types'

// 마일리지 직접 지급 대상 명단 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useDirectPayRoster() {
  return useQuery({
    queryKey: mileageDirectPayKeys.roster(),
    queryFn: () =>
      apiClient
        .get<DirectPayData>('/admin/mileage/direct-pay')
        .then((r) => r.data),
  })
}
