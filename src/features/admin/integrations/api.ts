import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminIntegrationsKeys } from './queryKeys'
import type { IntegrationsData } from './types'

// 외부 연동 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useIntegrations() {
  return useQuery({
    queryKey: adminIntegrationsKeys.overview(),
    queryFn: () =>
      apiClient
        .get<IntegrationsData>('/admin/integrations')
        .then((r) => r.data),
  })
}
