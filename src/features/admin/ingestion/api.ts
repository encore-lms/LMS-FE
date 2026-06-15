import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminIngestionKeys } from './queryKeys'
import type { IngestionOverview } from './types'

// 인입 격리 큐 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useIngestionQueue() {
  return useQuery({
    queryKey: adminIngestionKeys.overview(),
    queryFn: () =>
      apiClient
        .get<IngestionOverview>('/admin/ingestion/quarantine')
        .then((r) => r.data),
  })
}
