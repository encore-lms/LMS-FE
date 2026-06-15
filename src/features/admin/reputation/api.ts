import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminReputationKeys } from './queryKeys'
import type { ReputationOverview } from './types'

// 평판 관리 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useReputation() {
  return useQuery({
    queryKey: adminReputationKeys.overview(),
    queryFn: () =>
      apiClient
        .get<ReputationOverview>('/admin/reputation')
        .then((r) => r.data),
  })
}
