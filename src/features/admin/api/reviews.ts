import { useQuery } from '@tanstack/react-query'
import { apiClient, adminKeys } from '@/shared/api'
import type { CertReviewQueue } from '@/shared/types'

// 인증 검토 큐 — /admin/* 엔드포인트라 admin feature 소유. baseURL이 /api라 경로 앞에 안 붙임.
export function useReviewQueue(filter?: { status?: string }) {
  return useQuery({
    queryKey: adminKeys.reviewQueue(filter),
    queryFn: () =>
      apiClient
        .get<CertReviewQueue>('/admin/certificates/reviews', filter)
        .then((r) => r.data),
  })
}
