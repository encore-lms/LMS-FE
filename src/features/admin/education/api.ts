import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import { adminEducationKeys } from './queryKeys'
import type { EducationOverview } from './types'

// 과정·기수·교과목 통합 조회 훅 — 엔드포인트가 /admin/* 라 admin feature 소유.
// baseURL이 /api 이므로 경로 앞에 /api 를 붙이지 않는다(언래핑은 .then(r => r.data)).
export function useEducationOverview() {
  return useQuery({
    queryKey: adminEducationKeys.overview(),
    queryFn: () =>
      apiClient.get<EducationOverview>('/admin/education').then((r) => r.data),
  })
}
